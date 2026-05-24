const fs = require('fs')
const path = require('path')
const { renderCsv } = require('../lead-review-workspace/readers/csv')
const { readRunArtifacts } = require('../lead-review-workspace/readers/runArtifacts')
const { mergeReviewStatus } = require('../lead-review-workspace/state/reviewStatus')
const { buildSuggestedAngle } = require('../lead-review-workspace/exports/suggestedAngles')
const { CRM_SHORTLISTED_COLUMNS } = require('../lead-review-workspace/exports/crmShortlistedCsv')
const { normalizeOpportunityBullets } = require('../opportunity-bullets/opportunityBullets')
const { generateLeadDemo, slugify } = require('./generateLeadDemo')

function generateDemoForLead(options = {}) {
  const summaryPath = path.resolve(required(options.run, 'run'))
  const leadQuery = required(options.lead, 'lead')
  const artifacts = readRunArtifacts({ summaryPath, leadsCsvPath: options.leadsCsvPath })
  const reviewStatusPath = path.resolve(options.statusPath || path.join(artifacts.runDir, 'review-workspace', 'review-status.json'))
  const reviewStatus = loadReviewStatus(reviewStatusPath, artifacts.items)
  const selection = resolveSelectedLead(artifacts.items, reviewStatus, leadQuery)
  const row = buildDemoRow(selection.item, selection.review)
  const runId = artifacts.summary.runId || path.basename(artifacts.runDir)
  const outRoot = path.resolve(options.out || path.join(__dirname, '..', '..', 'generated', 'demos'))
  const tempCsvPath = writeDemoSourceCsv({ row, runId, outRoot })
  const demo = generateLeadDemo({ shortlistPath: tempCsvPath, runId, outRoot, index: 1 })
  const manifest = enrichManifest({
    manifestPath: demo.manifestPath,
    artifacts,
    item: selection.item,
    review: selection.review,
    reviewStatusPath,
    tempCsvPath,
  })
  return {
    ...demo,
    manifest,
    selectedLead: {
      id: selection.item.id,
      name: selection.item.name,
      url: selection.item.url,
      reviewStatus: selection.review.status || 'unreviewed',
    },
    sourceCsvPath: tempCsvPath,
  }
}

function resolveSelectedLead(items, reviewStatus, leadQuery) {
  const matches = items.filter((item) => leadMatches(item, leadQuery)).map((item) => ({ item, review: reviewStatus.items[item.id] || {} }))
  if (!matches.length) throw new Error('No lead matched "' + leadQuery + '"')
  const shortlisted = matches.filter((match) => match.review.status === 'shortlisted')
  const candidates = shortlisted.length ? shortlisted : matches
  if (candidates.length > 1) {
    const exact = candidates.filter((match) => exactLeadMatch(match.item, leadQuery))
    if (exact.length === 1) return exact[0]
    throw new Error('Lead selector "' + leadQuery + '" is ambiguous: ' + candidates.map((match) => match.item.id + ':' + (match.item.name || match.item.url)).join(', '))
  }
  return candidates[0]
}

function leadMatches(item, query) {
  const needle = normalizeText(query)
  return leadValues(item).some((value) => normalizeText(value).includes(needle))
}

function exactLeadMatch(item, query) {
  const needle = normalizeText(query)
  return leadValues(item).some((value) => normalizeText(value) === needle)
}

function leadValues(item) {
  const host = domainFromUrl(item.url)
  return [
    item.id,
    item.name,
    item.title,
    item.pageTitle,
    item.url,
    host,
    item.sourceMetadata?.businessName,
  ].filter(Boolean)
}

function buildDemoRow(item, review = {}) {
  const angle = buildSuggestedAngle(item)
  const opportunity = normalizeOpportunityBullets(item)
  return {
    company: item.name || item.sourceMetadata?.businessName || item.title || domainFromUrl(item.url) || item.url,
    website: item.url,
    pageTitle: item.pageTitle || item.title || '',
    industry: item.sourceMetadata?.industry || '',
    location: item.sourceMetadata?.location || '',
    score: item.leadScore,
    technologies: item.technologies.join('|'),
    issueCategories: formatCounts(item.issueCategories),
    topIssues: item.issues.slice(0, 5).join('|'),
    email: item.emails[0] || '',
    phone: item.phones[0] || '',
    reportPath: item.links.htmlReport,
    desktopScreenshotPath: item.links.desktopScreenshot,
    mobileScreenshotPath: item.links.mobileScreenshot,
    suggestedAngle: angle.suggestedAngle,
    suggestedAngleDetail: angle.suggestedAngleDetail,
    painPointBullets: opportunity.painPointBullets.join('|'),
    suggestedOffer: opportunity.suggestedOffer,
    outreachOpener: opportunity.outreachOpener,
    whyThisLeadMatters: opportunity.whyThisLeadMatters,
    reviewStatus: review.status || 'unreviewed',
    priority: review.priority || 'unset',
    nextAction: review.nextAction || 'unset',
    owner: review.owner || '',
    lastReviewedAt: review.lastReviewedAt || '',
    tags: (review.tags || []).join('|'),
    notes: review.notes || '',
  }
}

function writeDemoSourceCsv({ row, runId, outRoot }) {
  const sourceDir = path.join(outRoot, slugify(runId), '_sources')
  fs.mkdirSync(sourceDir, { recursive: true })
  const csvPath = path.join(sourceDir, slugify(row.company) + '.csv')
  fs.writeFileSync(csvPath, renderCsv([row], CRM_SHORTLISTED_COLUMNS))
  return csvPath
}

function enrichManifest({ manifestPath, artifacts, item, review, reviewStatusPath, tempCsvPath }) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.source = {
    ...manifest.source,
    type: 'selected-run-lead',
    summaryPath: artifacts.summaryPath,
    leadsCsvPath: artifacts.leadsCsvPath,
    reviewStatusPath,
    sourceCsvPath: tempCsvPath,
    itemId: item.id,
    reviewStatus: review.status || 'unreviewed',
  }
  manifest.audit = {
    reportPath: item.links.jsonArtifact,
    htmlReportPath: item.links.htmlReport,
    desktopScreenshotPath: item.links.desktopScreenshot,
    mobileScreenshotPath: item.links.mobileScreenshot,
  }
  manifest.generatedAt = new Date().toISOString()
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  return manifest
}

function loadReviewStatus(statusPath, items) {
  if (!fs.existsSync(statusPath)) return mergeReviewStatus({}, items)
  return mergeReviewStatus(JSON.parse(fs.readFileSync(statusPath, 'utf8')), items)
}

function formatCounts(counts) {
  return Object.keys(counts || {}).sort().map((key) => key + ':' + counts[key]).join('|')
}

function domainFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function required(value, name) {
  if (!value) throw new Error(name + ' is required')
  return value
}

module.exports = { generateDemoForLead, resolveSelectedLead, buildDemoRow }
