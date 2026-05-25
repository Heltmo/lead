const fs = require('fs')
const path = require('path')
const { generateReviewWorkspace } = require('../generateReviewWorkspace')
const { generateReportSurfaces } = require('../../website-audit-agent/reports/reportSurfaces')

const root = path.join(__dirname, 'workspace-smoke')
fs.rmSync(root, { recursive: true, force: true })
fs.mkdirSync(path.join(root, 'items', 'url-0001', 'screenshots'), { recursive: true })
const reportPath = path.join(root, 'items', 'url-0001', 'report.json')
fs.writeFileSync(reportPath, JSON.stringify({
  url: 'https://example.com',
  status: 'passed',
  sourceMetadata: { businessName: 'Discovered Example Clinic', source: 'manual-urls.txt', location: 'Halden', industry: 'dentists', confidence: 'medium', phone: '+4799999999', address: 'Clinicgata 1, Halden', placeId: 'places/example', rating: 4.6, reviewCount: 17, businessStatus: 'OPERATIONAL' },
  signals: { title: 'Example', emails: ['hello@example.com'], phones: ['+4712345678'] },
  technology: { technologies: ['WordPress'] },
  issueClassification: { counts: { seo: 1, conversion: 1 }, severityCounts: { high: 1 } },
  performance: { responseStatus: 200, domContentLoadedMs: 100, loadMs: 200, failedRequests: [], consoleErrors: [] },
  screenshots: { desktop: path.join(root, 'items', 'url-0001', 'screenshots', 'desktop.png'), mobile: path.join(root, 'items', 'url-0001', 'screenshots', 'mobile.png') },
  leadQuality: { score: 64, issues: ['Missing meta description'] },
  errors: [],
}, null, 2))
const summaryPath = path.join(root, 'summary.json')
fs.writeFileSync(summaryPath, JSON.stringify({
  runId: 'run-smoke',
  pipeline: 'website-audit-queue',
  status: 'completed',
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:00.000Z',
  totalItems: 1,
  completedItems: 1,
  failedItems: 0,
  pendingItems: 0,
  results: [{ id: 'url-0001', url: 'https://example.com', businessName: 'Discovered Example Clinic', source: 'manual-urls.txt', location: 'Halden', industry: 'dentists', confidence: 'medium', sourceMetadata: { businessName: 'Discovered Example Clinic', source: 'manual-urls.txt', location: 'Halden', industry: 'dentists', confidence: 'medium', phone: '+4799999999', address: 'Clinicgata 1, Halden', placeId: 'places/example', rating: 4.6, reviewCount: 17, businessStatus: 'OPERATIONAL' }, status: 'completed', attempts: 1, reportPath, errors: [] }],
}, null, 2))
generateReportSurfaces(summaryPath, { outDir: path.join(root, 'report-surfaces') })
const result = generateReviewWorkspace({ summaryPath })
assert(fs.existsSync(result.indexPath), 'index.html should exist')
assert(fs.existsSync(result.reviewStatusPath), 'review-status.json should exist')
assert(fs.existsSync(result.selectedLeadsPath), 'selected-leads.csv should exist')
assert(fs.existsSync(result.crmShortlistedPath), 'crm-shortlisted-leads.csv should exist')
const html = fs.readFileSync(result.indexPath, 'utf8')
const status = JSON.parse(fs.readFileSync(result.reviewStatusPath, 'utf8'))
const selected = fs.readFileSync(result.selectedLeadsPath, 'utf8')
const crm = fs.readFileSync(result.crmShortlistedPath, 'utf8')
assert(html.includes('Lead Review Workspace'), 'workspace title should exist')
assert(html.includes('Business opportunity'), 'workspace should show business opportunity section')
assert(html.includes('Top evidence'), 'workspace should show prioritized evidence section')
assert(html.includes('Review metadata'), 'workspace should show review metadata section')
assert(html.includes('Audit status:'), 'workspace should label audit status clearly')
assert(html.includes('Contactability:'), 'workspace should show contactability signals')
assert(html.includes('Provider phone:'), 'workspace should show provider phone metadata')
assert(html.includes('Clinicgata 1, Halden'), 'workspace should show provider address metadata')
assert(html.includes('Offer:'), 'workspace should show suggested opportunity offer')
assert(html.includes('Opener:'), 'workspace should show outreach opener')
assert(html.includes('Discovered Example Clinic'), 'workspace should prefer discovered business name')
assert(html.includes('pageTitle":"Example'), 'workspace should keep audit page title separately')
assert(status.items['url-0001'].status === 'unreviewed', 'default status should be unreviewed')
assert(status.items['url-0001'].priority === 'unset', 'default priority should be unset')
assert(status.items['url-0001'].nextAction === 'unset', 'default next action should be unset')
assert(Array.isArray(status.items['url-0001'].tags), 'default tags should be an array')
assert(selected.startsWith('id,reviewStatus,priority,nextAction,owner,lastReviewedAt,tags,notes'), 'selected CSV should have stable header')
assert(!selected.includes('https://example.com'), 'unreviewed leads should not export as selected')
assert(crm.startsWith('company,website,pageTitle,sourcePhone,address,placeId,rating,reviewCount,businessStatus,industry,location,score'), 'CRM CSV should have stable header')
assert(!crm.includes('https://example.com'), 'unreviewed leads should not export to CRM')
status.items['url-0001'] = { status: 'shortlisted', priority: 'high', nextAction: 'contact', owner: 'GG', lastReviewedAt: '2026-05-23T00:00:00.000Z', tags: ['redesign', 'seo'], notes: 'Strong redesign opportunity' }
fs.writeFileSync(result.reviewStatusPath, `${JSON.stringify(status, null, 2)}\n`)
const regenerated = generateReviewWorkspace({ summaryPath })
const selectedAfter = fs.readFileSync(regenerated.selectedLeadsPath, 'utf8')
const crmAfter = fs.readFileSync(regenerated.crmShortlistedPath, 'utf8')
assert(selectedAfter.includes('Discovered Example Clinic'), 'selected export should use discovered business name')
assert(selectedAfter.includes('https://example.com'), 'shortlisted lead should export')
assert(selectedAfter.includes('Strong redesign opportunity'), 'shortlist notes should export')
assert(selectedAfter.includes('high'), 'selected export should include priority')
assert(selectedAfter.includes('contact'), 'selected export should include next action')
assert(selectedAfter.includes('GG'), 'selected export should include owner')
assert(selectedAfter.includes('redesign|seo'), 'selected export should include tags')
assert(selectedAfter.includes('SEO foundation gap'), 'selected export should include suggested angle label')
assert(selectedAfter.includes('Search visibility may be weak because the page is missing meta description.'), 'selected export should include suggested angle detail')
assert(selectedAfter.includes('Booking/contact conversion cleanup'), 'selected export should include suggested offer')
assert(selectedAfter.includes('This lead matters because'), 'selected export should include why-this-lead-matters sentence')
assert(crmAfter.includes('Discovered Example Clinic'), 'CRM export should use discovered business name')
assert(crmAfter.includes('Example'), 'CRM export should keep page title available')
assert(crmAfter.includes('dentists'), 'CRM export should include industry')
assert(crmAfter.includes('Halden'), 'CRM export should include location')
assert(crmAfter.includes('https://example.com'), 'shortlisted lead should export to CRM')
assert(crmAfter.includes('hello@example.com'), 'CRM export should include email')
assert(crmAfter.includes('+4799999999'), 'CRM export should prefer provider phone')
assert(crmAfter.includes('Clinicgata 1, Halden'), 'CRM export should include provider address')
assert(crmAfter.includes('places/example'), 'CRM export should include place id')
assert(crmAfter.includes('OPERATIONAL'), 'CRM export should include business status')
assert(crmAfter.includes('painPointBullets'), 'CRM export should include opportunity bullets header')
assert(crmAfter.includes('Booking/contact conversion cleanup'), 'CRM export should include suggested offer')
assert(crmAfter.includes('I noticed'), 'CRM export should include deterministic outreach opener')
const htmlAfter = fs.readFileSync(regenerated.indexPath, 'utf8')
assert(htmlAfter.includes('SEO foundation gap'), 'workspace should display deterministic suggested angle label')
assert(htmlAfter.includes('Search visibility may be weak because the page is missing meta description.'), 'workspace should display deterministic suggested angle detail')
assert(htmlAfter.includes('This lead matters because'), 'workspace should display why-this-lead-matters sentence')
assert(crmAfter.includes('SEO foundation gap'), 'CRM export should include deterministic suggested angle label')
assert(crmAfter.includes('Search visibility may be weak because the page is missing meta description.'), 'CRM export should include deterministic suggested angle detail')
assert(crmAfter.includes('high'), 'CRM export should include priority')
assert(crmAfter.includes('contact'), 'CRM export should include next action')
assert(crmAfter.includes('GG'), 'CRM export should include owner')

const legacyStatus = JSON.parse(fs.readFileSync(result.reviewStatusPath, 'utf8'))
legacyStatus.items['url-0001'] = { status: 'shortlisted', notes: 'Legacy status shape' }
fs.writeFileSync(result.reviewStatusPath, JSON.stringify(legacyStatus, null, 2) + '\n')
generateReviewWorkspace({ summaryPath })
const normalizedLegacy = JSON.parse(fs.readFileSync(result.reviewStatusPath, 'utf8'))
assert(normalizedLegacy.items['url-0001'].priority === 'unset', 'legacy status should normalize priority')
assert(normalizedLegacy.items['url-0001'].nextAction === 'unset', 'legacy status should normalize next action')
assert(Array.isArray(normalizedLegacy.items['url-0001'].tags), 'legacy status should normalize tags')
assert(normalizedLegacy.items['url-0001'].notes === 'Legacy status shape', 'legacy status should preserve notes')

function assert(condition, message) { if (!condition) throw new Error(message) }
