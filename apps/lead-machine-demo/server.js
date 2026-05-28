const http = require('http')
const fs = require('fs')
const path = require('path')
const { runLeadMachine } = require('../../core/lead-machine/leadMachine')
const { parseLeadQuery } = require('./queryParser')

const DEFAULT_PORT = Number(process.env.PORT || 8787)
const APP_ROOT = __dirname
const PUBLIC_DIR = path.join(APP_ROOT, 'public')
const RUNS_DIR = path.join(APP_ROOT, 'runs')

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
  const provider = ['google-places', 'mock'].includes(body.provider) ? body.provider : 'google-places'
  const searchScope = ['strict', 'nearby', 'regional'].includes(body.searchScope) ? body.searchScope : 'strict'
  const enrichCompanyProfile = body.enrichCompanyProfile === true || body.enrichCompanyProfile === 'true'
  const runId = createSafeRunId(parsedQuery.normalizedQuery)
  const outputDir = path.join(context.runsDir, runId)
  fs.mkdirSync(outputDir, { recursive: true })

  const result = await context.runner({
    query: parsedQuery.normalizedQuery,
    provider,
    maxResults,
    searchScope,
    enrichCompanyProfile,
    outputDir,
    runId,
  })

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
  return error && error.message ? error.message : 'Run failed'
}

if (require.main === module) {
  const server = createServer()
  server.listen(DEFAULT_PORT, '127.0.0.1', () => {
    console.log(`Lead Machine demo running at http://127.0.0.1:${DEFAULT_PORT}`)
  })
}

module.exports = { createServer, createSafeRunId, normalizeMaxResults }
