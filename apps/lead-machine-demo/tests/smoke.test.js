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
        callPriority: 'high',
        leadClass: 'technical_redesign',
        opportunityType: 'technical_trust_risk',
        website: { auditStatus: 'completed', topEvidence: ['Selected lead audit completed'], contactability: 'strong' },
        ranking: { whyRanked: ['Deep qualified selected lead'], caution: ['Verify findings'], painScore: 0.9, buyingLikelihood: 0.8, salesEase: 'medium' },
        meta: { ...(args.lead.meta || {}), mode: 'deep' },
      },
    }
  }

  const server = createServer({ runner, deepQualifier, runsDir: path.join(root, 'runs') })
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

  response = await post(port, '/api/runs', { query: 'rørlegger i Kristiansand; rm -rf /', provider: 'google-places', maxResults: 5, searchScope: 'strict', enrichCompanyProfile: false })
  assert(response.status === 200, 'explicit live provider should still call runner')
  assert(runnerArgs.query === 'rørlegger i Kristiansand; rm -rf /', 'query should be passed as data, not shell command')
  assert(runnerArgs.mode === 'fast', 'demo should pass fast mode by default')
  assert(!('shellCommand' in runnerArgs), 'backend should not construct shell command')
  assert(response.body.leadPacks.length === 1, 'completed run should return lead packs')
  assert(response.body.downloads.csv.includes('/api/runs/'), 'completed run should return CSV download path')

  const csv = await get(port, response.body.downloads.csv)
  assert(csv.status === 200 && csv.body.includes('Kristiansand Rør AS'), 'CSV download should return generated CSV')

  const deepResponse = await post(port, '/api/deep-qualify', { query: 'rørlegger i Kristiansand', lead: response.body.leadPacks[0], enrichCompanyProfile: true })
  assert(deepResponse.status === 200, 'selected lead deep qualification should complete')
  assert(deepQualifierArgs.lead.company.displayName === 'Kristiansand Rør AS', 'deep qualification should receive the selected lead only')
  assert(deepQualifierArgs.enrichCompanyProfile === true, 'deep qualification should preserve company profile option')
  assert(deepResponse.body.leadPack.callPriority === 'high', 'deep qualification should return one updated lead pack')
  assert(deepResponse.body.leadPack.meta.mode === 'deep', 'deep qualification should mark selected lead as deep')

  const missingWebsite = await post(port, '/api/deep-qualify', { lead: { company: { displayName: 'No Site AS' }, contact: {} } })
  assert(missingWebsite.status === 400, 'deep qualification should reject leads without website')

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
  assert(lower.includes('professionselect'), 'UI should include structured profession selector')
  assert(lower.includes('locationinput'), 'UI should include structured location input')
  assert(lower.includes('ålesund'), 'UI should include Norway location autocomplete options')
  assert(lower.includes('fysioterapeut'), 'UI should include supported profession options')
  assert(lower.includes('value="balanced"'), 'UI should default to balanced Brreg + Google provider')
  assert(lower.includes('id="companyprofile" type="hidden" value="true"'), 'UI should make Brreg automatic without a seller checkbox')
  assert(lower.includes('runmode'), 'UI should include fast/deep mode selector')
  assert(lower.includes('audit skipped'), 'Fast mode UI should show audit skipped state')
  assert(lower.includes('needs deep qualification'), 'Fast leads should show deep qualification need')
  assert(lower.includes('run deep qualification for this lead'), 'Fast leads should expose selected-lead deep qualification action')
  assert(lower.includes('/api/deep-qualify'), 'UI should call selected-lead deep qualification endpoint')
  assert(lower.includes('state.result.leadpacks[state.selectedindex]'), 'UI should replace only the selected lead after Deep')
  assert(lower.includes('fast mode finds candidates'), 'Fast mode guidance should explain candidate scanning')
  assert(lower.includes('deep mode qualifies leads'), 'Deep mode guidance should explain qualification')
  assert(lower.includes('seller command'), 'UI should expose seller command section')
  assert(lower.includes('call readiness'), 'UI should expose call readiness')
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

  server.close()
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
