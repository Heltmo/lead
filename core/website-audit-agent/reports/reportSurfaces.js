const fs = require('fs')
const path = require('path')
const { normalizeOpportunityBullets } = require('../../opportunity-bullets/opportunityBullets')

const CSV_COLUMNS = [
  'rank',
  'name',
  'url',
  'status',
  'leadScore',
  'title',
  'pageTitle',
  'technologies',
  'issueCategories',
  'highIssues',
  'mediumIssues',
  'lowIssues',
  'responseStatus',
  'domContentLoadedMs',
  'loadMs',
  'failedRequestCount',
  'consoleErrorCount',
  'desktopScreenshot',
  'mobileScreenshot',
  'jsonArtifact',
  'issues',
  'painPointBullets',
  'suggestedOffer',
  'outreachOpener',
  'whyThisLeadMatters',
]

function generateReportSurfaces(input, options = {}) {
  const sourcePath = typeof input === 'string' ? path.resolve(input) : ''
  const payload = typeof input === 'string' ? readJson(sourcePath) : input
  const inputDir = sourcePath ? path.dirname(sourcePath) : process.cwd()
  const outDir = path.resolve(options.outDir || path.join(inputDir, 'report-surfaces'))
  fs.mkdirSync(outDir, { recursive: true })

  const model = normalizeReportPayload(payload, { inputDir, sourcePath, title: options.title })
  const markdownPath = path.join(outDir, 'report.md')
  const htmlPath = path.join(outDir, 'report.html')
  const csvPath = path.join(outDir, 'leads.csv')

  fs.writeFileSync(markdownPath, renderMarkdown(model, outDir))
  fs.writeFileSync(htmlPath, renderHtml(model, outDir))
  fs.writeFileSync(csvPath, renderCsv(model, outDir))

  return { markdownPath, htmlPath, csvPath, totalResults: model.results.length }
}

function normalizeReportPayload(payload, context = {}) {
  if (payload && Array.isArray(payload.results) && payload.sourceFile) return normalizeBatchReport(payload, context)
  if (payload && payload.pipeline === 'website-audit-queue' && Array.isArray(payload.results)) return normalizeRunSummary(payload, context)
  if (payload && payload.runId && Array.isArray(payload.results)) return normalizeRunSummary(payload, context)
  if (payload && payload.url && payload.signals) return normalizeSingleAudit(payload, context)
  throw new Error('Unsupported report payload shape')
}

function normalizeBatchReport(report, context) {
  const results = report.results.map((result, index) => normalizeBatchResult(result, { index }))
  return sortModel({
    kind: 'batch-report',
    title: context.title || 'Website Audit Batch Report',
    source: report.sourceFile || context.sourcePath || '',
    runId: '',
    generatedFrom: context.sourcePath || '',
    processedAt: report.processedAt || report.startedAt || '',
    totalResults: report.totalSites ?? results.length,
    successfulResults: report.successfulAudits ?? results.filter((result) => result.status === 'passed').length,
    failedResults: report.failedAudits ?? results.filter((result) => result.status === 'failed').length,
    pendingResults: report.pendingAudits ?? results.filter((result) => result.status === 'pending').length,
    results,
  })
}

function normalizeRunSummary(summary, context) {
  const results = summary.results.map((item, index) => {
    const artifactPath = resolveMaybeRelative(item.reportPath, context.inputDir)
    const artifact = artifactPath && fs.existsSync(artifactPath) ? readJson(artifactPath) : null
    return normalizeOrchestratorItem(item, artifact, { index, artifactPath })
  })
  return sortModel({
    kind: 'orchestrator-run',
    title: context.title || 'Website Audit Run Report',
    source: context.sourcePath || '',
    runId: summary.runId || '',
    generatedFrom: context.sourcePath || '',
    processedAt: summary.updatedAt || summary.createdAt || '',
    totalResults: summary.totalItems ?? results.length,
    successfulResults: summary.completedItems ?? results.filter((result) => result.status === 'completed').length,
    failedResults: summary.failedItems ?? results.filter((result) => result.status === 'failed').length,
    pendingResults: summary.pendingItems ?? results.filter((result) => result.status === 'pending').length,
    results,
  })
}

function normalizeSingleAudit(report, context) {
  const result = normalizeAuditReport(report, { index: 0, artifactPath: context.sourcePath })
  return sortModel({
    kind: 'single-audit',
    title: context.title || 'Website Audit Report',
    source: context.sourcePath || report.url,
    runId: '',
    generatedFrom: context.sourcePath || '',
    processedAt: report.finishedAt || report.startedAt || '',
    totalResults: 1,
    successfulResults: report.status === 'passed' ? 1 : 0,
    failedResults: report.status === 'passed' ? 0 : 1,
    pendingResults: 0,
    results: [result],
  })
}

function normalizeBatchResult(result, context) {
  const sourceMetadata = normalizeSourceMetadata(result.sourceMetadata || result)
  const pageTitle = result.pageTitle || result.title || ''
  return withOpportunityBullets({
    rank: context.index + 1,
    name: result.name || result.businessName || sourceMetadata.businessName || '',
    url: result.url || '',
    status: result.status || '',
    leadScore: numericScore(result.leadScore),
    title: pageTitle,
    pageTitle,
    sourceMetadata,
    technologies: arrayOf(result.technologies),
    issueCategories: result.issueCategories || {},
    issueSeverities: result.issueSeverities || {},
    performance: result.performance || {},
    screenshots: result.screenshots || {},
    jsonArtifact: result.reportPath || '',
    issues: arrayOf(result.issues),
    opportunityBullets: result.opportunityBullets,
  })
}


function normalizeOrchestratorItem(item, artifact, context) {
  const sourceMetadata = normalizeSourceMetadata(item.sourceMetadata || item, artifact?.sourceMetadata)
  const base = artifact ? normalizeAuditReport(artifact, context) : {
    rank: context.index + 1,
    name: item.id || '',
    url: item.url || '',
    status: item.status || '',
    leadScore: 0,
    title: '',
    pageTitle: '',
    technologies: [],
    issueCategories: {},
    issueSeverities: {},
    performance: {},
    screenshots: {},
    issues: arrayOf(item.errors),
  }
  return withOpportunityBullets({
    ...base,
    name: sourceMetadata.businessName || base.name,
    sourceMetadata,
    status: item.status || base.status,
    jsonArtifact: context.artifactPath || item.reportPath || '',
    attempts: item.attempts ?? 0,
  })
}


function normalizeAuditReport(report, context) {
  const sourceMetadata = normalizeSourceMetadata(report.sourceMetadata || {})
  const pageTitle = report.signals?.title || ''
  return withOpportunityBullets({
    rank: context.index + 1,
    name: sourceMetadata.businessName || '',
    url: report.url || '',
    status: report.status || '',
    leadScore: numericScore(report.leadQuality?.score),
    title: pageTitle,
    pageTitle,
    sourceMetadata,
    technologies: arrayOf(report.technology?.technologies),
    issueCategories: report.issueClassification?.counts || {},
    issueSeverities: report.issueClassification?.severityCounts || {},
    performance: summarizePerformance(report.performance),
    screenshots: report.screenshots || {},
    jsonArtifact: context.artifactPath || '',
    issues: arrayOf(report.leadQuality?.issues).concat(arrayOf(report.errors).map((error) => typeof error === 'string' ? error : error.message).filter(Boolean)),
    opportunityBullets: report.opportunityBullets,
  })
}

function withOpportunityBullets(result) {
  return { ...result, opportunityBullets: normalizeOpportunityBullets(result) }
}


function normalizeSourceMetadata(...values) {
  const metadata = {}
  for (const value of values) {
    if (!value) continue
    if (value.sourceMetadata) Object.assign(metadata, normalizeSourceMetadata(value.sourceMetadata))
    for (const key of ['businessName', 'source', 'location', 'industry', 'confidence']) {
      if (!metadata[key] && value[key]) metadata[key] = String(value[key]).trim()
    }
    if (!metadata.sources && Array.isArray(value.sources)) metadata.sources = value.sources
  }
  return metadata
}

function summarizePerformance(performance) {
  if (!performance) return {}
  return {
    responseStatus: performance.responseStatus,
    domContentLoadedMs: performance.domContentLoadedMs,
    loadMs: performance.loadMs,
    transferSizeBytes: performance.transferSizeBytes,
    imageCount: performance.imageCount,
    failedRequestCount: Array.isArray(performance.failedRequests) ? performance.failedRequests.length : performance.failedRequestCount,
    consoleErrorCount: Array.isArray(performance.consoleErrors) ? performance.consoleErrors.length : performance.consoleErrorCount,
  }
}

function sortModel(model) {
  model.results = [...model.results]
    .sort((a, b) => numericScore(b.leadScore) - numericScore(a.leadScore) || String(a.url).localeCompare(String(b.url)))
    .map((result, index) => ({ ...result, rank: index + 1 }))
  return model
}

function renderMarkdown(model, outDir) {
  const lines = []
  lines.push(`# ${model.title}`)
  lines.push('')
  lines.push(`- Type: ${model.kind}`)
  if (model.runId) lines.push(`- Run ID: ${model.runId}`)
  if (model.source) lines.push(`- Source: ${model.source}`)
  if (model.processedAt) lines.push(`- Processed at: ${model.processedAt}`)
  lines.push(`- Total results: ${model.totalResults}`)
  lines.push(`- Successful: ${model.successfulResults}`)
  lines.push(`- Failed: ${model.failedResults}`)
  lines.push(`- Pending: ${model.pendingResults}`)
  lines.push('')
  lines.push('## Ranked Leads')
  lines.push('')
  lines.push('| Rank | Score | Status | Lead | URL | Page Title | Technologies | Top Issues |')
  lines.push('| --- | ---: | --- | --- | --- | --- | --- | --- |')
  for (const result of model.results) {
    lines.push(`| ${result.rank} | ${result.leadScore} | ${escapeMarkdownCell(result.status)} | ${escapeMarkdownCell(result.name)} | ${markdownLink(result.url, result.url)} | ${escapeMarkdownCell(result.pageTitle || result.title)} | ${escapeMarkdownCell(result.technologies.join(', '))} | ${escapeMarkdownCell(result.issues.slice(0, 3).join('; '))} |`)
  }
  lines.push('')
  lines.push('## Lead Details')
  for (const result of model.results) {
    lines.push('')
    lines.push(`### ${result.rank}. ${result.name || result.url || 'Unknown lead'}`)
    lines.push('')
    lines.push(`- Score: ${result.leadScore}`)
    lines.push(`- Status: ${result.status || 'unknown'}`)
    if (result.name) lines.push(`- Business name: ${result.name}`)
    if (result.pageTitle || result.title) lines.push(`- Page title: ${result.pageTitle || result.title}`)
    if (result.technologies.length) lines.push(`- Technologies: ${result.technologies.join(', ')}`)
    lines.push(`- Issue categories: ${formatCounts(result.issueCategories) || 'none'}`)
    lines.push(`- Issue severities: ${formatCounts(result.issueSeverities) || 'none'}`)
    lines.push(`- Performance: ${formatPerformance(result.performance) || 'not available'}`)
    lines.push(...formatOpportunityMarkdown(result.opportunityBullets))
    if (result.jsonArtifact) lines.push(`- JSON artifact: ${relativeLink(outDir, result.jsonArtifact)}`)
    if (result.screenshots.desktop) lines.push(`- Desktop screenshot: ${relativeLink(outDir, result.screenshots.desktop)}`)
    if (result.screenshots.mobile) lines.push(`- Mobile screenshot: ${relativeLink(outDir, result.screenshots.mobile)}`)
    lines.push('')
    lines.push('Issues:')
    if (result.issues.length) result.issues.forEach((issue) => lines.push(`- ${issue}`))
    else lines.push('- none')
  }
  return `${lines.join('\n')}\n`
}

function formatOpportunityMarkdown(opportunity) {
  if (!opportunity) return []
  const lines = ['- Pain-point bullets:']
  for (const bullet of opportunity.painPointBullets || []) lines.push(`  - ${bullet}`)
  if (opportunity.suggestedOffer) lines.push(`- Suggested offer: ${opportunity.suggestedOffer}`)
  if (opportunity.outreachOpener) lines.push(`- Outreach opener: ${opportunity.outreachOpener}`)
  if (opportunity.whyThisLeadMatters) lines.push(`- Why this lead matters: ${opportunity.whyThisLeadMatters}`)
  return lines
}

function renderHtml(model, outDir) {
  const rows = model.results.map((result) => `<tr><td>${result.rank}</td><td>${result.leadScore}</td><td>${escapeHtml(result.status)}</td><td>${escapeHtml(result.name || '')}</td><td><a href="${escapeAttr(result.url)}">${escapeHtml(result.url)}</a></td><td>${escapeHtml(result.pageTitle || result.title)}</td><td>${escapeHtml(result.technologies.join(', '))}</td><td>${escapeHtml(result.issues.slice(0, 3).join('; '))}</td></tr>`).join('\n')
  const details = model.results.map((result) => `<section class="lead"><h2>${result.rank}. ${escapeHtml(result.name || result.url || 'Unknown lead')}</h2><dl><dt>Score</dt><dd>${result.leadScore}</dd><dt>Status</dt><dd>${escapeHtml(result.status || 'unknown')}</dd><dt>Business name</dt><dd>${escapeHtml(result.name || '')}</dd><dt>Page title</dt><dd>${escapeHtml(result.pageTitle || result.title || '')}</dd><dt>Technologies</dt><dd>${escapeHtml(result.technologies.join(', '))}</dd><dt>Issue categories</dt><dd>${escapeHtml(formatCounts(result.issueCategories) || 'none')}</dd><dt>Issue severities</dt><dd>${escapeHtml(formatCounts(result.issueSeverities) || 'none')}</dd><dt>Performance</dt><dd>${escapeHtml(formatPerformance(result.performance) || 'not available')}</dd></dl>${renderOpportunityHtml(result.opportunityBullets)}${renderArtifactLinks(result, outDir)}<h3>Issues</h3><ul>${(result.issues.length ? result.issues : ['none']).map((issue) => `<li>${escapeHtml(issue)}</li>`).join('')}</ul></section>`).join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(model.title)}</title>
<style>
:root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #09090b; color: #f4f4f5; }
body { margin: 0; padding: 32px; background: #09090b; }
a { color: #93c5fd; }
header, section { max-width: 1180px; margin: 0 auto 28px; }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 20px; }
.summary div, .lead { border: 1px solid #27272a; background: #111113; border-radius: 8px; padding: 16px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { border-bottom: 1px solid #27272a; padding: 10px; text-align: left; vertical-align: top; }
th { color: #a1a1aa; font-weight: 600; }
dl { display: grid; grid-template-columns: 180px 1fr; gap: 8px 16px; }
dt { color: #a1a1aa; }
.artifacts { display: flex; flex-wrap: wrap; gap: 12px; padding: 0; list-style: none; }
</style>
</head>
<body>
<header>
<h1>${escapeHtml(model.title)}</h1>
<p>${escapeHtml(model.kind)}${model.runId ? ` / ${escapeHtml(model.runId)}` : ''}</p>
<div class="summary"><div>Total<br><strong>${model.totalResults}</strong></div><div>Successful<br><strong>${model.successfulResults}</strong></div><div>Failed<br><strong>${model.failedResults}</strong></div><div>Pending<br><strong>${model.pendingResults}</strong></div></div>
</header>
<section>
<h2>Ranked Leads</h2>
<table><thead><tr><th>Rank</th><th>Score</th><th>Status</th><th>Lead</th><th>URL</th><th>Page Title</th><th>Technologies</th><th>Top Issues</th></tr></thead><tbody>
${rows}
</tbody></table>
</section>
${details}
</body>
</html>
`
}

function renderCsv(model, outDir) {
  const lines = [CSV_COLUMNS.join(',')]
  for (const result of model.results) {
    const row = {
      rank: result.rank,
      name: result.name,
      url: result.url,
      status: result.status,
      leadScore: result.leadScore,
      title: result.title,
      pageTitle: result.pageTitle || result.title,
      technologies: result.technologies.join('|'),
      issueCategories: formatCounts(result.issueCategories),
      highIssues: result.issueSeverities.high ?? 0,
      mediumIssues: result.issueSeverities.medium ?? 0,
      lowIssues: result.issueSeverities.low ?? 0,
      responseStatus: result.performance.responseStatus ?? '',
      domContentLoadedMs: result.performance.domContentLoadedMs ?? '',
      loadMs: result.performance.loadMs ?? '',
      failedRequestCount: result.performance.failedRequestCount ?? '',
      consoleErrorCount: result.performance.consoleErrorCount ?? '',
      desktopScreenshot: result.screenshots.desktop ? relativePath(outDir, result.screenshots.desktop) : '',
      mobileScreenshot: result.screenshots.mobile ? relativePath(outDir, result.screenshots.mobile) : '',
      jsonArtifact: result.jsonArtifact ? relativePath(outDir, result.jsonArtifact) : '',
      issues: result.issues.join('|'),
      painPointBullets: result.opportunityBullets.painPointBullets.join('|'),
      suggestedOffer: result.opportunityBullets.suggestedOffer,
      outreachOpener: result.opportunityBullets.outreachOpener,
      whyThisLeadMatters: result.opportunityBullets.whyThisLeadMatters,
    }
    lines.push(CSV_COLUMNS.map((column) => csvEscape(row[column])).join(','))
  }
  return `${lines.join('\n')}\n`
}

function renderOpportunityHtml(opportunity) {
  if (!opportunity) return ''
  const painPoints = (opportunity.painPointBullets || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')
  return `<h3>Opportunity</h3><ul>${painPoints}</ul><dl><dt>Suggested offer</dt><dd>${escapeHtml(opportunity.suggestedOffer || '')}</dd><dt>Outreach opener</dt><dd>${escapeHtml(opportunity.outreachOpener || '')}</dd><dt>Why this lead matters</dt><dd>${escapeHtml(opportunity.whyThisLeadMatters || '')}</dd></dl>`
}

function renderArtifactLinks(result, outDir) {
  const links = []
  if (result.jsonArtifact) links.push(`<li><a href="${escapeAttr(relativePath(outDir, result.jsonArtifact))}">JSON artifact</a></li>`)
  if (result.screenshots.desktop) links.push(`<li><a href="${escapeAttr(relativePath(outDir, result.screenshots.desktop))}">Desktop screenshot</a></li>`)
  if (result.screenshots.mobile) links.push(`<li><a href="${escapeAttr(relativePath(outDir, result.screenshots.mobile))}">Mobile screenshot</a></li>`)
  return links.length ? `<ul class="artifacts">${links.join('')}</ul>` : ''
}

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')) }
function arrayOf(value) { return Array.isArray(value) ? value.filter((item) => item != null).map(formatListValue).filter(Boolean) : [] }
function formatListValue(value) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && value.name) return String(value.name)
  return String(value || '')
}
function numericScore(value) { return Number.isFinite(Number(value)) ? Number(value) : 0 }
function resolveMaybeRelative(value, baseDir) { if (!value) return ''; return path.isAbsolute(value) ? value : path.resolve(baseDir || process.cwd(), value) }
function relativePath(fromDir, target) { return path.relative(fromDir, path.resolve(target)).replace(/\\/g, '/') || path.basename(target) }
function relativeLink(fromDir, target) { return relativePath(fromDir, target) }
function formatCounts(counts) { return Object.keys(counts || {}).sort().map((key) => `${key}:${counts[key]}`).join(', ') }
function formatPerformance(performance) {
  if (!performance || Object.keys(performance).length === 0) return ''
  const parts = []
  if (performance.responseStatus != null) parts.push(`status ${performance.responseStatus}`)
  if (performance.domContentLoadedMs != null) parts.push(`DOMContentLoaded ${performance.domContentLoadedMs}ms`)
  if (performance.loadMs != null) parts.push(`load ${performance.loadMs}ms`)
  if (performance.failedRequestCount != null) parts.push(`failed requests ${performance.failedRequestCount}`)
  if (performance.consoleErrorCount != null) parts.push(`console errors ${performance.consoleErrorCount}`)
  return parts.join(', ')
}
function markdownLink(label, href) { return href ? `[${escapeMarkdownCell(label || href)}](${href})` : '' }
function escapeMarkdownCell(value) { return String(value || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ') }
function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }
function escapeAttr(value) { return escapeHtml(value) }
function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

module.exports = { CSV_COLUMNS, generateReportSurfaces, normalizeReportPayload, renderMarkdown, renderHtml, renderCsv }
