const fs = require('fs')
const { spawnSync } = require('child_process')

const out = 'reports/smoke-local.json'
const screenshots = 'screenshots/smoke-local'
const result = spawnSync(process.execPath, ['cli/audit-url.js', 'http://127.0.0.1:5173', '--out', out, '--screenshots', screenshots], { cwd: `${__dirname}/..`, encoding: 'utf8' })
if (result.status !== 0) { console.error(result.stdout); console.error(result.stderr); process.exit(result.status) }
const report = JSON.parse(fs.readFileSync(`${__dirname}/../${out}`, 'utf8'))
assert(report.status === 'passed', 'report should pass')
assert(report.signals.title === 'Webconsult', 'title should be extracted')
assert(report.signals.headings.some((heading) => heading.level === 'h1'), 'h1 should be extracted')
assert(fs.existsSync(report.screenshots.desktop), 'desktop screenshot should exist')
assert(fs.existsSync(report.screenshots.mobile), 'mobile screenshot should exist')
assert(typeof report.accessibility.violationCount === 'number', 'accessibility count should be numeric')
assert(typeof report.leadQuality.score === 'number', 'lead score should be numeric')
assert(report.technology && Array.isArray(report.technology.technologies), 'technology should be present')
assert(report.issueClassification && Array.isArray(report.issueClassification.issues), 'issue classification should be present')
assert(report.performance && typeof report.performance.resourceCount === 'number', 'performance should be present')
assert(report.opportunityBullets && report.opportunityBullets.painPointBullets.length === 3, 'opportunity bullets should include three pain points')
assert(report.opportunityBullets.suggestedOffer, 'opportunity bullets should include suggested offer')
assert(report.opportunityBullets.outreachOpener, 'opportunity bullets should include outreach opener')
assert(report.opportunityBullets.whyThisLeadMatters, 'opportunity bullets should include why-this-lead-matters')
function assert(condition, message) { if (!condition) throw new Error(message) }
