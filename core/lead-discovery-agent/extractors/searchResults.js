function extractSearchResults(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.businesses)) return payload.businesses
  if (Array.isArray(payload.candidates)) return payload.candidates
  return []
}

module.exports = { extractSearchResults }
