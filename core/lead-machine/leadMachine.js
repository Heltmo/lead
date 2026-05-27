const fs = require('fs')
const path = require('path')
const { discoverLocalBusinesses, writeDiscoveryOutputs, shouldIncludeInHandoff, formatHandoffCandidate } = require('../lead-discovery-agent/discoverLocalBusinesses')
const { runAuditQueue } = require('../orchestrator/pipelines/auditQueue')
const { runLeadPack } = require('../lead-pack-runner/leadPackRunner')
const { normalizeSearchScope } = require('../lead-discovery-agent/normalizers/locationQuality')

async function runLeadMachine(options = {}) {
  if (!options.query) throw new Error('query is required')
  const query = String(options.query).trim()
  const provider = options.provider || 'google-places'
  const maxResults = normalizePositiveInteger(options.maxResults, 5)
  const searchScope = normalizeSearchScope(options.searchScope)
  const enrichCompanyProfile = parseBoolean(options.enrichCompanyProfile)
  const runId = options.runId || createLeadMachineRunId(query)
  const outputDir = path.resolve(options.outputDir || path.join(__dirname, 'runs', runId))
  const discoveryDir = path.join(outputDir, 'discovery')
  const leadPackOutputDir = path.join(outputDir, 'lead-packs')
  const orchestratorRootDir = path.resolve(options.orchestratorRootDir || path.join(__dirname, '..', 'orchestrator', 'runs'))
  fs.mkdirSync(discoveryDir, { recursive: true })
  fs.mkdirSync(leadPackOutputDir, { recursive: true })

  const discovery = await discoverLocalBusinesses({
    query,
    provider,
    maxResults,
    searchScope,
    mockResultsPath: options.mockResultsPath,
    mockResults: options.mockResults,
    validate: options.validate === undefined ? false : parseBoolean(options.validate),
    env: options.env,
    fetchImpl: options.fetchImpl,
    googlePlacesEndpoint: options.googlePlacesEndpoint,
    braveEndpoint: options.braveEndpoint,
  })
  const discoveryOutputs = writeDiscoveryOutputs(discovery, {
    outPath: path.join(discoveryDir, 'lead-candidates.json'),
    summaryPath: path.join(discoveryDir, 'discovery-summary.json'),
    handoffPath: path.join(discoveryDir, 'handoff.jsonl'),
  })

  const handoffItems = discovery.candidates
    .filter((candidate) => shouldIncludeInHandoff(candidate))
    .map((candidate) => JSON.parse(formatHandoffCandidate(candidate, discovery)))

  let auditResult = null
  let leadPackResult = null
  let leadPackSummary = null
  let leadPacks = []
  if (handoffItems.length > 0) {
    auditResult = await runAuditQueue({
      urls: handoffItems,
      runId: `${runId}-orchestrator`,
      rootDir: orchestratorRootDir,
      maxRetries: 1,
    })
    leadPackResult = await runLeadPack({
      query,
      runDir: path.dirname(auditResult.summaryPath),
      outputDir: leadPackOutputDir,
      enrichCompanyProfile,
    })
    leadPackSummary = readJson(leadPackResult.summaryPath)
    leadPacks = readJson(leadPackResult.leadPacksPath)
  } else {
    writeEmptyLeadPackOutputs({ outputDir: leadPackOutputDir, query, runId, discovery })
    leadPackResult = {
      outputDir: leadPackOutputDir,
      leadPacksPath: path.join(leadPackOutputDir, 'lead-packs.json'),
      csvPath: path.join(leadPackOutputDir, 'lead-packs.csv'),
      summaryPath: path.join(leadPackOutputDir, 'summary.json'),
      totalLeads: 0,
    }
    leadPackSummary = readJson(leadPackResult.summaryPath)
  }

  const summary = buildLeadMachineSummary({
    runId,
    query,
    provider,
    maxResults,
    searchScope,
    enrichCompanyProfile,
    outputDir,
    discovery,
    discoveryOutputs,
    auditResult,
    leadPackResult,
    leadPackSummary,
    leadPacks,
  })
  const summaryPath = path.join(outputDir, 'lead-machine-summary.json')
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)
  return { outputDir, summaryPath, leadPackOutputPath: leadPackOutputDir, sourceRunPath: summary.sourceRunPath, totalLeads: summary.totalIncluded }
}

function buildLeadMachineSummary({ runId, query, provider, maxResults, searchScope, enrichCompanyProfile, outputDir, discovery, discoveryOutputs, auditResult, leadPackResult, leadPackSummary, leadPacks }) {
  return {
    runId,
    query,
    provider,
    searchScope,
    maxResults,
    outputDir,
    createdAt: new Date().toISOString(),
    discoveryOutputs,
    sourceRunPath: auditResult ? path.dirname(auditResult.summaryPath) : null,
    leadPackOutputPath: leadPackResult.outputDir,
    totalDiscovered: discovery.totalCandidates,
    totalIncluded: leadPackSummary.totalLeads || 0,
    locationQualityCounts: leadPackSummary.locationQualityCounts || discovery.locationQuality?.counts || {},
    callPriorityCounts: leadPackSummary.priorityCounts || {},
    lowSupply: Boolean(discovery.searchSupply?.lowSupply || leadPackSummary.lowSupply),
    fallbackAvailable: Boolean(discovery.searchSupply?.fallbackAvailable || leadPackSummary.fallbackAvailable),
    fallbackUsed: Boolean(discovery.searchSupply?.fallbackUsed || leadPackSummary.fallbackUsed),
    recommendedExpansion: discovery.searchSupply?.recommendedExpansion || leadPackSummary.recommendedExpansion || null,
    companyProfileEnabled: Boolean(enrichCompanyProfile),
    companyProfileCounts: countCompanyProfileStatuses(leadPacks),
    economyStatus: 'not_enabled',
    productBoundary: 'machine_generates_ranked_lead_packs_seller_owns_angle_wording_outreach_timing_relationship_close',
  }
}

function writeEmptyLeadPackOutputs({ outputDir, query, runId, discovery }) {
  fs.mkdirSync(outputDir, { recursive: true })
  const summary = {
    runId,
    sourceRun: null,
    outputDir,
    sourceQuery: query,
    generatedAt: new Date().toISOString(),
    totalLeads: 0,
    priorityCounts: {},
    enrichCompanyProfile: false,
    economyStatus: 'not_enabled',
    searchScope: discovery.searchScope || 'strict',
    requestedMaxResults: discovery.searchSupply?.requestedMaxResults ?? null,
    includedLeadCount: 0,
    lowSupply: Boolean(discovery.searchSupply?.lowSupply),
    fallbackAvailable: Boolean(discovery.searchSupply?.fallbackAvailable),
    fallbackUsed: Boolean(discovery.searchSupply?.fallbackUsed),
    recommendedExpansion: discovery.searchSupply?.recommendedExpansion || null,
    locationQualityCounts: discovery.locationQuality?.counts || {},
  }
  fs.writeFileSync(path.join(outputDir, 'lead-packs.json'), '[]\n')
  fs.writeFileSync(path.join(outputDir, 'lead-packs.csv'), '\n')
  fs.writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
}

function countCompanyProfileStatuses(leadPacks) {
  return (leadPacks || []).reduce((acc, lead) => {
    const key = lead.company?.matchStatus || 'not_run'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function createLeadMachineRunId(query) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  return `${slugify(query)}-${stamp}`
}

function slugify(value) {
  return String(value || 'lead-machine')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'lead-machine'
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback
}

function parseBoolean(value) {
  if (value === true) return true
  return ['1', 'true', 'yes'].includes(String(value || '').toLowerCase())
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) out[key] = true
    else { out[key] = next; i += 1 }
  }
  return out
}

module.exports = { runLeadMachine, buildLeadMachineSummary, createLeadMachineRunId, parseArgs, slugify }
