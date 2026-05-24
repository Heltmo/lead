const fs = require('fs')
const http = require('http')
const path = require('path')
const { runCampaign } = require('../runCampaign')

async function main() {
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end([
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<title>Halden Dental Studio</title>',
      '<meta name="description" content="Dental care in Halden">',
      '</head>',
      '<body>',
      '<main>',
      '<h1>Halden Dental Studio</h1>',
      '<p>Dental care for families in Halden.</p>',
      '<a href="mailto:hello@example.test">Email us</a>',
      '<a href="tel:+4712345678">Call +47 12 34 56 78</a>',
      '</main>',
      '</body>',
      '</html>',
    ].join(''))
  })
  await listen(server)

  const root = path.join(__dirname, 'tmp')
  const sourcePath = path.join(root, 'campaign-source.json')
  const campaignRoot = path.join(root, 'generated-campaigns')
  const runsRoot = path.join(root, 'orchestrator-runs')
  const port = server.address().port

  fs.rmSync(root, { recursive: true, force: true })
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(sourcePath, JSON.stringify({
    results: [
      {
        businessName: 'Halden Dental Studio',
        website: 'http://127.0.0.1:' + port,
        source: 'campaign-smoke',
        location: 'Halden',
        industry: 'dentists',
        confidence: 'high',
      },
      {
        businessName: 'Directory Result',
        website: 'https://www.legelisten.no/tannleger/Viken/Halden',
        source: 'campaign-smoke',
        location: 'Halden',
        industry: 'dentists',
        confidence: 'low',
      },
    ],
  }, null, 2))

  const result = await runCampaign({
    query: 'dentists in Halden',
    sourceFiles: [sourcePath],
    maxLeads: 1,
    demoCount: 1,
    runId: 'campaign-runner-smoke',
    campaignRoot,
    orchestratorRunsRoot: runsRoot,
    validate: false,
  })

  server.close()

  assert(result.campaignId === 'campaign-runner-smoke', 'runId should become campaignId')
  assert(result.counts.discoveredCount === 2, 'campaign should record discovered candidates')
  assert(result.counts.auditEligibleCount === 1, 'campaign should record audit eligible candidates')
  assert(result.counts.handoffCount === 1, 'campaign should limit handoff to maxLeads')
  assert(result.counts.auditedCount === 1, 'campaign should audit one item')
  assert(result.counts.failedCount === 0, 'campaign should have no failed audits')
  assert(result.demoResults.length === 1, 'campaign should generate one demo')
  assert(fs.existsSync(result.paths.campaignJsonPath), 'campaign.json should exist')
  assert(fs.existsSync(result.paths.campaignSummaryPath), 'campaign-summary.md should exist')
  assert(fs.existsSync(result.paths.reviewWorkspaceIndexPath), 'campaign review index copy should exist')
  assert(fs.existsSync(result.paths.crmShortlistedPath), 'campaign CRM export should exist')
  assert(fs.existsSync(result.demoResults[0].indexPath), 'demo index should exist')
  assert(fs.existsSync(path.join(result.paths.runDir, 'summary.json')), 'campaign run summary copy should exist')
  assert(fs.existsSync(path.join(result.paths.runDir, 'report-surfaces', 'leads.csv')), 'campaign report CSV copy should exist')

  const campaign = JSON.parse(fs.readFileSync(result.paths.campaignJsonPath, 'utf8'))
  assert(campaign.topOpportunities.length === 1, 'campaign should include top opportunities')
  assert(campaign.demos.length === 1, 'campaign JSON should include demo metadata')
  const summary = fs.readFileSync(result.paths.campaignSummaryPath, 'utf8')
  assert(summary.includes('Discovered count: 2'), 'summary should include discovered count')
  assert(summary.includes('CRM export path:'), 'summary should include CRM export path')
  assert(summary.includes('Review workspace path:'), 'summary should include review workspace path')
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
