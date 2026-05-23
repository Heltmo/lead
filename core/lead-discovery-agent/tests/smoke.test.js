const fs = require('fs')
const http = require('http')
const path = require('path')
const { spawnSync } = require('child_process')
const { discoverLocalBusinesses, writeDiscoveryOutputs } = require('../discoverLocalBusinesses')

async function main() {
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' })
    response.end('<title>Halden Tannklinikk</title>')
  })
  await listen(server)
  const port = server.address().port
  const root = path.join(__dirname, 'tmp')
  const jsonFixture = path.join(root, 'dentists-halden.sample.json')
  const csvFixture = path.join(root, 'dentists-halden.directory.csv')
  const txtFixture = path.join(root, 'dentists-halden.extra-urls.txt')
  const htmlFixture = path.join(root, 'dentists-halden.search-results.html')
  const out = path.join(root, 'lead-candidates.json')
  const summary = path.join(root, 'discovery-summary.json')
  const handoff = path.join(root, 'orchestrator-urls.txt')
  fs.rmSync(root, { recursive: true, force: true })
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(jsonFixture, JSON.stringify({
    results: [
      { businessName: 'Halden Tannklinikk', website: 'http://127.0.0.1:' + port, source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'high' },
      { businessName: 'Halden Tannklinikk Duplicate', website: 'http://127.0.0.1:' + port + '/about', source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'high' },
      { businessName: 'Unreachable Dental', website: 'http://localhost:1', source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'medium' },
      { businessName: 'Oslo Dental', website: 'https://oslo.example', source: 'sample-directory', location: 'Oslo', industry: 'dentists', confidence: 'low' },
    ],
  }, null, 2))
  fs.writeFileSync(csvFixture, [
    'businessName,website,source,location,industry,confidence',
    'CSV Halden Dental,http://127.0.0.1:' + port + '/csv,csv-directory,Halden,dentists,medium',
    'CSV Extra Dental,https://csv-extra.example,csv-directory,Halden,dentists,low',
  ].join('\n') + '\n')
  fs.writeFileSync(txtFixture, [
    'Txt Dental | https://txt-dental.example',
    'Bad Dental | not a url',
  ].join('\n') + '\n')
  fs.writeFileSync(htmlFixture, '<html><body><a href="https://html-dental.example">HTML Dental</a><a href="/relative">Ignored relative</a></body></html>')

  const multiSourceReport = await discoverLocalBusinesses({
    query: 'dentists in Halden',
    sourceFiles: [jsonFixture, csvFixture, txtFixture, htmlFixture],
    validate: false,
  })
  assert(multiSourceReport.query === 'dentists in Halden', 'query should be preserved')
  assert(multiSourceReport.totalRawCandidates === 8, 'multi-source report should count raw filtered candidates')
  assert(multiSourceReport.invalidCandidates === 1, 'invalid txt URL should be counted')
  assert(multiSourceReport.duplicatesRemoved === 2, 'duplicates across JSON and CSV sources should be removed')
  assert(multiSourceReport.candidates.length === 5, 'multi-source candidates should merge and dedupe')
  assert(multiSourceReport.candidatesBySource['csv-directory'] === 2, 'summary should count CSV provenance')
  assert(multiSourceReport.candidatesBySource['dentists-halden.extra-urls.txt'] === 1, 'summary should count TXT provenance')
  assert(multiSourceReport.candidatesBySource['dentists-halden.search-results.html'] === 1, 'summary should count HTML provenance')
  const merged = multiSourceReport.candidates.find((candidate) => candidate.normalizedDomain === '127.0.0.1')
  assert(merged.sources.length === 2, 'duplicate local domain should preserve JSON and CSV provenance')

  const reportPayload = await discoverLocalBusinesses({ query: 'dentists in Halden', sourceFile: jsonFixture, timeoutMs: 3000 })
  writeDiscoveryOutputs(reportPayload, { outPath: out, summaryPath: summary, handoffPath: handoff })
  server.close()
  const report = JSON.parse(fs.readFileSync(out, 'utf8'))
  const summaryReport = JSON.parse(fs.readFileSync(summary, 'utf8'))
  const handoffRows = fs.readFileSync(handoff, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  assert(report.industry === 'dentists', 'industry should be parsed')
  assert(report.location === 'Halden', 'location should be parsed')
  assert(report.candidates.length === 2, 'duplicates should be removed and location should filter')
  assert(report.reachableCandidates === 1, 'one local candidate should be reachable')
  assert(report.unreachableCandidates === 1, 'one candidate should be unreachable')
  assert(handoffRows.length === 1, 'handoff should exclude unreachable candidates by default')
  assert(handoffRows[0].url.startsWith('http://127.0.0.1:' + port), 'handoff should contain reachable URL')
  assert(handoffRows[0].businessName === 'Halden Tannklinikk', 'handoff should preserve business name')
  assert(handoffRows[0].industry === 'dentists', 'handoff should preserve industry')
  assert(handoffRows[0].location === 'Halden', 'handoff should preserve location')
  assert(summaryReport.handoffReadyCandidates === 1, 'summary should include handoff count')
  assert(summaryReport.duplicatesRemoved === 1, 'summary should include duplicate count')
  assert(summaryReport.candidatesBySource['sample-directory'] === 2, 'summary should include source counts')

  const handoffResult = spawnSync(process.execPath, ['cli/handoff-candidates.js', out, '--out', path.join(root, 'handoff-all.txt'), '--include-unreachable', 'true'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' })
  if (handoffResult.status !== 0) { console.error(handoffResult.stdout); console.error(handoffResult.stderr); process.exit(handoffResult.status) }
  const allRows = fs.readFileSync(path.join(root, 'handoff-all.txt'), 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  assert(allRows.length === 2, 'explicit handoff can include unreachable candidates')
  assert(allRows[0].businessName, 'explicit handoff should preserve business names')
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

main().catch((error) => { console.error(error); process.exit(1) })
