const { buildBusinessSignalProfile } = require('../../business-signal-engine/businessSignalEngine')
const { buildCompressedOpportunity } = require('../opportunityCompressor')

const item = {
  name: 'Halden tannhelsesenter AS',
  sourceMetadata: { rating: 4.7, reviewCount: 83, phone: '69 17 51 52', businessStatus: 'OPERATIONAL' },
  emails: ['post@example.no'],
  issueCategories: { conversion: 1 },
  issues: ['No clear CTA detected'],
  pageSignals: {
    headings: [
      { level: 'h2', text: 'Tannleger og spesialister.' },
      { level: 'h2', text: 'Tannregulering' },
    ],
    links: [
      { text: '', href: 'https://haldentannhelsesenter.opusdentalonline.com/' },
    ],
  },
}
item.businessSignalProfile = buildBusinessSignalProfile(item)
const compressed = buildCompressedOpportunity(item)
assert(compressed.type === 'booking_visibility_gap', 'booking contradiction should compress to booking visibility gap')
assert(compressed.businessImpact === 'conversion', 'business impact should be conversion')
assert(compressed.urgency > 0.75, 'urgency should be high for booking visibility gap')
assert(compressed.primaryOpportunity.includes('booking'), 'primary opportunity should mention booking')
assert(compressed.whyThisMatters.length <= 3, 'whyThisMatters should be compressed to three bullets')
assert(compressed.callOpener.length < 220, 'call opener should stay concise')
assert(!compressed.callOpener.includes('concrete audit signals'), 'call opener should avoid reasoning dump phrasing')

function assert(condition, message) { if (!condition) throw new Error(message) }
