const { renderCsv } = require('../readers/csv')

const CRM_SHORTLISTED_COLUMNS = [
  'company',
  'website',
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
  'reviewStatus',
  'notes',
]

function buildCrmShortlistedCsv(items, reviewStatus) {
  const rows = items
    .filter((item) => reviewStatus.items[item.id]?.status === 'shortlisted')
    .map((item) => {
      const review = reviewStatus.items[item.id] || {}
      return {
        company: item.name || item.title,
        website: item.url,
        score: item.leadScore,
        technologies: item.technologies.join('|'),
        issueCategories: formatIssueCategories(item.issueCategories),
        topIssues: item.issues.slice(0, 5).join('|'),
        email: item.emails[0] || '',
        phone: item.phones[0] || '',
        reportPath: item.links.htmlReport,
        desktopScreenshotPath: item.links.desktopScreenshot,
        mobileScreenshotPath: item.links.mobileScreenshot,
        suggestedAngle: suggestAngle(item),
        reviewStatus: review.status || 'unreviewed',
        notes: review.notes || '',
      }
    })
  return renderCsv(rows, CRM_SHORTLISTED_COLUMNS)
}

function suggestAngle(item) {
  const issues = item.issues.join(' ').toLowerCase()
  const categories = item.issueCategories || {}
  const responseStatus = Number(item.performance?.responseStatus || 0)
  if (responseStatus === 404 || issues.includes('404') || issues.includes('failed request') || issues.includes('unavailable')) return 'Website availability issue'
  if ((categories.conversion || 0) > 0 && (categories.contactability || 0) > 0) return 'Conversion/contactability gap'
  if ((categories.seo || 0) > 0 || issues.includes('meta description') || issues.includes('h1')) return 'SEO foundation gap'
  if ((categories.accessibility || 0) > 0 || issues.includes('accessibility')) return 'Accessibility/usability improvement'
  if ((categories.performance || 0) > 0 || (categories.technical || 0) > 0 || issues.includes('console') || issues.includes('performance')) return 'Technical performance issue'
  return 'General website improvement opportunity'
}

function formatIssueCategories(categories) {
  return Object.keys(categories || {}).sort().map((key) => `${key}:${categories[key]}`).join('|')
}

module.exports = { CRM_SHORTLISTED_COLUMNS, buildCrmShortlistedCsv, suggestAngle }
