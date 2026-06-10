const http = require('http')
const fs = require('fs')
const path = require('path')
const { runLeadMachine } = require('../../core/lead-machine/leadMachine')
const { enrichCompanyProfile } = require('../../core/company-profile/companyProfile')
const { enrichProffCompany } = require('../../core/company-profile/proffProvider')
const { loadEnvFiles } = require('../../core/lead-machine/loadEnv')
const { evaluateSellerFit, normalizeSellerIntent, normalizeSellerProfile } = require('../../core/seller-fit/sellerFit')
const { evaluateWebsiteSalesFit } = require('../../core/website-sales-fit/websiteSalesFit')
const { auditWebsite } = require('../../core/website-audit/websiteAudit')
const { enrichOsint } = require('../../core/osint/osint')
const { evaluateSourceFusion, sourceFusionSummary } = require('../../core/source-fusion/sourceFusion')
const { buildOpportunityCommandCenter } = require('../../core/opportunity-command-center/opportunityCommandCenter')
const { parseLeadQuery } = require('./queryParser')
const { createWorkspaceStore } = require('./localStore')
const { defaultWorkflow, normalizeWorkflow, normalizeActivities, createWorkflowActivity, workflowForLead, inferLeadQueue, buildQueueQuality, leadMatchesQueue, normalizeQueue } = require('./workQueues')
const { buildNorwaySweepRunOptions, NORWAY_SWEEP_MAX_RESULTS } = require('../../core/lead-discovery-agent/providers/norwaySweep')

const DEFAULT_PORT = Number(process.env.PORT || 8787)
const APP_ROOT = __dirname
const PUBLIC_DIR = path.join(APP_ROOT, 'public')
const RUNS_DIR = path.join(APP_ROOT, 'runs')
const FIXTURE_DIR = path.join(APP_ROOT, 'fixtures')
const DEMO_FIXTURE_PATH = path.join(FIXTURE_DIR, 'kristiansand-rorlegger-result.json')
const REPO_ROOT = path.resolve(APP_ROOT, '..', '..')
const WORKFLOW_PATH = path.join(REPO_ROOT, '.cache', 'lead-machine-demo', 'lead-workflow.json')
const SAVED_SEARCHES_PATH = path.join(REPO_ROOT, '.cache', 'lead-machine-demo', 'saved-searches.json')
const WORKSPACE_DB_PATH = path.join(REPO_ROOT, '.cache', 'lead-machine-demo', 'workspace.sqlite')
loadEnvFiles([path.join(REPO_ROOT, '.env'), path.join(APP_ROOT, '.env')])

function createServer(options = {}) {
  const runner = options.runner || runLeadMachine
  const deepQualifier = options.deepQualifier || deepQualifyLead
  const runsDir = options.runsDir || RUNS_DIR
  const publicDir = options.publicDir || PUBLIC_DIR
  const runIndex = new Map()
  const workflowPath = options.workflowPath || WORKFLOW_PATH
  const savedSearchesPath = options.savedSearchesPath || SAVED_SEARCHES_PATH
  const workspaceStore = options.workspaceStore || createWorkspaceStore({
    dbPath: options.workspaceDbPath || WORKSPACE_DB_PATH,
    workflowPath,
    savedSearchesPath,
  })
  const workflowStore = options.workflowStore || workspaceStore
  const savedSearchesStore = options.savedSearchesStore || workspaceStore

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1')
      if (req.method === 'GET' && url.pathname === '/') return serveFile(res, path.join(publicDir, 'index.html'), 'text/html')
      if (req.method === 'GET' && url.pathname.startsWith('/assets/')) return serveFile(res, path.join(publicDir, url.pathname.replace('/assets/', '')), contentType(url.pathname))
      if (req.method === 'GET' && ['/styles.css', '/app.js'].includes(url.pathname)) return serveFile(res, path.join(publicDir, url.pathname.slice(1)), contentType(url.pathname))
      if (req.method === 'POST' && url.pathname === '/api/runs') {
        await handleRun(req, res, { runner, runsDir, runIndex, workflowStore, savedSearchesStore })
        return
      }
      if (req.method === 'GET' && url.pathname === '/api/latest-run') {
        await handleLatestRun(res, { runsDir, runIndex, workflowStore, savedSearchesStore })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/website-audit') return handleWebsiteAudit(req, res)
      if (req.method === 'POST' && url.pathname === '/api/deep-qualify') {
        await handleDeepQualify(req, res, { deepQualifier, runsDir, workflowStore })
        return
      }
      if (req.method === 'GET' && url.pathname === '/api/workflow') return handleWorkflowGet(url, res, workflowStore)
      if (req.method === 'POST' && url.pathname === '/api/workflow') return handleWorkflowPost(req, res, workflowStore)
      if (req.method === 'PATCH' && url.pathname === '/api/saved-searches') return handleSavedSearchPatch(req, res, savedSearchesStore)
      if (req.method === "GET" && url.pathname === "/api/opportunity-command-center") return handleOpportunityCommandCenter(res, { runsDir, runIndex, workflowStore, savedSearchesStore })
      if (req.method === "GET" && url.pathname === "/api/workspace-export") return json(res, 200, workspaceStore.exportSnapshot())
      if (req.method === "GET" && url.pathname === "/api/health") return json(res, 200, buildBetaHealth({ workspaceStore, savedSearchesStore }))
      if (req.method === 'GET' && url.pathname.startsWith('/api/runs/')) return handleRunFile(url, res, runIndex, workflowStore)
      return json(res, 404, { error: 'Not found' })
    } catch (error) {
      return json(res, 500, { error: friendlyError(error) })
    }
  })
  if (!options.workspaceStore && typeof workspaceStore.close === 'function') {
    server.on('close', () => workspaceStore.close())
  }
  return server
}

async function handleRun(req, res, context) {
  const body = await readJsonBody(req)
  const query = String(body.query || '').trim()
  if (!query) return json(res, 400, { error: 'Query is required' })

  const parsedQuery = parseLeadQuery(query)
  if (!parsedQuery.ok) return json(res, 400, { error: parsedQuery.error })

  const provider = ['demo-fixture', 'google-places', 'brreg', 'balanced', 'mock'].includes(body.provider) ? body.provider : 'balanced'
  const requestedSearchScope = ['strict', 'nearby', 'regional'].includes(body.searchScope) ? body.searchScope : 'strict'
  const sweepPlan = buildNorwaySweepRunOptions({ parsedQuery, searchScope: requestedSearchScope, requestedMaxResults: body.maxResults })
  const searchScope = sweepPlan.searchScope || requestedSearchScope
  const maxResults = provider === 'demo-fixture' ? normalizeMaxResults(body.maxResults, 25) : sweepPlan.maxResults
  const mode = ['fast', 'deep'].includes(body.mode) ? body.mode : 'fast'
  const sellerIntent = normalizeSellerIntent(body.sellerIntent)
  const sellerProfile = normalizeSellerProfile(body.sellerProfile)
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
      sellerIntent,
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
      sellerIntent,
      sellerProfile,
      mode,
      outputDir,
      runId,
      marketSweep: sweepPlan.marketSweep,
      marketSweepCities: sweepPlan.cities,
      maxProviderQueries: sweepPlan.maxProviderQueries,
      perProviderQueryMaxResults: sweepPlan.perProviderQueryMaxResults,
    })
  }

  const leadPackOutputPath = result.leadPackOutputPath || path.join(outputDir, 'lead-packs')
  const leadPacksPath = path.join(leadPackOutputPath, 'lead-packs.json')
  const leadPackSummaryPath = path.join(leadPackOutputPath, 'summary.json')
  const csvPath = path.join(leadPackOutputPath, 'lead-packs.csv')
  const machineSummaryPath = result.summaryPath || path.join(outputDir, 'lead-machine-summary.json')
  writeSummarySellerSetup(machineSummaryPath, sellerIntent, sellerProfile)
  writeSummarySellerSetup(leadPackSummaryPath, sellerIntent, sellerProfile)
  context.runIndex.set(runId, { outputDir, leadPackOutputPath, csvPath, leadPacksPath, machineSummaryPath, sellerIntent, sellerProfile })
  const savedLeadPacks = readJsonFile(leadPacksPath, [])
  saveSearchMetadata(context.savedSearchesStore, { runId, query: parsedQuery.normalizedQuery, rawQuery: parsedQuery.rawQuery, provider, searchScope, sellerIntent, sellerProfile, mode, maxResults, outputDir, leadPackOutputPath, leadCount: savedLeadPacks.length, phoneCount: savedLeadPacks.filter((lead) => lead.contact && lead.contact.phone || lead.phone).length, interestedCount: 0 })

  return json(res, 200, buildRunPayload({
    runId,
    parsedQuery,
    outputDir,
    leadPackOutputPath,
    leadPacksPath,
    leadPackSummaryPath,
    machineSummaryPath,
    workflowStore: context.workflowStore,
    savedSearchesStore: context.savedSearchesStore,
    sellerIntent,
    sellerProfile,
    machineSummaryOverride: result.summary,
  }))
}

async function handleLatestRun(res, context) {
  const latest = findLatestRun(context.runsDir)
  if (!latest) return json(res, 404, { error: 'No previous run found' })
  const leadPackOutputPath = path.join(latest.outputDir, 'lead-packs')
  const leadPacksPath = path.join(leadPackOutputPath, 'lead-packs.json')
  const leadPackSummaryPath = path.join(leadPackOutputPath, 'summary.json')
  const csvPath = path.join(leadPackOutputPath, 'lead-packs.csv')
  const machineSummaryPath = path.join(latest.outputDir, 'lead-machine-summary.json')
  context.runIndex.set(latest.runId, { outputDir: latest.outputDir, leadPackOutputPath, csvPath, leadPacksPath, machineSummaryPath })
  return json(res, 200, buildRunPayload({
    runId: latest.runId,
    outputDir: latest.outputDir,
    leadPackOutputPath,
    leadPacksPath,
    leadPackSummaryPath,
    machineSummaryPath,
    workflowStore: context.workflowStore,
    savedSearchesStore: context.savedSearchesStore,
  }))
}

function handleOpportunityCommandCenter(res, context) {
  const latest = findLatestRun(context.runsDir)
  if (!latest) {
    return json(res, 200, buildOpportunityCommandCenter({
      leadPacks: [],
      savedSearches: readSavedSearches(context.savedSearchesStore),
    }))
  }
  const leadPackOutputPath = path.join(latest.outputDir, 'lead-packs')
  const leadPacksPath = path.join(leadPackOutputPath, 'lead-packs.json')
  const leadPackSummaryPath = path.join(leadPackOutputPath, 'summary.json')
  const machineSummaryPath = path.join(latest.outputDir, 'lead-machine-summary.json')
  const payload = buildRunPayload({
    runId: latest.runId,
    outputDir: latest.outputDir,
    leadPackOutputPath,
    leadPacksPath,
    leadPackSummaryPath,
    machineSummaryPath,
    workflowStore: context.workflowStore,
    savedSearchesStore: context.savedSearchesStore,
  })
  return json(res, 200, payload.commandCenter)
}

function saveSearchMetadata(filePath, entry = {}) {
  if (!filePath) return
  const searches = readSavedSearches(filePath)
  const previous = searches.find((item) => savedSearchKey(item) === savedSearchKey(entry)) || {}
  const normalized = {
    runId: limitText(entry.runId || '', 140),
    query: limitText(entry.query || '', 180),
    rawQuery: limitText(entry.rawQuery || entry.query || '', 180),
    provider: limitText(entry.provider || 'balanced', 40),
    searchScope: limitText(entry.searchScope || 'regional', 40),
    sellerIntent: normalizeSellerIntent(entry.sellerIntent),
    sellerProfile: publicSellerProfile(entry.sellerProfile),
    mode: limitText(entry.mode || 'fast', 40),
    maxResults: normalizeMaxResults(entry.maxResults, 25),
    outputDir: limitText(entry.outputDir || '', 300),
    leadPackOutputPath: limitText(entry.leadPackOutputPath || '', 300),
    leadCount: normalizeCount(entry.leadCount),
    phoneCount: normalizeCount(entry.phoneCount),
    interestedCount: normalizeCount(entry.interestedCount),
    label: limitText(previous.label || entry.label || '', 80),
    pinned: previous.pinned === true || previous.pinned === 'true',
    updatedAt: limitText(previous.updatedAt || '', 40),
    savedAt: new Date().toISOString(),
  }
  const key = savedSearchKey(normalized)
  const next = sortSavedSearches([normalized, ...searches.filter((item) => savedSearchKey(item) !== key)]).slice(0, 30)
  writeSavedSearches(filePath, next)
}

function savedSearchKey(entry = {}) {
  return [entry.query, entry.sellerIntent, entry.searchScope, entry.provider].map((value) => String(value || '').toLowerCase()).join('::')
}

function readSavedSearches(target) {
  if (!target) return []
  if (target && typeof target.readSavedSearches === 'function') {
    return target.readSavedSearches().map(normalizeSavedSearch).filter(Boolean)
  }
  const parsed = readJsonFile(target, [])
  return Array.isArray(parsed) ? sortSavedSearches(parsed.map(normalizeSavedSearch).filter(Boolean)).slice(0, 30) : []
}

function publicSellerProfile(profile = {}) {
  const normalized = normalizeSellerProfile(profile)
  return { territory: normalized.territory, goodCustomer: normalized.goodCustomer, disqualifiers: normalized.disqualifiers }
}

function normalizeSavedSearch(entry = {}) {
  if (!entry || typeof entry !== 'object' || !entry.query) return null
  return {
    runId: limitText(entry.runId || '', 140),
    query: limitText(entry.query || '', 180),
    rawQuery: limitText(entry.rawQuery || entry.query || '', 180),
    provider: limitText(entry.provider || 'balanced', 40),
    searchScope: limitText(entry.searchScope || 'regional', 40),
    sellerIntent: normalizeSellerIntent(entry.sellerIntent),
    sellerProfile: publicSellerProfile(entry.sellerProfile),
    mode: limitText(entry.mode || 'fast', 40),
    maxResults: normalizeMaxResults(entry.maxResults, 25),
    outputDir: limitText(entry.outputDir || '', 300),
    leadPackOutputPath: limitText(entry.leadPackOutputPath || '', 300),
    leadCount: normalizeCount(entry.leadCount),
    phoneCount: normalizeCount(entry.phoneCount),
    interestedCount: normalizeCount(entry.interestedCount),
    label: limitText(entry.label || '', 80),
    pinned: entry.pinned === true || entry.pinned === 'true',
    updatedAt: limitText(entry.updatedAt || '', 40),
    key: savedSearchKey(entry),
    savedAt: limitText(entry.savedAt || '', 40),
  }
}

function sortSavedSearches(searches = []) {
  return (Array.isArray(searches) ? searches : []).slice().sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
    return String(b.savedAt || b.updatedAt || '').localeCompare(String(a.savedAt || a.updatedAt || ''))
  })
}

async function handleSavedSearchPatch(req, res, savedSearchesStore) {
  const body = await readJsonBody(req)
  const targetKey = String(body.key || savedSearchKey(body)).trim()
  if (!targetKey) return json(res, 400, { error: 'saved search key is required' })
  const searches = readSavedSearches(savedSearchesStore)
  let updated = null
  const next = searches.map((search) => {
    if (savedSearchKey(search) !== targetKey && search.key !== targetKey) return search
    updated = normalizeSavedSearch({
      ...search,
      label: body.label !== undefined ? limitText(body.label, 80) : search.label,
      pinned: body.pinned !== undefined ? (body.pinned === true || body.pinned === 'true') : search.pinned,
      updatedAt: new Date().toISOString(),
    })
    return updated
  })
  if (!updated) return json(res, 404, { error: 'Saved search not found' })
  writeSavedSearches(savedSearchesStore, sortSavedSearches(next).slice(0, 30))
  return json(res, 200, { savedSearch: updated, savedSearches: readSavedSearches(savedSearchesStore) })
}

function normalizeCount(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0
}

function writeSavedSearches(target, searches) {
  if (target && typeof target.writeSavedSearches === 'function') return target.writeSavedSearches(searches)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const tmp = target + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(Array.isArray(searches) ? searches : [], null, 2))
  fs.renameSync(tmp, target)
}

function buildProductReadiness({ summary = {}, leadPacks = [], workflowStore, savedSearchesStore, workflowPath, savedSearchesPath }) {
  const googleConfigured = Boolean(process.env.GOOGLE_PLACES_API_KEY)
  const proffConfigured = Boolean(process.env.PROFF_API_KEY)
  const included = Number(summary.includedLeadCount ?? summary.totalLeads ?? leadPacks.length ?? 0)
  const cappedMax = Number(summary.maxResults || 25)
  const persistenceMode = workflowStore && workflowStore.mode === 'sqlite' ? 'sqlite_local' : 'local_json'
  return {
    mode: 'proff_free_ready',
    sourceGuard: {
      searchCap: Math.min(cappedMax || (summary.marketSweep ? NORWAY_SWEEP_MAX_RESULTS : 25), summary.marketSweep ? NORWAY_SWEEP_MAX_RESULTS : 25),
      includedLeadCount: included,
      selectedLeadDeepOnly: true,
      googleStatus: googleConfigured ? 'enabled_metered' : 'not_configured',
      proffStatus: proffConfigured ? 'available_optional' : 'disabled_optional',
      brregStatus: 'automatic_identity_base',
    },
    providers: [
      { id: 'brreg', label: 'Brreg', status: 'automatic', note: 'Free company identity base: org.nr, legal name, NACE, status and employees when available.' },
      { id: 'google_places', label: 'Google Places', status: googleConfigured ? 'metered_enabled' : 'not_configured', note: 'Metered public presence source; searches are capped and Verify & Enrich runs only on selected leads.' },
      { id: 'osint', label: 'OSINT public evidence', status: 'selected_lead_only', note: 'Uses source-backed public business evidence already attached to the selected lead.' },
      { id: 'proff', label: 'Proff economy', status: proffConfigured ? 'optional_enabled' : 'optional_disabled', note: proffConfigured ? 'Available only after confirmed org.nr.' : 'Not required for core seller workflow; keep as later paid add-on.' },
    ],
    persistence: {
      status: persistenceMode,
      workspaceDbPath: workflowStore && workflowStore.dbPath || WORKSPACE_DB_PATH,
      workflowPath: workflowPath || workflowStore && workflowStore.workflowPath || WORKFLOW_PATH,
      savedSearchesPath: savedSearchesPath || savedSearchesStore && savedSearchesStore.savedSearchesPath || SAVED_SEARCHES_PATH,
      note: persistenceMode === 'sqlite_local' ? 'SQLite-backed local workspace keeps workflow, activity and recent searches durable without SaaS auth or billing.' : 'Local workflow and recent searches survive reloads without SaaS auth or billing.',
    },
    workspace: buildWorkspaceSummary(workflowStore, savedSearchesStore),
    guardrails: [
      'Proff is optional and never required for lead quality.',
      'Google usage stays capped: 25 for normal searches, 60 for Norway-sweep beta runs.',
      'Verify & Enrich runs on one selected lead, not the whole market.',
      'No outreach automation, email sending, or telephony is added.',
    ],
  }
}

function buildBetaHealth({ workspaceStore, savedSearchesStore }) {
  const readiness = buildProductReadiness({ workflowStore: workspaceStore, savedSearchesStore })
  return {
    status: "ok",
    product: "lead-machine-local-seller-desk",
    version: "beta-preflight-v1",
    beta: true,
    localOnly: true,
    sourceGuard: readiness.sourceGuard,
    workspace: readiness.workspace,
    guardrails: readiness.guardrails,
    limits: [
      "No auth in local app; hosted beta uses one shared workspace.",
      "No email sending, telephony, CRM sync, or outreach automation.",
      "Do not expose this local server on the open internet.",
      "Use workspace export before and after friend testing.",
    ],
  }
}

function buildWorkspaceSummary(workflowStore, savedSearchesStore) {
  const workflow = readWorkflowStore(workflowStore)
  const savedSearches = readSavedSearches(savedSearchesStore)
  let activityCount = 0
  try {
    const snapshot = workflowStore && typeof workflowStore.exportSnapshot === 'function' ? workflowStore.exportSnapshot() : null
    activityCount = Array.isArray(snapshot && snapshot.activityLog) ? snapshot.activityLog.length : 0
  } catch (_) {}
  const mode = workflowStore && workflowStore.mode === 'sqlite' ? 'sqlite_local' : 'local_json'
  return {
    status: mode,
    storageMode: mode === 'sqlite_local' ? 'SQLite local workspace' : 'Local JSON fallback',
    workspaceDbPath: workflowStore && workflowStore.dbPath || WORKSPACE_DB_PATH,
    workflowLeadCount: Object.keys(workflow.leads || {}).length,
    savedSearchCount: savedSearches.length,
    activityCount,
    canExport: workflowStore && typeof workflowStore.exportSnapshot === 'function',
    exportPath: '/api/workspace-export',
  }
}

function writeSummarySellerSetup(filePath, sellerIntent, sellerProfile) {
  const summary = readJsonFile(filePath, null)
  if (!summary || typeof summary !== 'object') return
  fs.writeFileSync(filePath, JSON.stringify({ ...summary, sellerIntent: normalizeSellerIntent(sellerIntent), sellerProfile: publicSellerProfile(sellerProfile) }, null, 2))
}

function buildRunPayload({ runId, parsedQuery, outputDir, leadPackOutputPath, leadPacksPath, leadPackSummaryPath, machineSummaryPath, workflowStore, savedSearchesStore, sellerIntent, sellerProfile, machineSummaryOverride }) {
  const leadPackSummary = readJsonFile(leadPackSummaryPath, {})
  const machineSummary = machineSummaryOverride || readJsonFile(machineSummaryPath, {})
  const normalizedSellerIntent = normalizeSellerIntent(sellerIntent || machineSummary.sellerIntent || leadPackSummary.sellerIntent)
  const normalizedSellerProfile = normalizeSellerProfile(sellerProfile || machineSummary.sellerProfile || leadPackSummary.sellerProfile)
  const fittedLeadPacks = attachSellerFitToLeads(readJsonFile(leadPacksPath, []), normalizedSellerIntent, normalizedSellerProfile)
  const leadPacks = attachQueueQualityToLeads(attachSourceFusionToLeads(attachWorkflowToLeads(attachSourceFusionToLeads(fittedLeadPacks), readWorkflowStore(workflowStore))))
  const normalizedQuery = parsedQuery?.normalizedQuery || machineSummary.query || leadPacks[0]?.meta?.sourceQuery || ''
  const savedSearches = readSavedSearches(savedSearchesStore)
  const providerErrors = readProviderErrors(outputDir)
  const summary = { ...leadPackSummary, ...machineSummary, sellerIntent: normalizedSellerIntent, sellerProfile: publicSellerProfile(normalizedSellerProfile), providerErrors }
  return {
    runId,
    parsedQuery: parsedQuery || { ok: true, rawQuery: normalizedQuery, normalizedQuery },
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
    summary,
    readiness: buildProductReadiness({ summary, leadPacks, workflowStore, savedSearchesStore }),
    commandCenter: buildOpportunityCommandCenter({ leadPacks, savedSearches, summary }),
    savedSearches,
    leadPacks,
  }
}

function readProviderErrors(outputDir) {
  try {
    const discovery = JSON.parse(fs.readFileSync(path.join(outputDir, 'discovery', 'discovery-summary.json'), 'utf8'))
    return Array.isArray(discovery?.provider?.errors) ? discovery.provider.errors : []
  } catch (_) {
    return []
  }
}

function findLatestRun(runsDir) {
  try {
    return fs.readdirSync(runsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const outputDir = path.join(runsDir, entry.name)
        const leadPacksPath = path.join(outputDir, 'lead-packs', 'lead-packs.json')
        if (!fs.existsSync(leadPacksPath)) return null
        const stat = fs.statSync(leadPacksPath)
        return { runId: entry.name, outputDir, mtimeMs: stat.mtimeMs }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null
  } catch (_) {
    return null
  }
}


async function handleWebsiteAudit(req, res) {
  const body = await readJsonBody(req)
  const lead = body.lead && typeof body.lead === 'object' ? body.lead : null
  if (!lead) return json(res, 400, { error: 'Lead er påkrevd' })
  const websiteUrl = selectedWebsiteUrl(lead)
  if (!websiteUrl) return json(res, 400, { error: 'Leaden har ingen nettside å sjekke - ingen nettside er allerede et sterkt salgssignal' })
  const result = await auditWebsite({
    url: websiteUrl,
    companyName: lead.company?.displayName || lead.companyName || '',
    city: lead.contact?.city || lead.city || '',
  })
  if (!result.ok) return json(res, 502, { error: result.error })
  const updated = JSON.parse(JSON.stringify(lead))
  updated.website = { ...(updated.website || {}), aiAudit: result.audit }
  return json(res, 200, { audit: result.audit, websiteSalesFit: evaluateWebsiteSalesFit(updated), model: result.model, usage: result.usage })
}

async function handleDeepQualify(req, res, context) {
  const body = await readJsonBody(req)
  const lead = body.lead && typeof body.lead === 'object' ? body.lead : null
  if (!lead) return json(res, 400, { error: 'Lead is required' })
  const query = String(body.query || lead.meta?.sourceQuery || '').trim() || 'selected lead'
  const sellerIntent = normalizeSellerIntent(body.sellerIntent || lead.sellerFit?.sellerIntent)
  const sellerProfile = normalizeSellerProfile(body.sellerProfile || lead.sellerFit?.sellerProfile)
  const enrichCompanyProfile = !(body.enrichCompanyProfile === false || body.enrichCompanyProfile === 'false')
  const result = await context.deepQualifier({ lead, query, enrichCompanyProfile, runsDir: context.runsDir, sellerIntent, sellerProfile })
  if (result && result.leadPack) {
    const fittedLead = attachQueueQualityToLeads(attachSourceFusionToLeads(attachWorkflowToLeads(attachSourceFusionToLeads(attachSellerFitToLeads([result.leadPack], sellerIntent, sellerProfile)), readWorkflowStore(context.workflowStore))))[0]
    result.leadPack = attachOsintToLead(fittedLead, sellerIntent)
  }
  return json(res, 200, result)
}

async function deepQualifyLead({ lead, query, enrichCompanyProfile: shouldEnrichCompanyProfile, runsDir, sellerIntent }) {
  const originalLead = JSON.parse(JSON.stringify(lead))
  const company = lead.company || {}
  const sourceQuality = lead.sourceQuality || {}
  const runId = createSafeRunId(`${company.displayName || 'selected-lead'} deep`)
  const outputDir = path.join(runsDir, runId)
  const leadPackOutputPath = path.join(outputDir, 'lead-packs')
  fs.mkdirSync(leadPackOutputPath, { recursive: true })

  const refreshedCompanyProfile = shouldEnrichCompanyProfile ? await safeSelectedCompanyProfile(lead) : null
  const proffProfile = await safeSelectedProffProfile(lead, refreshedCompanyProfile)
  const hasWebsite = Boolean(selectedWebsiteUrl(lead))
  const selectedLead = mergeProffProfile(mergeSelectedCompanyProfile(originalLead, refreshedCompanyProfile), proffProfile)
  selectedLead.rank = lead.rank || selectedLead.rank || 1

  const enrichedLead = applyDeepEnrichmentV1(selectedLead, originalLead, {
    companyProfile: refreshedCompanyProfile,
    proffProfile,
    websiteAuditStatus: hasWebsite ? 'not_run' : 'skipped_no_website',
    outputDir,
  })
  const finalLead = attachQueueQualityToLeads(attachSourceFusionToLeads([attachOsintToLead(enrichedLead, sellerIntent)]))[0]

  const jsonPath = path.join(leadPackOutputPath, 'lead-packs.json')
  const csvPath = path.join(leadPackOutputPath, 'lead-packs.csv')
  const summaryPath = path.join(leadPackOutputPath, 'summary.json')
  const summary = {
    runId,
    sourceRun: originalLead.meta?.sourceRun || null,
    outputDir: leadPackOutputPath,
    sourceQuery: query,
    generatedAt: new Date().toISOString(),
    mode: 'selected_lead_enrichment',
    totalLeads: 1,
    priorityCounts: { [String(finalLead.callPriority || 'verify').toLowerCase()]: 1 },
    enrichCompanyProfile: Boolean(shouldEnrichCompanyProfile),
    searchScope: sourceQuality.searchScope || 'strict',
    websiteStatus: finalLead.website?.auditStatus || 'not_run',
    companyIdentityStatus: finalLead.company?.matchStatus || 'not_run',
    economyStatus: finalLead.economy?.status || 'not_enabled',
    productBoundary: 'selected_lead_enrichment_without_website_audit',
  }

  fs.writeFileSync(jsonPath, `${JSON.stringify([finalLead], null, 2)}\n`)
  fs.writeFileSync(csvPath, toLeadPackCsv([finalLead]))
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)

  return {
    outputDir,
    leadPackOutputPath,
    leadPack: finalLead,
    downloads: { csvPath, jsonPath, summaryPath },
  }
}

function attachOsintToLead(lead = {}, sellerIntent = 'general_b2b') {
  const copy = JSON.parse(JSON.stringify(lead || {}))
  const { osint } = enrichOsint(copy, { sellerIntent })
  copy.osint = osint
  const modules = Array.isArray(copy.enrichmentModules)
    ? copy.enrichmentModules.filter((module) => module && module.id !== 'osint_public_evidence')
    : []
  modules.push(moduleStatus('osint_public_evidence', 'OSINT public evidence', 'completed', osintModuleSummary(osint)))
  copy.enrichmentModules = modules
  copy.enrichment = {
    ...(copy.enrichment || {}),
    modules,
    summary: {
      ...(copy.enrichment && copy.enrichment.summary ? copy.enrichment.summary : {}),
      osint: osint.summary,
    },
  }
  return copy
}

function osintModuleSummary(osint = {}) {
  const summary = osint.summary || {}
  return String(summary.evidenceCount || 0) + " public evidence signals, " + String(summary.riskCount || 0) + " verification checks, " + String(summary.sourceCount || 0) + " sources."
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


async function safeSelectedProffProfile(lead = {}, companyProfile = null) {
  const company = lead.company || {}
  const organizationNumber = companyProfile?.organizationNumber || company.organizationNumber
  const matchStatus = companyProfile?.organizationNumber ? companyProfile.matchStatus : (company.matchStatus || companyProfile?.matchStatus)
  try {
    return await enrichProffCompany({ organizationNumber, matchStatus })
  } catch (error) {
    return {
      source: 'proff',
      enrichmentStatus: 'error',
      errorType: 'unknown_error',
      organizationNumber: organizationNumber || null,
      companyName: null,
      revenue: null,
      profit: null,
      employees: null,
      roles: [],
      owners: [],
      creditScore: null,
      paymentRemarks: null,
      rawAvailableFields: [],
      warnings: [error && error.message ? error.message : 'proff_error'],
      sourceUrl: null,
    }
  }
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


function mergeProffProfile(lead = {}, proffProfile) {
  const copy = JSON.parse(JSON.stringify(lead || {}))
  const current = copy.economy || {}
  if (!proffProfile) {
    copy.economy = { status: current.status || 'not_enabled', source: current.source || null, revenue: current.revenue ?? null, profit: current.profit ?? null, employees: current.employees ?? null }
    return copy
  }
  copy.economy = {
    ...current,
    status: proffProfile.enrichmentStatus || current.status || 'not_enabled',
    source: 'proff',
    organizationNumber: proffProfile.organizationNumber || null,
    companyName: proffProfile.companyName || null,
    revenue: proffProfile.revenue ?? current.revenue ?? null,
    profit: proffProfile.profit ?? current.profit ?? null,
    employees: proffProfile.employees ?? current.employees ?? null,
    creditScore: proffProfile.creditScore ?? current.creditScore ?? null,
    paymentRemarks: proffProfile.paymentRemarks ?? current.paymentRemarks ?? null,
    roles: Array.isArray(proffProfile.roles) ? proffProfile.roles : [],
    owners: Array.isArray(proffProfile.owners) ? proffProfile.owners : [],
    warnings: Array.from(new Set([...(current.warnings || []), ...(proffProfile.warnings || [])].filter(Boolean))),
    sourceUrl: proffProfile.sourceUrl || null,
    rawAvailableFields: Array.isArray(proffProfile.rawAvailableFields) ? proffProfile.rawAvailableFields : [],
  }
  return copy
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
    moduleStatus('digital_presence', 'Digital presence check', websiteStatus, websiteSummaryV1(websiteStatus, hasWebsite)),
    moduleStatus('seller_summary', 'Seller leverage summary', 'completed', 'Decision summary refreshed from identity, contact, location, source and digital signals.'),
    moduleStatus('economy_proff', 'Economy / Proff', economy.status || 'not_enabled', proffSummary(economy)),
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
      digitalPresence: websiteStatus,
      economy: economy.status || 'not_enabled',
      proff: economy.status || 'not_enabled',
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

function proffSummary(economy = {}) {
  if (economy.status === 'success') return 'Proff enrichment attached economy fields for confirmed org.nr.'
  if (economy.status === 'disabled') return 'Proff disabled; set PROFF_API_KEY to enable economy enrichment.'
  if (economy.status === 'not_eligible') return 'Proff skipped because org.nr is not confirmed.'
  if (economy.status === 'error') return `Proff lookup failed${economy.warnings?.length ? `: ${economy.warnings.join(', ')}` : '.'}`
  return 'Not enabled. Requires confirmed org.nr and Proff integration.'
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
  if (!hasWebsite) return 'No website available, so digital presence check was skipped.'
  if (status === 'skipped_no_website') return 'Digital presence check skipped because no website was available.'
  if (status === 'completed') return 'Digital presence check completed for selected lead.'
  if (status === 'error') return 'Digital presence check failed; review source manually.'
  return 'Digital presence check status recorded for selected lead.'
}

function deepEvidenceLine({ company, contact, websiteStatus, contactability }) {
  if (websiteStatus === 'skipped_no_website') return 'Verify & Enrich skipped digital presence check because no website was available.'
  if (company.organizationNumber && contact.phone) return 'Verify & Enrich confirms usable company identity/contact context.'
  if (contactability === 'strong') return 'Verify & Enrich confirms strong contactability.'
  return 'Verify & Enrich refreshed selected-lead context.'
}

function deepWhyRanked({ company, contact, contactability, websiteStatus }) {
  return [
    'Verify & Enrich ran on this selected lead only.',
    company.organizationNumber ? 'Official company identity is confirmed.' : company.candidateOrganizationNumber ? 'Official company identity has a candidate match.' : null,
    contact.phone ? 'Direct phone exists for seller qualification.' : null,
    websiteStatus === 'completed' ? 'Digital presence signals are attached.' : null,
    contactability === 'strong' ? 'Contactability is strong.' : null,
  ].filter(Boolean)
}

function deepCaution({ company, websiteStatus, economy }) {
  return [
    !company.organizationNumber && company.candidateOrganizationNumber ? 'Candidate org.nr must be manually verified before export.' : null,
    !company.organizationNumber && !company.candidateOrganizationNumber ? 'Company identity is not confirmed; verify before sales use.' : null,
    websiteStatus === 'skipped_no_website' ? 'Digital presence check was skipped because no website was available.' : null,
    ['disabled', 'not_enabled'].includes(economy.status) ? 'Economy/Proff data is not enabled yet.' : null,
  ].filter(Boolean)
}

function createDemoFixtureRun({ parsedQuery, maxResults, searchScope, sellerIntent, sellerProfile, enrichCompanyProfile, outputDir, runId }) {
  const fixture = readJsonFile(DEMO_FIXTURE_PATH, null)
  if (!fixture) throw new Error('Demo fixture data is missing')

  const leadPackOutputPath = path.join(outputDir, 'lead-packs')
  fs.mkdirSync(leadPackOutputPath, { recursive: true })

  const allLeadPacks = Array.isArray(fixture.leadPacks) ? fixture.leadPacks : []
  const leadPacks = attachQueueQualityToLeads(attachSourceFusionToLeads(attachSellerFitToLeads(allLeadPacks.slice(0, maxResults).map((lead) => withDemoRunMetadata(lead, parsedQuery, searchScope, enrichCompanyProfile)), sellerIntent, sellerProfile)))
  const summary = buildDemoSummary(fixture.summary || {}, leadPacks, parsedQuery, maxResults, searchScope, sellerIntent, sellerProfile, enrichCompanyProfile, outputDir, leadPackOutputPath)

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

function buildDemoSummary(baseSummary, leadPacks, parsedQuery, maxResults, searchScope, sellerIntent, sellerProfile, enrichCompanyProfile, outputDir, leadPackOutputPath) {
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
    sellerIntent: normalizeSellerIntent(sellerIntent),
    sellerProfile: publicSellerProfile(sellerProfile),
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
  const headers = ['rank', 'company', 'orgNumber', 'candidateOrgNumber', 'phone', 'email', 'website', 'city', 'priority', 'leadClass', 'matchStatus', 'sellerIntent', 'sellerFit', 'sellerRecommendedAction', 'leadConfidence', 'identityConfidence', 'contactConfidence', 'locationConfidence', 'recommendedTrustAction', 'sourceCoverage', 'verifiedFieldsSummary', 'proofReasonsSummary', 'riskReasonsSummary', 'sourceFusionWarnings', 'warningsSummary', 'fitReasons', 'riskReasons', 'osintEvidenceCount', 'osintRiskCount', 'osintSourceCount', 'osintTopSignals', 'osintTopRisks', 'workflowQueue', 'queue', 'queueQualityRecommendedQueue', 'queueQualityRecommendedAction', 'queueQualityReadiness', 'workflowStatus', 'owner', 'contacted', 'channel', 'personReached', 'response', 'followUpDate', 'nextFollowUpAt', 'lastContactedAt', 'nextAction', 'latestOutcome', 'workflowNotes', 'workflowOutcome', 'lastActivityAt', 'evidenceSummary', 'cautionSummary']
  const rows = leadPacks.map((lead) => {
    const workflow = normalizeWorkflow(lead.workflow || {})
    const osintSummary = lead.osint && lead.osint.summary ? lead.osint.summary : {}
    const fusion = lead.sourceFusion || evaluateSourceFusion({ lead, googlePlaces: lead.places, brregCompanyProfile: lead.company, contactProfile: lead.contact, sourceQuality: lead.sourceQuality, sellerFit: lead.sellerFit, workflow })
    const fusionSummary = sourceFusionSummary(fusion)
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
      lead.sellerFit && lead.sellerFit.sellerIntent,
      lead.sellerFit && lead.sellerFit.sellerFit,
      lead.sellerFit && lead.sellerFit.recommendedAction,
      fusion.leadConfidence,
      fusion.identityConfidence,
      fusion.contactConfidence,
      fusion.locationConfidence,
      fusion.recommendedTrustAction,
      fusionSummary.sourceCoverage,
      fusionSummary.verifiedFields,
      fusionSummary.proofReasons,
      fusionSummary.riskReasons,
      fusionSummary.warnings,
      fusionSummary.warnings,
      lead.sellerFit && Array.isArray(lead.sellerFit.fitReasons) ? lead.sellerFit.fitReasons.join(' | ') : '',
      lead.sellerFit && Array.isArray(lead.sellerFit.riskReasons) ? lead.sellerFit.riskReasons.join(' | ') : '',
      osintSummary.evidenceCount || '',
      osintSummary.riskCount || '',
      osintSummary.sourceCount || '',
      Array.isArray(osintSummary.topSignals) ? osintSummary.topSignals.join(' | ') : '',
      Array.isArray(osintSummary.topRisks) ? osintSummary.topRisks.join(' | ') : '',
      workflow.queue,
      workflow.queue,
      lead.queueQuality && lead.queueQuality.recommendedQueue || '',
      lead.queueQuality && lead.queueQuality.recommendedAction || '',
      lead.queueQuality && lead.queueQuality.readiness || '',
      workflow.status,
      workflow.owner,
      workflow.contacted ? 'yes' : 'no',
      workflow.channel,
      workflow.personReached,
      workflow.response,
      workflow.followUpDate,
      workflow.nextFollowUpAt,
      workflow.lastContactedAt,
      workflow.nextAction,
      workflow.response || workflow.outcome,
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
    const summary = readJsonFile(run.machineSummaryPath, {})
    const leads = attachQueueQualityToLeads(attachSourceFusionToLeads(attachWorkflowToLeads(attachSourceFusionToLeads(attachSellerFitToLeads(readJsonFile(run.leadPacksPath, []), run.sellerIntent || summary.sellerIntent, run.sellerProfile || summary.sellerProfile)), readWorkflowStore(workflowPath))))
    const csvLeads = file === 'call-list.csv' ? filterCallListLeads(leads, url.searchParams.get('view') || 'all') : leads
    res.writeHead(200, { 'content-type': 'text/csv' })
    res.end(toLeadPackCsv(csvLeads))
    return
  }
  if (file === 'lead-packs.json') {
    const summary = readJsonFile(run.machineSummaryPath, {})
    return json(res, 200, attachQueueQualityToLeads(attachSourceFusionToLeads(attachWorkflowToLeads(attachSourceFusionToLeads(attachSellerFitToLeads(readJsonFile(run.leadPacksPath, []), run.sellerIntent || summary.sellerIntent, run.sellerProfile || summary.sellerProfile)), readWorkflowStore(workflowPath)))))
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
  workflow.activities = [activity, ...normalizeActivities(previous.activities || previous.activityLog)].filter(Boolean).slice(0, 25)
  workflow.activityLog = workflow.activities
  store.leads[leadId] = workflow
  writeWorkflowStore(workflowPath, store)
  return json(res, 200, { workflow })
}

function attachSellerFitToLeads(leadPacks, sellerIntent = 'general_b2b', sellerProfile = {}) {
  const normalizedSellerIntent = normalizeSellerIntent(sellerIntent)
  const normalizedSellerProfile = normalizeSellerProfile(sellerProfile)
  return (Array.isArray(leadPacks) ? leadPacks : []).map((lead) => {
    const copy = JSON.parse(JSON.stringify(lead || {}))
    copy.sellerFit = evaluateSellerFit(copy, normalizedSellerIntent, normalizedSellerProfile)
    copy.websiteSalesFit = evaluateWebsiteSalesFit(copy)
    copy.meta = { ...(copy.meta || {}), sellerIntent: normalizedSellerIntent, sellerProfile: publicSellerProfile(normalizedSellerProfile) }
    return copy
  })
}

function attachSourceFusionToLeads(leadPacks) {
  return (Array.isArray(leadPacks) ? leadPacks : []).map((lead) => {
    const copy = JSON.parse(JSON.stringify(lead || {}))
    copy.sourceFusion = evaluateSourceFusion({
      lead: copy,
      googlePlaces: copy.places,
      brregCompanyProfile: copy.company,
      contactProfile: copy.contact,
      sourceQuality: copy.sourceQuality,
      sellerFit: copy.sellerFit,
      workflow: copy.workflow,
    })
    return copy
  })
}

function attachWorkflowToLeads(leadPacks, store) {
  const workflowStore = store && store.leads ? store : { leads: {} }
  return (Array.isArray(leadPacks) ? leadPacks : []).map((lead, index) => {
    const copy = JSON.parse(JSON.stringify(lead || {}))
    const leadId = leadWorkflowId(copy, index)
    copy.workflow = workflowForLead(copy, workflowStore.leads[leadId] || {}, leadId)
    return copy
  })
}

function attachQueueQualityToLeads(leadPacks) {
  return (Array.isArray(leadPacks) ? leadPacks : []).map((lead) => {
    const copy = JSON.parse(JSON.stringify(lead || {}))
    copy.queueQuality = buildQueueQuality(copy, copy.workflow || {})
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

function filterCallListLeads(leads, view) {
  const normalizedView = String(view || 'all')
  const list = Array.isArray(leads) ? leads : []
  const queueView = normalizeQueue(normalizedView)
  if (queueView) return list.filter((lead) => leadMatchesQueue(lead, queueView)).sort(serverCompareTodayCallLeads)
  if (normalizedView === 'today') return list.filter((lead) => leadMatchesQueue(lead, 'call_now') || leadMatchesQueue(lead, 'follow_up_today')).sort(serverCompareTodayCallLeads)
  if (normalizedView === 'notContacted') return list.filter((lead) => !serverWorkflowContacted(lead.workflow || {}))
  if (normalizedView === 'followUpDue') return list.filter((lead) => leadMatchesQueue(lead, 'follow_up_today'))
  if (normalizedView === 'interested') return list.filter((lead) => leadMatchesQueue(lead, 'interested'))
  return list
}

function serverIsTodayCallLead(lead = {}) {
  const workflow = lead.workflow || {}
  const phone = lead.contact && lead.contact.phone || lead.phone
  if (!phone || ['rejected'].includes(workflow.status)) return false
  const queue = inferLeadQueue(lead, workflow)
  return ['call_now', 'follow_up_today', 'interested'].includes(queue)
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

function readWorkflowStore(target) {
  if (target && typeof target.readWorkflowStore === 'function') return target.readWorkflowStore()
  try {
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'))
    return parsed && typeof parsed === 'object' && parsed.leads ? parsed : { leads: {} }
  } catch (_) {
    return { leads: {} }
  }
}

function writeWorkflowStore(target, store) {
  if (target && typeof target.writeWorkflowStore === 'function') return target.writeWorkflowStore(store)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const tmp = target + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify({ leads: store.leads || {} }, null, 2))
  fs.renameSync(tmp, target)
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
