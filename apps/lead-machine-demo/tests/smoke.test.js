const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { createServer } = require('../server')
const { parseLeadQuery } = require('../queryParser')
const { workflowForLead, normalizeWorkflow } = require('../workQueues')

async function main() {
  const strongLead = { sellerFit: { sellerFit: 'strong', recommendedAction: 'contact' }, contact: { phone: '12345678' }, company: { organizationNumber: '999888777' }, sourceQuality: { locationMatchStatus: 'exact_location' } }
  const verifyLead = { sellerFit: { sellerFit: 'review', recommendedAction: 'verify' }, contact: { phone: '12345678' }, company: { candidateOrganizationNumber: '999111222', matchStatus: 'manual_verify' }, sourceQuality: { locationMatchStatus: 'regional_fallback' } }
  assert(workflowForLead(strongLead, {}, 'strong::1').queue === 'call_now', 'strong/good contact-ready lead should enter call_now')
  assert(workflowForLead(verifyLead, {}, 'verify::1').queue === 'verify_first', 'verify lead should enter verify_first')
  assert(normalizeWorkflow({ response: 'no_answer' }, { today: '2026-06-02', now: '2026-06-02T09:00:00.000Z' }).queue === 'no_answer', 'no_answer without due date should move to no_answer and get a later follow-up')
  assert(normalizeWorkflow({ response: 'no_answer', followUpDate: '2026-06-02' }, { today: '2026-06-02' }).queue === 'follow_up_today', 'no_answer with follow-up today should appear in follow_up_today')
  assert(normalizeWorkflow({ response: 'interested' }).queue === 'interested', 'interested outcome should move to interested')
  assert(normalizeWorkflow({ status: 'rejected', outcome: 'not relevant' }).queue === 'not_relevant', 'rejected/not_relevant outcome should move to not_relevant')
  assert(normalizeWorkflow({ queue: 'archived' }).queue === 'archived', 'archive should hide a lead from active queues')
  assert(normalizeWorkflow({ queue: 'verify_first' }).queue === 'verify_first', 'manual queue override should persist when no outcome overrides it')

  assert(parseLeadQuery('Kristiansand rørlegger').normalizedQuery === 'rørlegger i Kristiansand', 'location-first query should parse')
  assert(parseLeadQuery('rørlegger Kristiansand').normalizedQuery === 'rørlegger i Kristiansand', 'vertical-first query should parse')
  assert(parseLeadQuery('rørleggere i Kristiansand').normalizedQuery === 'rørlegger i Kristiansand', 'i-pattern query should parse')
  assert(parseLeadQuery('advokater i Gol').normalizedQuery === 'advokat i Gol', 'lawyer query should parse')
  assert(parseLeadQuery('Gol advokat').normalizedQuery === 'advokat i Gol', 'Gol advokat should parse')
  assert(parseLeadQuery('Ålesund fysioterapeuter').normalizedQuery === 'fysioterapeut i Ålesund', 'Ålesund fysioterapeuter should parse')
  assert(parseLeadQuery('bilverksted i Bergen').normalizedQuery === 'bilverksted i Bergen', 'bilverksted should parse')
  assert(parseLeadQuery('frisør Tromsø').normalizedQuery === 'frisør i Tromsø', 'frisør should parse')
  assert(parseLeadQuery('eiendomsmeglere i Oslo').normalizedQuery === 'eiendomsmegler i Oslo', 'eiendomsmegler should parse')
  assert(parseLeadQuery('escapreroom').normalizedQuery === 'escape room', 'escape room typo should normalize for broad Norway search')
  assert(parseLeadQuery('paintball').normalizedQuery === 'paintball', 'paintball free text should remain a broad Norway search')

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-machine-demo-'))
  let runnerArgs = null
  let deepQualifierArgs = null
  const runner = async (args) => {
    runnerArgs = args
    const leadPackOutputPath = path.join(args.outputDir, 'lead-packs')
    fs.mkdirSync(leadPackOutputPath, { recursive: true })
    const leadPacks = [{
      rank: 1,
      callPriority: 'medium',
      leadClass: 'service_line_optimization',
      opportunityType: 'high_value_service_conversion',
      company: {
        displayName: 'Kristiansand Rør AS',
        legalName: 'KRISTIANSAND RØR AS',
        candidateLegalName: 'KRISTIANSAND RØR AS',
        organizationNumber: null,
        candidateOrganizationNumber: '999111222',
        organizationForm: 'Aksjeselskap',
        registeredAddress: 'Testgata 1, 4600 Kristiansand',
        municipality: 'Kristiansand',
        unitType: 'enhet',
        naceCode: '43.220',
        naceDescription: 'VVS-arbeid',
        employees: 7,
        registrationDate: '2018-01-01',
        activeStatus: 'active',
        sourceUrl: 'https://data.brreg.no/enhetsregisteret/api/enheter/999111222',
        matchStatus: 'manual_verify',
        matchConfidence: 0.72,
        warnings: ['multiple_plausible_candidates'],
        candidates: [{ candidateOrganizationNumber: '999111222', candidateLegalName: 'KRISTIANSAND RØR AS', municipality: 'Kristiansand', unitType: 'enhet', score: 0.72 }],
      },
      contact: { website: 'https://example.no', phone: '38000000', city: 'Kristiansand' },
      sourceQuality: { locationMatchStatus: 'exact_location' },
      ranking: { whyRanked: ['Contactable local trade business'], caution: ['Verify company identity'] },
      website: { topEvidence: ['Website found'] },
      economy: { status: 'not_enabled' },
    }]
    fs.writeFileSync(path.join(leadPackOutputPath, 'lead-packs.json'), JSON.stringify(leadPacks, null, 2))
    fs.writeFileSync(path.join(leadPackOutputPath, 'lead-packs.csv'), 'rank,company\n1,Kristiansand Rør AS\n')
    fs.writeFileSync(path.join(leadPackOutputPath, 'summary.json'), JSON.stringify({ totalLeads: 1, priorityCounts: { medium: 1 }, economyStatus: 'not_enabled' }, null, 2))
    const summaryPath = path.join(args.outputDir, 'lead-machine-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify({ includedLeadCount: 1, totalDiscovered: 1, lowSupply: false, fallbackAvailable: false, fallbackUsed: false, callPriorityCounts: { medium: 1 }, nextRecommendedAction: 'Review top MEDIUM leads as shortlist.' }, null, 2))
    return { outputDir: args.outputDir, summaryPath, leadPackOutputPath, totalLeads: 1 }
  }

  const deepQualifier = async (args) => {
    deepQualifierArgs = args
    return {
      outputDir: path.join(root, 'deep-run'),
      leadPackOutputPath: path.join(root, 'deep-run', 'lead-packs'),
      leadPack: {
        ...args.lead,
        enrichmentStatus: 'deep_enriched',
        enrichmentModules: [{ id: 'digital_presence', name: 'Digital presence check', status: 'completed', summary: 'Digital presence check completed for selected lead.' }],
        callPriority: 'high',
        leadClass: 'technical_redesign',
        opportunityType: 'technical_trust_risk',
        website: { auditStatus: 'completed', topEvidence: ['Selected lead audit completed'], contactability: 'strong' },
        ranking: { whyRanked: ['Deep qualified selected lead'], caution: ['Verify findings'], painScore: 0.9, buyingLikelihood: 0.8, salesEase: 'medium' },
        meta: { ...(args.lead.meta || {}), mode: 'deep' },
      },
    }
  }

  const savedSearchesPath = path.join(root, 'saved-searches.json')
  const workspaceDbPath = path.join(root, 'workspace.sqlite')
  const server = createServer({ runner, deepQualifier, runsDir: path.join(root, 'runs'), workflowPath: path.join(root, 'workflow.json'), savedSearchesPath, workspaceDbPath })
  await listen(server)
  const port = server.address().port

  const health = await get(port, "/api/health")
  assert(health.status === 200, "health endpoint should be available for friend beta preflight")
  assert(health.body.product === "lead-machine-local-seller-desk", "health endpoint should identify the seller desk")
  assert(health.body.beta === true && health.body.localOnly === true, "health endpoint should expose local beta boundary")
  assert(health.body.sourceGuard.proffStatus === "disabled_optional" || health.body.sourceGuard.proffStatus === "available_optional", "health endpoint should expose Proff optional status")
  assert(health.body.limits.some((item) => item.includes("No auth")), "health endpoint should expose beta limits")
  let response = await post(port, '/api/runs', { query: '' })
  assert(response.status === 400, 'missing query should return validation error')

  response = await post(port, '/api/runs', { query: 'Kristiansand rørlegger', provider: 'demo-fixture', maxResults: 5, searchScope: 'strict', enrichCompanyProfile: false })
  assert(response.status === 200, 'default demo fixture should complete without a live API key')
  assert(response.body.summary.provider === 'demo-fixture', 'explicit fixture provider should remain available for tests')
  assert(response.body.leadPacks.length >= 1, 'demo fixture should return lead packs')
  assert(response.body.downloads.csv.includes('/api/runs/'), 'demo fixture should return CSV download path')
  const fixtureCsv = await get(port, response.body.downloads.csv)
  assert(fixtureCsv.status === 200 && fixtureCsv.body.includes('Kristiansand Rør AS'), 'fixture CSV download should return generated CSV')

  response = await post(port, '/api/runs', { query: 'rørlegger i Kristiansand; rm -rf /', provider: 'google-places', searchScope: 'strict', sellerIntent: 'telecom', enrichCompanyProfile: false })
  assert(response.status === 200, 'explicit live provider should still call runner')
  assert(runnerArgs.query === 'rørlegger i Kristiansand; rm -rf /', 'query should be passed as data, not shell command')
  assert(runnerArgs.mode === 'fast', 'demo should pass fast mode by default')
  assert(runnerArgs.maxResults === 25, 'demo should use broad automatic max results when none is supplied')
  assert(runnerArgs.sellerIntent === 'telecom', 'seller intent should flow into the runner options')
  assert(!('shellCommand' in runnerArgs), 'backend should not construct shell command')
  assert(response.body.leadPacks.length === 1, 'completed run should return lead packs')
  assert(response.body.summary.sellerIntent === 'telecom', 'completed run should return seller intent in summary')
  assert(response.body.leadPacks[0].sellerFit.sellerIntent === 'telecom', 'completed run should attach seller fit to lead packs')
  assert(response.body.downloads.csv.includes('/api/runs/'), 'completed run should return CSV download path')
  assert(response.body.readiness.sourceGuard.proffStatus.includes('optional'), 'readiness should mark Proff as optional, not required')
  assert(response.body.readiness.sourceGuard.searchCap === 25, 'readiness should expose the 25-lead cost guard')
  assert(response.body.readiness.persistence.status === 'sqlite_local', 'readiness should expose SQLite local workspace persistence')
  assert(response.body.readiness.workspace && response.body.readiness.workspace.status === 'sqlite_local', 'readiness should expose workspace visibility state')
  assert(response.body.readiness.workspace.savedSearchCount >= 1, 'workspace visibility should count saved searches')
  assert(response.body.readiness.workspace.exportPath === '/api/workspace-export', 'workspace visibility should expose snapshot export path')
  assert(Array.isArray(response.body.savedSearches) && response.body.savedSearches.some((search) => search.query === 'rørlegger i Kristiansand; rm -rf /'), 'run response should include saved recent searches')
  assert(response.body.savedSearches[0].leadCount === 1 && response.body.savedSearches[0].phoneCount === 1, 'saved searches should include lead and phone-ready counts')
  assert(response.body.savedSearches[0].key, 'saved searches should expose a stable management key')
  const savedSearchUpdate = await request(port, '/api/saved-searches', 'PATCH', JSON.stringify({ key: response.body.savedSearches[0].key, label: 'Kristiansand VVS', pinned: true }), { 'content-type': 'application/json' })
  assert(savedSearchUpdate.status === 200, 'saved search metadata update should succeed')
  assert(savedSearchUpdate.body.savedSearch.label === 'Kristiansand VVS', 'saved search rename label should persist')
  assert(savedSearchUpdate.body.savedSearch.pinned === true, 'saved search pin state should persist')
  assert(savedSearchUpdate.body.savedSearches[0].pinned === true, 'pinned saved searches should sort first')
  assert(fs.existsSync(workspaceDbPath), 'workspace should persist to a local SQLite database')

  const csv = await get(port, response.body.downloads.csv)
  assert(csv.status === 200 && csv.body.includes('Kristiansand Rør AS'), 'CSV download should return generated CSV')
  assert(csv.body.includes('sellerIntent') && csv.body.includes('sellerFit'), 'CSV should include seller-fit columns')
  assert(csv.body.includes('osintEvidenceCount'), 'CSV should include OSINT summary columns')
  const latestRun = await get(port, '/api/latest-run')
  assert(latestRun.status === 200, 'latest run endpoint should load previous run from disk')
  assert(latestRun.body.leadPacks.length === 1, 'latest run endpoint should return lead packs')
  assert(latestRun.body.downloads.csv.includes('/api/runs/'), 'latest run endpoint should return download links')
  assert(Array.isArray(latestRun.body.savedSearches) && latestRun.body.savedSearches.length >= 1, 'latest run should restore recent saved searches')
  assert(latestRun.body.savedSearches[0].label === 'Kristiansand VVS', 'latest run should restore saved search label')
  assert(latestRun.body.savedSearches[0].pinned === true, 'latest run should restore saved search pin state')
  assert(latestRun.body.readiness && latestRun.body.readiness.mode === 'proff_free_ready', 'latest run should include product readiness state')

  const workflowLeadId = response.body.leadPacks[0].workflow.leadId
  const savedWorkflow = await post(port, '/api/workflow', {
    leadId: workflowLeadId,
    runId: response.body.runId,
    leadName: 'Kristiansand Rør AS',
    status: 'contacted',
    contacted: true,
    channel: 'phone',
    personReached: 'Daglig leder',
    response: 'interested',
    followUpDate: '2026-06-01',
    nextAction: 'follow up after call',
    notes: 'Asked for a short follow-up.',
    outcome: 'pending',
  })
  assert(savedWorkflow.status === 200, 'workflow save should succeed')
  assert(savedWorkflow.body.workflow.status === 'contacted', 'workflow status should persist')
  assert(savedWorkflow.body.workflow.queue === 'follow_up_today', 'interested lead with due follow-up should enter follow_up_today')
  assert(Array.isArray(savedWorkflow.body.workflow.activities) && savedWorkflow.body.workflow.activities.length === 1, 'workflow save should append an activity timeline entry')
  assert(savedWorkflow.body.workflow.activities[0].type === 'queue_change' || savedWorkflow.body.workflow.activities[0].toQueue === 'follow_up_today', 'workflow activity should record queue movement')
  const workflowLookup = await get(port, `/api/workflow?leadId=${encodeURIComponent(workflowLeadId)}`)
  assert(workflowLookup.status === 200 && workflowLookup.body.workflow.response === 'interested', 'workflow lookup should return saved response')
  const quickWorkflow = await post(port, '/api/workflow', {
    leadId: workflowLeadId,
    runId: response.body.runId,
    leadName: 'Kristiansand Rør AS',
    status: 'follow_up',
    contacted: true,
    channel: 'phone',
    response: 'no_answer',
    followUpDate: '2026-06-02',
    nextAction: 'call again',
    outcome: 'pending',
  })
  assert(quickWorkflow.status === 200, 'quick workflow-style save should succeed')
  assert(quickWorkflow.body.workflow.status === 'follow_up', 'quick workflow action should update status')
  assert(quickWorkflow.body.workflow.response === 'no_answer', 'quick workflow action should update response')
  assert(quickWorkflow.body.workflow.queue === 'follow_up_today', 'no_answer with follow-up today should enter follow_up_today')
  assert(quickWorkflow.body.workflow.nextFollowUpAt === '2026-06-02', 'workflow should expose nextFollowUpAt alias')
  assert(quickWorkflow.body.workflow.activities.length >= 2, 'quick workflow action should append activity timeline entry')
  assert(!String(quickWorkflow.body.workflow.notes || '').includes('Quick action:'), 'quick actions should not write system text into seller notes')
  assert(!String(quickWorkflow.body.workflow.activities[0].notes || '').includes('Quick action:'), 'quick action activity should not duplicate system text as notes')
  const workspaceExport = await get(port, '/api/workspace-export')
  assert(workspaceExport.status === 200, 'workspace export should return a local snapshot')
  assert(workspaceExport.body.storage.mode === 'sqlite', 'workspace export should identify SQLite storage')
  assert(workspaceExport.body.workflow.leads[workflowLeadId].status === 'follow_up', 'workspace export should include saved workflow state')
  assert(workspaceExport.body.workflow.leads[workflowLeadId].queue === 'follow_up_today', 'workspace export should include saved queue state')
  assert(Array.isArray(workspaceExport.body.savedSearches) && workspaceExport.body.savedSearches.length >= 1, 'workspace export should include saved searches')
  assert(Array.isArray(workspaceExport.body.activityLog) && workspaceExport.body.activityLog.length >= 1, 'workspace export should include activity log entries')

  const workflowCsv = await get(port, response.body.downloads.csv)
  assert(workflowCsv.body.includes('workflowQueue'), 'CSV should include workflow queue column')
  assert(workflowCsv.body.includes('nextFollowUpAt'), 'CSV should include next follow-up column')
  assert(workflowCsv.body.includes('lastContactedAt'), 'CSV should include last contacted column')
  assert(workflowCsv.body.includes('workflowStatus'), 'CSV should include workflow status column')
  assert(workflowCsv.body.includes('lastActivityAt'), 'CSV should include last activity timestamp column')
  assert(workflowCsv.body.includes('call again'), 'CSV should include workflow next action from quick action')
  const callListCsv = await get(port, response.body.downloads.callListNotContacted)
  assert(callListCsv.status === 200 && callListCsv.body.includes('rank,company'), 'call-list export should return a CSV')
  const todayCallListCsv = await get(port, response.body.downloads.callListToday)
  assert(todayCallListCsv.status === 200 && todayCallListCsv.body.includes('rank,company'), 'today call queue export should return a CSV')
  response = await post(port, '/api/runs', { query: 'rørlegger i Kristiansand; rm -rf /', provider: 'google-places', searchScope: 'strict', enrichCompanyProfile: false })
  assert(response.body.leadPacks[0].workflow.status === 'follow_up', 'workflow quick action should attach to later returned lead packs')
  assert(response.body.leadPacks[0].workflow.queue === 'follow_up_today', 'workflow queue should attach to later returned lead packs')

  const deepResponse = await post(port, '/api/deep-qualify', { query: 'rørlegger i Kristiansand', lead: response.body.leadPacks[0], enrichCompanyProfile: true })
  assert(deepResponse.status === 200, 'selected lead deep qualification should complete')
  assert(deepQualifierArgs.lead.company.displayName === 'Kristiansand Rør AS', 'deep qualification should receive the selected lead only')
  assert(deepQualifierArgs.enrichCompanyProfile === true, 'deep qualification should preserve company profile option')
  assert(deepResponse.body.leadPack.callPriority === 'high', 'deep qualification should return one updated lead pack')
  assert(deepResponse.body.leadPack.meta.mode === 'deep', 'deep qualification should mark selected lead as deep')
  assert(deepResponse.body.leadPack.osint && deepResponse.body.leadPack.osint.summary.evidenceCount >= 1, 'deep qualification should attach OSINT evidence to selected lead')
  assert(deepResponse.body.leadPack.enrichmentModules.some((module) => module.id === 'osint_public_evidence'), 'deep qualification should expose OSINT as an enrichment module')

  const missingWebsite = await post(port, '/api/deep-qualify', { lead: { company: { displayName: 'No Site AS' }, contact: {} } })
  assert(missingWebsite.status === 200, 'deep enrichment should not reject leads without website')

  const noWebsiteServer = createServer({ runsDir: path.join(root, 'runs-no-website') })
  await listen(noWebsiteServer)
  const noWebsiteDeep = await post(noWebsiteServer.address().port, '/api/deep-qualify', {
    lead: {
      company: { displayName: 'No Site AS' },
      contact: { phone: '40000000', city: 'Oslo' },
      website: { auditStatus: 'skipped_fast_mode' },
      meta: { mode: 'fast', sourceRun: 'fixture' },
    },
    enrichCompanyProfile: false,
  })
  assert(noWebsiteDeep.status === 200, 'default deep enrichment should handle selected leads without website')
  assert(noWebsiteDeep.body.leadPack.enrichmentStatus === 'deep_enriched', 'default deep enrichment should attach enrichment status')
  assert(noWebsiteDeep.body.leadPack.enrichmentModules.some((module) => module.id === 'digital_presence' && module.status === 'skipped_no_website'), 'digital presence module should be skipped when no website exists')
  assert(noWebsiteDeep.body.leadPack.osint && noWebsiteDeep.body.leadPack.osint.riskVerify.length >= 1, 'OSINT should still run when the selected lead has no website')

  const failing = createServer({ runner: async () => { throw new Error('provider unavailable') }, runsDir: path.join(root, 'runs-fail') })
  await listen(failing)
  const failResponse = await post(failing.address().port, '/api/runs', { query: 'advokater i Gol', provider: 'google-places' })
  assert(failResponse.status === 500, 'failed run should return user-friendly error')
  assert(failResponse.body.error.includes('provider unavailable'), 'failed run should expose friendly error')

  const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8')
  const uiText = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8') + appJs
  const lower = uiText.toLowerCase()
  assert(!lower.includes('call opener'), 'UI must not include call openers')
  assert(!lower.includes('ready-to-send'), 'UI must not include ready-to-send text')
  assert(!lower.includes('suggested wording'), 'UI must not include suggested wording')
  assert(!lower.includes('demo-fixture'), 'UI should not expose demo fixture as the seller workflow')
  assert(lower.includes('leadsort'), 'UI should include lead sorting control')
  assert(lower.includes('lead-filter'), 'UI should include lead filters')
  assert(lower.includes('lead-name-line'), 'Selected lead header should align company name and phone')
  assert(lower.includes('instant-lead-view'), 'Selected lead should put critical call info in an instant top view')
  assert(lower.includes('instant-decision-grid'), 'Selected lead should show top decision facts immediately')
  assert(appJs.indexOf('sellerDeskCards(lead, command, { includeDetails: false })') > appJs.indexOf('instant-lead-main'), 'Contact/company/proof cards should sit directly under the selected lead header')
  assert(appJs.indexOf('sellerDeskCards(lead, command, { includeDetails: false })') < appJs.indexOf('instant-decision-grid'), 'Contact/company/proof cards should appear before lower-priority decision cards')
  assert(lower.includes('title-phone'), 'Selected lead header should show primary phone near the company name')
  assert(lower.includes('nextleadbutton'), 'Selected lead header should include a next-lead button')
  assert(lower.includes('selectnextvisiblelead'), 'Next lead button should advance through the visible lead list')
  assert(lower.includes('phone first'), 'UI should support phone-first sorting')
  assert(lower.includes('confirmed org.nr'), 'UI should support confirmed org number filtering/sorting')
  assert(lower.includes('needs enrichment'), 'UI should support needs-enrichment filtering')
  assert(lower.includes('clear filters'), 'UI should allow clearing filters')
  assert(lower.includes('professionselect') && lower.includes('hidden'), 'UI should keep profession data hidden from the main seller search')
  assert(lower.includes('locationinput') && lower.includes('type="hidden"'), 'UI should not force a visible location field for free-text search')
  assert(lower.includes('ålesund'), 'UI should include Norway location autocomplete options')
  assert(lower.includes('fysioterapeut'), 'UI should include supported profession options')
  assert(lower.includes('value="balanced"'), 'UI should default to balanced Brreg + Google provider')
  assert(lower.includes('id="maxresults" type="hidden" value="25"'), 'UI should hide max results and use the broad safe cap automatically')
  assert(!lower.includes('<span>max</span><select'), 'UI should not expose max results as a seller-facing dropdown')
  assert(lower.includes('id="companyprofile" type="hidden" value="true"'), 'UI should make Brreg automatic without a seller checkbox')
  assert(lower.includes('<span>område</span><select id="searchscope"'), 'UI should label search scope as a geography control')
  assert(lower.includes('hele norge') && lower.includes('kun sted i søket') && lower.includes('nærområde'), 'UI should use human-readable geography scope labels')
  assert(lower.includes('id="runmode" type="hidden" value="fast"'), 'UI should hide global mode and default searches to fast scan')
  assert(!lower.includes('<span>mode</span><select'), 'UI should not expose global Fast/Deep mode in the top search')
  assert(lower.includes('fast scan'), 'Fast mode UI should show fast scan state')
  assert(lower.includes('need more context?'), 'Fast leads should show optional enrichment state')
  assert(lower.includes('enrich lead'), 'Fast leads should expose selected-lead enrichment action')
  assert(lower.includes('/api/deep-qualify'), 'UI should call selected-lead deep qualification endpoint')
  assert(lower.includes('enrichment modules'), 'UI should expose Deep enrichment module panel')
  assert(lower.includes('digital presence check'), 'Deep enrichment should show digital presence module')
  assert(lower.includes('brreg verification'), 'Deep enrichment should show Brreg verification module')
  assert(lower.includes('economy / proff'), 'Deep enrichment should show economy/Proff module status')
  assert(lower.includes('social/source signals'), 'Deep enrichment should show social/source module status')
  assert(lower.includes('decision makers'), 'Deep enrichment should show decision maker module status')
  assert(lower.includes('recent activity'), 'Deep enrichment should show recent activity module status')
  assert(lower.includes('seller fit summary'), 'Deep enrichment should show seller fit module status')
  assert(lower.includes('osint public evidence'), 'Deep enrichment should show OSINT public evidence module status')
  assert(lower.includes('osintpanel'), 'UI should render a selected-lead OSINT evidence panel')
  assert(lower.includes('osintexportcell'), 'Export preview should include OSINT summary cells')
  assert(lower.includes('state.result.leadpacks[state.selectedindex]'), 'UI should replace only the selected lead after Deep')
  assert(lower.includes('getvisibleleads'), 'UI should derive visible leads from filters and sorting')
  assert(lower.includes('matchesleadfilters'), 'UI should filter leads client-side')
  assert(lower.includes('compareleads'), 'UI should sort leads client-side')
  assert(lower.includes('fast scan finds candidates'), 'Fast scan guidance should explain candidate scanning')
  assert(lower.includes('selected lead enrichment'), 'Deep enrich guidance should explain enrichment modules')
  assert(lower.includes('call brief'), 'UI should expose a neutral call brief section')
  assert(lower.includes('contactability and company context decide sales usability'), 'UI should define generic sales usability separately from website pain')
  assert(lower.includes('fit'), 'UI should expose general seller fit')
  assert(lower.includes('digital presence'), 'UI should separate digital presence from generic seller fit')
  assert(lower.includes('best first contact'), 'UI should expose best first contact')
  assert(lower.includes('company fit'), 'UI should expose company fit')
  assert(lower.includes('verification'), 'UI should expose verification status')
  assert(lower.includes('main risk'), 'UI should expose main risk')
  assert(lower.includes('next action'), 'UI should expose next action')
  assert(lower.includes('source confidence'), 'UI should expose source confidence')
  assert(lower.includes('identity pending'), 'UI should avoid making temporary Brreg failure the lead headline')
  assert(lower.includes('brreg unavailable'), 'UI should expose Brreg unavailable as source status')
  assert(lower.includes('source gap, not a weak lead signal'), 'UI should frame Brreg outages as source gaps')
  assert(lower.includes('brreg returned no confirmed identity'), 'UI should explain no-match identity state')
  assert(lower.includes('websitevalue'), 'UI should normalize website values before rendering')
  assert(lower.includes('seller context'), 'UI should expose seller context section')
  assert(lower.includes('seller-desk-v2'), 'UI should include seller desk V2 cards')
  assert(lower.includes('business type'), 'Call brief should expose business type')
  assert(lower.includes('proof & checks'), 'UI should combine proof and verification into a decision card')
  assert(lower.includes('company identity'), 'UI should expose company identity context')
  assert(lower.includes('contactability'), 'UI should expose contactability context')
  assert(lower.includes('market proof'), 'UI should keep market proof in details')
  assert(lower.includes('qualification'), 'UI should expose qualification card')
  assert(lower.includes('sales signals'), 'UI should expose sales signals card')
  assert(lower.includes('risk / verify'), 'UI should expose risk/verify card')
  assert(lower.includes('weak digital angle'), 'UI should explain low digital priority as a weak digital angle, not a bad business lead')
  assert(lower.includes('do not treat low digital signal as a bad business lead'), 'UI should prevent low digital signal from disqualifying generic sales leads')
  assert(lower.includes('qualification and verification details'), 'UI should collapse secondary qualification details')
  assert(lower.includes('export state'), 'UI should expose export readiness state')
  assert(lower.includes('why inspect?'), 'UI should collapse supporting reasons behind a seller-focused details row')
  assert(lower.includes('sources'), 'UI should include collapsible source intelligence')
  assert(lower.includes('raw data'), 'UI should include collapsible raw lead data')
  assert(lower.includes('unverified'), 'UI should mark Fast mode websites as unverified')
  assert(lower.includes('source-grid'), 'UI should include source intelligence cards')
  assert(lower.includes('discovery quality'), 'UI should expose discovery quality source card')
  assert(lower.includes('discovery confidence'), 'UI should expose discovery confidence')
  assert(lower.includes('brreg firmaprofil'), 'UI should expose Brreg firmaprofil panel')
  assert(lower.includes('confirmed org.nr'), 'UI should expose confirmed org number field')
  assert(lower.includes('candidate org.nr'), 'UI should expose candidate org number field')
  assert(lower.includes('candidate legal name'), 'UI should expose candidate legal name field')
  assert(lower.includes('registered address'), 'UI should expose registered address field')
  assert(lower.includes('nace'), 'UI should expose NACE field')
  assert(lower.includes('employees'), 'UI should expose employees field')
  assert(lower.includes('brreg candidates'), 'UI should expose Brreg candidate list')
  assert(lower.includes('source strategy'), 'UI should expose identity/presence source strategy')
  assert(lower.includes('identity source'), 'UI should expose identity source')
  assert(lower.includes('presence source'), 'UI should expose presence source')
  assert(lower.includes('presence-first fallback'), 'UI should explain fallback when Brreg is unavailable')
  assert(lower.includes('confirmed_org'), 'UI should support confirmed org badge')
  assert(lower.includes('candidate_org'), 'UI should support candidate org badge')
  assert(lower.includes('lead notes'), 'UI should include the lead notes panel')
  assert(lower.includes('save note'), 'UI should allow saving lead notes')
  assert(lower.includes('data-save-note'), 'Save note should have a direct click handler')
  assert(lower.includes('apifetch'), 'UI should route API calls through beta-aware fetch')
  assert(lower.includes('x-beta-token'), 'UI should send beta access token to hosted API')
  assert(lower.includes('withbetatoken'), 'Download links should preserve beta access token')
  assert(lower.includes('saving note...'), 'Save note should show inline saving feedback')
  assert(lower.includes('could not save - local server is not running'), 'Save note should explain backend/server failures inline')
  assert(lower.includes('/api/workflow'), 'UI should save workflow through the workflow API')
  assert(lower.includes('follow-up date'), 'UI should track follow-up date')
  assert(lower.includes('contacted'), 'UI should track contacted state')
  assert(lower.includes('workflowboard'), 'UI should include workflow queue board')
  assert(lower.includes('work-queue-tabs'), 'UI should expose explicit seller work queue tabs')
  assert(lower.includes('data-work-queue'), 'UI should switch queues through data-work-queue buttons')
  assert(lower.includes('ring nå') && lower.includes('ingen svar') && lower.includes('oppfølging i dag') && lower.includes('må verifiseres'), 'UI should show Norwegian seller queue labels')
  assert(lower.includes('follow-up due'), 'UI should filter follow-up due leads')
  assert(lower.includes('notcontacted'), 'UI should filter not-contacted leads')
  assert(lower.includes('current-call'), 'UI should summarize one current queue lead')
  assert(lower.includes('followupsortscore'), 'UI should sort by follow-up due')
  assert(lower.includes('call now'), 'UI should expose click-to-call tel action')
  assert(lower.includes('tel:'), 'UI should render phone numbers as tel links')
  assert(lower.includes('logged activity'), 'UI should show visible local activity log')
  assert(lower.includes('textarea name="notes"'), 'Workflow notes should use a multi-line editable field')
  assert(lower.includes('cleanworkflownote'), 'Workflow notes should hide old quick-action noise from visible notes')
  assert(lower.includes('call-list.csv'), 'UI should include call-list CSV export links')
  assert(lower.includes('workflowqueue'), 'UI/export should expose workflowQueue')
  assert(lower.includes('leadworkqueue'), 'UI should calculate explicit work queues')
  assert(lower.includes('workqueuecounts'), 'UI should update queue counts')
  assert(lower.includes('not contacted yet'), 'UI should explain why new phone leads are in the queue')
  assert(lower.includes('follow-up due'), 'UI should include follow-up due leads in the queue')
  assert(lower.includes('inspect'), 'UI should allow inspecting a queued lead')
  assert(lower.includes('lastactivityat'), 'CSV should expose last activity timestamp')
  assert(lower.includes('quick_workflow_actions'), 'UI should define quick workflow actions')
  assert(lower.includes('mark called'), 'UI should include Mark called quick action')
  assert(lower.includes('no answer'), 'UI should include No answer quick action')
  assert(lower.includes('interested'), 'UI should include Interested quick action')
  assert(lower.includes('not relevant'), 'UI should include Not relevant quick action')
  assert(lower.includes('follow up tomorrow'), 'UI should include tomorrow follow-up quick action')
  assert(lower.includes('follow up next week'), 'UI should include next-week follow-up quick action')
  assert(lower.includes('data-workflow-action'), 'UI should wire quick workflow buttons through data attributes')
  assert(lower.includes('data-archive-lead'), 'UI should include an archive action')
  assert(lower.includes('workflowqueueoptions'), 'UI should allow manual Move to queue control')
  assert(lower.includes('buildquickworkflow'), 'UI should build quick workflow payloads locally')
  assert(lower.includes('applyworkflowquickactiondraft'), 'Detail quick actions should update a draft instead of saving immediately')
  assert(lower.includes('draft only - click save note to log it'), 'Detail quick actions should explain that Save note is required')
  assert(lower.includes('/api/latest-run'), 'UI should auto-load the latest local run on startup')
  assert(lower.includes('loadlatestrun'), 'UI should define latest-run restore logic')
  assert(lower.includes('arbeidskøer'), 'UI should expose seller work queues as the main lead-list panel')
  assert(lower.includes('find leads · call · log outcome · follow up'), 'Header should use simple seller workflow copy')
  assert(lower.includes('søk fritt i hele norge'), 'Search hint should explain broad free-text search')
  assert(lower.includes('hva selger du?'), 'UI should expose seller intent selector')
  assert(lower.includes('general_b2b') && lower.includes('web_it') && lower.includes('telecom'), 'UI should include seller intent options')
  assert(lower.includes('sellerintent'), 'UI should send sellerIntent through requests')
  assert(lower.includes('seller fit'), 'UI should expose seller fit output')
  assert(lower.includes('virksomhet.brreg.no/nb/oppslag/enheter'), 'UI should link visible Brreg identity to public Brønnøysund lookup')
  assert(lower.includes('åpne i brønnøysund'), 'UI should label public Brønnøysund links for sellers')
  assert(lower.includes('data-query-example="escape room"'), 'UI should offer clickable free-text query examples')
  assert(lower.includes('searchsuggestions'), 'UI should expose autocomplete suggestions without separate required fields')
  assert(lower.includes('compactrunstatus'), 'Summary should use compact run status instead of noisy operational metrics')
  assert(lower.includes('call notes and follow-up'), 'Selected lead should show a clear note and follow-up procedure')
  assert(lower.includes('choose outcome, write a short note, set follow-up, then save'), 'Lead notes should explain the seller note-taking procedure')
  assert(lower.includes('what happened? who did you speak with? what should happen next?'), 'Lead notes should prompt for useful call-note content')
  assert(lower.includes('saved markets'), 'UI should expose saved searches as saved markets')
  assert(lower.includes('return to useful searches'), 'Saved searches should use seller-facing language')
  assert(lower.includes('leads with notes'), 'Saved market summary should count noted leads without technical workspace copy')
  assert(!lower.includes('works without proff'), 'Main app should not show technical Proff-readiness copy')
  assert(!lower.includes('google cost guard'), 'Main app should not show technical Google cost-guard copy')
  assert(!lower.includes('workspace data'), 'Main app should not show internal workspace data copy')
  assert(lower.includes('data-saved-search'), 'UI should allow loading a saved search into the search box')
  assert(lower.includes('renderreadiness'), 'UI should render saved workspace state from the backend')
  assert(lower.includes('data-workspace-export'), 'UI should expose workspace export action')
  assert(lower.includes('exportworkspacesnapshot'), 'UI should implement workspace snapshot download')
  assert(lower.includes('callreadiness'), 'UI should compute a shared call readiness state')
  assert(lower.includes('call-focus-strip'), 'Selected lead should include a compact call focus strip')
  assert(lower.includes('ready to call'), 'UI should expose Ready to call state')
  assert(lower.includes('verify first'), 'UI should expose Verify first state')
  assert(lower.includes('needs contact'), 'UI should expose Needs contact state')
  assert(lower.includes('saved-search-rerun'), 'Saved searches should support one-click rerun')
  assert(lower.includes('saved-search-management'), 'UI should show saved search management list')
  assert(lower.includes('data-saved-search-pin'), 'UI should support pinning saved searches')
  assert(lower.includes('data-saved-search-label'), 'UI should support renaming saved searches')
  assert(lower.includes('/api/saved-searches'), 'UI should persist saved search metadata')
  assert(lower.includes('phone-ready'), 'Saved searches should show phone-ready counts')
  assert(lower.includes('slice(0, 8)'), 'Activity timeline should show up to eight recent entries')
  assert(lower.includes('detail-tools'), 'Lead detail should group lower utility panels into compact detail tools')
  assert(lower.includes('why inspect?'), 'Lead detail should use compact inspect rationale label')
  assert(lower.includes('data-queue-preset'), 'UI should expose call queue preset buttons')
  assert(lower.includes('filter / sort lead list'), 'Advanced lead filters should be collapsed behind a filter/sort control')
  assert(lower.includes('call queue first'), 'UI should support call-queue-first sorting')
  assert(lower.includes('seller fit first'), 'UI should support seller-fit-first sorting')
  assert(lower.includes('applyqueuepreset'), 'UI should apply queue preset filters locally')
  assert(lower.includes('callqueuesortscore'), 'UI should score leads for the seller call queue')
  assert(lower.includes('sellerfitsortscore'), 'UI should use seller fit when ranking the call queue')
  assert(lower.includes('sellerrecommendedaction'), 'UI should use seller recommended action in queue labels')
  assert(lower.includes('sellerfitbadge'), 'UI should expose seller-fit badges')
  assert(lower.includes('leadqueueactionlabel'), 'UI should compute next queue action per lead')
  assert(lower.includes('needs verification'), 'UI should include a verification queue preset')
  assert(lower.includes('follow-ups'), 'UI should include a follow-up queue preset')
  assert(lower.includes('queue-action'), 'Lead cards should show a next queue action')
  assert(lower.includes('current-call-board'), 'UI should render one current queue item instead of a dense board')
  assert(lower.includes('workqueuelabel'), 'Workflow board should label the selected work queue')
  assert(lower.includes('tomorrow'), 'Queue quick actions should include a compact tomorrow follow-up')
  assert(lower.includes('next week'), 'Queue quick actions should include a compact next-week follow-up')
  assert(lower.includes('followuptiming'), 'UI should classify follow-ups as overdue, today or future')
  assert(lower.includes('overdue:'), 'UI should label overdue follow-ups')
  assert(lower.includes('due today:'), 'UI should label follow-ups due today')
  assert(lower.includes('future follow-up:'), 'UI should label future follow-ups')
  assert(lower.includes('focusleaddetail'), 'UI should focus lead detail when the current call is inspected')
  assert(lower.includes('selectnextqueuelead'), 'Queue quick actions should support advancing to the next call-ready lead')
  assert(lower.includes('advancequeue'), 'Queue quick actions should track whether auto-advance is needed')

  server.close()
  noWebsiteServer.close()
  failing.close()
  fs.rmSync(root, { recursive: true, force: true })
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
}
function post(port, pathname, body) {
  return request(port, pathname, 'POST', JSON.stringify(body), { 'content-type': 'application/json' })
}
function get(port, pathname) {
  return request(port, pathname, 'GET')
}
function request(port, pathname, method, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: pathname, method, headers }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const type = res.headers['content-type'] || ''
        resolve({ status: res.statusCode, body: type.includes('application/json') ? JSON.parse(data || '{}') : data })
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}
function assert(condition, message) { if (!condition) throw new Error(message) }

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error)
  process.exitCode = 1
})
