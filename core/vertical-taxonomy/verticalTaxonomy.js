const VERTICALS = [
  {
    canonicalVertical: 'plumber',
    discoveryCanonical: 'plumber',
    demoCanonical: 'rørlegger',
    label: 'Rørlegger',
    marketFamily: 'hands_on_local_services',
    exactTerms: ['rørlegger', 'rørleggere', 'rorlegger', 'rorleggere', 'vvs'],
    synonymTerms: ['rørleggerfirma', 'plumber', 'plumbing company'],
    broadTerms: ['bad', 'varme', 'avløp'],
    googleTypeHints: ['plumber'],
  },
  {
    canonicalVertical: 'electrician',
    discoveryCanonical: 'electrician',
    demoCanonical: 'elektriker',
    label: 'Elektriker',
    marketFamily: 'hands_on_local_services',
    exactTerms: ['elektriker', 'elektrikere'],
    synonymTerms: ['elektroinstallatør', 'elektrofirma', 'electrician', 'electrical contractor'],
    broadTerms: ['elektro'],
    googleTypeHints: ['electrician'],
  },
  {
    canonicalVertical: 'dentist',
    discoveryCanonical: 'dentist',
    demoCanonical: 'tannlege',
    label: 'Tannlege',
    marketFamily: 'health_clinic_services',
    exactTerms: ['tannlege', 'tannleger'],
    synonymTerms: ['tannklinikk', 'tannhelse', 'dentist', 'dentists', 'dental clinic'],
    broadTerms: ['dental'],
    googleTypeHints: ['dentist'],
  },
  {
    canonicalVertical: 'lawyer',
    discoveryCanonical: 'lawyer',
    demoCanonical: 'advokat',
    label: 'Advokat',
    marketFamily: 'professional_b2b_services',
    exactTerms: ['advokat', 'advokater'],
    synonymTerms: ['advokatfirma', 'juridisk', 'lawyer', 'law firm', 'attorney'],
    googleTypeHints: ['lawyer'],
  },
  {
    canonicalVertical: 'accountant',
    discoveryCanonical: 'accountant',
    demoCanonical: 'regnskapsfører',
    label: 'Regnskapsfører',
    marketFamily: 'professional_b2b_services',
    exactTerms: ['regnskapsfører', 'regnskapsførere', 'regnskapsforer', 'regnskapsforere'],
    synonymTerms: ['regnskapsbyrå', 'regnskap', 'accountant', 'accountants', 'accounting firm'],
    broadTerms: ['revisor'],
    googleTypeHints: ['accounting'],
  },
  {
    canonicalVertical: 'physiotherapist',
    discoveryCanonical: 'physiotherapist',
    demoCanonical: 'fysioterapeut',
    label: 'Fysioterapeut',
    marketFamily: 'health_clinic_services',
    exactTerms: ['fysioterapeut', 'fysioterapeuter'],
    synonymTerms: ['fysioterapiklinikk', 'physiotherapist', 'physical therapy clinic'],
    broadTerms: ['fysio'],
    googleTypeHints: ['physiotherapist'],
  },
  {
    canonicalVertical: 'restaurant',
    discoveryCanonical: 'restaurant',
    demoCanonical: 'restaurant',
    label: 'Restaurant',
    marketFamily: 'hospitality_food',
    exactTerms: ['restaurant', 'restauranter'],
    synonymTerms: ['spisested', 'dining'],
    broadTerms: ['kafe', 'cafe'],
    googleTypeHints: ['restaurant'],
  },
  {
    canonicalVertical: 'auto_repair',
    discoveryCanonical: 'auto repair',
    demoCanonical: 'bilverksted',
    label: 'Bilverksted',
    marketFamily: 'vehicle_services',
    exactTerms: ['bilverksted', 'bilverksteder', 'bilmekaniker', 'bilmekanikere'],
    synonymTerms: ['verksted', 'verksteder', 'bilservice', 'autoservice', 'auto repair', 'car repair', 'mechanic'],
    broadTerms: ['eu-kontroll', 'dekkskift', 'skadeverksted'],
    googleTypeHints: ['car_repair'],
  },
  {
    canonicalVertical: 'hair_salon',
    discoveryCanonical: 'hair salon',
    demoCanonical: 'frisør',
    label: 'Frisør',
    marketFamily: 'beauty_personal_care',
    exactTerms: ['frisør', 'frisører', 'frisor', 'frisorer'],
    synonymTerms: ['frisørsalong', 'frisorsalong', 'hair salon', 'hairdresser', 'hairdressers'],
    googleTypeHints: ['hair_care', 'hair_salon'],
  },
  {
    canonicalVertical: 'real_estate_agent',
    discoveryCanonical: 'real estate agent',
    demoCanonical: 'eiendomsmegler',
    label: 'Eiendomsmegler',
    marketFamily: 'property_home_services',
    exactTerms: ['eiendomsmegler', 'eiendomsmeglere'],
    synonymTerms: ['megler', 'meglere', 'meglerkontor', 'real estate agent', 'realtor'],
    googleTypeHints: ['real_estate_agency'],
  },
  {
    canonicalVertical: 'paintball',
    discoveryCanonical: 'paintball',
    demoCanonical: 'paintball',
    label: 'Paintball',
    marketFamily: 'event_activity',
    exactTerms: ['paintball'],
    synonymTerms: ['paintballbane', 'paintballsenter', 'paintball center', 'paintball field'],
  },
  {
    canonicalVertical: 'escape_room',
    discoveryCanonical: 'escape room',
    demoCanonical: 'escape room',
    label: 'Escape room',
    marketFamily: 'event_activity',
    exactTerms: ['escape room', 'escape rooms', 'escaperoom', 'escapreroom'],
    synonymTerms: ['rømningsrom', 'romningsrom', 'rømningsspill', 'romningsspill', 'escape game', 'escape games'],
    googleTypeHints: ['escape_room'],
  },
  {
    canonicalVertical: 'personal_trainer',
    discoveryCanonical: 'personal trainer',
    demoCanonical: 'personlig trener',
    label: 'Personlig trener',
    marketFamily: 'fitness_wellness',
    exactTerms: ['personlig trener', 'personlige trenere'],
    synonymTerms: ['pt', 'pt trener', 'pt-trener', 'personal trainer', 'fitness trainer', 'fitness coach', 'treningscoach', 'online coach'],
    broadTerms: ['treningssenter personlig trener', 'gym personal trainer', 'treningssenter', 'gym', 'fitness center'],
    weakTerms: ['trener'],
    googleTypeHints: ['gym'],
    excludedTerms: ['hundetrener', 'hundetrening', 'fotballtrener', 'håndballtrener', 'handballtrener', 'kjøreskole', 'trafikkskole', 'business coach', 'ledercoach'],
    queryTerms: ['personlig trener', 'PT', 'personal trainer', 'treningssenter personlig trener'],
  },
  {
    canonicalVertical: 'skin_care',
    discoveryCanonical: 'skin care',
    demoCanonical: 'hudpleie',
    label: 'Hudpleie',
    marketFamily: 'beauty_personal_care',
    exactTerms: ['hudpleie', 'hudklinikk', 'hudterapeut', 'hudbehandling', 'ansiktsbehandling'],
    synonymTerms: ['skjønnhetsklinikk', 'skjonnhetsklinikk', 'kosmetisk behandling', 'skin care', 'beauty clinic', 'facial treatment', 'skincare'],
    broadTerms: ['skjønnhetssalong', 'skjonnhetssalong', 'velvære', 'velvaere', 'spa', 'beauty salon'],
    weakTerms: ['hair salon', 'hair care', 'hair_care', 'frisør', 'frisørsalong', 'hairdresser'],
    googleTypeHints: ['beauty_salon', 'spa'],
    excludedTerms: ['tattoo', 'tatovør', 'tatovor', 'piercing', 'dermatolog', 'hudlege'],
    queryTerms: ['hudpleie', 'hudklinikk', 'hudterapeut', 'skjønnhetsklinikk', 'beauty salon', 'spa'],
  },
  {
    canonicalVertical: 'gym_fitness',
    discoveryCanonical: 'gym fitness',
    demoCanonical: 'treningssenter',
    label: 'Treningssenter',
    marketFamily: 'fitness_wellness',
    exactTerms: ['treningssenter', 'helsestudio'],
    synonymTerms: ['gym', 'fitness', 'fitness center', 'training center'],
    broadTerms: ['trening'],
    googleTypeHints: ['gym'],
  },
  {
    canonicalVertical: 'massage_therapy',
    discoveryCanonical: 'massage therapy',
    demoCanonical: 'massasje',
    label: 'Massasje',
    marketFamily: 'fitness_wellness',
    exactTerms: ['massasje', 'massør', 'massor', 'massører', 'massorer'],
    synonymTerms: ['massasjeterapi', 'massage therapy', 'massage therapist'],
    googleTypeHints: ['massage'],
  },
  {
    canonicalVertical: 'beauty_clinic',
    discoveryCanonical: 'beauty clinic',
    demoCanonical: 'skjønnhetsklinikk',
    label: 'Skjønnhetsklinikk',
    marketFamily: 'beauty_personal_care',
    exactTerms: ['skjønnhetsklinikk', 'skjonnhetsklinikk', 'skjønnhetssalong', 'skjonnhetssalong'],
    synonymTerms: ['beauty clinic', 'beauty salon', 'velvære', 'velvaere'],
    broadTerms: ['laserbehandling', 'kosmetisk behandling'],
    googleTypeHints: ['beauty_salon', 'spa'],
  },
  {
    canonicalVertical: 'driving_school',
    discoveryCanonical: 'driving school',
    demoCanonical: 'kjøreskole',
    label: 'Kjøreskole',
    marketFamily: 'local_services',
    exactTerms: ['kjøreskole', 'kjoereskole', 'kjoreskole', 'trafikkskole'],
    synonymTerms: ['driving school', 'driver training'],
    googleTypeHints: ['driving_school'],
  },
  {
    canonicalVertical: 'property_maintenance',
    discoveryCanonical: 'property maintenance',
    demoCanonical: 'vaktmester',
    label: 'Vaktmester',
    marketFamily: 'property_home_services',
    exactTerms: ['vaktmester', 'eiendomsdrift', 'eiendomsservice'],
    synonymTerms: ['property maintenance', 'janitorial', 'facility management'],
    broadTerms: ['byggdrift'],
  },
  {
    canonicalVertical: 'window_cleaning',
    discoveryCanonical: 'window cleaning',
    demoCanonical: 'vindusvask',
    label: 'Vindusvask',
    marketFamily: 'property_home_services',
    exactTerms: ['vindusvask', 'vinduspuss'],
    synonymTerms: ['window cleaning', 'window cleaner'],
    broadTerms: ['renhold'],
  },
  {
    canonicalVertical: 'boat_service',
    discoveryCanonical: 'boat service',
    demoCanonical: 'båtservice',
    label: 'Båtservice',
    marketFamily: 'vehicle_services',
    exactTerms: ['båtservice', 'batservice', 'båtreparasjon', 'batreparasjon'],
    synonymTerms: ['båtopplag', 'batopplag', 'marina', 'boat service', 'boat repair', 'boat storage'],
    broadTerms: ['verksted båt', 'verksted bat'],
  },
  {
    canonicalVertical: 'photographer',
    discoveryCanonical: 'photographer',
    demoCanonical: 'fotograf',
    label: 'Fotograf',
    marketFamily: 'event_activity',
    exactTerms: ['fotograf', 'fotografer'],
    synonymTerms: ['photographer', 'photo studio', 'fotostudio'],
    googleTypeHints: ['photographer'],
  },
]

const NORMALIZED_VERTICALS = VERTICALS.map(normalizeProfile)
const PROFILES = new Map(NORMALIZED_VERTICALS.map((profile) => [profile.canonicalVertical, profile]))
const DISCOVERY_INDEX = buildIndex((profile) => [profile.discoveryCanonical, profile.canonicalVertical, profile.demoCanonical, ...allTerms(profile)])
const DEMO_INDEX = buildIndex((profile) => [profile.demoCanonical, ...profile.exactTerms, ...profile.synonymTerms])

function normalizeVerticalTerm(term) {
  const profile = findVerticalProfile(term)
  return profile ? profile.canonicalVertical : null
}

function detectVerticalFromQuery(query) {
  const normalized = normalizeVerticalText(query)
  const terms = verticalTermEntries().sort((a, b) => b.normalized.length - a.normalized.length)
  for (const entry of terms) {
    if (normalized === entry.normalized || normalized.startsWith(entry.normalized + ' ') || normalized.endsWith(' ' + entry.normalized)) {
      return { canonicalVertical: entry.profile.canonicalVertical, matchedTerm: entry.term, profile: entry.profile }
    }
  }
  return null
}

function getVerticalProfile(value) {
  return findVerticalProfile(value)
}

function expandQueryTerms(value) {
  const profile = findVerticalProfile(value)
  if (!profile) return []
  return uniqueText(profile.queryTerms.length ? profile.queryTerms : [...profile.exactTerms, ...profile.synonymTerms, ...profile.broadTerms])
}

function getMarketFamily(value) {
  return findVerticalProfile(value)?.marketFamily || null
}

function getSellerIntentWeight(value, sellerIntent) {
  const profile = findVerticalProfile(value)
  if (!profile) return 'medium'
  return profile.sellerIntentWeights?.[sellerIntent] || 'medium'
}

function isExcludedCategory(candidateText, value) {
  const profile = findVerticalProfile(value)
  const haystack = normalizeVerticalText(candidateText)
  const excluded = profile ? profile.excludedTerms : VERTICALS.flatMap((item) => item.excludedTerms || [])
  return excluded.some((term) => termMatches(haystack, normalizeVerticalText(term)))
}

function demoVerticals() {
  return NORMALIZED_VERTICALS.map((profile) => ({
    canonical: profile.demoCanonical,
    terms: uniqueText([profile.demoCanonical, ...profile.exactTerms, ...profile.synonymTerms]),
  }))
}

function discoveryVerticalEntries() {
  return NORMALIZED_VERTICALS.map((profile) => ({
    canonical: profile.discoveryCanonical,
    norwegian: uniqueText([...profile.exactTerms, ...profile.synonymTerms, ...profile.broadTerms].filter((term) => !looksEnglish(term))),
    english: uniqueText([profile.discoveryCanonical, ...profile.synonymTerms, ...profile.broadTerms].filter((term) => looksEnglish(term) || /^[a-z0-9\s-]+$/i.test(term))),
    queryTerms: expandQueryTerms(profile.canonicalVertical),
    searchPatterns: ['{term} {location}', '{term} i {location}', '{location} {term}'],
  }))
}

function termsForDiscoveryIndustry(value) {
  const profile = findVerticalProfile(value)
  return profile ? uniqueText([profile.discoveryCanonical, profile.demoCanonical, ...allTerms(profile)]) : []
}

function classifyVerticalCandidate(candidate = {}, context = {}) {
  const profile = findVerticalProfile(context.canonicalIndustry || context.industry)
  if (!profile) return null
  const haystack = normalizeVerticalText([
    candidate.businessName,
    candidate.legalName,
    candidate.candidateLegalName,
    candidate.description,
    Array.isArray(candidate.providerTypes) ? candidate.providerTypes.join(' ') : '',
    candidate.website,
  ].filter(Boolean).join(' '))
  const providerTypes = normalizeVerticalText(Array.isArray(candidate.providerTypes) ? candidate.providerTypes.join(' ') : '')
  const excluded = firstMatchingTerm(haystack, profile.excludedTerms)
  if (excluded) return { matches: false, status: 'unknown', matchedTerm: excluded, reasons: ['excluded_vertical_term:' + excluded], warnings: ['vertical_exclusion'] }

  const exact = firstMatchingTerm(haystack, profile.exactTerms)
  if (exact) return verticalResult('exact', exact, ['matched_exact_vertical_term:' + exact])
  const synonym = firstMatchingTerm(haystack, profile.synonymTerms)
  if (synonym) return verticalResult('synonym', synonym, ['matched_synonym_vertical_term:' + synonym])
  const typeHint = firstMatchingTerm(providerTypes, profile.googleTypeHints)
  if (typeHint) return verticalResult('broad', typeHint, ['matched_google_type:' + typeHint])
  const broad = firstMatchingTerm(haystack, profile.broadTerms)
  if (broad) return verticalResult('broad', broad, ['matched_broad_vertical_term:' + broad])
  const weak = firstMatchingTerm(haystack, profile.weakTerms)
  if (weak) return verticalResult('weak', weak, ['matched_weak_vertical_term:' + weak], ['vertical_match_is_weak'])

  return { matches: false, status: 'unknown', matchedTerm: '', reasons: ['no_vertical_signal'], warnings: [] }
}

function findVerticalProfile(value) {
  const direct = PROFILES.get(String(value || '').trim())
  if (direct) return direct
  const normalized = normalizeVerticalText(value)
  if (!normalized) return null
  const key = DISCOVERY_INDEX.get(normalized) || DEMO_INDEX.get(normalized)
  return key ? PROFILES.get(key) : null
}

function verticalTermEntries() {
  return NORMALIZED_VERTICALS.flatMap((profile) => uniqueText([profile.demoCanonical, profile.discoveryCanonical, ...profile.exactTerms, ...profile.synonymTerms])
    .map((term) => ({ term, normalized: normalizeVerticalText(term), profile: PROFILES.get(profile.canonicalVertical) })))
}

function firstMatchingTerm(haystack, terms = []) {
  const normalizedTerms = uniqueText(terms).map((term) => ({ term, normalized: normalizeVerticalText(term) }))
  for (const item of normalizedTerms.sort((a, b) => b.normalized.length - a.normalized.length)) {
    if (termMatches(haystack, item.normalized)) return item.term
  }
  return ''
}

function verticalResult(status, matchedTerm, reasons, warnings = []) {
  return { matches: true, status, matchedTerm, reasons, warnings }
}

function termMatches(haystack, term) {
  if (!haystack || !term) return false
  if (haystack === term) return true
  if (haystack.includes(term)) return true
  const compactHaystack = haystack.replace(/\s+/g, '')
  const compactTerm = term.replace(/\s+/g, '')
  return compactTerm.length > 2 && compactHaystack.includes(compactTerm)
}

function allTerms(profile = {}) {
  return uniqueText([
    ...(profile.exactTerms || []),
    ...(profile.synonymTerms || []),
    ...(profile.broadTerms || []),
    ...(profile.weakTerms || []),
    ...(profile.googleTypeHints || []),
    ...(profile.queryTerms || []),
  ])
}

function buildIndex(termFactory) {
  const index = new Map()
  for (const profile of NORMALIZED_VERTICALS) {
    for (const term of uniqueText(termFactory(profile))) {
      const normalized = normalizeVerticalText(term)
      if (normalized && !index.has(normalized)) index.set(normalized, profile.canonicalVertical)
    }
  }
  return index
}

function normalizeProfile(profile) {
  return {
    exactTerms: [],
    synonymTerms: [],
    broadTerms: [],
    weakTerms: [],
    googleTypeHints: [],
    excludedTerms: [],
    queryTerms: [],
    sellerIntentWeights: {},
    ...profile,
  }
}

function normalizeVerticalText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/_/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksEnglish(term = '') {
  return /[a-z]/i.test(term) && !/[æøå]/i.test(term) && !/(rør|fø|skjø|kjø|båt|vaktmester|vindus|hud|tann|advokat|regnskap|fris|eiendom|massør)/i.test(term)
}

function uniqueText(values = []) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const text = String(value || '').trim()
    const key = normalizeVerticalText(text)
    if (!text || !key || seen.has(key)) continue
    seen.add(key)
    result.push(text)
  }
  return result
}

module.exports = {
  VERTICALS: NORMALIZED_VERTICALS,
  normalizeVerticalTerm,
  detectVerticalFromQuery,
  getVerticalProfile,
  expandQueryTerms,
  getMarketFamily,
  getSellerIntentWeight,
  isExcludedCategory,
  demoVerticals,
  discoveryVerticalEntries,
  termsForDiscoveryIndustry,
  classifyVerticalCandidate,
  normalizeVerticalText,
}
