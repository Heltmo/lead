const TERM_GROUPS = [
  { type: 'emergency_call', terms: ['akutt time', 'tannlegevakt', 'døgnvakt', 'dognvakt', 'rørleggervakt', 'rorleggervakt', 'akutt hjelp', 'vakttelefon'] },
  { type: 'quote_request', terms: ['be om tilbud', 'få tilbud', 'fa tilbud', 'be om pristilbud', 'få pristilbud', 'fa pristilbud', 'avtal befaring', 'gratis befaring', 'uforpliktende prat', 'uforpliktende samtale'] },
  { type: 'table_booking', terms: ['bordbestilling', 'bestill bord', 'reservér bord', 'reserver bord', 'book bord', 'booking', 'takeaway', 'catering', 'selskapslokaler', 'julebord'] },
  { type: 'booking', terms: ['bestill time', 'timebestilling', 'online booking', 'bestill', 'booking', 'book time', 'appointment', 'nye pasienter', 'ny pasient'] },
  { type: 'client_intake', terms: ['book møte', 'book mote', 'bestill konsultasjon', 'konsultasjon', 'snakk med advokat', 'vi ringer deg', 'send e-post', 'send oss en e-post'] },
  { type: 'general_contact', terms: ['kontakt oss', 'kontakt', 'ring oss', 'telefon', 'e-post', 'epost', 'mail', 'kontaktskjema', 'ta kontakt', 'hva kan vi hjelpe deg med'] },
]

function buildContactCtaProfile(input = {}) {
  const texts = normalizeArray(input.texts)
  const links = Array.isArray(input.links) ? input.links : []
  const emails = normalizeArray(input.emails)
  const phones = normalizeArray(input.phones)
  const hasForm = Boolean(input.hasForm)
  const searchable = [
    ...texts,
    ...links.flatMap((link) => [link.text, link.href]),
  ].map(normalize).filter(Boolean)
  const evidence = []
  const ctaTerms = []
  const matchedTypes = new Map()

  for (const group of TERM_GROUPS) {
    for (const term of group.terms) {
      const hit = searchable.find((value) => value.includes(normalize(term)))
      if (!hit) continue
      ctaTerms.push(term)
      if (!matchedTypes.has(group.type)) matchedTypes.set(group.type, [])
      matchedTypes.get(group.type).push(term)
      evidence.push(term)
    }
  }

  const contactMethods = []
  if (phones.length || links.some((link) => String(link.href || '').toLowerCase().startsWith('tel:'))) contactMethods.push('phone')
  if (emails.length || links.some((link) => String(link.href || '').toLowerCase().startsWith('mailto:'))) contactMethods.push('email')
  if (hasForm) contactMethods.push('form')
  if (matchedTypes.has('general_contact') || matchedTypes.has('client_intake')) contactMethods.push('contact_link')
  if (matchedTypes.has('booking') || matchedTypes.has('table_booking')) contactMethods.push('booking_link')
  if (matchedTypes.has('quote_request')) contactMethods.push('quote_request')
  if (matchedTypes.has('emergency_call')) contactMethods.push('emergency_call')

  const uniqueMethods = unique(contactMethods)
  const uniqueTerms = unique(ctaTerms)
  const verticalCtaType = chooseType(matchedTypes)
  const hasVisibleContactPath = uniqueMethods.length > 0 || uniqueTerms.length > 0
  const hasStrongPrimaryCta = Boolean(
    matchedTypes.has('booking') ||
    matchedTypes.has('table_booking') ||
    matchedTypes.has('quote_request') ||
    matchedTypes.has('emergency_call') ||
    matchedTypes.has('client_intake') ||
    uniqueMethods.length >= 2 ||
    (uniqueTerms.length >= 2 && uniqueMethods.length >= 1)
  )
  const confidence = hasStrongPrimaryCta ? 0.88 : hasVisibleContactPath ? 0.68 : 0.2

  return {
    hasVisibleContactPath,
    hasStrongPrimaryCta,
    contactMethods: uniqueMethods,
    ctaTerms: uniqueTerms.slice(0, 12),
    verticalCtaType,
    evidence: unique([...evidence, ...phones.slice(0, 1), ...emails.slice(0, 1)]).slice(0, 8),
    confidence,
  }
}

function chooseType(types) {
  for (const type of ['emergency_call', 'quote_request', 'table_booking', 'booking', 'client_intake', 'general_contact']) {
    if (types.has(type)) return type
  }
  return 'none'
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : []
}

function unique(values) {
  return [...new Set(values.map((item) => String(item || '').trim()).filter(Boolean))]
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

module.exports = { buildContactCtaProfile }
