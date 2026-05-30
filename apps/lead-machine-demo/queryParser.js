const VERTICALS = [
  { terms: ['rørlegger', 'rørleggere', 'rorlegger', 'rorleggere'], canonical: 'rørlegger' },
  { terms: ['advokat', 'advokater'], canonical: 'advokat' },
  { terms: ['tannlege', 'tannleger'], canonical: 'tannlege' },
  { terms: ['elektriker', 'elektrikere'], canonical: 'elektriker' },
  { terms: ['regnskapsfører', 'regnskapsførere', 'regnskapsforer', 'regnskapsforere'], canonical: 'regnskapsfører' },
  { terms: ['fysioterapeut', 'fysioterapeuter'], canonical: 'fysioterapeut' },
  { terms: ['restaurant', 'restauranter'], canonical: 'restaurant' },
  { terms: ['bilverksted', 'bilverksteder', 'verksted', 'verksteder'], canonical: 'bilverksted' },
  { terms: ['frisør', 'frisører', 'frisor', 'frisorer'], canonical: 'frisør' },
  { terms: ['eiendomsmegler', 'eiendomsmeglere', 'megler', 'meglere'], canonical: 'eiendomsmegler' },
  { terms: ['paintball'], canonical: 'paintball' },
  { terms: ['escape room', 'escape rooms', 'escaperoom', 'escapreroom', 'rømningsrom', 'romningsrom', 'rømningsspill', 'romningsspill'], canonical: 'escape room' },
]

function parseLeadQuery(rawQuery) {
  const query = String(rawQuery || '').trim().replace(/\s+/g, ' ')
  if (!query) return { ok: false, error: 'Query is required' }

  const viaI = query.match(/^(.+?)\s+(?:i|in)\s+(.+)$/i)
  if (viaI) {
    const vertical = matchVertical(viaI[1])
    if (vertical) return result(query, vertical, cleanupLocation(viaI[2]))
  }

  const exactVertical = matchVertical(query)
  if (exactVertical) return { ok: true, originalQuery: query, vertical: exactVertical.canonical, location: null, normalizedQuery: exactVertical.canonical }

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

function matchVertical(value) {
  const normalized = normalize(value)
  return VERTICALS.find((item) => item.terms.some((term) => normalize(term) === normalized)) || null
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

module.exports = { parseLeadQuery, VERTICALS }
