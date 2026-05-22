const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { extractLeadsFromSpreadsheet } = require('../extractors/spreadsheet')

async function main() {
  const fixtureDir = path.join(__dirname, 'fixtures')
  const fixture = path.join(fixtureDir, 'leads.csv')
  fs.mkdirSync(fixtureDir, { recursive: true })
  fs.writeFileSync(fixture, ['Mail sendt:,,1', 'Firmanavn,Nettside,Telefon,E-post', 'Local Webconsult,http://127.0.0.1:5173,,'].join('\n'))
  const leads = await extractLeadsFromSpreadsheet(fixture)
  assert(leads.length === 1, 'one lead should be extracted')
  assert(leads[0].name === 'Local Webconsult', 'company name should be mapped')
  assert(leads[0].url === 'http://127.0.0.1:5173', 'URL should be normalized')
  const out = 'reports/batch-smoke.json'
  const result = spawnSync(process.execPath, ['cli/audit-batch.js', fixture, '--out', out, '--screenshots', 'screenshots/batch-smoke', '--limit', '1'], { cwd: `${__dirname}/..`, encoding: 'utf8' })
  if (result.status !== 0) { console.error(result.stdout); console.error(result.stderr); process.exit(result.status) }
  const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', out), 'utf8'))
  assert(report.totalSites === 1, 'batch should process one site')
  assert(report.successfulAudits === 1, 'batch should have one successful audit')
  assert(report.results[0].title === 'Webconsult', 'batch should extract page title')
  assert(typeof report.results[0].leadScore === 'number', 'batch should include lead score')
}
function assert(condition, message) { if (!condition) throw new Error(message) }
main().catch((error) => { console.error(error); process.exit(1) })
