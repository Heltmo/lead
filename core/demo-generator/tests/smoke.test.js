const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { generateLeadDemo, deriveRunId, slugify } = require('../generateLeadDemo')

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const fixture = path.join(__dirname, 'fixtures', 'crm-shortlisted-leads.csv')
const outRoot = path.join(repoRoot, 'generated', 'demos')
const smokeRun = path.join(outRoot, 'smoke-run')
fs.rmSync(smokeRun, { recursive: true, force: true })

assert(deriveRunId('/tmp/core/orchestrator/runs/run-123/review-workspace/crm-shortlisted-leads.csv') === 'run-123', 'run id should be derived from orchestrator run path')
assert(slugify('Halden Dental Care!') === 'halden-dental-care', 'business slug should be stable')

const result = generateLeadDemo({ shortlistPath: fixture, runId: 'smoke-run', outRoot })
assert(fs.existsSync(result.indexPath), 'demo index should exist')
assert(fs.existsSync(result.manifestPath), 'demo manifest should exist')
assert(result.outDir.endsWith(path.join('generated', 'demos', 'smoke-run', 'halden-dental-care')), 'demo should be written under ignored generated path')

const html = fs.readFileSync(result.indexPath, 'utf8')
const manifest = JSON.parse(fs.readFileSync(result.manifestPath, 'utf8'))
assert(html.includes('Halden Dental Care'), 'HTML should include business name')
assert(html.includes('dentists in Halden'), 'HTML should include industry and location')
assert(html.includes('SEO foundation gap'), 'HTML should include suggested angle')
assert(html.includes('Missing meta description'), 'HTML should include top issues')
assert(html.includes('Visible email: hello@halden-dental.example'), 'HTML should include email finding')
assert(html.includes('Visible phone: +4712345678'), 'HTML should include phone finding')
assert(manifest.deterministic === true, 'manifest should mark deterministic generation')
assert(manifest.lead.businessName === 'Halden Dental Care', 'manifest should include business name')
assert(manifest.lead.industry === 'dentists', 'manifest should include industry')
assert(manifest.lead.location === 'Halden', 'manifest should include location')
assert(manifest.lead.contactFindings.cta === 'CTA/contact path flagged by the audit', 'manifest should include CTA finding')

const cli = spawnSync(process.execPath, ['cli/generate-demo.js', fixture, '--run-id', 'smoke-run-cli', '--out-root', outRoot], { cwd: path.join(__dirname, '..'), encoding: 'utf8' })
if (cli.status !== 0) {
  console.error(cli.stdout)
  console.error(cli.stderr)
  process.exit(cli.status)
}
const cliPayload = JSON.parse(cli.stdout)
assert(fs.existsSync(cliPayload.indexPath), 'CLI should write demo index')
assert(fs.existsSync(cliPayload.manifestPath), 'CLI should write manifest')

const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8')
assert(gitignore.split(/\r?\n/).includes('/generated/'), 'generated demo output should be ignored by Git')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
