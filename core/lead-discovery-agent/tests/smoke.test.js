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
  const fixture = path.join(root, 'dentists-halden.sample.json')
  const out = path.join(root, 'lead-candidates.json')
  const summary = path.join(root, 'discovery-summary.json')
  const handoff = path.join(root, 'orchestrator-urls.txt')
  fs.rmSync(root, { recursive: true, force: true })
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(fixture, JSON.stringify({
    results: [
      { businessName: 'Halden Tannklinikk', website: `http://127.0.0.1:${port}`, source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'high' },
      { businessName: 'Halden Tannklinikk Duplicate', website: `http://127.0.0.1:${port}/about`, source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'high' },
      { businessName: 'Unreachable Dental', website: 'http://localhost:1', source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'medium' },
      { businessName: 'Oslo Dental', website: 'https://oslo.example', source: 'sample-directory', location: 'Oslo', industry: 'dentists', confidence: 'low' },
    ],
  }, null, 2))

  const reportPayload = await discoverLocalBusinesses({ query: 'dentists in Halden', sourceFile: fixture, timeoutMs: 3000 })
  writeDiscoveryOutputs(reportPayload, { outPath: out, summaryPath: summary, handoffPath: handoff })
  server.close()
  const report = JSON.parse(fs.readFileSync(out, 'utf8'))
  const summaryReport = JSON.parse(fs.readFileSync(summary, 'utf8'))
  const urls = fs.readFileSync(handoff, 'utf8').trim().split(/\r?\n/).filter(Boolean)
  assert(report.query === 'dentists in Halden', 'query should be preserved')
  assert(report.industry === 'dentists', 'industry should be parsed')
  assert(report.location === 'Halden', 'location should be parsed')
  assert(report.candidates.length === 2, 'duplicates should be removed and location should filter')
  assert(report.reachableCandidates === 1, 'one local candidate should be reachable')
  assert(report.unreachableCandidates === 1, 'one candidate should be unreachable')
  assert(urls.length === 1, 'handoff should exclude unreachable candidates by default')
  assert(urls[0].startsWith(`http://127.0.0.1:${port}`), 'handoff should contain reachable URL')
  assert(summaryReport.handoffReadyCandidates === 1, 'summary should include handoff count')

  const handoffResult = spawnSync(process.execPath, ['cli/handoff-candidates.js', out, '--out', path.join(root, 'handoff-all.txt'), '--include-unreachable', 'true'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' })
  if (handoffResult.status !== 0) { console.error(handoffResult.stdout); console.error(handoffResult.stderr); process.exit(handoffResult.status) }
  const allUrls = fs.readFileSync(path.join(root, 'handoff-all.txt'), 'utf8').trim().split(/\r?\n/).filter(Boolean)
  assert(allUrls.length === 2, 'explicit handoff can include unreachable candidates')
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

main().catch((error) => { console.error(error); process.exit(1) })
