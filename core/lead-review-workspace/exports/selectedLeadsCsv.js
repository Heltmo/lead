const { renderCsv } = require('../readers/csv')

const SELECTED_LEADS_COLUMNS = [
  'id',
  'reviewStatus',
  'notes',
  'rank',
  'leadScore',
  'name',
  'url',
  'title',
  'technologies',
  'issueCategories',
  'htmlReport',
  'jsonArtifact',
  'desktopScreenshot',
  'mobileScreenshot',
  'issues',
]

function buildSelectedLeadsCsv(items, reviewStatus) {
  const rows = items
    .filter((item) => reviewStatus.items[item.id]?.status === 'shortlisted')
    .map((item) => ({
      id: item.id,
      reviewStatus: reviewStatus.items[item.id]?.status || 'unreviewed',
      notes: reviewStatus.items[item.id]?.notes || '',
      rank: item.rank,
      leadScore: item.leadScore,
      name: item.name,
      url: item.url,
      title: item.title,
      technologies: item.technologies.join('|'),
      issueCategories: Object.keys(item.issueCategories).sort().map((key) => `${key}:${item.issueCategories[key]}`).join('|'),
      htmlReport: item.links.htmlReport,
      jsonArtifact: item.links.jsonArtifact,
      desktopScreenshot: item.links.desktopScreenshot,
      mobileScreenshot: item.links.mobileScreenshot,
      issues: item.issues.join('|'),
    }))
  return renderCsv(rows, SELECTED_LEADS_COLUMNS)
}

module.exports = { SELECTED_LEADS_COLUMNS, buildSelectedLeadsCsv }
