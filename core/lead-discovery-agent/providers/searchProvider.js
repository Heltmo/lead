const fs = require('fs')
const { extractSearchResults } = require('../extractors/searchResults')

function loadFixedSearchResults(sourceFile, filters = {}) {
  const payload = JSON.parse(fs.readFileSync(sourceFile, 'utf8'))
  const rows = extractSearchResults(payload)
  return rows.filter((row) => matchesFilter(row, filters))
}

function matchesFilter(row, filters) {
  const industry = String(row.industry || '').toLowerCase()
  const location = String(row.location || '').toLowerCase()
  const requestedIndustry = String(filters.industry || '').toLowerCase()
  const requestedLocation = String(filters.location || '').toLowerCase()
  if (requestedIndustry && industry && !industry.includes(requestedIndustry.replace(/s$/, ''))) return false
  if (requestedLocation && location && !location.includes(requestedLocation)) return false
  return true
}

module.exports = { loadFixedSearchResults }
