const { buildBusinessSignalProfile } = require('../../business-signal-engine/businessSignalEngine')
const { buildCompressedOpportunity, rankCandidates } = require('../opportunityCompressor')

const halden = withSignals({
  name: 'Halden tannhelsesenter AS',
  pageTitle: 'Forside - Halden Tannhelsesenter',
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
})
const haldenCompressed = buildCompressedOpportunity(halden)
assert(haldenCompressed.type === 'specialist_to_booking_gap', 'Halden should prioritize specialist-to-booking, not generic booking visibility')
assert(haldenCompressed.businessImpact === 'positioning', 'specialist angle should be positioning impact')
assert(haldenCompressed.urgency > 0.75, 'specialist booking gap should stay urgent')
assert(haldenCompressed.primaryOpportunity.includes('Specialist'), 'Halden primary opportunity should mention specialist services')
assert(haldenCompressed.whyThisMatters.length <= 3, 'whyThisMatters should be compressed to three bullets')
assert(haldenCompressed.callOpener.length < 240, 'call opener should stay concise')
assert(!haldenCompressed.callOpener.includes('concrete audit signals'), 'call opener should avoid reasoning dump phrasing')

const norfloss = withSignals({
  name: 'Norfloss Tannklinikk',
  pageTitle: 'Tannlege Halden - Velkommen til Norfloss Tannklinikk',
  sourceMetadata: { rating: 5, reviewCount: 223, phone: '69 10 90 19', businessStatus: 'OPERATIONAL' },
  emails: ['smil@norfloss.no'],
  technologies: ['Google Analytics'],
  issueCategories: { conversion: 1, accessibility: 1 },
  issues: ['No clear CTA detected', 'Serious accessibility issues detected'],
  pageSignals: {
    headings: [
      { level: 'h2', text: 'Velkommen til NorFloss Tannklinikk' },
      { level: 'h2', text: 'Fra bestilling til besøk hos NorFloss Tannklinikk' },
      { level: 'h2', text: 'Kjeveortoped i Halden' },
      { level: 'h2', text: 'Møt vårt profesjonelle team' },
      { level: 'h2', text: 'Våre behandlinger' },
    ],
    links: [
      { text: 'Bestill time', href: 'https://norfloss.opusdentalonline.com/' },
      { text: 'Se våre priser', href: '/priser' },
      { text: 'Utviklet av Dental Markedsføring', href: 'https://dentalmarkedsforing.no' },
    ],
  },
})
const norflossCompressed = buildCompressedOpportunity(norfloss)
assert(norflossCompressed.type === 'modern_site_campaign_optimization', 'Norfloss should not receive the generic booking visibility angle')
assert(norflossCompressed.primaryOpportunity.includes('conversion-ready'), 'modern site angle should acknowledge the site is already strong')
assert(norflossCompressed.outreachAngle.includes('campaign'), 'modern site angle should suggest campaign optimization')

const berg = withSignals({
  name: 'Os Allé Dental Clinic',
  url: 'https://tannlegeneberg.no',
  pageTitle: 'Hjem | Tannlegene Berg',
  sourceMetadata: { rating: 5, reviewCount: 16, phone: '69 17 53 70', businessStatus: 'OPERATIONAL' },
  issueCategories: { conversion: 1, seo: 1 },
  issues: ['Expected exactly one h1, found 0', 'No clear CTA detected'],
  pageSignals: {
    headings: [
      { level: 'h2', text: 'Vi har gleden av å informere om at Tannlegene Berg nå heter Sydsiden Tannhelsesenter.' },
      { level: 'h2', text: 'Vi har utvidet kapasitet og tar nå imot nye pasienter her hos oss.' },
      { level: 'h2', text: 'Kontakt oss' },
    ],
    links: [
      { text: 'Bestill time', href: '/bestill-time' },
      { text: 'Prisliste', href: '/prisliste' },
    ],
  },
})
const bergCompressed = buildCompressedOpportunity(berg)
assert(bergCompressed.type === 'brand_identity_confusion', 'Tannlegene Berg should prioritize rebrand/identity confusion')
assert(bergCompressed.primaryOpportunity.includes('brand transition'), 'brand angle should mention transition')
assert(bergCompressed.callOpener.includes('brand'), 'brand call opener should be about brand/search consistency')

const ranked = rankCandidates(berg).map((item) => item.strategy.type)
assert(ranked[0] === 'brand_identity_confusion', 'brand identity should outrank booking for rebrand cases')

function withSignals(item) {
  item.businessSignalProfile = buildBusinessSignalProfile(item)
  return item
}
function assert(condition, message) { if (!condition) throw new Error(message) }
