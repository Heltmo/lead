const fs = require('fs')
const path = require('path')
const { buildLeadInsight, generateLeadInsight, buildLeadInsightPrompt, normalizeLeadInsight } = require('../leadInsightAgent')

const item = {
  id: 'lead-0001',
  name: 'Halden tannhelsesenter AS',
  url: 'https://haldentannhelsesenter.no',
  pageTitle: 'Forside - Halden Tannhelsesenter',
  leadScore: 28,
  sourceMetadata: { phone: '69 17 51 52', address: 'Niels Stubs gate 1, 1776 Halden', rating: 4.7, reviewCount: 83, businessStatus: 'OPERATIONAL', sourceType: 'directBusiness', industry: 'dentist' },
  technologies: ['WordPress', 'Google Analytics'],
  issueCategories: { conversion: 1, accessibility: 1, technical: 1 },
  issues: ['No clear CTA detected', 'Serious accessibility issues detected', 'Failed network requests detected'],
  phones: ['69 17 51 52'],
  emails: ['post@example.no'],
  performance: { responseStatus: 200, failedRequestCount: 2, consoleErrorCount: 0 },
  pageSignals: {
    metaDescription: 'Et tannhelsesenter med pasienten i fokus.',
    headings: [
      { level: 'h1', text: 'Velkommen til Halden Tannhelsesenter' },
      { level: 'h2', text: 'Tannleger og spesialister.' },
      { level: 'h2', text: 'Tannregulering' },
      { level: 'h2', text: 'Velkommen til nye Aremark-pasienter!' },
    ],
    links: [
      { text: 'Bestill time til vanlig tannbehandling!', href: 'https://haldentannhelsesenter.opusdentalonline.com/' },
      { text: 'Prisliste', href: 'https://example.com/prisliste/' },
      { text: 'Møt våre ansatte', href: 'https://example.com/om-oss#team' },
    ],
  },
}

const insight = generateLeadInsight(item)
assertIncludes(insight.leadSummary, 'Halden tannhelsesenter AS', 'summary should name the business')
assertIncludes(insight.leadSummary, '4.7', 'summary should include rating evidence')
assertIncludes(insight.mainProblem, 'High-value services', 'main problem should use positive business signals')
assertIncludes(insight.evidenceBasedAngle, 'service growth', 'angle should frame service growth')
assertIncludes(insight.evidenceBasedAngle, 'tannregulering', 'angle should include service signal')
assertIncludes(insight.callOpeningLine, 'Halden tannhelsesenter AS', 'opener should be lead-specific')
assertIncludes(insight.callOpeningLine, 'high-value services', 'opener should mention high-value services')
assert(insight.confidence === 'high', 'call-ready lead should have high insight confidence')
assert(!JSON.stringify(insight).includes('focused website cleanup opportunity'), 'insight should avoid old generic phrase')

const prompt = buildLeadInsightPrompt(item)
assertIncludes(prompt, 'Return JSON only', 'prompt should define JSON output')
assertIncludes(prompt, 'No clear CTA detected', 'prompt should include audit facts')

const mock = buildLeadInsight(item, { llmGenerate: () => JSON.stringify({ leadSummary: 'Mock clinic summary', whyThisLeadIsInteresting: 'Mock reason from facts', mainProblem: 'Mock problem', evidenceBasedAngle: 'Mock angle', callOpeningLine: 'Mock opener', recommendedOffer: 'Mock offer', disqualifiers: [], confidence: 'medium' }) })
assert(mock.leadSummary === 'Mock clinic summary', 'mocked LLM response should be used')

const cacheDir = path.join(__dirname, 'tmp-cache')
fs.rmSync(cacheDir, { recursive: true, force: true })
const cached = buildLeadInsight(item, { cacheDir })
const cacheFiles = fs.readdirSync(cacheDir)
assert(cacheFiles.length === 1, 'insight should be cached')
assert(cached.leadSummary, 'cached generation should remain valid')

const publicSector = normalizeLeadInsight(generateLeadInsight({ ...item, sourceMetadata: { ...item.sourceMetadata, sourceType: 'publicSector' } }))
assert(publicSector.disqualifiers.some((value) => value.includes('Public-sector')), 'public-sector leads should be disqualified')

function assertIncludes(value, expected, message) { if (!String(value).includes(expected)) throw new Error(message + ': expected ' + expected + ' in ' + value) }
function assert(condition, message) { if (!condition) throw new Error(message) }
