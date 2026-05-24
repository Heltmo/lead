const fs = require('fs')
const path = require('path')
const { discoverLocalBusinesses, writeDiscoveryOutputs, toSummary } = require('../lead-discovery-agent/discoverLocalBusinesses')
const { parseQueueInputLine } = require('../orchestrator/queue/urlQueue')
const { runAuditQueue } = require('../orchestrator/pipelines/auditQueue')
const { readRunArtifacts } = require('../lead-review-workspace/readers/runArtifacts')
const { parseCsv, renderCsv } = require('../lead-review-workspace/readers/csv')
const { mergeReviewStatus } = require('../lead-review-workspace/state/reviewStatus')
const { buildCrmShortlistedCsv, CRM_SHORTLISTED_COLUMNS } = require('../lead-review-workspace/exports/crmShortlistedCsv')
const { generateLeadDemo } = require('../demo-generator/generateLeadDemo')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const DEFAULT_CAMPAIGN_ROOT = path.join(REPO_ROOT, 'generated', 'campaigns')
const DEFAULT_ORCHESTRATOR_RUNS_ROOT = path.join(REPO_ROOT, 'core', 'orchestrator', 'runs')

async function runCampaign(options = {}) {
  if (!options.query) throw new Error('query is required')
  if (!options.provider && !hasSources(options.sourceFiles)) throw new Error('campaign discovery requires --source or --provider')

  const campaignId = sanitizePathPart(options.runId || createCampaignId(options.query))
  const maxLeads = positiveInteger(options.maxLeads, 10)
  const demoCount = positiveInteger(options.demoCount, 1)
  const campaignDir = path.resolve(options.campaignRoot || DEFAULT_CAMPAIGN_ROOT, campaignId)
  const discoveryDir = path.join(campaignDir, 'discovery')
  const campaignRunDir = path.join(campaignDir, 'run')
  const campaignReviewDir = path.join(campaignDir, 'review')
  const campaignCrmDir = path.join(campaignDir, 'crm')
  const campaignDemosDir = path.join(campaignDir, 'demos')

  ensureCleanCampaignDir(campaignDir)
  for (const dir of [discoveryDir, campaignRunDir, campaignReviewDir, campaignCrmDir, campaignDemosDir]) fs.mkdirSync(dir, { recursive: true })

  const discoveryReport = await discoverLocalBusinesses({
    query: options.query,
    sourceFiles: normalizeList(options.sourceFiles),
    provider: options.provider,
    maxResults: maxLeads,
    maxProviderQueries: options.maxProviderQueries,
    mockResultsPath: options.mockResultsPath,
    validate: options.validate,
    timeoutMs: options.timeoutMs,
    env: options.env,
    fetchImpl: options.fetchImpl,
  })
  const discoveryOutputs = writeDiscoveryOutputs(discoveryReport, {
    outPath: path.join(discoveryDir, 'lead-candidates.json'),
    summaryPath: path.join(discoveryDir, 'discovery-summary.json'),
    handoffPath: path.join(discoveryDir, 'orchestrator-handoff.jsonl'),
  })
  const handoffItems = readHandoffItems(discoveryOutputs.handoffPath).slice(0, maxLeads)
  if (!handoffItems.length) throw new Error('Discovery produced no audit-eligible handoff candidates')

  const auditResult = await runAuditQueue({
    urls: handoffItems,
    runId: campaignId,
    rootDir: options.orchestratorRunsRoot || DEFAULT_ORCHESTRATOR_RUNS_ROOT,
    maxRetries: options.maxRetries == null ? 1 : Number(options.maxRetries),
  })
  const canonicalRunDir = path.dirname(auditResult.summaryPath)

  copyDir(path.join(canonicalRunDir, 'report-surfaces'), path.join(campaignRunDir, 'report-surfaces'))
  copyFile(auditResult.summaryPath, path.join(campaignRunDir, 'summary.json'))
  copyFile(auditResult.statePath, path.join(campaignRunDir, 'state.json'))
  copyDir(path.join(canonicalRunDir, 'review-workspace'), campaignReviewDir)

  const artifacts = readRunArtifacts({ summaryPath: auditResult.summaryPath, leadsCsvPath: auditResult.reportSurfaces.csvPath })
  const reviewStatusPath = path.join(canonicalRunDir, 'review-workspace', 'review-status.json')
  const reviewStatus = mergeReviewStatus(JSON.parse(fs.readFileSync(reviewStatusPath, 'utf8')), artifacts.items)
  const crmShortlistedPath = path.join(campaignCrmDir, 'crm-shortlisted-leads.csv')
  fs.writeFileSync(crmShortlistedPath, buildCrmShortlistedCsv(artifacts.items, reviewStatus))

  const demoSource = buildDemoSource({ artifacts, reviewStatus, crmShortlistedPath, campaignCrmDir, demoCount })
  const demoResults = []
  for (let index = 0; index < Math.min(demoCount, demoSource.rowCount); index += 1) {
    demoResults.push(generateLeadDemo({
      shortlistPath: demoSource.path,
      runId: campaignId,
      outRoot: campaignDemosDir,
      index: index + 1,
    }))
  }

  const topOpportunities = selectTopOpportunities(artifacts.items, 5)
  const counts = {
    discoveredCount: discoveryReport.totalCandidates,
    auditEligibleCount: discoveryReport.auditEligibleCandidates,
    handoffCount: handoffItems.length,
    auditedCount: auditResult.summary.completedItems,
    failedCount: auditResult.summary.failedItems,
    demoCount: demoResults.length,
  }
  const paths = {
    campaignDir,
    discoveryDir,
    runDir: campaignRunDir,
    reviewDir: campaignReviewDir,
    crmDir: campaignCrmDir,
    demosDir: campaignDemosDir,
    canonicalRunDir,
    campaignJsonPath: path.join(campaignDir, 'campaign.json'),
    campaignSummaryPath: path.join(campaignDir, 'campaign-summary.md'),
    discoveryCandidatesPath: discoveryOutputs.candidatesPath,
    discoverySummaryPath: discoveryOutputs.summaryPath,
    discoveryHandoffPath: discoveryOutputs.handoffPath,
    canonicalSummaryPath: auditResult.summaryPath,
    campaignSummaryJsonCopyPath: path.join(campaignRunDir, 'summary.json'),
    reviewWorkspaceIndexPath: path.join(campaignReviewDir, 'index.html'),
    crmShortlistedPath,
    demoSourcePath: demoSource.path,
  }
  const campaign = {
    version: 1,
    deterministic: true,
    campaignId,
    query: options.query,
    provider: options.provider || '',
    sourceFiles: normalizeList(options.sourceFiles).map((sourceFile) => path.resolve(sourceFile)),
    maxLeads,
    demoCount,
    createdAt: new Date().toISOString(),
    counts,
    paths,
    discovery: toSummary(discoveryReport),
    topOpportunities,
    demos: demoResults.map((demo) => ({
      outDir: demo.outDir,
      indexPath: demo.indexPath,
      manifestPath: demo.manifestPath,
      businessSlug: demo.businessSlug,
      company: demo.lead.businessName,
      website: demo.lead.website,
    })),
  }

  fs.writeFileSync(paths.campaignJsonPath, JSON.stringify(campaign, null, 2) + '\n')
  fs.writeFileSync(paths.campaignSummaryPath, renderCampaignSummary(campaign))

  return { campaignId, campaign, paths, counts, discoveryReport, auditResult, topOpportunities, demoResults }
}

function buildDemoSource({ artifacts, reviewStatus, crmShortlistedPath, campaignCrmDir }) {
  const shortlistedRows = parseCsv(fs.readFileSync(crmShortlistedPath, 'utf8'))
  if (shortlistedRows.length) return { path: crmShortlistedPath, rowCount: shortlistedRows.length, sourceType: 'shortlisted' }

  const rows = selectTopItems(artifacts.items, 10).map((item) => toCrmLikeRow(item, reviewStatus.items[item.id]))
  const pathOut = path.join(campaignCrmDir, 'top-opportunities-for-demo.csv')
  fs.writeFileSync(pathOut, renderCsv(rows, CRM_SHORTLISTED_COLUMNS))
  return { path: pathOut, rowCount: rows.length, sourceType: 'top-opportunity' }
}

function toCrmLikeRow(item, review = {}) {
  const opportunity = item.opportunityBullets || {}
  return {
    company: item.name || item.title || item.url,
    website: item.url,
    pageTitle: item.pageTitle || item.title || '',
    industry: item.sourceMetadata?.industry || '',
    location: item.sourceMetadata?.location || '',
    score: item.leadScore,
    technologies: item.technologies.join('|'),
    issueCategories: formatCounts(item.issueCategories),
    topIssues: item.issues.slice(0, 5).join('|'),
    email: item.emails[0] || '',
    phone: item.phones[0] || '',
    reportPath: item.links.htmlReport,
    desktopScreenshotPath: item.links.desktopScreenshot,
    mobileScreenshotPath: item.links.mobileScreenshot,
    suggestedAngle: 'Top opportunity',
    suggestedAngleDetail: opportunity.whyThisLeadMatters || 'This lead has measurable website improvement signals.',
    painPointBullets: (opportunity.painPointBullets || []).join('|'),
    suggestedOffer: opportunity.suggestedOffer || '',
    outreachOpener: opportunity.outreachOpener || '',
    whyThisLeadMatters: opportunity.whyThisLeadMatters || '',
    reviewStatus: review.status || 'top-opportunity',
    priority: review.priority || 'unset',
    nextAction: review.nextAction || 'demo',
    owner: review.owner || '',
    lastReviewedAt: review.lastReviewedAt || '',
    tags: (review.tags || []).join('|'),
    notes: review.notes || '',
  }
}

function selectTopOpportunities(items, limit) {
  return selectTopItems(items, limit)
    .map((item) => ({
      id: item.id,
      rank: item.rank,
      company: item.name || item.title || item.url,
      website: item.url,
      score: item.leadScore,
      status: item.status,
      industry: item.sourceMetadata?.industry || '',
      location: item.sourceMetadata?.location || '',
      painPointBullets: item.opportunityBullets?.painPointBullets || [],
      suggestedOffer: item.opportunityBullets?.suggestedOffer || '',
      outreachOpener: item.opportunityBullets?.outreachOpener || '',
      whyThisLeadMatters: item.opportunityBullets?.whyThisLeadMatters || '',
    }))
}

function selectTopItems(items, limit) {
  return [...items]
    .sort((a, b) => Number(b.leadScore || 0) - Number(a.leadScore || 0) || String(a.url).localeCompare(String(b.url)))
    .slice(0, limit)
}

function renderCampaignSummary(campaign) {
  const lines = []
  lines.push(`# Campaign ${campaign.campaignId}`)
  lines.push('')
  lines.push(`- Query: ${campaign.query}`)
  lines.push(`- Provider: ${campaign.provider || 'none'}`)
  lines.push(`- Sources: ${campaign.sourceFiles.length ? campaign.sourceFiles.join(', ') : 'none'}`)
  lines.push(`- Discovered count: ${campaign.counts.discoveredCount}`)
  lines.push(`- Audit eligible count: ${campaign.counts.auditEligibleCount}`)
  lines.push(`- Handoff count: ${campaign.counts.handoffCount}`)
  lines.push(`- Audited count: ${campaign.counts.auditedCount}`)
  lines.push(`- Failed count: ${campaign.counts.failedCount}`)
  lines.push(`- CRM export path: ${campaign.paths.crmShortlistedPath}`)
  lines.push(`- Review workspace path: ${campaign.paths.reviewWorkspaceIndexPath}`)
  lines.push('')
  lines.push('## Generated Demos')
  if (campaign.demos.length) {
    for (const demo of campaign.demos) lines.push(`- ${demo.company}: ${demo.indexPath}`)
  } else {
    lines.push('- none')
  }
  lines.push('')
  lines.push('## Top Opportunities')
  if (campaign.topOpportunities.length) {
    for (const lead of campaign.topOpportunities) {
      lines.push('')
      lines.push(`### ${lead.company}`)
      lines.push(`- Website: ${lead.website}`)
      lines.push(`- Score: ${lead.score}`)
      if (lead.industry) lines.push(`- Industry: ${lead.industry}`)
      if (lead.location) lines.push(`- Location: ${lead.location}`)
      if (lead.whyThisLeadMatters) lines.push(`- Why this lead matters: ${lead.whyThisLeadMatters}`)
      if (lead.suggestedOffer) lines.push(`- Suggested offer: ${lead.suggestedOffer}`)
      if (lead.outreachOpener) lines.push(`- Outreach opener: ${lead.outreachOpener}`)
      if (lead.painPointBullets.length) {
        lines.push('- Pain points:')
        for (const bullet of lead.painPointBullets) lines.push(`  - ${bullet}`)
      }
    }
  } else {
    lines.push('- none')
  }
  return lines.join('\n') + '\n'
}

function readHandoffItems(filePath) {
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map(parseQueueInputLine).filter(Boolean)
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return
  fs.rmSync(to, { recursive: true, force: true })
  fs.cpSync(from, to, { recursive: true })
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

function ensureCleanCampaignDir(campaignDir) {
  if (fs.existsSync(campaignDir)) fs.rmSync(campaignDir, { recursive: true, force: true })
  fs.mkdirSync(campaignDir, { recursive: true })
}

function formatCounts(counts) {
  return Object.keys(counts || {}).sort().map((key) => key + ':' + counts[key]).join('|')
}

function hasSources(value) {
  return normalizeList(value).length > 0
}

function normalizeList(value) {
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item || '').split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

function positiveInteger(value, fallback) {
  const number = Number(value || fallback)
  if (!Number.isInteger(number) || number < 0) throw new Error('Expected a non-negative integer')
  return number
}

function createCampaignId(query) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  return `${sanitizePathPart(query)}-${stamp}`
}

function sanitizePathPart(value) {
  const slug = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  return slug || 'campaign'
}

module.exports = {
  runCampaign,
  renderCampaignSummary,
  selectTopOpportunities,
  toCrmLikeRow,
  createCampaignId,
  sanitizePathPart,
}
