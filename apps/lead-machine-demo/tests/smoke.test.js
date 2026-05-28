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

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-machine-demo-'))
  let runnerArgs = null
  const runner = async (args) => {
    runnerArgs = args
    const leadPackOutputPath = path.join(args.outputDir, 'lead-packs')
    fs.mkdirSync(leadPackOutputPath, { recursive: true })
    const leadPacks = [{
      rank: 1,
      callPriority: 'medium',
      leadClass: 'service_line_optimization',
      opportunityType: 'high_value_service_conversion',
      company: { displayName: 'Kristiansand Rør AS', matchStatus: 'not_run' },
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

  const server = createServer({ runner, runsDir: path.join(root, 'runs') })
  await listen(server)
  const port = server.address().port

  let response = await post(port, '/api/runs', { query: '' })
  assert(response.status === 400, 'missing query should return validation error')

  response = await post(port, '/api/runs', { query: 'Kristiansand rørlegger', maxResults: 5, searchScope: 'strict', enrichCompanyProfile: false })
  assert(response.status === 200, 'default demo fixture should complete without a live API key')
  assert(response.body.summary.provider === 'demo-fixture', 'default provider should be demo-fixture')
  assert(response.body.leadPacks.length >= 1, 'demo fixture should return lead packs')
  assert(response.body.downloads.csv.includes('/api/runs/'), 'demo fixture should return CSV download path')
  const fixtureCsv = await get(port, response.body.downloads.csv)
  assert(fixtureCsv.status === 200 && fixtureCsv.body.includes('Kristiansand Rør AS'), 'fixture CSV download should return generated CSV')

  response = await post(port, '/api/runs', { query: 'rørlegger i Kristiansand; rm -rf /', provider: 'google-places', maxResults: 5, searchScope: 'strict', enrichCompanyProfile: false })
  assert(response.status === 200, 'explicit live provider should still call runner')
  assert(runnerArgs.query === 'rørlegger i Kristiansand; rm -rf /', 'query should be passed as data, not shell command')
  assert(!('shellCommand' in runnerArgs), 'backend should not construct shell command')
  assert(response.body.leadPacks.length === 1, 'completed run should return lead packs')
  assert(response.body.downloads.csv.includes('/api/runs/'), 'completed run should return CSV download path')

  const csv = await get(port, response.body.downloads.csv)
  assert(csv.status === 200 && csv.body.includes('Kristiansand Rør AS'), 'CSV download should return generated CSV')

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
  assert(lower.includes('demo-fixture'), 'UI should expose a no-key demo fixture provider')

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
