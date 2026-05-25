const { renderCsv } = require('../readers/csv')
const { buildSuggestedAngle, suggestAngle, suggestAngleDetail } = require('./suggestedAngles')
const { normalizeOpportunityBullets } = require('../../opportunity-bullets/opportunityBullets')
const { normalizeLeadInsight } = require('../../lead-insight-agent/leadInsightAgent')

const CRM_SHORTLISTED_COLUMNS = [
  'company',
  'website',
  'pageTitle',
  'sourcePhone',
  'address',
  'placeId',
  'rating',
  'reviewCount',
  'businessStatus',
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
  'painPointBullets',
  'suggestedOffer',
  'outreachOpener',
  'whyThisLeadMatters',
  'leadSummary',
  'whyThisLeadIsInteresting',
  'mainProblem',
  'evidenceBasedAngle',
  'callOpeningLine',
  'recommendedOffer',
  'disqualifiers',
  'insightConfidence',
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
      const opportunity = normalizeOpportunityBullets(item)
      const insight = normalizeLeadInsight(item.leadInsight || item)
      return {
        company: item.name || item.title,
        website: item.url,
        pageTitle: item.pageTitle || item.title,
        sourcePhone: item.sourceMetadata?.phone || '',
        address: item.sourceMetadata?.address || '',
        placeId: item.sourceMetadata?.placeId || '',
        rating: item.sourceMetadata?.rating || '',
        reviewCount: item.sourceMetadata?.reviewCount || '',
        businessStatus: item.sourceMetadata?.businessStatus || '',
        industry: item.sourceMetadata?.industry || '',
        location: item.sourceMetadata?.location || '',
        score: item.leadScore,
        technologies: item.technologies.join('|'),
        issueCategories: formatIssueCategories(item.issueCategories),
        topIssues: item.issues.slice(0, 5).join('|'),
        email: item.emails[0] || '',
        phone: item.sourceMetadata?.phone || item.phones[0] || '',
        reportPath: item.links.htmlReport,
        desktopScreenshotPath: item.links.desktopScreenshot,
        mobileScreenshotPath: item.links.mobileScreenshot,
        suggestedAngle: angle.suggestedAngle,
        suggestedAngleDetail: angle.suggestedAngleDetail,
        painPointBullets: opportunity.painPointBullets.join('|'),
        suggestedOffer: opportunity.suggestedOffer,
        outreachOpener: opportunity.outreachOpener,
        whyThisLeadMatters: opportunity.whyThisLeadMatters,
        leadSummary: insight.leadSummary,
        whyThisLeadIsInteresting: insight.whyThisLeadIsInteresting,
        mainProblem: insight.mainProblem,
        evidenceBasedAngle: insight.evidenceBasedAngle,
        callOpeningLine: insight.callOpeningLine,
        recommendedOffer: insight.recommendedOffer,
        disqualifiers: insight.disqualifiers.join('|'),
        insightConfidence: insight.confidence,
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
