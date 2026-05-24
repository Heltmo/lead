const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { generateLeadDemo, deriveRunId, slugify } = require('../generateLeadDemo')
const { generateDemoForLead } = require('../generateDemoForLead')

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


const selectedRunDir = path.join(__dirname, 'tmp', 'selected-run')
fs.rmSync(selectedRunDir, { recursive: true, force: true })
fs.mkdirSync(path.join(selectedRunDir, 'items', 'url-0001'), { recursive: true })
fs.mkdirSync(path.join(selectedRunDir, 'report-surfaces'), { recursive: true })
fs.mkdirSync(path.join(selectedRunDir, 'review-workspace'), { recursive: true })
const selectedReportPath = path.join(selectedRunDir, 'items', 'url-0001', 'report.json')
fs.writeFileSync(selectedReportPath, JSON.stringify({
  url: 'https://selected-halden.example',
  status: 'passed',
  sourceMetadata: { businessName: 'Selected Halden Dental', industry: 'dentists', location: 'Halden' },
  signals: {
    title: 'Selected Halden Dental',
    emails: ['hello@selected-halden.example'],
    phones: ['+4711111111'],
    ctas: [],
  },
  leadQuality: {
    score: 42,
    issues: ['No clear CTA detected', 'Missing meta description', 'Serious accessibility issues detected'],
  },
  issueClassification: {
    counts: { conversion: 1, seo: 1, accessibility: 1 },
    severityCounts: { high: 1, medium: 2 },
  },
  technology: { technologies: ['WordPress'] },
  performance: { responseStatus: 200, failedRequests: [], consoleErrors: [] },
  screenshots: { desktop: path.join(selectedRunDir, 'desktop.png'), mobile: path.join(selectedRunDir, 'mobile.png') },
}, null, 2))
fs.writeFileSync(path.join(selectedRunDir, 'summary.json'), JSON.stringify({
  runId: 'selected-run',
  pipeline: 'website-audit-queue',
  totalItems: 1,
  completedItems: 1,
  failedItems: 0,
  pendingItems: 0,
  results: [{
    id: 'url-0001',
    url: 'https://selected-halden.example',
    businessName: 'Selected Halden Dental',
    sourceMetadata: { businessName: 'Selected Halden Dental', industry: 'dentists', location: 'Halden' },
    status: 'completed',
    reportPath: selectedReportPath,
    errors: [],
  }],
}, null, 2))
fs.writeFileSync(path.join(selectedRunDir, 'report-surfaces', 'leads.csv'), [
  'rank,name,url,status,leadScore,title,pageTitle,technologies,issueCategories,responseStatus,failedRequestCount,consoleErrorCount,desktopScreenshot,mobileScreenshot,jsonArtifact,issues,painPointBullets,suggestedOffer,outreachOpener,whyThisLeadMatters',
  '1,Selected Halden Dental,https://selected-halden.example,completed,42,Selected Halden Dental,Selected Halden Dental,WordPress,accessibility:1|conversion:1|seo:1,200,0,0,desktop.png,mobile.png,' + selectedReportPath + ',No clear CTA detected|Missing meta description|Serious accessibility issues detected,,,,',
].join('\n') + '\n')
fs.writeFileSync(path.join(selectedRunDir, 'review-workspace', 'review-status.json'), JSON.stringify({
  updatedAt: '2026-05-24T00:00:00.000Z',
  items: {
    'url-0001': {
      status: 'shortlisted',
      priority: 'high',
      notes: 'Selected for demo',
      nextAction: 'contact',
      owner: 'GG',
      lastReviewedAt: '2026-05-24T00:00:00.000Z',
      tags: ['demo'],
    },
  },
}, null, 2))
const selectedDemo = generateDemoForLead({ run: path.join(selectedRunDir, 'summary.json'), lead: 'selected-halden.example', out: outRoot })
assert(fs.existsSync(selectedDemo.indexPath), 'selected lead demo index should exist')
assert(fs.existsSync(selectedDemo.manifestPath), 'selected lead demo manifest should exist')
assert(selectedDemo.selectedLead.reviewStatus === 'shortlisted', 'selected lead demo should prefer review status')
const selectedManifest = JSON.parse(fs.readFileSync(selectedDemo.manifestPath, 'utf8'))
assert(selectedManifest.source.type === 'selected-run-lead', 'selected lead manifest should record source type')
assert(selectedManifest.source.itemId === 'url-0001', 'selected lead manifest should record item id')
assert(selectedManifest.audit.reportPath === selectedReportPath, 'selected lead manifest should record audit report path')
const selectedHtml = fs.readFileSync(selectedDemo.indexPath, 'utf8')
assert(selectedHtml.includes('Selected Halden Dental'), 'selected lead HTML should include business name')
assert(selectedHtml.includes('Booking'), 'selected lead HTML should include deterministic angle/offer content')

const selectedCli = spawnSync(process.execPath, ['cli/generate-demo-for-lead.js', '--run', path.join(selectedRunDir, 'summary.json'), '--lead', 'url-0001', '--out', outRoot], { cwd: path.join(__dirname, '..'), encoding: 'utf8' })
if (selectedCli.status !== 0) {
  console.error(selectedCli.stdout)
  console.error(selectedCli.stderr)
  process.exit(selectedCli.status)
}
const selectedCliPayload = JSON.parse(selectedCli.stdout)
assert(selectedCliPayload.selectedLead.id === 'url-0001', 'selected lead CLI should resolve item id')
assert(fs.existsSync(selectedCliPayload.indexPath), 'selected lead CLI should write demo index')

const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8')
assert(gitignore.split(/\r?\n/).includes('/generated/'), 'generated demo output should be ignored by Git')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
