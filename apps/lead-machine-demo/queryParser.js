const { demoVerticals } = require('../../core/vertical-taxonomy/verticalTaxonomy')

const VERTICALS = demoVerticals()

const KNOWN_LOCATIONS = [
  'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 'Drammen', 'Fredrikstad', 'Sarpsborg', 'Moss', 'Halden',
  'Ålesund', 'Molde', 'Kristiansund', 'Bodø', 'Tromsø', 'Alta', 'Narvik', 'Harstad', 'Hamar', 'Lillehammer',
  'Gjøvik', 'Elverum', 'Kongsvinger', 'Tønsberg', 'Sandefjord', 'Larvik', 'Skien', 'Porsgrunn', 'Arendal', 'Grimstad',
  'Mandal', 'Flekkefjord', 'Bryne', 'Sandnes', 'Haugesund', 'Karmøy', 'Stord', 'Voss', 'Førde', 'Florø',
  'Sogndal', 'Gol', 'Geilo', 'Hønefoss', 'Kongsberg', 'Notodden', 'Ringerike', 'Lillestrøm', 'Jessheim', 'Ski',
  'Asker', 'Bærum', 'Lørenskog', 'Eidsvoll', 'Ullensaker', 'Nesodden', 'Nittedal', 'Råde', 'Rygge', 'Rolvsøy',
  'Namsos', 'Steinkjer', 'Levanger', 'Stjørdal', 'Mo i Rana', 'Mosjøen', 'Brønnøysund', 'Sortland', 'Svolvær', 'Hammerfest',
]

function parseLeadQuery(rawQuery) {
  const query = String(rawQuery || '').trim().replace(/\s+/g, ' ')
  if (!query) return { ok: false, error: 'Query is required' }

  const viaI = query.match(/^(.+?)\s+(?:i|in)\s+(.+)$/i)
  if (viaI) {
    const vertical = matchVertical(viaI[1])
    if (vertical) return result(query, vertical, cleanupLocation(viaI[2]))
    const location = knownLocationFromText(viaI[2])
    const freeTextVertical = cleanupLocation(viaI[1])
    if (location && freeTextVertical) return freeTextLocationResult(query, freeTextVertical, location)
  }

  const exactVertical = matchVertical(query)
  if (exactVertical) return { ok: true, originalQuery: query, vertical: exactVertical.canonical, location: null, normalizedQuery: exactVertical.canonical }

  const phraseMatch = matchVerticalPhraseWithLocation(query)
  if (phraseMatch) return result(query, phraseMatch.vertical, phraseMatch.location)

  const freeTextLocationMatch = matchFreeTextWithKnownLocation(query)
  if (freeTextLocationMatch) return freeTextLocationResult(query, freeTextLocationMatch.vertical, freeTextLocationMatch.location)

  const tokens = query.split(' ')
  for (let i = 0; i < tokens.length; i += 1) {
    const before = tokens.slice(0, i).join(' ')
    const token = tokens[i]
    const after = tokens.slice(i + 1).join(' ')
    const vertical = matchVertical(token)
    if (!vertical) continue
    const location = cleanupLocation(before || after)
    if (location) return result(query, vertical, location)
  }

  return { ok: true, originalQuery: query, vertical: null, location: null, normalizedQuery: query, warning: 'Could not parse vertical/location deterministically' }
}

function result(originalQuery, vertical, location) {
  return {
    ok: true,
    originalQuery,
    vertical: vertical.canonical,
    location,
    normalizedQuery: `${vertical.canonical} i ${location}`,
  }
}

function freeTextLocationResult(originalQuery, vertical, location) {
  return {
    ok: true,
    originalQuery,
    vertical: null,
    freeTextVertical: vertical,
    location,
    normalizedQuery: vertical + ' i ' + location,
    warning: 'Parsed known location with free-text vertical',
  }
}

function matchVertical(value) {
  const normalized = normalize(value)
  return VERTICALS.find((item) => item.terms.some((term) => normalize(term) === normalized)) || null
}

function matchFreeTextWithKnownLocation(query) {
  const tokens = String(query || '').split(' ').filter(Boolean)
  if (tokens.length < 2) return null
  const normalizedQuery = normalize(query)
  const locations = KNOWN_LOCATIONS
    .map((location) => ({ location, normalized: normalize(location), words: normalize(location).split(' ').filter(Boolean).length }))
    .sort((a, b) => b.normalized.length - a.normalized.length)

  for (const item of locations) {
    if (!item.normalized) continue
    if (normalizedQuery.endsWith(' ' + item.normalized)) {
      const vertical = cleanupLocation(tokens.slice(0, -item.words).join(' '))
      if (vertical) return { vertical, location: item.location }
    }
    if (normalizedQuery.startsWith(item.normalized + ' ')) {
      const vertical = cleanupLocation(tokens.slice(item.words).join(' '))
      if (vertical) return { vertical, location: item.location }
    }
  }
  return null
}

function knownLocationFromText(value) {
  const normalized = normalize(value)
  const match = KNOWN_LOCATIONS.find((location) => normalize(location) === normalized)
  return match || ''
}

function matchVerticalPhraseWithLocation(query) {
  const normalizedQuery = normalize(query)
  const terms = VERTICALS.flatMap((vertical) => vertical.terms.map((term) => ({ term, vertical })))
    .sort((a, b) => b.term.length - a.term.length)
  for (const item of terms) {
    const normalizedTerm = normalize(item.term)
    if (!normalizedTerm) continue
    if (normalizedQuery.startsWith(normalizedTerm + ' ')) {
      const location = cleanupLocation(String(query || '').slice(item.term.length))
      if (location) return { vertical: item.vertical, location }
    }
    if (normalizedQuery.endsWith(' ' + normalizedTerm)) {
      const location = cleanupLocation(String(query || '').slice(0, -item.term.length))
      if (location) return { vertical: item.vertical, location }
    }
  }
  return null
}

function cleanupLocation(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

module.exports = { parseLeadQuery, VERTICALS, KNOWN_LOCATIONS }
