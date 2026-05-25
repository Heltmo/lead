const { buildBusinessSignalProfile } = require('../businessSignalEngine')

const profile = buildBusinessSignalProfile({
  name: 'Halden tannhelsesenter AS',
  sourceMetadata: { rating: 4.7, reviewCount: 83, phone: '69 17 51 52', businessStatus: 'OPERATIONAL' },
  emails: ['post@example.no'],
  issueCategories: { conversion: 1 },
  issues: ['No clear CTA detected'],
  pageSignals: {
    metaDescription: 'Et tannhelsesenter med pasienten i fokus.',
    headings: [
      { level: 'h2', text: 'Tannleger og spesialister.' },
      { level: 'h2', text: 'Tannregulering' },
      { level: 'h3', text: 'Velkommen til nye Aremark-pasienter!' },
    ],
    links: [
      { text: 'Bestill time til vanlig tannbehandling!', href: 'https://haldentannhelsesenter.opusdentalonline.com/' },
      { text: 'Prisliste', href: 'https://example.com/prisliste/' },
      { text: 'Møt våre ansatte', href: 'https://example.com/om-oss#team' },
    ],
  },
})

assertSignal(profile, 'online_booking')
assertSignal(profile, 'high_value_service')
assertSignal(profile, 'specialist_service')
assertSignal(profile, 'team_authority')
assertSignal(profile, 'pricing_transparency')
assertSignal(profile, 'new_patient_signal')
assertSignal(profile, 'missing_primary_cta')
assertContradiction(profile, 'booking_exists_but_cta_weak')
assertContradiction(profile, 'high_value_service_but_weak_action_path')
assertContradiction(profile, 'strong_reviews_but_weak_conversion')
assert(profile.topOpportunities.some((item) => item.id === 'booking_visibility'), 'booking visibility should be ranked as an opportunity')
assert(profile.topOpportunities.some((item) => item.id === 'high_value_service_conversion'), 'high-value service conversion should be ranked as an opportunity')
const booking = profile.signals.find((item) => item.id === 'online_booking')
assert(typeof booking.strength === 'number', 'strength should be numeric')
assert(booking.observation.ctaProminence < 0.6, 'booking prominence should be inspectable')

function assertSignal(profile, id) { assert(profile.signals.some((item) => item.id === id), 'expected signal ' + id) }
function assertContradiction(profile, id) { assert(profile.contradictions.some((item) => item.id === id), 'expected contradiction ' + id) }
function assert(condition, message) { if (!condition) throw new Error(message) }


const lawyerProfile = buildBusinessSignalProfile({
  name: 'Eksempel Advokatfirma AS',
  sourceMetadata: { rating: 4.8, reviewCount: 42, phone: '22112211', businessStatus: 'OPERATIONAL' },
  emails: ['post@example-law.no'],
  issueCategories: { conversion: 1 },
  issues: ['No clear CTA detected'],
  industry: 'lawyer',
  pageSignals: {
    headings: [
      { level: 'h2', text: 'Forretningsjus og selskapsrett' },
      { level: 'h2', text: 'Tvisteløsning og prosedyre' },
    ],
    links: [
      { text: 'Kontakt oss', href: '/kontakt' },
    ],
  },
})
assertSignal(lawyerProfile, 'high_value_service')
assert(!lawyerProfile.signals.some((item) => item.id === 'specialist_service'), 'lawyer high-value service should not use dentist specialist alias')
assertContradiction(lawyerProfile, 'high_value_service_but_weak_action_path')
assert(lawyerProfile.topOpportunities.some((item) => item.id === 'high_value_service_conversion'), 'lawyer high-value service should create generic commercial opportunity')
