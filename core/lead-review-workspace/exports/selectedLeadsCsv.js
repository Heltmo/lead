const { renderCsv } = require('../readers/csv')
const { buildSuggestedAngle } = require('./suggestedAngles')
const { normalizeOpportunityBullets } = require('../../opportunity-bullets/opportunityBullets')
const { normalizeLeadInsight } = require('../../lead-insight-agent/leadInsightAgent')

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
  'businessSignals',
  'businessContradictions',
  'topOpportunities',
  'rank',
  'leadScore',
  'name',
  'url',
  'title',
  'pageTitle',
  'sourcePhone',
  'address',
  'placeId',
  'rating',
  'reviewCount',
  'businessStatus',
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
      const opportunity = normalizeOpportunityBullets(item)
      const insight = normalizeLeadInsight(item.leadInsight || item)
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
        businessSignals: formatBusinessSignals(item.businessSignalProfile),
        businessContradictions: formatBusinessContradictions(item.businessSignalProfile),
        topOpportunities: formatTopOpportunities(item.businessSignalProfile),
        rank: item.rank,
        leadScore: item.leadScore,
        name: item.name,
        url: item.url,
        title: item.title,
        pageTitle: item.pageTitle || item.title,
        sourcePhone: item.sourceMetadata?.phone || '',
        address: item.sourceMetadata?.address || '',
        placeId: item.sourceMetadata?.placeId || '',
        rating: item.sourceMetadata?.rating || '',
        reviewCount: item.sourceMetadata?.reviewCount || '',
        businessStatus: item.sourceMetadata?.businessStatus || '',
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

function formatBusinessSignals(profile = {}) {
  return (profile.signals || []).map((item) => [item.id, item.category, item.strength, item.confidence].join(':')).join('|')
}

function formatBusinessContradictions(profile = {}) {
  return (profile.contradictions || []).map((item) => [item.id, item.opportunity, item.strength].join(':')).join('|')
}

function formatTopOpportunities(profile = {}) {
  return (profile.topOpportunities || []).map((item) => [item.id, item.score].join(':')).join('|')
}

function formatIssueCategories(categories) {
  return Object.keys(categories || {}).sort().map((key) => key + ':' + categories[key]).join('|')
}

module.exports = { SELECTED_LEADS_COLUMNS, buildSelectedLeadsCsv }
