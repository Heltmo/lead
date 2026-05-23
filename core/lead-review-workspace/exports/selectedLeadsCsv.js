const { renderCsv } = require('../readers/csv')
const { buildSuggestedAngle } = require('./suggestedAngles')

const SELECTED_LEADS_COLUMNS = [
  'id',
  'reviewStatus',
  'priority',
  'nextAction',
  'owner',
  'lastReviewedAt',
  'tags',
  'notes',
  'suggestedAngle',
  'suggestedAngleDetail',
  'rank',
  'leadScore',
  'name',
  'url',
  'title',
  'pageTitle',
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
    .map((item) => {
      const review = reviewStatus.items[item.id] || {}
      const angle = buildSuggestedAngle(item)
      return {
        id: item.id,
        reviewStatus: review.status || 'unreviewed',
        priority: review.priority || 'unset',
        nextAction: review.nextAction || 'unset',
        owner: review.owner || '',
        lastReviewedAt: review.lastReviewedAt || '',
        tags: (review.tags || []).join('|'),
        notes: review.notes || '',
        suggestedAngle: angle.suggestedAngle,
        suggestedAngleDetail: angle.suggestedAngleDetail,
        rank: item.rank,
        leadScore: item.leadScore,
        name: item.name,
        url: item.url,
        title: item.title,
        pageTitle: item.pageTitle || item.title,
        technologies: item.technologies.join('|'),
        issueCategories: formatIssueCategories(item.issueCategories),
        htmlReport: item.links.htmlReport,
        jsonArtifact: item.links.jsonArtifact,
        desktopScreenshot: item.links.desktopScreenshot,
        mobileScreenshot: item.links.mobileScreenshot,
        issues: item.issues.join('|'),
      }
    })
  return renderCsv(rows, SELECTED_LEADS_COLUMNS)
}

function formatIssueCategories(categories) {
  return Object.keys(categories || {}).sort().map((key) => key + ':' + categories[key]).join('|')
}

module.exports = { SELECTED_LEADS_COLUMNS, buildSelectedLeadsCsv }
