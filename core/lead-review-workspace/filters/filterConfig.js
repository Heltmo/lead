function buildFilterConfig(items) {
  const technologies = uniqueFlat(items.map((item) => item.technologies))
  const issueCategories = [...new Set(items.flatMap((item) => Object.keys(item.issueCategories || {})))].sort()
  return {
    scoreRanges: ['all', '80-100', '60-79', '40-59', '0-39'],
    reviewStatuses: ['all', 'unreviewed', 'reviewed', 'shortlisted', 'rejected'],
    technologies: ['all', ...technologies],
    issueCategories: ['all', ...issueCategories],
  }
}

function uniqueFlat(values) {
  return [...new Set(values.flatMap((value) => Array.isArray(value) ? value : String(value || '').split('|')).map((value) => String(value).trim()).filter(Boolean))].sort()
}

module.exports = { buildFilterConfig }
