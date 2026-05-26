const { buildContactCtaProfile } = require('../website-audit-agent/extractors/contactCtaProfile')
const DEFAULT_PAIN_POINTS = [
  'The audit found measurable website friction that gives outreach a concrete starting point.',
  'The current page leaves room to make the next customer action clearer and easier to complete.',
  'The site has deterministic improvement signals that can be turned into a focused sales conversation.',
]

function buildOpportunityBullets(input = {}) {
  const evidence = collectEvidence(input)
  const selected = selectPainRules(evidence)
  const painPointBullets = selected.map((rule) => rule.pain(evidence))

  while (painPointBullets.length < 3) {
    const fallback = DEFAULT_PAIN_POINTS[painPointBullets.length]
    if (!painPointBullets.includes(fallback)) painPointBullets.push(fallback)
    else break
  }

  return {
    painPointBullets: painPointBullets.slice(0, 3),
    suggestedOffer: suggestedOffer(evidence, selected[0]?.id),
    outreachOpener: outreachOpener(evidence, selected[0]),
    whyThisLeadMatters: whyThisLeadMatters(evidence, selected),
  }
}

function normalizeOpportunityBullets(input = {}) {
  const source = input.opportunityBullets || input.opportunity || input
  const existingPainPoints = normalizeArray(source.painPointBullets || source.painPoints)
  const hasCompleteExisting =
    existingPainPoints.length >= 3 &&
    source.suggestedOffer &&
    source.outreachOpener &&
    source.whyThisLeadMatters

  if (hasCompleteExisting && !shouldRebuildForSuppressedCta(input, existingPainPoints)) {
    return {
      painPointBullets: existingPainPoints.slice(0, 3),
      suggestedOffer: String(source.suggestedOffer),
      outreachOpener: String(source.outreachOpener),
      whyThisLeadMatters: String(source.whyThisLeadMatters),
    }
  }

  return buildOpportunityBullets(input)
}

function shouldRebuildForSuppressedCta(input, painPoints) {
  const signal = (input.businessSignalProfile?.signals || []).find((entry) => entry.id === 'visible_contact_cta_path')
  const strongContact = Boolean(signal?.observation?.hasStrongPrimaryCta)
  if (!strongContact) return false
  return painPoints.some((point) => /no clear cta|clear primary cta|booking or enquiry intent leak|visitors do not get a clear next step/i.test(String(point || '')))
}

function collectEvidence(input) {
  const categories = input.issueCategories || input.issueClassification?.counts || {}
  const severities = input.issueSeverities || input.issueClassification?.severityCounts || {}
  const signals = input.signals || {}
  const issueTexts = normalizeArray(input.issues)
    .concat(normalizeArray(input.leadQuality?.issues))
    .concat(normalizeArray(input.errors).map((error) => typeof error === 'string' ? error : error.message))
    .concat(normalizeArray(input.issueClassification?.issues).map((issue) => issue.label || issue.detail || issue.category))
    .filter(Boolean)
  const issueText = issueTexts.join(' ').toLowerCase()
  const emails = normalizeArray(input.emails ?? signals.emails)
  const phones = normalizeArray(input.phones ?? signals.phones)
  const ctas = normalizeArray(input.ctas ?? signals.ctas)
  const pageSignals = input.pageSignals || signals
  const contactProfile = contactCtaProfile(input, pageSignals, emails, phones)
  const technologies = normalizeTechnologies(input.technologies ?? input.technology?.technologies)
  const performance = normalizePerformance(input.performance)
  const sourceMetadata = input.sourceMetadata || {}
  const hasCtaSignal = Array.isArray(input.ctas) || Array.isArray(signals.ctas)
  const hasContactSignal = Array.isArray(input.emails) || Array.isArray(input.phones) || Array.isArray(signals.emails) || Array.isArray(signals.phones)
  const primaryTechnology = technologies[0] || ''

  return {
    name: input.name || input.businessName || sourceMetadata.businessName || input.title || input.pageTitle || 'this lead',
    location: input.location || sourceMetadata.location || '',
    industry: input.industry || sourceMetadata.industry || '',
    leadScore: numeric(input.leadScore ?? input.leadQuality?.score, 0),
    categories,
    severities,
    issueTexts,
    issueText,
    emails,
    phones,
    ctas,
    technologies,
    primaryTechnology,
    technologyLabel: primaryTechnology ? `${primaryTechnology} site` : 'site',
    responseStatus: performance.responseStatus,
    failedRequestCount: performance.failedRequestCount,
    consoleErrorCount: performance.consoleErrorCount,
    loadMs: performance.loadMs,
    transferSizeBytes: performance.transferSizeBytes,
    missingCta: ((categories.conversion || 0) > 0 || includesAny(issueText, ['no clear cta', 'missing cta']) || (hasCtaSignal && ctas.length === 0)) && !contactProfile.hasStrongPrimaryCta,
    missingContact: ((categories.contactability || 0) > 0 || includesAny(issueText, ['no email or phone', 'contactability']) || (hasContactSignal && emails.length === 0 && phones.length === 0)) && !contactProfile.hasVisibleContactPath,
    hasSeo: (categories.seo || 0) > 0 || includesAny(issueText, ['meta description', 'h1', 'seo']),
    hasAccessibility: (categories.accessibility || 0) > 0 || includesAny(issueText, ['accessibility', 'axe violation']),
    hasPerformance: (categories.performance || 0) > 0 || includesAny(issueText, ['slow', 'page transfer size', 'oversized image', 'performance']) || performance.loadMs > 3000 || performance.transferSizeBytes > 1500000,
    hasFailedRequests: performance.responseStatus >= 400 || performance.failedRequestCount > 0 || includesAny(issueText, ['failed network request', 'failed request', 'http status']),
    hasConsoleErrors: performance.consoleErrorCount > 0 || issueText.includes('console error'),
    hasTechnologyGap: technologies.length === 0 || issueText.includes('no recognized technology stack'),
  }
}

function selectPainRules(evidence) {
  const rules = [
    {
      id: 'availability',
      active: evidence.responseStatus >= 400,
      pain: (item) => `The website returned HTTP ${item.responseStatus}, so visitors may hit an availability problem before they can contact the business.`,
    },
    {
      id: 'cta-contact',
      active: evidence.missingCta && evidence.missingContact,
      pain: () => 'Visitors do not get a clear next step, and the page does not expose an obvious email or phone path.',
    },
    {
      id: 'cta',
      active: evidence.missingCta,
      pain: () => 'The page does not expose a clear primary CTA, which can make booking or enquiry intent leak away.',
    },
    {
      id: 'contactability',
      active: evidence.missingContact,
      pain: () => 'Contact details are hard to detect, so ready-to-buy visitors may not find a direct way to reach the business.',
    },
    {
      id: 'failed-requests',
      active: evidence.hasFailedRequests,
      pain: (item) => `The browser observed ${item.failedRequestCount || 'one or more'} failed request(s), which can break parts of the customer journey.`,
    },
    {
      id: 'seo',
      active: evidence.hasSeo,
      pain: () => 'Basic SEO structure is weak, so the page may be harder to understand in search results and local discovery.',
    },
    {
      id: 'accessibility',
      active: evidence.hasAccessibility,
      pain: () => 'Accessibility issues may make the page harder to use and reduce trust for visitors who need clear, readable content.',
    },
    {
      id: 'performance',
      active: evidence.hasPerformance,
      pain: (item) => `The ${item.technologyLabel} shows performance or asset issues that may make mobile browsing feel slower than expected.`,
    },
    {
      id: 'browser-errors',
      active: evidence.hasConsoleErrors,
      pain: (item) => `The browser observed ${item.consoleErrorCount || 'one or more'} console error(s), which can signal fragile page behavior.`,
    },
    {
      id: 'technology',
      active: evidence.hasTechnologyGap,
      pain: () => 'The audit could not identify a clear technology stack, which can make maintenance, tracking, and fixes harder to scope.',
    },
    {
      id: 'technology-context',
      active: evidence.technologies.length > 0,
      pain: (item) => `The detected ${item.primaryTechnology} stack gives a concrete path for a focused conversion and cleanup project.`,
    },
  ]
  return rules.filter((rule) => rule.active).slice(0, 3)
}

function suggestedOffer(evidence, primaryRuleId) {
  if (primaryRuleId === 'availability' || primaryRuleId === 'failed-requests' || primaryRuleId === 'browser-errors') return 'Technical health check and conversion-path repair'
  if (primaryRuleId === 'cta-contact' || primaryRuleId === 'cta' || primaryRuleId === 'contactability') return 'Booking/contact conversion cleanup'
  if (primaryRuleId === 'seo') return 'Local SEO and page-structure refresh'
  if (primaryRuleId === 'accessibility') return 'Accessibility and usability remediation'
  if (primaryRuleId === 'performance') return `${capitalize(evidence.primaryTechnology) || 'Mobile'} speed and asset cleanup`
  return 'Website conversion audit and prioritized quick-win cleanup'
}

function outreachOpener(evidence, primaryRule) {
  const leadName = evidence.name || 'your website'
  if (primaryRule?.id === 'availability') return `I noticed ${leadName}'s website returned HTTP ${evidence.responseStatus} during a deterministic audit, which can block visitors before they reach you.`
  if (primaryRule?.id === 'cta-contact') return `I noticed ${leadName}'s site has both CTA and contactability friction, which can make it harder for ready visitors to take the next step.`
  if (primaryRule?.id === 'seo') return `I noticed ${leadName}'s page has basic SEO structure gaps that could be cleaned up without changing the business offering.`
  if (primaryRule?.id === 'performance') return `I noticed ${leadName}'s ${evidence.technologyLabel} has performance signals that may be slowing down mobile visitors.`
  if (primaryRule?.id === 'accessibility') return `I noticed ${leadName}'s page has accessibility signals that may make the site harder for some visitors to use.`
  return `I noticed ${leadName}'s site has concrete audit signals that point to a focused website cleanup opportunity.`
}

function whyThisLeadMatters(evidence, selectedRules) {
  const issueCount = selectedRules.length
  const location = evidence.location ? ` in ${evidence.location}` : ''
  const scorePart = evidence.leadScore ? ` with a lead score of ${evidence.leadScore}` : ''
  const techPart = evidence.primaryTechnology ? ` and a detectable ${evidence.primaryTechnology} stack` : ''
  return `This lead matters because it has ${issueCount || 'multiple'} deterministic opportunity signal(s)${scorePart}${techPart}${location}, making the outreach angle specific and evidence-backed.`
}

function contactCtaProfile(input, pageSignals, emails, phones) {
  const signal = (input.businessSignalProfile?.signals || []).find((entry) => entry.id === 'visible_contact_cta_path')
  if (signal) return { hasVisibleContactPath: true, hasStrongPrimaryCta: Boolean(signal.observation?.hasStrongPrimaryCta) }
  return pageSignals?.contactCtaProfile || buildContactCtaProfile({
    texts: [input.title, input.pageTitle, pageSignals?.metaDescription, ...((pageSignals?.headings || []).map((heading) => heading.text || heading))],
    links: pageSignals?.links || [],
    emails,
    phones,
    hasForm: Boolean(pageSignals?.hasForm),
  })
}

function normalizePerformance(performance = {}) {
  performance = performance || {}
  return {
    responseStatus: numeric(performance.responseStatus, 0),
    failedRequestCount: numeric(performance.failedRequestCount ?? performance.failedRequests?.length, 0),
    consoleErrorCount: numeric(performance.consoleErrorCount ?? performance.consoleErrors?.length, 0),
    loadMs: numeric(performance.loadMs, 0),
    transferSizeBytes: numeric(performance.transferSizeBytes, 0),
  }
}

function normalizeTechnologies(value) {
  return normalizeArray(value).map((item) => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object') return item.name || item.label || ''
    return ''
  }).filter(Boolean)
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null)
  if (value == null || value === '') return []
  return String(value).split('|').map((item) => item.trim()).filter(Boolean)
}

function numeric(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function includesAny(value, needles) {
  return needles.some((needle) => value.includes(needle))
}

function capitalize(value) {
  if (!value) return ''
  return String(value).charAt(0).toUpperCase() + String(value).slice(1)
}

module.exports = { buildOpportunityBullets, normalizeOpportunityBullets }
