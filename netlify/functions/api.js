const fs = require('fs')
const os = require('os')
const path = require('path')

const TMP_ROOT = path.join(os.tmpdir(), 'lead-machine-netlify-beta')
const STATE_PATH = path.join(TMP_ROOT, 'hosted-state.json')
const BUNDLED_RUNS_DIR = path.join(__dirname, '..', '..', 'apps', 'lead-machine-demo', 'runs')
const STORE_NAME = 'lead-machine-beta'
const { defaultWorkflow, normalizeWorkflow, normalizeActivities, createWorkflowActivity, workflowForLead: buildWorkflowForLead, leadMatchesQueue, normalizeQueue } = require('../../apps/lead-machine-demo/workQueues')
const { parseLeadQuery } = require('../../apps/lead-machine-demo/queryParser')
const { runLeadMachine } = require('../../core/lead-machine/leadMachine')
const { evaluateSellerFit, normalizeSellerIntent } = require('../../core/seller-fit/sellerFit')
const { buildNorwaySweepRunOptions, NORWAY_SWEEP_MAX_RESULTS } = require('../../core/lead-discovery-agent/providers/norwaySweep')
const { evaluateSourceFusion, sourceFusionSummary } = require('../../core/source-fusion/sourceFusion')
const { enrichCompanyProfile } = require('../../core/company-profile/companyProfile')

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod === 'OPTIONS') return textResponse(204, '')
    const apiPath = normalizeApiPath(event)
    if (!isAuthorized(event)) return jsonResponse(401, { error: 'Beta access token is required.' })

    const state = await readHostedState()
    if (event.httpMethod === 'GET' && apiPath === '/api/health') return jsonResponse(200, hostedHealth(state))
    if (event.httpMethod === 'GET' && apiPath === '/api/workflow') return jsonResponse(200, { workflow: workflowForLead(state, queryUrl(event, apiPath).searchParams.get('leadId')) })
    if (event.httpMethod === 'POST' && apiPath === '/api/workflow') {
      const result = await saveWorkflowFromEvent(event, state)
      await writeHostedState(state)
      return result.error ? jsonResponse(400, result) : jsonResponse(200, result)
    }
    if (event.httpMethod === 'PATCH' && apiPath === '/api/saved-searches') {
      const result = await updateSavedSearchFromEvent(event, state)
      await writeHostedState(state)
      return result.error ? jsonResponse(result.error.includes('not found') ? 404 : 400, result) : jsonResponse(200, result)
    }
    if (event.httpMethod === 'POST' && apiPath === '/api/deep-qualify') {
      const result = await hostedDeepQualifyFromEvent(event, state)
      await writeHostedState(state)
      return result.error ? jsonResponse(result.statusCode || 400, result) : jsonResponse(200, result)
    }
    if (event.httpMethod === 'GET' && apiPath === '/api/workspace-export') return jsonResponse(200, exportSnapshot(state))
    if (event.httpMethod === 'GET' && apiPath === '/api/latest-run') {
      const latest = state.latestRun || await bundledLatestRun(event)
      if (!latest) return jsonResponse(404, { error: 'No previous run found' })
      state.latestRun = attachHostedStateToRun(latest, state)
      await writeHostedState(state)
      return jsonResponse(200, state.latestRun)
    }

    const runFile = runFileResponse(apiPath, state, event)
    if (runFile) return runFile

    if (event.httpMethod === 'POST' && apiPath === '/api/runs') {
      const result = await hostedRunFromEvent(event, state)
      await writeHostedState(state)
      return result.error ? jsonResponse(result.statusCode || 400, result) : jsonResponse(200, result)
    }

    return jsonResponse(404, { error: 'Hosted beta endpoint not found' })
  } catch (error) {
    return jsonResponse(500, { error: error && error.message ? error.message : 'Hosted beta API failed' })
  }
}

function normalizeApiPath(event) {
  let pathname = event.path || '/api'
  const prefix = '/.netlify/functions/api'
  if (pathname.startsWith(prefix)) pathname = '/api' + pathname.slice(prefix.length)
  if (!pathname.startsWith('/api')) pathname = '/api' + (pathname.startsWith('/') ? pathname : '/' + pathname)
  return pathname === '/api/' ? '/api' : pathname
}

function queryUrl(event, apiPath) {
  const params = new URLSearchParams(event.queryStringParameters || {})
  return new URL(apiPath + (params.toString() ? '?' + params.toString() : ''), 'https://lead-machine.local')
}

function isAuthorized(event) {
  const required = process.env.BETA_ACCESS_TOKEN
  if (!required) return true
  const headers = event.headers || {}
  const headerToken = headers['x-beta-token'] || headers['X-Beta-Token'] || headers['X-BETA-TOKEN']
  const query = event.queryStringParameters || {}
  const queryToken = query.beta || query.token
  return String(headerToken || queryToken || '') === String(required)
}

async function bundledLatestRun() {
  const latest = findLatestRun(BUNDLED_RUNS_DIR)
  return latest ? buildBundledRun(latest) : null
}

function findLatestRun(runsDir) {
  try {
    return fs.readdirSync(runsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const outputDir = path.join(runsDir, entry.name)
        const leadPacksPath = path.join(outputDir, 'lead-packs', 'lead-packs.json')
        if (!fs.existsSync(leadPacksPath)) return null
        return { runId: entry.name, outputDir, mtimeMs: fs.statSync(leadPacksPath).mtimeMs }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null
  } catch (_) {
    return null
  }
}

function buildBundledRun(latest) {
  const leadPackOutputPath = path.join(latest.outputDir, 'lead-packs')
  const leadPacks = readJsonFile(path.join(leadPackOutputPath, 'lead-packs.json'), [])
  const leadSummary = readJsonFile(path.join(leadPackOutputPath, 'summary.json'), {})
  const machineSummary = readJsonFile(path.join(latest.outputDir, 'lead-machine-summary.json'), {})
  const query = machineSummary.query || leadSummary.query || firstLeadQuery(leadPacks) || latest.runId
  const summary = { ...leadSummary, ...machineSummary, includedLeadCount: leadPacks.length, totalLeads: leadPacks.length }
  const savedSearches = [savedSearchFromRun({ runId: latest.runId, query, leadPacks, summary })]
  return {
    runId: latest.runId,
    parsedQuery: { ok: true, rawQuery: query, normalizedQuery: query },
    outputDir: latest.outputDir,
    leadPackOutputPath,
    downloads: downloadsForRun(latest.runId),
    summary,
    readiness: hostedReadiness(leadPacks, savedSearches, summary),
    savedSearches,
    leadPacks: leadPacks.map((lead, index) => attachSourceFusion({ ...lead, workflow: buildWorkflowForLead(lead, lead.workflow || {}, hostedLeadId(lead, index)) })),
  }
}

function firstLeadQuery(leadPacks) {
  const first = Array.isArray(leadPacks) ? leadPacks[0] : null
  return first && first.meta && first.meta.sourceQuery || ''
}

function downloadsForRun(runId) {
  return {
    csv: '/api/runs/' + runId + '/lead-packs.csv',
    json: '/api/runs/' + runId + '/lead-packs.json',
    summary: '/api/runs/' + runId + '/summary.json',
    callList: '/api/runs/' + runId + '/call-list.csv',
    callListToday: '/api/runs/' + runId + '/call-list.csv?view=today',
    callListNotContacted: '/api/runs/' + runId + '/call-list.csv?view=notContacted',
    callListFollowUps: '/api/runs/' + runId + '/call-list.csv?view=followUpDue',
    callListInterested: '/api/runs/' + runId + '/call-list.csv?view=interested',
  }
}

function savedSearchFromRun({ runId, query, leadPacks, summary = {} }) {
  const search = {
    runId,
    query,
    rawQuery: query,
    provider: 'hosted-beta-bundled',
    searchScope: summary.searchScope || 'regional',
    sellerIntent: summary.sellerIntent || 'general_b2b',
    mode: summary.mode || 'fast',
    maxResults: Number(summary.maxResults || 25),
    leadCount: Array.isArray(leadPacks) ? leadPacks.length : 0,
    phoneCount: (Array.isArray(leadPacks) ? leadPacks : []).filter((lead) => lead.contact && lead.contact.phone || lead.phone).length,
    interestedCount: 0,
    label: '',
    pinned: false,
    savedAt: new Date().toISOString(),
  }
  search.key = savedSearchKey(search)
  return search
}

function hostedReadiness(leadPacks = [], savedSearches = [], summary = {}) {
  const cap = summary.marketSweep ? NORWAY_SWEEP_MAX_RESULTS : 25
  return {
    mode: 'hosted_beta_ready',
    sourceGuard: { searchCap: cap, includedLeadCount: leadPacks.length, selectedLeadDeepOnly: true, googleStatus: process.env.GOOGLE_PLACES_API_KEY ? 'configured' : 'not_configured', proffStatus: process.env.PROFF_API_KEY ? 'available_optional' : 'disabled_optional', brregStatus: 'automatic_identity_base' },
    persistence: { status: getBlobStore() ? 'netlify_blobs' : 'tmp_json', note: 'Hosted beta stores notes and follow-ups for one shared tester workspace.' },
    workspace: { status: getBlobStore() ? 'netlify_blobs' : 'tmp_json', storageMode: getBlobStore() ? 'Netlify Blobs beta workspace' : 'Temporary JSON fallback', workflowLeadCount: 0, savedSearchCount: savedSearches.length, activityCount: 0, canExport: true, exportPath: '/api/workspace-export' },
    guardrails: ['One shared beta workspace.', 'No email sending, CRM sync, or telephony backend.', 'Call now uses the tester device tel link only.'],
  }
}

async function hostedRunFromEvent(event, state) {
  const body = parseJsonBody(event)
  const rawQuery = limitText(body.query || '', 180).trim()
  if (!rawQuery) return { error: 'Query is required', statusCode: 400 }
  const parsedQuery = parseLeadQuery(rawQuery)
  if (!parsedQuery.ok) return { error: parsedQuery.error || 'Query is invalid', statusCode: 400 }

  if (process.env.GOOGLE_PLACES_API_KEY) {
    try {
      const payload = await hostedLiveRun({ body, parsedQuery, state })
      state.latestRun = payload
      return payload
    } catch (error) {
      return { error: friendlyHostedError(error), statusCode: 500 }
    }
  }

  const latest = await bundledLatestRun()
  if (!latest) return { error: 'GOOGLE_PLACES_API_KEY is required for hosted beta searches. Add it in Netlify Environment variables, then redeploy.', statusCode: 400 }
  const payload = attachHostedStateToRun({ ...latest, parsedQuery, summary: { ...(latest.summary || {}), query: parsedQuery.normalizedQuery } }, state)
  const saved = savedSearchFromRun({ runId: payload.runId, query: parsedQuery.normalizedQuery, leadPacks: payload.leadPacks || [], summary: payload.summary || {} })
  state.savedSearches = sortSavedSearches([saved, ...(state.savedSearches || []).filter((item) => savedSearchKey(item) !== saved.key)]).slice(0, 30)
  state.latestRun = { ...payload, savedSearches: state.savedSearches }
  return state.latestRun
}

async function hostedLiveRun({ body, parsedQuery, state }) {
  const sellerIntent = normalizeSellerIntent(body.sellerIntent)
  const requestedSearchScope = ['strict', 'nearby', 'regional'].includes(body.searchScope) ? body.searchScope : 'regional'
  const sweepPlan = buildNorwaySweepRunOptions({ parsedQuery, searchScope: requestedSearchScope, requestedMaxResults: body.maxResults })
  const searchScope = sweepPlan.searchScope || requestedSearchScope
  const maxResults = sweepPlan.maxResults
  const runId = createHostedRunId(parsedQuery.normalizedQuery)
  const outputDir = path.join(TMP_ROOT, 'runs', runId)
  const result = await runLeadMachine({
    query: parsedQuery.normalizedQuery,
    provider: 'balanced',
    maxResults,
    searchScope,
    enrichCompanyProfile: true,
    mode: 'fast',
    outputDir,
    runId,
    validate: false,
    marketSweep: sweepPlan.marketSweep,
    marketSweepCities: sweepPlan.cities,
    maxProviderQueries: sweepPlan.maxProviderQueries,
    perProviderQueryMaxResults: sweepPlan.perProviderQueryMaxResults,
  })
  const leadPackOutputPath = result.leadPackOutputPath || path.join(outputDir, 'lead-packs')
  const leadPacks = attachHostedStateToLeads(attachSellerFitToLeads(readJsonFile(path.join(leadPackOutputPath, 'lead-packs.json'), []), sellerIntent), state)
  const summary = { ...(result.summary || {}), query: parsedQuery.normalizedQuery, sellerIntent, provider: 'hosted-live-balanced', mode: 'fast', maxResults, searchScope, includedLeadCount: leadPacks.length, totalLeads: leadPacks.length, marketSweep: Boolean(sweepPlan.marketSweep) }
  const saved = savedSearchFromRun({ runId, query: parsedQuery.normalizedQuery, leadPacks, summary })
  state.savedSearches = sortSavedSearches([saved, ...(state.savedSearches || []).filter((item) => savedSearchKey(item) !== saved.key)]).slice(0, 30)
  return {
    runId,
    parsedQuery,
    outputDir,
    leadPackOutputPath,
    downloads: downloadsForRun(runId),
    summary,
    readiness: hostedReadiness(leadPacks, state.savedSearches, summary),
    savedSearches: state.savedSearches,
    leadPacks,
  }
}

async function hostedDeepQualifyFromEvent(event, state) {
  const body = parseJsonBody(event)
  const lead = body.lead && typeof body.lead === 'object' ? JSON.parse(JSON.stringify(body.lead)) : null
  if (!lead) return { error: 'Lead is required', statusCode: 400 }
  const sellerIntent = normalizeSellerIntent(body.sellerIntent || lead.sellerFit?.sellerIntent)
  const leadId = lead.workflow?.leadId || findHostedLeadId(state.latestRun, lead)
  const companyProfile = body.enrichCompanyProfile === false || body.enrichCompanyProfile === 'false'
    ? null
    : await hostedSelectedCompanyProfile(lead)
  let enriched = mergeHostedCompanyProfile(lead, companyProfile)
  enriched.rank = lead.rank || enriched.rank || 1
  enriched.enrichmentStatus = 'deep_enriched'
  enriched.enrichmentModules = hostedEnrichmentModules(enriched)
  enriched.enrichment = {
    status: 'deep_enriched',
    mode: 'selected_lead_hosted',
    enrichedAt: new Date().toISOString(),
    modules: enriched.enrichmentModules,
    summary: {
      companyIdentity: hostedBrregStatus(enriched.company || {}),
      contactability: hostedContactability(enriched),
      digitalPresence: enriched.website?.auditStatus || 'skipped_hosted_beta',
      economy: enriched.economy?.status || 'not_enabled',
    },
  }
  enriched.meta = { ...(enriched.meta || {}), mode: 'deep', enrichmentMode: 'selected_lead_hosted', enrichedAt: enriched.enrichment.enrichedAt }
  enriched.sellerFit = evaluateSellerFit(enriched, sellerIntent)
  enriched.workflow = buildWorkflowForLead(enriched, { ...(lead.workflow || {}), ...(leadId ? state.workflow.leads[leadId] || {} : {}) }, leadId || hostedLeadId(enriched, 0))
  enriched = attachSourceFusion(enriched)
  replaceHostedLeadInLatestRun(state, lead, enriched)
  return { leadPack: enriched, companyProfile, mode: 'selected_lead_enrichment', hosted: true }
}

async function hostedSelectedCompanyProfile(lead = {}) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  try {
    return await enrichCompanyProfile({
      companyName: company.displayName || lead.companyName || company.legalName || company.candidateLegalName,
      website: selectedHostedWebsiteUrl(lead),
      phone: contact.phone || lead.phone,
      email: contact.email || lead.email,
      address: contact.address || lead.address,
      city: contact.city || lead.city,
      industry: lead.leadClass || lead.opportunityType,
    }, { timeoutMs: 7000, retries: 1, cache: false })
  } catch (error) {
    return hostedBrregErrorProfile(error)
  }
}

function mergeHostedCompanyProfile(lead = {}, profile) {
  const copy = JSON.parse(JSON.stringify(lead || {}))
  if (!profile) return copy
  const current = copy.company || {}
  if (String(profile.matchStatus || '').toLowerCase() === 'error' && (current.organizationNumber || current.candidateOrganizationNumber)) return copy
  const confirmed = profile.organizationNumber && ['exact_match', 'strong_match'].includes(String(profile.matchStatus || '').toLowerCase())
  copy.company = {
    ...current,
    legalName: profile.legalName || current.legalName || null,
    candidateLegalName: profile.candidateLegalName || current.candidateLegalName || profile.legalName || null,
    organizationNumber: confirmed ? profile.organizationNumber : (current.organizationNumber || null),
    candidateOrganizationNumber: profile.candidateOrganizationNumber || current.candidateOrganizationNumber || (!confirmed ? profile.organizationNumber : null),
    organizationForm: profile.organizationForm || current.organizationForm || null,
    registeredAddress: profile.registeredAddress || current.registeredAddress || null,
    municipality: profile.municipality || current.municipality || null,
    unitType: profile.unitType || current.unitType || null,
    naceCode: profile.naceCode || current.naceCode || null,
    naceDescription: profile.naceDescription || current.naceDescription || null,
    employees: profile.employees ?? current.employees ?? null,
    registrationDate: profile.registrationDate || current.registrationDate || null,
    activeStatus: profile.activeStatus || current.activeStatus || null,
    source: profile.source || current.source || 'brreg',
    sourceUrl: profile.sourceUrl || current.sourceUrl || null,
    errorType: profile.errorType || current.errorType || null,
    matchStatus: profile.matchStatus || current.matchStatus || null,
    matchConfidence: profile.matchConfidence ?? current.matchConfidence ?? null,
    matchReasons: Array.isArray(profile.matchReasons) ? profile.matchReasons : (current.matchReasons || []),
    warnings: Array.from(new Set([...(current.warnings || []), ...(profile.warnings || [])].filter(Boolean))),
    candidates: Array.isArray(profile.candidates) && profile.candidates.length ? profile.candidates : (current.candidates || []),
  }
  return copy
}

function hostedEnrichmentModules(lead = {}) {
  const company = lead.company || {}
  const contactability = hostedContactability(lead)
  const websiteStatus = selectedHostedWebsiteUrl(lead) ? (lead.website?.auditStatus || 'skipped_hosted_beta') : 'skipped_no_website'
  const economyStatus = lead.economy?.status || 'not_enabled'
  return [
    { id: 'company_identity', name: 'Brreg verification', status: hostedBrregStatus(company), summary: hostedBrregSummary(company) },
    { id: 'contactability', name: 'Contactability refresh', status: contactability, summary: contactability === 'strong' ? 'Direct phone is available for seller qualification.' : 'Direct phone is missing or indirect.' },
    { id: 'digital_presence', name: 'Digital presence check', status: websiteStatus, summary: 'Hosted beta records website presence but does not run browser audit.' },
    { id: 'seller_summary', name: 'Seller fit summary', status: 'completed', summary: 'Seller fit refreshed after selected-lead Brreg retry.' },
    { id: 'economy_proff', name: 'Economy / Proff', status: economyStatus, summary: 'Proff is not enabled for hosted beta.' },
  ]
}

function hostedBrregStatus(company = {}) {
  if (company.organizationNumber) return 'completed'
  if (company.candidateOrganizationNumber || ['manual_verify', 'weak_match'].includes(String(company.matchStatus || '').toLowerCase())) return 'manual_verify'
  return company.matchStatus || 'not_run'
}

function hostedBrregSummary(company = {}) {
  if (company.organizationNumber) return 'Confirmed org.nr ' + company.organizationNumber + '.'
  if (company.candidateOrganizationNumber) return 'Candidate org.nr ' + company.candidateOrganizationNumber + '; verify before export.'
  if (company.matchStatus === 'error') return 'Brreg retry failed in hosted beta; keep this as a contactable lead if phone is valid.'
  if (company.matchStatus === 'no_match') return 'Brreg returned no confident company match.'
  return 'Brreg identity is not confirmed yet.'
}

function hostedContactability(lead = {}) {
  const contact = lead.contact || {}
  if (contact.phone || lead.phone) return 'strong'
  if (contact.email || lead.email || selectedHostedWebsiteUrl(lead)) return 'medium'
  return 'weak'
}

function selectedHostedWebsiteUrl(lead = {}) {
  const contactWebsite = lead.contact && typeof lead.contact.website === 'string' ? lead.contact.website.trim() : ''
  if (contactWebsite) return contactWebsite
  if (typeof lead.website === 'string') return lead.website.trim()
  if (lead.website && typeof lead.website === 'object') return String(lead.website.url || lead.website.href || lead.website.website || lead.website.uri || '').trim()
  return ''
}

function hostedBrregErrorProfile(error) {
  return { source: 'brreg', matchStatus: 'error', matchConfidence: 0, errorType: 'unknown_error', warnings: [error && error.message ? error.message : 'company_profile_error'], candidates: [] }
}

function replaceHostedLeadInLatestRun(state, targetLead, replacement) {
  if (!state.latestRun || !Array.isArray(state.latestRun.leadPacks)) return
  let replaced = false
  state.latestRun.leadPacks = state.latestRun.leadPacks.map((lead, index) => {
    if (!replaced && hostedLeadMatches(lead, targetLead, index)) {
      replaced = true
      return replacement
    }
    return lead
  })
  if (!replaced) state.latestRun.leadPacks.unshift(replacement)
  state.latestRun = attachHostedStateToRun(state.latestRun, state)
}

function findHostedLeadId(run, targetLead) {
  const explicit = targetLead?.workflow?.leadId
  if (explicit) return explicit
  const leads = run && Array.isArray(run.leadPacks) ? run.leadPacks : []
  const match = leads.find((lead, index) => hostedLeadMatches(lead, targetLead, index))
  if (!match) return ''
  const index = leads.indexOf(match)
  return match.workflow?.leadId || hostedLeadId(match, index)
}

function hostedLeadMatches(lead = {}, targetLead = {}, index = 0) {
  const leadId = lead.workflow?.leadId || hostedLeadId(lead, index)
  const targetId = targetLead.workflow?.leadId
  if (targetId && leadId === targetId) return true
  const leadOrg = lead.company?.organizationNumber || lead.company?.candidateOrganizationNumber
  const targetOrg = targetLead.company?.organizationNumber || targetLead.company?.candidateOrganizationNumber
  if (leadOrg && targetOrg && String(leadOrg) === String(targetOrg)) return true
  const leadPlace = lead.places?.placeId
  const targetPlace = targetLead.places?.placeId
  if (leadPlace && targetPlace && leadPlace === targetPlace) return true
  const leadName = String(lead.company?.displayName || lead.companyName || '').toLowerCase()
  const targetName = String(targetLead.company?.displayName || targetLead.companyName || '').toLowerCase()
  const leadPhone = digitsOnly(lead.contact?.phone || lead.phone)
  const targetPhone = digitsOnly(targetLead.contact?.phone || targetLead.phone)
  return Boolean(leadName && targetName && leadName === targetName && (!leadPhone || !targetPhone || leadPhone === targetPhone))
}

function digitsOnly(value) { return String(value || '').replace(/\D/g, '') }

function attachSellerFitToLeads(leadPacks, sellerIntent = 'general_b2b') {
  const normalizedSellerIntent = normalizeSellerIntent(sellerIntent)
  return (Array.isArray(leadPacks) ? leadPacks : []).map((lead) => {
    const copy = JSON.parse(JSON.stringify(lead || {}))
    copy.sellerFit = evaluateSellerFit(copy, normalizedSellerIntent)
    copy.meta = { ...(copy.meta || {}), sellerIntent: normalizedSellerIntent }
    return copy
  })
}

function attachHostedStateToLeads(leadPacks, state) {
  return (Array.isArray(leadPacks) ? leadPacks : []).map((lead, index) => {
    const next = { ...lead }
    const id = hostedLeadId(next, index)
    next.workflow = buildWorkflowForLead(next, { ...(next.workflow || {}), ...(state.workflow.leads[id] || {}) }, id)
    return attachSourceFusion(next)
  })
}

async function readHostedState() {
  const fallback = { workflow: { leads: {} }, savedSearches: [], latestRun: null, activityLog: [] }
  const blobStore = getBlobStore()
  if (blobStore) {
    const value = await blobStore.get('state', { type: 'json', consistency: 'strong' }).catch(() => null)
    return normalizeHostedState(value || fallback)
  }
  return normalizeHostedState(readJsonFile(STATE_PATH, fallback))
}

async function writeHostedState(state) {
  const normalized = normalizeHostedState(state)
  const blobStore = getBlobStore()
  if (blobStore) {
    await blobStore.setJSON('state', normalized)
    return
  }
  writeJsonFile(STATE_PATH, normalized)
}

function getBlobStore() {
  try {
    const { getStore } = require('@netlify/blobs')
    return getStore(STORE_NAME)
  } catch (_) {
    return null
  }
}

function normalizeHostedState(value = {}) {
  return {
    workflow: value.workflow && value.workflow.leads ? value.workflow : { leads: {} },
    savedSearches: Array.isArray(value.savedSearches) ? value.savedSearches.slice(0, 30) : [],
    latestRun: value.latestRun && typeof value.latestRun === 'object' ? value.latestRun : null,
    activityLog: Array.isArray(value.activityLog) ? value.activityLog.slice(0, 200) : [],
  }
}

function workflowForLead(state, leadId) {
  const id = String(leadId || '').trim()
  return { ...defaultWorkflow(), ...(state.workflow.leads[id] || {}), leadId: id }
}

async function saveWorkflowFromEvent(event, state) {
  const body = parseJsonBody(event)
  const leadId = String(body.leadId || '').trim()
  if (!leadId) return { error: 'leadId is required' }
  const previous = normalizeWorkflow(state.workflow.leads[leadId] || {})
  const workflow = normalizeWorkflow({ ...previous, ...(body.workflow || body), leadId })
  workflow.leadId = leadId
  workflow.runId = limitText(body.runId || workflow.runId || '', 120)
  workflow.leadName = limitText(body.leadName || workflow.leadName || '', 180)
  workflow.updatedAt = new Date().toISOString()
  const activity = createWorkflowActivity(previous, workflow)
  workflow.activities = [activity, ...normalizeActivities(previous.activities || previous.activityLog)].filter(Boolean).slice(0, 25)
  workflow.activityLog = workflow.activities
  state.workflow.leads[leadId] = workflow
  if (activity) state.activityLog = [{ leadId, activity, createdAt: activity.at }, ...state.activityLog].slice(0, 200)
  if (state.latestRun) state.latestRun = attachHostedStateToRun(state.latestRun, state)
  return { workflow }
}

async function updateSavedSearchFromEvent(event, state) {
  const body = parseJsonBody(event)
  const targetKey = String(body.key || savedSearchKey(body)).trim()
  if (!targetKey) return { error: 'saved search key is required' }
  let updated = null
  const searches = Array.isArray(state.savedSearches) ? state.savedSearches : []
  const next = searches.map((search) => {
    if (savedSearchKey(search) !== targetKey && search.key !== targetKey) return search
    updated = { ...search, label: body.label !== undefined ? limitText(body.label, 80) : search.label, pinned: body.pinned !== undefined ? (body.pinned === true || body.pinned === 'true') : search.pinned, updatedAt: new Date().toISOString(), key: savedSearchKey(search) }
    return updated
  })
  if (!updated) return { error: 'Saved search not found' }
  state.savedSearches = sortSavedSearches(next).slice(0, 30)
  if (state.latestRun) state.latestRun.savedSearches = state.savedSearches
  return { savedSearch: updated, savedSearches: state.savedSearches }
}

function attachHostedStateToRun(run, state) {
  const copy = JSON.parse(JSON.stringify(run || {}))
  copy.savedSearches = state.savedSearches.length ? state.savedSearches : (copy.savedSearches || [])
  copy.leadPacks = (copy.leadPacks || []).map((lead, index) => {
    const next = { ...lead }
    const id = next.workflow && next.workflow.leadId || hostedLeadId(next, index)
    const savedWorkflow = state.workflow.leads[id] || {}
    const existingWorkflow = next.workflow && (next.workflow.updatedAt || Array.isArray(next.workflow.activities) && next.workflow.activities.length || Array.isArray(next.workflow.activityLog) && next.workflow.activityLog.length)
      ? next.workflow
      : {}
    next.workflow = buildWorkflowForLead(next, { ...existingWorkflow, ...savedWorkflow }, id)
    return attachSourceFusion(next)
  })
  if (copy.readiness && copy.readiness.workspace) {
    copy.readiness.workspace.workflowLeadCount = Object.keys(state.workflow.leads || {}).length
    copy.readiness.workspace.savedSearchCount = copy.savedSearches.length
    copy.readiness.workspace.activityCount = state.activityLog.length
  }
  return copy
}

function attachSourceFusion(lead = {}) {
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
}

function runFileResponse(apiPath, state, event) {
  const match = apiPath.match(new RegExp('^/api/runs/([^/]+)/([^/]+)$'))
  if (!match || !state.latestRun || state.latestRun.runId !== match[1]) return null
  const file = match[2]
  const run = attachHostedStateToRun(state.latestRun, state)
  if (file === 'lead-packs.json') return jsonResponse(200, run.leadPacks || [])
  if (file === 'summary.json') return jsonResponse(200, run.summary || {})
  if (file === 'lead-packs.csv' || file === 'call-list.csv') {
    const view = event ? queryUrl(event, apiPath).searchParams.get('view') : ''
    const leads = file === 'call-list.csv' ? filterHostedCallList(run.leadPacks || [], view) : (run.leadPacks || [])
    return textResponse(200, hostedCsv(leads), { 'content-type': 'text/csv' })
  }
  return null
}

function filterHostedCallList(leads, view) {
  const list = Array.isArray(leads) ? leads : []
  const queue = normalizeQueue(view)
  if (queue) return list.filter((lead) => leadMatchesQueue(lead, queue))
  if (view === 'today') return list.filter((lead) => leadMatchesQueue(lead, 'call_now') || leadMatchesQueue(lead, 'follow_up_today'))
  if (view === 'followUpDue') return list.filter((lead) => leadMatchesQueue(lead, 'follow_up_today'))
  if (view === 'interested') return list.filter((lead) => leadMatchesQueue(lead, 'interested'))
  if (view === 'notContacted') return list.filter((lead) => !lead.workflow || !lead.workflow.contacted)
  return list
}

function hostedCsv(leads) {
  const headers = ['rank', 'company', 'phone', 'city', 'leadConfidence', 'identityConfidence', 'contactConfidence', 'locationConfidence', 'recommendedTrustAction', 'sourceCoverage', 'verifiedFieldsSummary', 'proofReasonsSummary', 'riskReasonsSummary', 'sourceFusionWarnings', 'workflowQueue', 'workflowStatus', 'owner', 'response', 'followUpDate', 'nextFollowUpAt', 'lastContactedAt', 'nextAction', 'latestOutcome', 'workflowNotes']
  const rows = (Array.isArray(leads) ? leads : []).map((lead, index) => {
    const workflow = normalizeWorkflow(lead.workflow || {})
    const contact = lead.contact || {}
    const fusion = lead.sourceFusion || evaluateSourceFusion({ lead, googlePlaces: lead.places, brregCompanyProfile: lead.company, contactProfile: lead.contact, sourceQuality: lead.sourceQuality, sellerFit: lead.sellerFit, workflow })
    const fusionSummary = sourceFusionSummary(fusion)
    return [index + 1, lead.company && lead.company.displayName || lead.companyName || '', contact.phone || lead.phone || '', contact.city || lead.city || '', fusion.leadConfidence || '', fusion.identityConfidence || '', fusion.contactConfidence || '', fusion.locationConfidence || '', fusion.recommendedTrustAction || '', fusionSummary.sourceCoverage, fusionSummary.verifiedFields, fusionSummary.proofReasons, fusionSummary.riskReasons, fusionSummary.warnings, workflow.queue || '', workflow.status || '', workflow.owner || '', workflow.response || '', workflow.followUpDate || '', workflow.nextFollowUpAt || '', workflow.lastContactedAt || '', workflow.nextAction || '', workflow.response || workflow.outcome || '', workflow.notes || '']
  })
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n') + '\n'
}

function exportSnapshot(state) {
  return {
    exportedAt: new Date().toISOString(),
    storage: { mode: getBlobStore() ? 'netlify_blobs' : 'tmp_json', store: STORE_NAME },
    workflow: state.workflow,
    savedSearches: state.savedSearches,
    activityLog: state.activityLog,
    latestRunId: state.latestRun && state.latestRun.runId || '',
  }
}

function hostedHealth(state) {
  return {
    status: 'ok',
    product: 'lead-machine-hosted-seller-desk',
    version: 'netlify-friend-beta-v1',
    beta: true,
    hosted: true,
    localOnly: false,
    tokenProtected: Boolean(process.env.BETA_ACCESS_TOKEN),
    storage: getBlobStore() ? 'netlify_blobs' : 'tmp_json_fallback',
    workspace: {
      status: getBlobStore() ? 'netlify_blobs' : 'tmp_json',
      workflowLeadCount: Object.keys(state.workflow.leads || {}).length,
      savedSearchCount: state.savedSearches.length,
      activityCount: state.activityLog.length,
    },
    limits: [
      'One shared beta workspace for invited testers.',
      'No email sending, telephony, CRM sync, or outreach automation.',
      'Call now uses the tester device tel link only.',
      'Set BETA_ACCESS_TOKEN before sharing the URL.',
    ],
  }
}

function parseJsonBody(event) {
  const body = event.body ? Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8').toString('utf8') : '{}'
  return parseJson(body, {}) || {}
}

function createHostedRunId(query) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const slug = String(query || 'lead-machine').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'lead-machine'
  return slug + '-' + stamp
}

function normalizeHostedMaxResults(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 && number <= 25 ? Math.floor(number) : fallback
}

function friendlyHostedError(error) {
  const message = error && error.message ? String(error.message) : 'Hosted beta search failed'
  if (message.includes('GOOGLE_PLACES_API_KEY')) return 'Google Places API key is missing or unavailable in Netlify. Check GOOGLE_PLACES_API_KEY and redeploy.'
  return message
}

function hostedLeadId(lead, index) {
  return [lead.company && lead.company.organizationNumber, lead.company && lead.company.candidateOrganizationNumber, lead.places && lead.places.placeId, lead.company && lead.company.displayName, index].filter(Boolean).join('::') || 'lead::' + index
}

function savedSearchKey(entry = {}) {
  return [entry.query, entry.sellerIntent, entry.searchScope, entry.provider].map((value) => String(value || '').toLowerCase()).join('::')
}

function sortSavedSearches(searches = []) {
  return searches.slice().sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
    return String(b.savedAt || b.updatedAt || '').localeCompare(String(a.savedAt || a.updatedAt || ''))
  })
}

function limitText(value, max) { return String(value || '').slice(0, max) }
function parseJson(value, fallback) { try { return JSON.parse(value) } catch (_) { return fallback } }
function readJsonFile(filePath, fallback) { try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) } catch (_) { return fallback } }
function writeJsonFile(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(value, null, 2)) }
function csvEscape(value) { const text = value === null || value === undefined ? '' : String(value); return (text.includes(',') || text.includes('\n') || text.includes('"')) ? '"' + text.replace(/"/g, '""') + '"' : text }
function jsonResponse(statusCode, value, headers = {}) { return { statusCode, headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(value) } }
function textResponse(statusCode, body, headers = {}) { return { statusCode, headers: { 'content-type': 'text/plain', ...headers }, body } }
