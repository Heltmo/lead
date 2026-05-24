const { renderCsv } = require('../readers/csv')
const { buildSuggestedAngle, suggestAngle, suggestAngleDetail } = require('./suggestedAngles')

const CRM_SHORTLISTED_COLUMNS = [
  'company',
  'website',
  'pageTitle',
  'industry',
  'location',
  'score',
  'technologies',
  'issueCategories',
  'topIssues',
  'email',
  'phone',
  'reportPath',
  'desktopScreenshotPath',
  'mobileScreenshotPath',
  'suggestedAngle',
  'suggestedAngleDetail',
  'reviewStatus',
  'priority',
  'nextAction',
  'owner',
  'lastReviewedAt',
  'tags',
  'notes',
]

function buildCrmShortlistedCsv(items, reviewStatus) {
  const rows = items
    .filter((item) => reviewStatus.items[item.id]?.status === 'shortlisted')
    .map((item) => {
      const review = reviewStatus.items[item.id] || {}
      const angle = buildSuggestedAngle(item)
      return {
        company: item.name || item.title,
        website: item.url,
        pageTitle: item.pageTitle || item.title,
        industry: item.sourceMetadata?.industry || '',
        location: item.sourceMetadata?.location || '',
        score: item.leadScore,
        technologies: item.technologies.join('|'),
        issueCategories: formatIssueCategories(item.issueCategories),
        topIssues: item.issues.slice(0, 5).join('|'),
        email: item.emails[0] || '',
        phone: item.phones[0] || '',
        reportPath: item.links.htmlReport,
        desktopScreenshotPath: item.links.desktopScreenshot,
        mobileScreenshotPath: item.links.mobileScreenshot,
        suggestedAngle: angle.suggestedAngle,
        suggestedAngleDetail: angle.suggestedAngleDetail,
        reviewStatus: review.status || 'unreviewed',
        priority: review.priority || 'unset',
        nextAction: review.nextAction || 'unset',
        owner: review.owner || '',
        lastReviewedAt: review.lastReviewedAt || '',
        tags: (review.tags || []).join('|'),
        notes: review.notes || '',
      }
    })
  return renderCsv(rows, CRM_SHORTLISTED_COLUMNS)
}

function formatIssueCategories(categories) {
  return Object.keys(categories || {}).sort().map((key) => key + ':' + categories[key]).join('|')
}

module.exports = { CRM_SHORTLISTED_COLUMNS, buildCrmShortlistedCsv, suggestAngle, suggestAngleDetail, buildSuggestedAngle }
