const http = require('http')
const fs = require('fs')
const path = require('path')
const { runLeadMachine } = require('../../core/lead-machine/leadMachine')
const { loadEnvFiles } = require('../../core/lead-machine/loadEnv')
const { parseLeadQuery } = require('./queryParser')

const DEFAULT_PORT = Number(process.env.PORT || 8787)
const APP_ROOT = __dirname
const PUBLIC_DIR = path.join(APP_ROOT, 'public')
const RUNS_DIR = path.join(APP_ROOT, 'runs')
const FIXTURE_DIR = path.join(APP_ROOT, 'fixtures')
const DEMO_FIXTURE_PATH = path.join(FIXTURE_DIR, 'kristiansand-rorlegger-result.json')
const REPO_ROOT = path.resolve(APP_ROOT, '..', '..')
loadEnvFiles([path.join(REPO_ROOT, '.env'), path.join(APP_ROOT, '.env')])

function createServer(options = {}) {
  const runner = options.runner || runLeadMachine
  const runsDir = options.runsDir || RUNS_DIR
  const publicDir = options.publicDir || PUBLIC_DIR
  const runIndex = new Map()

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1')
      if (req.method === 'GET' && url.pathname === '/') return serveFile(res, path.join(publicDir, 'index.html'), 'text/html')
      if (req.method === 'GET' && url.pathname.startsWith('/assets/')) return serveFile(res, path.join(publicDir, url.pathname.replace('/assets/', '')), contentType(url.pathname))
      if (req.method === 'POST' && url.pathname === '/api/runs') {
        await handleRun(req, res, { runner, runsDir, runIndex })
        return
      }
      if (req.method === 'GET' && url.pathname.startsWith('/api/runs/')) return handleRunFile(url, res, runIndex)
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

  const maxResults = normalizeMaxResults(body.maxResults, 5)
  const provider = ['demo-fixture', 'google-places', 'mock'].includes(body.provider) ? body.provider : 'google-places'
  const searchScope = ['strict', 'nearby', 'regional'].includes(body.searchScope) ? body.searchScope : 'strict'
  const mode = ['fast', 'deep'].includes(body.mode) ? body.mode : 'fast'
  const enrichCompanyProfile = body.enrichCompanyProfile === true || body.enrichCompanyProfile === 'true'
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
  const leadPacks = readJsonFile(leadPacksPath, [])
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
    },
    summary: { ...leadPackSummary, ...machineSummary },
    leadPacks,
  })
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
  const headers = ['rank', 'company', 'orgNumber', 'candidateOrgNumber', 'phone', 'email', 'website', 'city', 'priority', 'leadClass', 'matchStatus', 'evidenceSummary', 'cautionSummary']
  const rows = leadPacks.map((lead) => [
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
    [...((lead.ranking && lead.ranking.whyRanked) || []), ...((lead.website && lead.website.topEvidence) || [])].join(' | '),
    ((lead.ranking && lead.ranking.caution) || []).join(' | '),
  ])
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n') + '\n'
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function handleRunFile(url, res, runIndex) {
  const parts = url.pathname.split('/').filter(Boolean)
  const runId = parts[2]
  const file = parts[3]
  const run = runIndex.get(runId)
  if (!run) return json(res, 404, { error: 'Run not found in this server session' })
  if (file === 'lead-packs.csv') return serveFile(res, run.csvPath, 'text/csv')
  if (file === 'lead-packs.json') return serveFile(res, run.leadPacksPath, 'application/json')
  if (file === 'summary.json') return serveFile(res, run.machineSummaryPath, 'application/json')
  return json(res, 404, { error: 'Run file not found' })
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
    return 'Google Places requires GOOGLE_PLACES_API_KEY. Choose Demo fixture to run without an API key, or set GOOGLE_PLACES_API_KEY for live Google Places runs.'
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
