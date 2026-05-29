const http = require('http')
const fs = require('fs')
const path = require('path')
const { runLeadMachine } = require('../../core/lead-machine/leadMachine')
const { runAuditQueue } = require('../../core/orchestrator/pipelines/auditQueue')
const { runLeadPack } = require('../../core/lead-pack-runner/leadPackRunner')
const { enrichCompanyProfile } = require('../../core/company-profile/companyProfile')
const { loadEnvFiles } = require('../../core/lead-machine/loadEnv')
const { parseLeadQuery } = require('./queryParser')

const DEFAULT_PORT = Number(process.env.PORT || 8787)
const APP_ROOT = __dirname
const PUBLIC_DIR = path.join(APP_ROOT, 'public')
const RUNS_DIR = path.join(APP_ROOT, 'runs')
const FIXTURE_DIR = path.join(APP_ROOT, 'fixtures')
const DEMO_FIXTURE_PATH = path.join(FIXTURE_DIR, 'kristiansand-rorlegger-result.json')
const REPO_ROOT = path.resolve(APP_ROOT, '..', '..')
const WORKFLOW_PATH = path.join(REPO_ROOT, '.cache', 'lead-machine-demo', 'lead-workflow.json')
loadEnvFiles([path.join(REPO_ROOT, '.env'), path.join(APP_ROOT, '.env')])

function createServer(options = {}) {
  const runner = options.runner || runLeadMachine
  const deepQualifier = options.deepQualifier || deepQualifyLead
  const runsDir = options.runsDir || RUNS_DIR
  const publicDir = options.publicDir || PUBLIC_DIR
  const runIndex = new Map()
  const workflowPath = options.workflowPath || WORKFLOW_PATH

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1')
      if (req.method === 'GET' && url.pathname === '/') return serveFile(res, path.join(publicDir, 'index.html'), 'text/html')
      if (req.method === 'GET' && url.pathname.startsWith('/assets/')) return serveFile(res, path.join(publicDir, url.pathname.replace('/assets/', '')), contentType(url.pathname))
      if (req.method === 'POST' && url.pathname === '/api/runs') {
        await handleRun(req, res, { runner, runsDir, runIndex, workflowPath })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/deep-qualify') {
        await handleDeepQualify(req, res, { deepQualifier, runsDir, workflowPath })
        return
      }
      if (req.method === 'GET' && url.pathname === '/api/workflow') return handleWorkflowGet(url, res, workflowPath)
      if (req.method === 'POST' && url.pathname === '/api/workflow') return handleWorkflowPost(req, res, workflowPath)
      if (req.method === 'GET' && url.pathname.startsWith('/api/runs/')) return handleRunFile(url, res, runIndex, workflowPath)
      return json(res, 404, { error: 'Not found' })
    } catch (error) {
      return json(res, 500, { error: friendlyError(error) })
    }
  })
}

async function handleRun(req, res, context) {
  const body = await readJsonBody(req)
  const query = String(body.query || '').trim()
  if (!query) return json(res, 400, { error: 'Query is required' })

  const parsedQuery = parseLeadQuery(query)
  if (!parsedQuery.ok) return json(res, 400, { error: parsedQuery.error })

  const maxResults = normalizeMaxResults(body.maxResults, 25)
  const provider = ['demo-fixture', 'google-places', 'brreg', 'balanced', 'mock'].includes(body.provider) ? body.provider : 'balanced'
  const searchScope = ['strict', 'nearby', 'regional'].includes(body.searchScope) ? body.searchScope : 'strict'
  const mode = ['fast', 'deep'].includes(body.mode) ? body.mode : 'fast'
  const enrichCompanyProfile = !(body.enrichCompanyProfile === false || body.enrichCompanyProfile === 'false')
  const runId = createSafeRunId(parsedQuery.normalizedQuery)
  const outputDir = path.join(context.runsDir, runId)
  fs.mkdirSync(outputDir, { recursive: true })

  let result
  if (provider === 'demo-fixture') {
    result = createDemoFixtureRun({
      parsedQuery,
      maxResults,
      searchScope,
      enrichCompanyProfile,
      outputDir,
      runId,
    })
  } else {
    result = await context.runner({
      query: parsedQuery.normalizedQuery,
      provider,
      maxResults,
      searchScope,
      enrichCompanyProfile,
      mode,
      outputDir,
      runId,
    })
  }

  const leadPackOutputPath = result.leadPackOutputPath || path.join(outputDir, 'lead-packs')
  const leadPacksPath = path.join(leadPackOutputPath, 'lead-packs.json')
  const leadPackSummaryPath = path.join(leadPackOutputPath, 'summary.json')
  const csvPath = path.join(leadPackOutputPath, 'lead-packs.csv')
  const machineSummaryPath = result.summaryPath || path.join(outputDir, 'lead-machine-summary.json')
  const leadPacks = attachWorkflowToLeads(readJsonFile(leadPacksPath, []), readWorkflowStore(context.workflowPath))
  const leadPackSummary = readJsonFile(leadPackSummaryPath, {})
  const machineSummary = result.summary || readJsonFile(machineSummaryPath, {})

  context.runIndex.set(runId, { outputDir, leadPackOutputPath, csvPath, leadPacksPath, machineSummaryPath })

  return json(res, 200, {
    runId,
    parsedQuery,
    outputDir,
    leadPackOutputPath,
    downloads: {
      csv: `/api/runs/${runId}/lead-packs.csv`,
      json: `/api/runs/${runId}/lead-packs.json`,
      summary: `/api/runs/${runId}/summary.json`,
      callList: `/api/runs/${runId}/call-list.csv`,
      callListToday: `/api/runs/${runId}/call-list.csv?view=today`,
      callListNotContacted: `/api/runs/${runId}/call-list.csv?view=notContacted`,
      callListFollowUps: `/api/runs/${runId}/call-list.csv?view=followUpDue`,
      callListInterested: `/api/runs/${runId}/call-list.csv?view=interested`,
    },
    summary: { ...leadPackSummary, ...machineSummary },
    leadPacks,
  })
}


async function handleDeepQualify(req, res, context) {
  const body = await readJsonBody(req)
  const lead = body.lead && typeof body.lead === 'object' ? body.lead : null
  if (!lead) return json(res, 400, { error: 'Lead is required' })
  const query = String(body.query || lead.meta?.sourceQuery || '').trim() || 'selected lead'
  const enrichCompanyProfile = !(body.enrichCompanyProfile === false || body.enrichCompanyProfile === 'false')
  const result = await context.deepQualifier({ lead, query, enrichCompanyProfile, runsDir: context.runsDir })
  if (result && result.leadPack) result.leadPack = attachWorkflowToLeads([result.leadPack], readWorkflowStore(context.workflowPath))[0]
  return json(res, 200, result)
}

async function deepQualifyLead({ lead, query, enrichCompanyProfile: shouldEnrichCompanyProfile, runsDir }) {
  const originalLead = JSON.parse(JSON.stringify(lead))
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const sourceQuality = lead.sourceQuality || {}
  const runId = createSafeRunId(`${company.displayName || 'selected-lead'} deep`)
  const outputDir = path.join(runsDir, runId)
  const orchestratorRootDir = path.join(outputDir, 'orchestrator')
  const leadPackOutputPath = path.join(outputDir, 'lead-packs')
  fs.mkdirSync(outputDir, { recursive: true })

  const refreshedCompanyProfile = shouldEnrichCompanyProfile ? await safeSelectedCompanyProfile(lead) : null
  const websiteUrl = selectedWebsiteUrl(lead)
  const hasWebsite = Boolean(websiteUrl)
  if (!hasWebsite) {
    const deepLead = applyDeepEnrichmentV1(mergeSelectedCompanyProfile(originalLead, refreshedCompanyProfile), originalLead, {
      companyProfile: refreshedCompanyProfile,
      websiteAuditStatus: 'skipped_no_website',
      outputDir,
    })
    return {
      outputDir,
      leadPackOutputPath,
      leadPack: deepLead,
      downloads: { csvPath: null, jsonPath: null, summaryPath: null },
    }
  }

  const auditInput = {
    url: websiteUrl,
    businessName: company.displayName || lead.companyName || '',
    source: places.provider || 'selected-lead',
    location: contact.city || '',
    industry: lead.leadClass || '',
    sourceType: 'directBusiness',
    auditEligible: true,
    provenance: { provider: places.provider || 'selected-lead', selectedLeadDeepQualification: true },
    phone: contact.phone || lead.phone || '',
    address: contact.address || lead.address || '',
    placeId: places.placeId || '',
    rating: places.rating ?? '',
    reviewCount: places.reviewCount ?? '',
    searchScope: sourceQuality.searchScope || 'strict',
    requestedMaxResults: sourceQuality.requestedMaxResults ?? '',
    includedLeadCount: sourceQuality.includedLeadCount ?? '',
    lowSupply: Boolean(sourceQuality.lowSupply),
    fallbackAvailable: Boolean(sourceQuality.fallbackAvailable),
    recommendedExpansion: sourceQuality.recommendedExpansion || '',
    requestedLocation: sourceQuality.requestedLocation || '',
    candidateLocation: sourceQuality.candidateLocation || contact.address || '',
    candidateCity: contact.city || '',
    locationMatchStatus: sourceQuality.locationMatchStatus || 'unknown',
    locationConfidence: sourceQuality.locationConfidence ?? '',
    distanceKm: sourceQuality.distanceKm ?? '',
    locationWarnings: sourceQuality.locationWarnings || [],
    fallbackUsed: Boolean(sourceQuality.fallbackUsed),
    locationQuality: sourceQuality.locationQuality || null,
    discoveryQuality: sourceQuality.discoveryQuality || null,
    discoveryConfidence: sourceQuality.discoveryConfidence || sourceQuality.discoveryQuality?.level || '',
    identitySource: sourceQuality.identitySource || company.source || '',
    presenceSource: sourceQuality.presenceSource || places.provider || '',
    organizationNumber: company.organizationNumber || '',
    candidateOrganizationNumber: company.candidateOrganizationNumber || '',
    legalName: company.legalName || '',
    candidateLegalName: company.candidateLegalName || '',
    organizationForm: company.organizationForm || '',
    registeredAddress: company.registeredAddress || '',
    municipality: company.municipality || '',
    unitType: company.unitType || '',
    naceCode: company.naceCode || '',
    naceDescription: company.naceDescription || '',
    employees: company.employees ?? '',
    registrationDate: company.registrationDate || '',
    activeStatus: company.activeStatus || '',
    sourceUrl: company.sourceUrl || '',
    selectedLeadEnrichment: true,
  }

  const auditResult = await runAuditQueue({
    urls: [auditInput],
    runId: `${runId}-audit`,
    rootDir: orchestratorRootDir,
    maxRetries: 1,
  })
  const leadPackResult = await runLeadPack({
    query,
    runDir: path.dirname(auditResult.summaryPath),
    outputDir: leadPackOutputPath,
    enrichCompanyProfile: shouldEnrichCompanyProfile,
  })
  const leadPacks = readJsonFile(leadPackResult.leadPacksPath, [])
  const deepLead = leadPacks[0]
  if (!deepLead) throw new Error('Deep qualification did not produce a lead pack')
  deepLead.rank = lead.rank || deepLead.rank
  const mergedLead = applyDeepEnrichmentV1(mergeSelectedCompanyProfile(deepLead, refreshedCompanyProfile), originalLead, {
    companyProfile: refreshedCompanyProfile,
    websiteAuditStatus: deepLead.website?.auditStatus || 'completed',
    outputDir,
  })
  return {
    outputDir,
    leadPackOutputPath,
    leadPack: mergedLead,
    downloads: {
      csvPath: leadPackResult.csvPath,
      jsonPath: leadPackResult.leadPacksPath,
      summaryPath: leadPackResult.summaryPath,
    },
  }
}



function selectedWebsiteUrl(lead = {}) {
  const contactWebsite = lead.contact && typeof lead.contact.website === 'string' ? lead.contact.website.trim() : ''
  if (contactWebsite) return contactWebsite
  if (typeof lead.website === 'string') return lead.website.trim()
  if (lead.website && typeof lead.website === 'object') {
    return String(lead.website.url || lead.website.href || lead.website.website || lead.website.uri || '').trim()
  }
  return ''
}

async function safeSelectedCompanyProfile(lead = {}) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  try {
    return await enrichCompanyProfile({
      companyName: company.displayName || lead.companyName || company.legalName || company.candidateLegalName,
      website: selectedWebsiteUrl(lead),
      phone: contact.phone || lead.phone,
      email: contact.email || lead.email,
      address: contact.address || lead.address,
      city: contact.city || lead.city,
      industry: lead.leadClass || lead.opportunityType,
    }, {
      fileCache: true,
    })
  } catch (error) {
    return {
      organizationNumber: null,
      candidateOrganizationNumber: null,
      legalName: null,
      candidateLegalName: null,
      organizationForm: null,
      registeredAddress: null,
      municipality: null,
      naceCode: null,
      naceDescription: null,
      employees: null,
      registrationDate: null,
      activeStatus: null,
      source: 'brreg',
      sourceUrl: null,
      matchStatus: 'error',
      matchConfidence: 0,
      errorType: 'unknown_error',
      warnings: [error && error.message ? error.message : 'company_profile_error'],
      candidates: [],
    }
  }
}

function mergeSelectedCompanyProfile(lead = {}, profile) {
  const copy = JSON.parse(JSON.stringify(lead || {}))
  if (!profile) return copy
  const company = copy.company || {}
  const confirmed = profile.organizationNumber && ['exact_match', 'strong_match'].includes(String(profile.matchStatus || '').toLowerCase())
  copy.company = {
    ...company,
    legalName: profile.legalName || company.legalName || null,
    candidateLegalName: profile.candidateLegalName || company.candidateLegalName || profile.legalName || null,
    organizationNumber: confirmed ? profile.organizationNumber : (company.organizationNumber || null),
    candidateOrganizationNumber: profile.candidateOrganizationNumber || company.candidateOrganizationNumber || profile.organizationNumber || null,
    organizationForm: profile.organizationForm || company.organizationForm || null,
    registeredAddress: profile.registeredAddress || company.registeredAddress || null,
    municipality: profile.municipality || company.municipality || null,
    unitType: profile.unitType || company.unitType || null,
    naceCode: profile.naceCode || company.naceCode || null,
    naceDescription: profile.naceDescription || company.naceDescription || null,
    employees: profile.employees ?? company.employees ?? null,
    registrationDate: profile.registrationDate || company.registrationDate || null,
    activeStatus: profile.activeStatus || company.activeStatus || null,
    source: profile.source || company.source || 'brreg',
    sourceUrl: profile.sourceUrl || company.sourceUrl || null,
    errorType: profile.errorType || company.errorType || null,
    matchStatus: profile.matchStatus || company.matchStatus || null,
    matchConfidence: profile.matchConfidence ?? company.matchConfidence ?? null,
    matchReasons: Array.isArray(profile.matchReasons) ? profile.matchReasons : (company.matchReasons || []),
    warnings: Array.from(new Set([...(company.warnings || []), ...(profile.warnings || [])].filter(Boolean))),
    candidates: Array.isArray(profile.candidates) && profile.candidates.length ? profile.candidates : (company.candidates || []),
  }
  return copy
}

function applyDeepEnrichmentV1(lead = {}, originalLead = {}, context = {}) {
  const copy = JSON.parse(JSON.stringify(lead || {}))
  const company = copy.company || {}
  const contact = copy.contact || {}
  const website = copy.website || {}
  const ranking = copy.ranking || {}
  const economy = copy.economy || { status: 'not_enabled', source: null, revenue: null, profit: null, employees: null }
  const hasPhone = Boolean(contact.phone || copy.phone)
  const hasEmail = Boolean(contact.email || copy.email)
  const hasWebsite = Boolean(selectedWebsiteUrl(copy))
  const contactability = hasPhone ? 'strong' : hasEmail || hasWebsite ? 'medium' : 'weak'
  const brregStatus = company.organizationNumber ? 'completed' : company.candidateOrganizationNumber ? 'manual_verify' : company.matchStatus || 'no_match'
  const websiteStatus = context.websiteAuditStatus || website.auditStatus || (hasWebsite ? 'not_run' : 'skipped_no_website')
  const modules = [
    moduleStatus('company_identity', 'Brreg verification', brregStatus, brregSummary(company)),
    moduleStatus('contactability', 'Contactability refresh', contactability, contactabilitySummaryV1({ hasPhone, hasEmail, hasWebsite })),
    moduleStatus('website_audit', 'Website audit', websiteStatus, websiteSummaryV1(websiteStatus, hasWebsite)),
    moduleStatus('seller_summary', 'Seller leverage summary', 'completed', 'Decision summary refreshed from identity, contact, location, source and audit signals.'),
    moduleStatus('economy_proff', 'Economy / Proff', economy.status || 'not_enabled', 'Not enabled. Requires confirmed org.nr and Proff integration.'),
    moduleStatus('social_sources', 'Social/source signals', 'not_enabled', 'Not enabled. Later module for Facebook, LinkedIn, news and public source links.'),
    moduleStatus('decision_makers', 'Decision makers', 'not_enabled', 'Not enabled. Later module for public role/contact hints.'),
    moduleStatus('recent_activity', 'Recent activity', 'not_enabled', 'Not enabled. Later module for hiring, news, website updates and public activity.'),
  ]
  copy.website = {
    ...website,
    auditStatus: websiteStatus,
    contactability: website.contactability || contactability,
    topEvidence: Array.from(new Set([...(website.topEvidence || []), deepEvidenceLine({ company, contact, websiteStatus, contactability })].filter(Boolean))),
  }
  copy.ranking = {
    ...ranking,
    whyRanked: Array.from(new Set([...(ranking.whyRanked || []), ...deepWhyRanked({ company, contact, contactability, websiteStatus })].filter(Boolean))),
    caution: Array.from(new Set([...(ranking.caution || []), ...deepCaution({ company, websiteStatus, economy })].filter(Boolean))),
  }
  copy.economy = economy
  copy.enrichmentStatus = 'deep_enriched'
  copy.enrichmentModules = modules
  copy.enrichment = {
    status: 'deep_enriched',
    mode: 'selected_lead',
    enrichedAt: new Date().toISOString(),
    modules,
    summary: {
      companyIdentity: brregStatus,
      contactability,
      websiteAudit: websiteStatus,
      economy: economy.status || 'not_enabled',
    },
  }
  copy.meta = {
    ...(copy.meta || {}),
    deepQualifiedFrom: originalLead.meta?.sourceRun || originalLead.meta?.deepQualifiedFrom || 'selected-fast-lead',
    mode: 'deep',
    enrichmentMode: 'selected_lead',
    enrichedAt: copy.enrichment.enrichedAt,
  }
  return copy
}

function moduleStatus(id, name, status, summary, warnings = []) {
  return { id, name, status: status || 'unknown', summary, warnings }
}

function brregSummary(company = {}) {
  if (company.organizationNumber) return `Confirmed org.nr ${company.organizationNumber}.`
  if (company.candidateOrganizationNumber) return `Candidate org.nr ${company.candidateOrganizationNumber}; manual verification required.`
  if (company.matchStatus === 'error') return 'Brreg lookup failed; retry before export.'
  if (company.matchStatus === 'no_match') return 'No official identity match found.'
  return 'Company identity remains unverified.'
}

function contactabilitySummaryV1({ hasPhone, hasEmail, hasWebsite }) {
  if (hasPhone) return 'Direct phone is available; usable for seller qualification.'
  if (hasEmail) return 'Email is available, but phone is missing.'
  if (hasWebsite) return 'Website exists, but direct contact data is limited.'
  return 'No direct contact path found.'
}

function websiteSummaryV1(status, hasWebsite) {
  if (!hasWebsite) return 'No website available, so website audit was skipped.'
  if (status === 'skipped_no_website') return 'Website audit skipped because no website was available.'
  if (status === 'completed') return 'Website audit completed for selected lead.'
  if (status === 'error') return 'Website audit failed; review source manually.'
  return 'Website audit status recorded for selected lead.'
}

function deepEvidenceLine({ company, contact, websiteStatus, contactability }) {
  if (websiteStatus === 'skipped_no_website') return 'Deep enrichment skipped website audit because no website was available.'
  if (company.organizationNumber && contact.phone) return 'Deep enrichment confirms usable company identity/contact context.'
  if (contactability === 'strong') return 'Deep enrichment confirms strong contactability.'
  return 'Deep enrichment refreshed selected-lead context.'
}

function deepWhyRanked({ company, contact, contactability, websiteStatus }) {
  return [
    'Deep enrichment ran on this selected lead only.',
    company.organizationNumber ? 'Official company identity is confirmed.' : company.candidateOrganizationNumber ? 'Official company identity has a candidate match.' : null,
    contact.phone ? 'Direct phone exists for seller qualification.' : null,
    websiteStatus === 'completed' ? 'Website audit signals are attached.' : null,
    contactability === 'strong' ? 'Contactability is strong.' : null,
  ].filter(Boolean)
}

function deepCaution({ company, websiteStatus, economy }) {
  return [
    !company.organizationNumber && company.candidateOrganizationNumber ? 'Candidate org.nr must be manually verified before export.' : null,
    !company.organizationNumber && !company.candidateOrganizationNumber ? 'Company identity is not confirmed; verify before sales use.' : null,
    websiteStatus === 'skipped_no_website' ? 'Website audit was skipped because no website was available.' : null,
    economy.status === 'not_enabled' ? 'Economy/Proff data is not enabled yet.' : null,
  ].filter(Boolean)
}

function createDemoFixtureRun({ parsedQuery, maxResults, searchScope, enrichCompanyProfile, outputDir, runId }) {
  const fixture = readJsonFile(DEMO_FIXTURE_PATH, null)
  if (!fixture) throw new Error('Demo fixture data is missing')

  const leadPackOutputPath = path.join(outputDir, 'lead-packs')
  fs.mkdirSync(leadPackOutputPath, { recursive: true })

  const allLeadPacks = Array.isArray(fixture.leadPacks) ? fixture.leadPacks : []
  const leadPacks = allLeadPacks.slice(0, maxResults).map((lead) => withDemoRunMetadata(lead, parsedQuery, searchScope, enrichCompanyProfile))
  const summary = buildDemoSummary(fixture.summary || {}, leadPacks, parsedQuery, maxResults, searchScope, enrichCompanyProfile, outputDir, leadPackOutputPath)

  fs.writeFileSync(path.join(leadPackOutputPath, 'lead-packs.json'), JSON.stringify(leadPacks, null, 2))
  fs.writeFileSync(path.join(leadPackOutputPath, 'lead-packs.csv'), toLeadPackCsv(leadPacks))
  fs.writeFileSync(path.join(leadPackOutputPath, 'summary.json'), JSON.stringify(summary.leadPackSummary, null, 2))
  const summaryPath = path.join(outputDir, 'lead-machine-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary.machineSummary, null, 2))

  return {
    outputDir,
    summaryPath,
    leadPackOutputPath,
    summary: summary.machineSummary,
    totalLeads: leadPacks.length,
    provider: 'demo-fixture',
    runId,
  }
}

function withDemoRunMetadata(lead, parsedQuery, searchScope, enrichCompanyProfile) {
  const copy = JSON.parse(JSON.stringify(lead))
  copy.meta = {
    ...(copy.meta || {}),
    sourceQuery: parsedQuery.normalizedQuery,
    requestedQuery: parsedQuery.rawQuery,
    sourceRun: 'demo-fixture',
    lastCheckedAt: new Date().toISOString(),
  }
  copy.sourceQuality = {
    searchScope,
    fallbackUsed: false,
    locationWarnings: [],
    ...(copy.sourceQuality || {}),
  }
  copy.company = {
    displayName: 'unknown',
    legalName: null,
    organizationNumber: null,
    candidateOrganizationNumber: null,
    organizationForm: null,
    matchStatus: 'not_run',
    matchConfidence: null,
    warnings: [],
    ...(copy.company || {}),
  }
  if (enrichCompanyProfile && copy.company.matchStatus === 'not_run') {
    copy.company.matchStatus = 'manual_verify'
    copy.company.warnings = [...(copy.company.warnings || []), 'demo_fixture_company_profile_not_verified']
  }
  copy.economy = { status: 'not_enabled', source: null, revenue: null, profit: null, employees: null, ...(copy.economy || {}) }
  return copy
}

function buildDemoSummary(baseSummary, leadPacks, parsedQuery, maxResults, searchScope, enrichCompanyProfile, outputDir, leadPackOutputPath) {
  const priorityCounts = leadPacks.reduce((counts, lead) => {
    const key = String(lead.callPriority || 'unknown').toLowerCase()
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})
  const locationQualityCounts = leadPacks.reduce((counts, lead) => {
    const key = lead.sourceQuality && lead.sourceQuality.locationMatchStatus ? lead.sourceQuality.locationMatchStatus : 'unknown'
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})
  const hasHigh = Boolean(priorityCounts.high)
  const hasMedium = Boolean(priorityCounts.medium)
  const fallbackUsed = leadPacks.some((lead) => lead.sourceQuality && lead.sourceQuality.fallbackUsed)
  const lowSupply = leadPacks.length < maxResults
  const nextRecommendedAction = hasHigh
    ? 'Review HIGH leads first.'
    : hasMedium
      ? 'Review top MEDIUM leads as shortlist.'
      : lowSupply
        ? 'Try nearby or regional search scope for more volume.'
        : 'Review included leads.'

  const common = {
    ...baseSummary,
    query: parsedQuery.normalizedQuery,
    provider: 'demo-fixture',
    searchScope,
    maxResults,
    sourceRunPath: 'demo-fixture',
    leadPackOutputPath,
    outputDir,
    includedLeadCount: leadPacks.length,
    totalIncluded: leadPacks.length,
    totalDiscovered: Math.max(baseSummary.totalDiscovered || leadPacks.length, leadPacks.length),
    totalExcludedByLocation: baseSummary.totalExcludedByLocation || 0,
    locationQualityCounts,
    callPriorityCounts: priorityCounts,
    lowSupply,
    fallbackAvailable: lowSupply,
    fallbackUsed,
    recommendedExpansion: lowSupply ? 'nearby' : null,
    economyStatus: 'not_enabled',
    companyProfileEnabled: Boolean(enrichCompanyProfile),
    nextRecommendedAction,
  }

  return {
    leadPackSummary: common,
    machineSummary: common,
  }
}

function toLeadPackCsv(leadPacks) {
  const headers = ['rank', 'company', 'orgNumber', 'candidateOrgNumber', 'phone', 'email', 'website', 'city', 'priority', 'leadClass', 'matchStatus', 'workflowStatus', 'contacted', 'channel', 'personReached', 'response', 'followUpDate', 'nextAction', 'workflowNotes', 'workflowOutcome', 'lastActivityAt', 'evidenceSummary', 'cautionSummary']
  const rows = leadPacks.map((lead) => {
    const workflow = normalizeWorkflow(lead.workflow || {})
    return [
      lead.rank,
      lead.company && lead.company.displayName,
      lead.company && lead.company.organizationNumber,
      lead.company && lead.company.candidateOrganizationNumber,
      lead.contact && lead.contact.phone,
      lead.contact && lead.contact.email,
      lead.contact && lead.contact.website,
      lead.contact && lead.contact.city,
      lead.callPriority,
      lead.leadClass,
      lead.company && lead.company.matchStatus,
      workflow.status,
      workflow.contacted ? 'yes' : 'no',
      workflow.channel,
      workflow.personReached,
      workflow.response,
      workflow.followUpDate,
      workflow.nextAction,
      workflow.notes,
      workflow.outcome,
      workflow.activities && workflow.activities[0] ? workflow.activities[0].at : '',
      [...((lead.ranking && lead.ranking.whyRanked) || []), ...((lead.website && lead.website.topEvidence) || [])].join(' | '),
      ((lead.ranking && lead.ranking.caution) || []).join(' | '),
    ]
  })
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n') + '\n'
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function handleRunFile(url, res, runIndex, workflowPath) {
  const parts = url.pathname.split('/').filter(Boolean)
  const runId = parts[2]
  const file = parts[3]
  const run = runIndex.get(runId)
  if (!run) return json(res, 404, { error: 'Run not found in this server session' })
  if (file === 'lead-packs.csv' || file === 'call-list.csv') {
    const leads = attachWorkflowToLeads(readJsonFile(run.leadPacksPath, []), readWorkflowStore(workflowPath))
    const csvLeads = file === 'call-list.csv' ? filterCallListLeads(leads, url.searchParams.get('view') || 'all') : leads
    res.writeHead(200, { 'content-type': 'text/csv' })
    res.end(toLeadPackCsv(csvLeads))
    return
  }
  if (file === 'lead-packs.json') {
    return json(res, 200, attachWorkflowToLeads(readJsonFile(run.leadPacksPath, []), readWorkflowStore(workflowPath)))
  }
  if (file === 'summary.json') return serveFile(res, run.machineSummaryPath, 'application/json')
  return json(res, 404, { error: 'Run file not found' })
}


function handleWorkflowGet(url, res, workflowPath) {
  const leadId = String(url.searchParams.get('leadId') || '').trim()
  if (!leadId) return json(res, 400, { error: 'leadId is required' })
  const store = readWorkflowStore(workflowPath)
  return json(res, 200, { workflow: { ...defaultWorkflow(), ...(store.leads[leadId] || {}), leadId } })
}

async function handleWorkflowPost(req, res, workflowPath) {
  const body = await readJsonBody(req)
  const leadId = String(body.leadId || '').trim()
  if (!leadId) return json(res, 400, { error: 'leadId is required' })
  const store = readWorkflowStore(workflowPath)
  const previous = normalizeWorkflow(store.leads[leadId] || {})
  const workflow = normalizeWorkflow({ ...previous, ...(body.workflow || body), leadId })
  workflow.leadId = leadId
  workflow.runId = limitText(body.runId || workflow.runId || '', 120)
  workflow.leadName = limitText(body.leadName || workflow.leadName || '', 180)
  workflow.updatedAt = new Date().toISOString()
  const activity = createWorkflowActivity(previous, workflow)
  workflow.activities = [activity, ...normalizeActivities(previous.activities)].filter(Boolean).slice(0, 25)
  store.leads[leadId] = workflow
  writeWorkflowStore(workflowPath, store)
  return json(res, 200, { workflow })
}

function attachWorkflowToLeads(leadPacks, store) {
  const workflowStore = store && store.leads ? store : { leads: {} }
  return (Array.isArray(leadPacks) ? leadPacks : []).map((lead, index) => {
    const copy = JSON.parse(JSON.stringify(lead || {}))
    const leadId = leadWorkflowId(copy, index)
    copy.workflow = { ...defaultWorkflow(), ...(workflowStore.leads[leadId] || {}), leadId }
    return copy
  })
}

function leadWorkflowId(lead = {}, index = 0) {
  const parts = [
    lead.company && lead.company.organizationNumber,
    lead.company && lead.company.candidateOrganizationNumber,
    lead.places && lead.places.placeId,
    lead.company && lead.company.displayName,
    index,
  ].filter(Boolean)
  return parts.join('::') || `lead::${index}`
}

function defaultWorkflow() {
  return {
    status: 'new',
    contacted: false,
    channel: '',
    personReached: '',
    response: '',
    notes: '',
    followUpDate: '',
    nextAction: 'review',
    outcome: '',
    owner: '',
    updatedAt: null,
    activities: [],
  }
}

function normalizeWorkflow(input = {}) {
  const statuses = new Set(['new', 'reviewed', 'contacted', 'follow_up', 'interested', 'rejected'])
  const channels = new Set(['', 'phone', 'email', 'contact_form', 'linkedin', 'other'])
  const responses = new Set(['', 'no_answer', 'no_response', 'negative', 'neutral', 'interested', 'meeting_booked'])
  const status = statuses.has(String(input.status || '').toLowerCase()) ? String(input.status).toLowerCase() : 'new'
  const channel = channels.has(String(input.channel || '').toLowerCase()) ? String(input.channel || '').toLowerCase() : ''
  const response = responses.has(String(input.response || '').toLowerCase()) ? String(input.response || '').toLowerCase() : ''
  const followUpDate = /^\d{4}-\d{2}-\d{2}$/.test(String(input.followUpDate || '')) ? String(input.followUpDate) : ''
  return {
    status,
    contacted: input.contacted === true || input.contacted === 'true' || status === 'contacted' || status === 'follow_up' || status === 'interested',
    channel,
    personReached: limitText(input.personReached || '', 120),
    response,
    notes: limitText(input.notes || '', 2000),
    followUpDate,
    nextAction: limitText(input.nextAction || 'review', 180),
    outcome: limitText(input.outcome || '', 500),
    owner: limitText(input.owner || '', 120),
    updatedAt: input.updatedAt || null,
    activities: normalizeActivities(input.activities),
  }
}

function normalizeActivities(activities) {
  if (!Array.isArray(activities)) return []
  return activities.slice(0, 25).map((activity) => ({
    at: limitText(activity && activity.at || '', 40),
    status: limitText(activity && activity.status || '', 40),
    channel: limitText(activity && activity.channel || '', 40),
    response: limitText(activity && activity.response || '', 40),
    personReached: limitText(activity && activity.personReached || '', 120),
    followUpDate: /^\d{4}-\d{2}-\d{2}$/.test(String(activity && activity.followUpDate || '')) ? String(activity.followUpDate) : '',
    nextAction: limitText(activity && activity.nextAction || '', 180),
    outcome: limitText(activity && activity.outcome || '', 500),
    notes: limitText(activity && activity.notes || '', 600),
  })).filter((activity) => activity.at || activity.status || activity.response || activity.notes)
}

function createWorkflowActivity(previous = {}, workflow = {}) {
  const changed = ['status', 'contacted', 'channel', 'response', 'personReached', 'followUpDate', 'nextAction', 'outcome', 'notes']
    .some((field) => String(previous[field] || '') !== String(workflow[field] || ''))
  if (!changed) return null
  return {
    at: workflow.updatedAt || new Date().toISOString(),
    status: workflow.status || 'new',
    channel: workflow.channel || '',
    response: workflow.response || '',
    personReached: workflow.personReached || '',
    followUpDate: workflow.followUpDate || '',
    nextAction: workflow.nextAction || '',
    outcome: workflow.outcome || '',
    notes: workflow.notes || '',
  }
}

function filterCallListLeads(leads, view) {
  const normalizedView = String(view || 'all')
  const list = Array.isArray(leads) ? leads : []
  if (normalizedView === 'today') return list.filter(serverIsTodayCallLead).sort(serverCompareTodayCallLeads)
  if (normalizedView === 'notContacted') return list.filter((lead) => !serverWorkflowContacted(lead.workflow || {}))
  if (normalizedView === 'followUpDue') return list.filter(serverIsFollowUpDue)
  if (normalizedView === 'interested') return list.filter((lead) => {
    const workflow = lead.workflow || {}
    return workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked'
  })
  return list
}

function serverIsTodayCallLead(lead = {}) {
  const workflow = lead.workflow || {}
  const phone = lead.contact && lead.contact.phone || lead.phone
  if (!phone || workflow.status === 'rejected') return false
  return serverIsFollowUpDue(lead) || !serverWorkflowContacted(workflow) || workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked'
}

function serverCompareTodayCallLeads(a = {}, b = {}) {
  return serverTodayCallScore(b) - serverTodayCallScore(a)
}

function serverTodayCallScore(lead = {}) {
  const workflow = lead.workflow || {}
  let score = 0
  if (serverIsFollowUpDue(lead)) score += 1000
  if (!serverWorkflowContacted(workflow)) score += 500
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') score += 300
  if (lead.company && lead.company.organizationNumber) score += 80
  if (lead.company && lead.company.candidateOrganizationNumber) score += 40
  if (lead.sourceQuality && lead.sourceQuality.locationMatchStatus === 'exact_location') score += 50
  if (lead.places && lead.places.rating) score += Number(lead.places.rating || 0) * 5
  if (lead.places && lead.places.reviewCount) score += Math.min(Number(lead.places.reviewCount || 0), 100) / 5
  return score
}

function serverWorkflowContacted(workflow = {}) {
  return workflow.contacted || ['contacted', 'follow_up', 'interested'].includes(workflow.status)
}

function serverIsFollowUpDue(lead = {}) {
  const date = lead.workflow && lead.workflow.followUpDate
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return false
  const today = new Date().toISOString().slice(0, 10)
  return date <= today && lead.workflow.status !== 'rejected'
}

function readWorkflowStore(workflowPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(workflowPath, 'utf8'))
    return parsed && typeof parsed === 'object' && parsed.leads ? parsed : { leads: {} }
  } catch (_) {
    return { leads: {} }
  }
}

function writeWorkflowStore(workflowPath, store) {
  fs.mkdirSync(path.dirname(workflowPath), { recursive: true })
  const tmp = `${workflowPath}.tmp`
  fs.writeFileSync(tmp, JSON.stringify({ leads: store.leads || {} }, null, 2))
  fs.renameSync(tmp, workflowPath)
}

function limitText(value, max) {
  return String(value || '').slice(0, max)
}

function serveFile(res, filePath, type) {
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(PUBLIC_DIR) && !resolved.includes(`${path.sep}runs${path.sep}`)) return json(res, 403, { error: 'Forbidden' })
  if (!fs.existsSync(resolved)) return json(res, 404, { error: 'File not found' })
  res.writeHead(200, { 'content-type': type })
  fs.createReadStream(resolved).pipe(res)
}


function json(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(payload, null, 2))
}

function contentType(filePath) {
  if (filePath.endsWith('.css')) return 'text/css'
  if (filePath.endsWith('.js')) return 'application/javascript'
  if (filePath.endsWith('.json')) return 'application/json'
  return 'text/plain'
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024 * 1024) reject(new Error('Request body too large'))
    })
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) } catch (_) { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

function normalizeMaxResults(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 && number <= 25 ? Math.floor(number) : fallback
}

function createSafeRunId(query) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const slug = String(query || 'lead-machine')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'lead-machine'
  return `${slug}-${stamp}`
}

function readJsonFile(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) } catch (_) { return fallback }
}

function friendlyError(error) {
  const message = error && error.message ? error.message : 'Run failed'
  if (message.includes('GOOGLE_PLACES_API_KEY')) {
    return 'Google Places requires GOOGLE_PLACES_API_KEY. Set GOOGLE_PLACES_API_KEY before running live lead discovery.'
  }
  return message
}

if (require.main === module) {
  const server = createServer()
  server.listen(DEFAULT_PORT, '127.0.0.1', () => {
    console.log(`Lead Machine demo running at http://127.0.0.1:${DEFAULT_PORT}`)
  })
}

module.exports = { createServer, createSafeRunId, normalizeMaxResults, createDemoFixtureRun }
