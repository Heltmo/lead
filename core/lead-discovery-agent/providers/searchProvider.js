const { loadDiscoverySources } = require('./sourceImporters')

function loadFixedSearchResults(sourceFile, filters = {}) {
  return loadDiscoverySources([sourceFile], filters)
}

module.exports = { loadFixedSearchResults, loadDiscoverySources }
