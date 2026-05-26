const { buildContactCtaProfile } = require('../extractors/contactCtaProfile')
const { classifyIssues } = require('../audits/issueClassification')

assertStrong('lawyer client-intake CTA', {
  texts: ['Ring oss', 'Send e-post', 'Vi ringer deg', 'Kontakt oss'],
  links: [{ text: 'Kontakt oss', href: '/kontakt' }, { text: 'Vi ringer deg', href: '/callback' }],
  emails: ['post@example.no'],
  phones: ['22 11 22 11'],
}, 'client_intake')

assertStrong('electrician CTA', {
  texts: ['Bestill elektriker', 'Ring oss', 'Hva kan vi hjelpe deg med?'],
  links: [{ text: 'Bestill elektriker', href: '/bestill' }],
  emails: ['post@example.no'],
  phones: ['69 11 11 11'],
}, 'booking')

assertStrong('plumber CTA', {
  texts: ['Bestill rørlegger', 'Be om pristilbud', 'Avtal befaring', 'Døgnvakt'],
  links: [{ text: 'Be om pristilbud', href: '/tilbud' }],
  phones: ['69 22 22 22'],
}, 'emergency_call')

assertStrong('restaurant CTA', {
  texts: ['Bestill bord', 'Bordbestilling', 'Meny', 'Åpningstider'],
  links: [{ text: 'Bestill bord', href: '/booking' }, { text: 'Meny', href: '/meny' }],
  phones: ['32 22 22 22'],
}, 'table_booking')

const classified = classifyIssues({
  signals: {
    metaDescription: 'Example',
    headings: [{ level: 'h1', text: 'Example' }],
    ctas: [],
    emails: ['post@example.no'],
    phones: ['69 00 00 00'],
    socialLinks: ['https://facebook.com/example'],
    contactCtaProfile: buildContactCtaProfile({ texts: ['Ring oss', 'Kontakt oss'], emails: ['post@example.no'], phones: ['69 00 00 00'] }),
  },
  accessibility: { seriousViolationCount: 0 },
  performance: {},
  technology: { technologies: ['WordPress'] },
})
assert(!classified.issues.some((issue) => issue.label === 'No clear CTA detected'), 'strong contact path should suppress No clear CTA detected')

function assertStrong(label, input, expectedType) {
  const profile = buildContactCtaProfile(input)
  assert(profile.hasVisibleContactPath, label + ' should have visible contact path')
  assert(profile.hasStrongPrimaryCta, label + ' should have strong primary CTA')
  assert(profile.verticalCtaType === expectedType, label + ' expected ' + expectedType + ', got ' + profile.verticalCtaType)
}

function assert(condition, message) { if (!condition) throw new Error(message) }
