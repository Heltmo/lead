const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { createServer } = require('../server')
const { parseLeadQuery } = require('../queryParser')

async function main() {
  assert(parseLeadQuery('Kristiansand rørlegger').normalizedQuery === 'rørlegger i Kristiansand', 'location-first query should parse')
  assert(parseLeadQuery('rørlegger Kristiansand').normalizedQuery === 'rørlegger i Kristiansand', 'vertical-first query should parse')
  assert(parseLeadQuery('rørleggere i Kristiansand').normalizedQuery === 'rørlegger i Kristiansand', 'i-pattern query should parse')
  assert(parseLeadQuery('advokater i Gol').normalizedQuery === 'advokat i Gol', 'lawyer query should parse')
  assert(parseLeadQuery('Gol advokat').normalizedQuery === 'advokat i Gol', 'Gol advokat should parse')
  assert(parseLeadQuery('Ålesund fysioterapeuter').normalizedQuery === 'fysioterapeut i Ålesund', 'Ålesund fysioterapeuter should parse')
  assert(parseLeadQuery('bilverksted i Bergen').normalizedQuery === 'bilverksted i Bergen', 'bilverksted should parse')
  assert(parseLeadQuery('frisør Tromsø').normalizedQuery === 'frisør i Tromsø', 'frisør should parse')
  assert(parseLeadQuery('eiendomsmeglere i Oslo').normalizedQuery === 'eiendomsmegler i Oslo', 'eiendomsmegler should parse')

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
        enrichmentModules: [{ id: 'website_audit', name: 'Website audit', status: 'completed', summary: 'Website audit completed for selected lead.' }],
        callPriority: 'high',
        leadClass: 'technical_redesign',
        opportunityType: 'technical_trust_risk',
        website: { auditStatus: 'completed', topEvidence: ['Selected lead audit completed'], contactability: 'strong' },
        ranking: { whyRanked: ['Deep qualified selected lead'], caution: ['Verify findings'], painScore: 0.9, buyingLikelihood: 0.8, salesEase: 'medium' },
        meta: { ...(args.lead.meta || {}), mode: 'deep' },
      },
    }
  }

  const server = createServer({ runner, deepQualifier, runsDir: path.join(root, 'runs'), workflowPath: path.join(root, 'workflow.json') })
  await listen(server)
  const port = server.address().port

  let response = await post(port, '/api/runs', { query: '' })
  assert(response.status === 400, 'missing query should return validation error')

  response = await post(port, '/api/runs', { query: 'Kristiansand rørlegger', provider: 'demo-fixture', maxResults: 5, searchScope: 'strict', enrichCompanyProfile: false })
  assert(response.status === 200, 'default demo fixture should complete without a live API key')
  assert(response.body.summary.provider === 'demo-fixture', 'explicit fixture provider should remain available for tests')
  assert(response.body.leadPacks.length >= 1, 'demo fixture should return lead packs')
  assert(response.body.downloads.csv.includes('/api/runs/'), 'demo fixture should return CSV download path')
  const fixtureCsv = await get(port, response.body.downloads.csv)
  assert(fixtureCsv.status === 200 && fixtureCsv.body.includes('Kristiansand Rør AS'), 'fixture CSV download should return generated CSV')

  response = await post(port, '/api/runs', { query: 'rørlegger i Kristiansand; rm -rf /', provider: 'google-places', searchScope: 'strict', enrichCompanyProfile: false })
  assert(response.status === 200, 'explicit live provider should still call runner')
  assert(runnerArgs.query === 'rørlegger i Kristiansand; rm -rf /', 'query should be passed as data, not shell command')
  assert(runnerArgs.mode === 'fast', 'demo should pass fast mode by default')
  assert(runnerArgs.maxResults === 25, 'demo should use broad automatic max results when none is supplied')
  assert(!('shellCommand' in runnerArgs), 'backend should not construct shell command')
  assert(response.body.leadPacks.length === 1, 'completed run should return lead packs')
  assert(response.body.downloads.csv.includes('/api/runs/'), 'completed run should return CSV download path')

  const csv = await get(port, response.body.downloads.csv)
  assert(csv.status === 200 && csv.body.includes('Kristiansand Rør AS'), 'CSV download should return generated CSV')

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
  assert(Array.isArray(savedWorkflow.body.workflow.activities) && savedWorkflow.body.workflow.activities.length === 1, 'workflow save should append an activity timeline entry')
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
    notes: 'Quick action: no answer.',
    outcome: 'pending',
  })
  assert(quickWorkflow.status === 200, 'quick workflow-style save should succeed')
  assert(quickWorkflow.body.workflow.status === 'follow_up', 'quick workflow action should update status')
  assert(quickWorkflow.body.workflow.response === 'no_answer', 'quick workflow action should update response')
  assert(quickWorkflow.body.workflow.activities.length >= 2, 'quick workflow action should append activity timeline entry')
  const workflowCsv = await get(port, response.body.downloads.csv)
  assert(workflowCsv.body.includes('workflowStatus'), 'CSV should include workflow status column')
  assert(workflowCsv.body.includes('lastActivityAt'), 'CSV should include last activity timestamp column')
  assert(workflowCsv.body.includes('call again'), 'CSV should include workflow next action from quick action')
  const callListCsv = await get(port, response.body.downloads.callListNotContacted)
  assert(callListCsv.status === 200 && callListCsv.body.includes('rank,company'), 'call-list export should return a CSV')
  const todayCallListCsv = await get(port, response.body.downloads.callListToday)
  assert(todayCallListCsv.status === 200 && todayCallListCsv.body.includes('rank,company'), 'today call queue export should return a CSV')
  response = await post(port, '/api/runs', { query: 'rørlegger i Kristiansand; rm -rf /', provider: 'google-places', searchScope: 'strict', enrichCompanyProfile: false })
  assert(response.body.leadPacks[0].workflow.status === 'follow_up', 'workflow quick action should attach to later returned lead packs')

  const deepResponse = await post(port, '/api/deep-qualify', { query: 'rørlegger i Kristiansand', lead: response.body.leadPacks[0], enrichCompanyProfile: true })
  assert(deepResponse.status === 200, 'selected lead deep qualification should complete')
  assert(deepQualifierArgs.lead.company.displayName === 'Kristiansand Rør AS', 'deep qualification should receive the selected lead only')
  assert(deepQualifierArgs.enrichCompanyProfile === true, 'deep qualification should preserve company profile option')
  assert(deepResponse.body.leadPack.callPriority === 'high', 'deep qualification should return one updated lead pack')
  assert(deepResponse.body.leadPack.meta.mode === 'deep', 'deep qualification should mark selected lead as deep')

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
  assert(noWebsiteDeep.body.leadPack.enrichmentModules.some((module) => module.id === 'website_audit' && module.status === 'skipped_no_website'), 'website audit module should be skipped when no website exists')

  const failing = createServer({ runner: async () => { throw new Error('provider unavailable') }, runsDir: path.join(root, 'runs-fail') })
  await listen(failing)
  const failResponse = await post(failing.address().port, '/api/runs', { query: 'advokater i Gol', provider: 'google-places' })
  assert(failResponse.status === 500, 'failed run should return user-friendly error')
  assert(failResponse.body.error.includes('provider unavailable'), 'failed run should expose friendly error')

  const uiText = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8') + fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8')
  const lower = uiText.toLowerCase()
  assert(!lower.includes('call opener'), 'UI must not include call openers')
  assert(!lower.includes('ready-to-send'), 'UI must not include ready-to-send text')
  assert(!lower.includes('suggested wording'), 'UI must not include suggested wording')
  assert(!lower.includes('demo-fixture'), 'UI should not expose demo fixture as the seller workflow')
  assert(lower.includes('leadsort'), 'UI should include lead sorting control')
  assert(lower.includes('lead-filter'), 'UI should include lead filters')
  assert(lower.includes('phone first'), 'UI should support phone-first sorting')
  assert(lower.includes('confirmed org.nr'), 'UI should support confirmed org number filtering/sorting')
  assert(lower.includes('needs enrichment'), 'UI should support needs-enrichment filtering')
  assert(lower.includes('clear filters'), 'UI should allow clearing filters')
  assert(lower.includes('professionselect'), 'UI should include structured profession selector')
  assert(lower.includes('locationinput'), 'UI should include structured location input')
  assert(lower.includes('ålesund'), 'UI should include Norway location autocomplete options')
  assert(lower.includes('fysioterapeut'), 'UI should include supported profession options')
  assert(lower.includes('value="balanced"'), 'UI should default to balanced Brreg + Google provider')
  assert(lower.includes('id="maxresults" type="hidden" value="25"'), 'UI should hide max results and use the broad safe cap automatically')
  assert(!lower.includes('<span>max</span><select'), 'UI should not expose max results as a seller-facing dropdown')
  assert(lower.includes('id="companyprofile" type="hidden" value="true"'), 'UI should make Brreg automatic without a seller checkbox')
  assert(lower.includes('runmode'), 'UI should include fast/deep mode selector')
  assert(lower.includes('audit skipped'), 'Fast mode UI should show audit skipped state')
  assert(lower.includes('enrichment optional'), 'Fast leads should show optional enrichment state')
  assert(lower.includes('enrich selected lead'), 'Fast leads should expose selected-lead enrichment action')
  assert(lower.includes('/api/deep-qualify'), 'UI should call selected-lead deep qualification endpoint')
  assert(lower.includes('deep enrichment modules'), 'UI should expose Deep enrichment module panel')
  assert(lower.includes('website audit'), 'Deep enrichment should show website audit module')
  assert(lower.includes('brreg verification'), 'Deep enrichment should show Brreg verification module')
  assert(lower.includes('economy / proff'), 'Deep enrichment should show economy/Proff module status')
  assert(lower.includes('social/source signals'), 'Deep enrichment should show social/source module status')
  assert(lower.includes('decision makers'), 'Deep enrichment should show decision maker module status')
  assert(lower.includes('recent activity'), 'Deep enrichment should show recent activity module status')
  assert(lower.includes('seller leverage summary'), 'Deep enrichment should show seller leverage module status')
  assert(lower.includes('state.result.leadpacks[state.selectedindex]'), 'UI should replace only the selected lead after Deep')
  assert(lower.includes('getvisibleleads'), 'UI should derive visible leads from filters and sorting')
  assert(lower.includes('matchesleadfilters'), 'UI should filter leads client-side')
  assert(lower.includes('compareleads'), 'UI should sort leads client-side')
  assert(lower.includes('fast scan finds candidates'), 'Fast scan guidance should explain candidate scanning')
  assert(lower.includes('deep enrich adds modules'), 'Deep enrich guidance should explain enrichment modules')
  assert(lower.includes('seller command'), 'UI should expose seller command section')
  assert(lower.includes('contactability and company context decide sales usability'), 'UI should define generic sales usability separately from website pain')
  assert(lower.includes('seller readiness'), 'UI should expose general seller readiness')
  assert(lower.includes('website opportunity'), 'UI should separate website opportunity from seller readiness')
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
  assert(lower.includes('seller leverage'), 'UI should expose seller leverage section')
  assert(lower.includes('seller-desk-v2'), 'UI should include seller desk V2 cards')
  assert(lower.includes('company identity'), 'UI should expose company identity card')
  assert(lower.includes('contactability'), 'UI should expose contactability card')
  assert(lower.includes('market proof'), 'UI should expose market proof card')
  assert(lower.includes('qualification'), 'UI should expose qualification card')
  assert(lower.includes('action and risk'), 'UI should expose action and risk card')
  assert(lower.includes('weak website angle'), 'UI should explain low website priority as a weak website angle, not a bad business lead')
  assert(lower.includes('do not treat low website opportunity as a bad business lead'), 'UI should prevent low website opportunity from disqualifying generic sales leads')
  assert(lower.includes('qualification and verification details'), 'UI should collapse secondary qualification details')
  assert(lower.includes('verification and caution'), 'UI should expose verification and caution details')
  assert(lower.includes('export state'), 'UI should expose export readiness state')
  assert(lower.includes('why this lead is interesting'), 'UI should collapse supporting reasons behind a details row')
  assert(lower.includes('source intelligence'), 'UI should include collapsible source intelligence')
  assert(lower.includes('raw lead data'), 'UI should include collapsible raw lead data')
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
  assert(lower.includes('seller workflow'), 'UI should include seller workflow panel')
  assert(lower.includes('save workflow'), 'UI should allow saving workflow state')
  assert(lower.includes('/api/workflow'), 'UI should save workflow through the workflow API')
  assert(lower.includes('follow-up date'), 'UI should track follow-up date')
  assert(lower.includes('contacted'), 'UI should track contacted state')
  assert(lower.includes('workflowboard'), 'UI should include workflow queue board')
  assert(lower.includes('follow-up due'), 'UI should filter follow-up due leads')
  assert(lower.includes('notcontacted'), 'UI should filter not-contacted leads')
  assert(lower.includes('seller queue'), 'UI should summarize seller queue')
  assert(lower.includes('followupsortscore'), 'UI should sort by follow-up due')
  assert(lower.includes('call now'), 'UI should expose click-to-call tel action')
  assert(lower.includes('tel:'), 'UI should render phone numbers as tel links')
  assert(lower.includes('activity timeline'), 'UI should show local activity timeline')
  assert(lower.includes('call-list.csv'), 'UI should include call-list CSV export links')
  assert(lower.includes('today call queue'), 'UI should expose a today call queue')
  assert(lower.includes('todaycallqueue'), 'UI should calculate today call queue leads')
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
  assert(lower.includes('buildquickworkflow'), 'UI should build quick workflow payloads locally')

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
