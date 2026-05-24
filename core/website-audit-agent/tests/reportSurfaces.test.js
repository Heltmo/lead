const fs = require('fs')
const path = require('path')
const { generateReportSurfaces, CSV_COLUMNS } = require('../reports/reportSurfaces')

const fixture = {
  sourceFile: 'fixtures/leads.csv',
  processedAt: '2026-05-23T00:00:00.000Z',
  startedAt: '2026-05-23T00:00:00.000Z',
  totalSites: 1,
  successfulAudits: 1,
  failedAudits: 0,
  pendingAudits: 0,
  topLeads: [],
  results: [{
    name: 'Example Lead',
    url: 'https://example.com',
    status: 'passed',
    title: 'Example',
    technologies: [{ name: 'WordPress', confidence: 'deterministic' }],
    issueCategories: { seo: 1, conversion: 1 },
    issueSeverities: { high: 1, medium: 1 },
    performance: { responseStatus: 200, domContentLoadedMs: 100, loadMs: 200, failedRequestCount: 0, consoleErrorCount: 0 },
    leadScore: 42,
    screenshots: { desktop: '/tmp/desktop.png', mobile: '/tmp/mobile.png' },
    issues: ['Missing meta description'],
    opportunityBullets: {
      painPointBullets: ['SEO structure is incomplete', 'CTA path needs review', 'WordPress cleanup is scoped'],
      suggestedOffer: 'Local SEO and page-structure refresh',
      outreachOpener: 'I noticed Example Lead has SEO gaps.',
      whyThisLeadMatters: 'This lead matters because the audit has deterministic evidence.',
    },
  }],
}

const outDir = path.join(__dirname, 'report-surfaces-smoke')
fs.rmSync(outDir, { recursive: true, force: true })
const surfaces = generateReportSurfaces(fixture, { outDir, title: 'Smoke Report' })
assert(fs.existsSync(surfaces.markdownPath), 'markdown report should exist')
assert(fs.existsSync(surfaces.htmlPath), 'html report should exist')
assert(fs.existsSync(surfaces.csvPath), 'csv report should exist')
const markdown = fs.readFileSync(surfaces.markdownPath, 'utf8')
const html = fs.readFileSync(surfaces.htmlPath, 'utf8')
const csv = fs.readFileSync(surfaces.csvPath, 'utf8')
assert(markdown.includes('# Smoke Report'), 'markdown should include report title')
assert(html.includes('<!doctype html>'), 'html should be static document')
assert(csv.startsWith(CSV_COLUMNS.join(',')), 'csv should preserve deterministic column order')
assert(csv.includes('Missing meta description'), 'csv should include issues')
assert(csv.includes('WordPress'), 'csv should serialize technology object names')
assert(csv.includes('painPointBullets'), 'csv should include opportunity header')
assert(csv.includes('Local SEO and page-structure refresh'), 'csv should include suggested offer')
assert(markdown.includes('Pain-point bullets'), 'markdown should include opportunity bullets')
assert(html.includes('Opportunity'), 'html should include opportunity section')
assert(!csv.includes('[object Object]'), 'csv should not leak object serialization')

function assert(condition, message) { if (!condition) throw new Error(message) }
