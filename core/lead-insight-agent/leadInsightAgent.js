const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const GENERIC_PHRASES = [
  'concrete audit signals',
  'focused website cleanup opportunity',
  'visitors may not know',
]

function buildLeadInsight(item = {}, options = {}) {
  const cachePath = options.cacheDir ? path.join(options.cacheDir, cacheKey(item) + '.json') : ''
  if (cachePath && fs.existsSync(cachePath)) return normalizeLeadInsight(JSON.parse(fs.readFileSync(cachePath, 'utf8')))
  const insight = normalizeLeadInsight(generateLeadInsight(item, options))
  if (cachePath) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true })
    fs.writeFileSync(cachePath, `${JSON.stringify(insight, null, 2)}\n`)
  }
  return insight
}

function generateLeadInsight(item = {}, options = {}) {
  if (typeof options.llmGenerate === 'function') {
    const prompt = buildLeadInsightPrompt(item)
    const response = options.llmGenerate(prompt, compactLeadInput(item))
    const parsed = typeof response === 'string' ? parseJsonResponse(response) : response
    return ensureEvidenceBound(parsed)
  }
  return deterministicInsight(item)
}

function normalizeLeadInsight(value = {}) {
  const source = value.leadInsight || value
  return {
    leadSummary: clean(source.leadSummary) || 'No lead summary generated.',
    whyThisLeadIsInteresting: clean(source.whyThisLeadIsInteresting) || 'This lead needs manual review before outreach.',
    mainProblem: clean(source.mainProblem) || 'No dominant website problem was identified.',
    evidenceBasedAngle: clean(source.evidenceBasedAngle) || 'Review the audit evidence before choosing an outreach angle.',
    callOpeningLine: clean(source.callOpeningLine) || 'Hi, I reviewed your website and noticed a few specific items worth checking.',
    recommendedOffer: clean(source.recommendedOffer) || 'Manual website review and prioritized improvement plan',
    disqualifiers: normalizeArray(source.disqualifiers),
    confidence: ['high', 'medium', 'low'].includes(clean(source.confidence).toLowerCase()) ? clean(source.confidence).toLowerCase() : 'medium',
  }
}

function deterministicInsight(item = {}) {
  const evidence = collectEvidence(item)
  const primary = selectPrimaryIssue(evidence)
  const disqualifiers = collectDisqualifiers(evidence)
  return removeGenericPhrases({
    leadSummary: leadSummary(evidence),
    whyThisLeadIsInteresting: whyInteresting(evidence, primary),
    mainProblem: primary.problem,
    evidenceBasedAngle: primary.angle(evidence),
    callOpeningLine: primary.opener(evidence),
    recommendedOffer: primary.offer,
    disqualifiers,
    confidence: confidence(evidence, disqualifiers),
  })
}

function buildLeadInsightPrompt(item = {}) {
  return [
    'You are a sales research assistant for Webconsult.',
    '',
    'Convert website audit facts into a specific, honest, call-ready lead insight.',
    '',
    'Rules:',
    '- Only use the provided facts.',
    '- Do not invent business problems.',
    '- Do not exaggerate.',
    '- Do not write generic agency copy.',
    '- Mention concrete evidence from the audit or provider metadata.',
    '- If the lead looks weak, say so in disqualifiers.',
    '- Prefer practical call angles over technical jargon.',
    '- Return JSON only.',
    '',
    'Avoid these generic phrases:',
    ...GENERIC_PHRASES.map((phrase) => '- ' + phrase),
    '',
    'Input:',
    JSON.stringify(compactLeadInput(item), null, 2),
    '',
    'Output schema:',
    JSON.stringify({
      leadSummary: '',
      whyThisLeadIsInteresting: '',
      mainProblem: '',
      evidenceBasedAngle: '',
      callOpeningLine: '',
      recommendedOffer: '',
      disqualifiers: [],
      confidence: 'high|medium|low',
    }, null, 2),
  ].join('\n')
}

function compactLeadInput(item = {}) {
  const meta = item.sourceMetadata || {}
  return {
    businessName: item.name || meta.businessName || item.title || '',
    website: item.url || '',
    pageTitle: item.pageTitle || item.title || '',
    industry: item.industry || meta.industry || '',
    location: item.location || meta.location || meta.address || '',
    googlePlaces: { phone: meta.phone || '', address: meta.address || '', rating: meta.rating || '', reviewCount: meta.reviewCount || '', businessStatus: meta.businessStatus || '', sourceType: meta.sourceType || '' },
    leadScore: item.leadScore || 0,
    technologies: item.technologies || [],
    issueCategories: item.issueCategories || {},
    topIssues: (item.issues || []).slice(0, 6),
    contactability: { emails: item.emails || [], phones: item.phones || [] },
    performance: item.performance || {},
    links: item.links || {},
  }
}

function collectEvidence(item = {}) {
  const meta = item.sourceMetadata || {}
  const issues = normalizeArray(item.issues)
  const issueText = issues.join(' ').toLowerCase()
  const categories = item.issueCategories || {}
  const performance = item.performance || {}
  const phones = normalizeArray(item.phones)
  const emails = normalizeArray(item.emails)
  const technologies = normalizeArray(item.technologies)
  return {
    name: clean(item.name || meta.businessName || item.title || item.pageTitle || 'this business'),
    website: clean(item.url),
    pageTitle: clean(item.pageTitle || item.title),
    industry: clean(item.industry || meta.industry),
    location: clean(item.location || meta.location || meta.address),
    address: clean(meta.address),
    phone: clean(meta.phone || phones[0]),
    rating: clean(meta.rating),
    reviewCount: clean(meta.reviewCount),
    businessStatus: clean(meta.businessStatus),
    sourceType: clean(meta.sourceType),
    leadScore: numeric(item.leadScore, 0),
    technologies,
    primaryTechnology: technologies[0] || '',
    categories,
    issues,
    topIssues: issues.slice(0, 4),
    issueText,
    emails,
    phones,
    responseStatus: numeric(performance.responseStatus, 0),
    failedRequestCount: numeric(performance.failedRequestCount, 0),
    consoleErrorCount: numeric(performance.consoleErrorCount, 0),
    missingCta: hasCategory(categories, 'conversion') || includesAny(issueText, ['no clear cta', 'missing cta']),
    accessibility: hasCategory(categories, 'accessibility') || issueText.includes('accessibility'),
    seo: hasCategory(categories, 'seo') || includesAny(issueText, ['h1', 'meta description', 'seo']),
    failedRequests: numeric(performance.failedRequestCount, 0) > 0 || includesAny(issueText, ['failed request', 'failed network']),
    consoleErrors: numeric(performance.consoleErrorCount, 0) > 0 || issueText.includes('console error'),
  }
}

function selectPrimaryIssue(e) {
  const rules = [
    {
      active: e.responseStatus >= 400,
      problem: 'Website availability issue',
      offer: 'Fix the broken availability path and verify the main contact journey',
      angle: (x) => `${x.name} is listed as operational, but the audited website returned HTTP ${x.responseStatus}. That is a direct reason to verify whether potential patients can reach the clinic online.`,
      opener: (x) => `Hi, I found ${x.name} through Google Places and noticed the website returned HTTP ${x.responseStatus} during a browser audit. Is the website still the main way patients find you?`,
    },
    {
      active: e.failedRequests && e.missingCta,
      problem: 'Booking path is unclear and the page has failed requests',
      offer: 'Repair failed resources and make booking/contact actions clearer',
      angle: (x) => `${x.name} ${reviewProof(x)} and ${contactPath(x)}, but the site audit found no clear booking CTA plus ${x.failedRequestCount} failed request(s)${techContext(x)}. That makes the call about protecting an existing local reputation, not selling a generic redesign.`,
      opener: (x) => `Hi, I noticed ${x.name} ${reviewProof(x)}, but the website audit found no clear booking CTA and ${x.failedRequestCount} failed request(s). Are online bookings or contact requests important for you right now?`,
    },
    {
      active: e.missingCta,
      problem: 'The site does not make the next patient action obvious',
      offer: 'Add a clearer booking/contact section and improve the first-screen conversion path',
      angle: (x) => `${x.name} ${reviewProof(x)} and ${contactPath(x)}, but the website audit did not detect a clear primary CTA${techContext(x)}. The call angle is about turning existing search interest into an easier booking or enquiry path.`,
      opener: (x) => `Hi, I was looking at ${x.name}'s website after finding the clinic in Google Places. The audit did not find a clear booking or contact CTA. Do most new patient enquiries come through the website or by phone?`,
    },
    {
      active: e.accessibility,
      problem: 'Accessibility issues may reduce trust and usability',
      offer: 'Accessibility and readability cleanup for key pages',
      angle: (x) => `${x.name} has public rating/contact data, but the audit found accessibility issues. For a healthcare business, readability and clear interaction paths are useful trust signals.`,
      opener: (x) => `Hi, I noticed ${x.name}'s website has accessibility findings in a browser audit. Would it be useful if I showed you the specific issues affecting readability and usability?`,
    },
    {
      active: e.seo,
      problem: 'Basic page structure is weak for local discovery',
      offer: 'Local SEO structure cleanup for title, headings, and metadata',
      angle: (x) => `${x.name} is discoverable in Google Places, but the website audit found basic SEO structure issues such as heading or metadata gaps. That gives a narrow local-search improvement angle.`,
      opener: (x) => `Hi, I found ${x.name} in local search and noticed the website has basic SEO structure gaps. Do you actively work on local visibility for new patients?`,
    },
    {
      active: e.consoleErrors || e.failedRequests,
      problem: 'Technical issues may weaken the website experience',
      offer: 'Technical cleanup of console errors, failed requests, and tracking assets',
      angle: (x) => `${x.name}'s site has technical audit findings${x.primaryTechnology ? ` on a ${x.primaryTechnology} stack` : ''}. This is a specific maintenance conversation rather than a broad redesign claim.`,
      opener: (x) => `Hi, I ran a browser check on ${x.name}'s website and found technical errors that may be worth fixing. Who usually maintains the website for you?`,
    },
  ]
  return rules.find((rule) => rule.active) || {
    problem: 'Manual review needed before outreach',
    offer: 'Manual website review and prioritized improvement list',
    angle: (x) => `${x.name} has enough contact and website metadata to review, but the current audit did not isolate one dominant issue. Check the screenshots before contacting them.`,
    opener: (x) => `Hi, I reviewed ${x.name}'s website and wanted to ask who handles updates to the site today.`,
  }
}

function leadSummary(e) {
  const parts = [e.name]
  if (e.address || e.location) parts.push(`at ${e.address || e.location}`)
  if (e.rating) parts.push(`has a Google rating of ${e.rating}${e.reviewCount ? ` from ${e.reviewCount} reviews` : ''}`)
  if (e.phone) parts.push(`and a callable phone number (${e.phone})`)
  return parts.join(' ') + '.'
}

function whyInteresting(e, primary) {
  const proof = []
  if (e.businessStatus) proof.push(`Google status is ${e.businessStatus}`)
  if (e.phone) proof.push('phone is available')
  if (e.primaryTechnology) proof.push(`${e.primaryTechnology} is detectable`)
  if (e.topIssues[0]) proof.push(`top issue: ${e.topIssues[0]}`)
  return `${e.name} is interesting because ${proof.length ? proof.join(', ') : 'it has enough verified metadata for review'}, and the strongest angle is: ${primary.problem}.`
}

function reviewProof(e) {
  if (e.rating && e.reviewCount) {
    const count = Number(e.reviewCount)
    if (count >= 100) return `already has very strong Google proof (rating ${e.rating}, ${e.reviewCount} reviews)`
    if (count >= 20) return `has solid Google proof (rating ${e.rating}, ${e.reviewCount} reviews)`
    return `has early Google proof (rating ${e.rating}, ${e.reviewCount} reviews)`
  }
  if (e.rating) return `has a Google rating of ${e.rating}`
  return 'has a verified Google business profile'
}

function contactPath(e) {
  if (e.phone && e.emails.length) return 'shows both phone and email contact paths'
  if (e.phone && !e.emails.length) return 'has phone contact but no email was detected in the audit'
  if (!e.phone && e.emails.length) return 'has email contact but no provider phone was available'
  return 'does not expose a strong contact path in the audit data'
}

function techContext(e) {
  return e.primaryTechnology ? ` on a ${e.primaryTechnology} site` : ''
}

function collectDisqualifiers(e) {
  const result = []
  if (e.sourceType === 'publicSector') result.push('Public-sector site; usually not a normal private sales lead.')
  if (e.businessStatus && e.businessStatus !== 'OPERATIONAL') result.push(`Google business status is ${e.businessStatus}.`)
  if (!e.phone) result.push('No provider phone was available.')
  if (!e.website) result.push('No website was available for audit.')
  if (!e.topIssues.length) result.push('Audit evidence is thin; inspect screenshots before outreach.')
  return result
}

function confidence(e, disqualifiers) {
  if (disqualifiers.some((item) => item.includes('Public-sector') || item.includes('No website'))) return 'low'
  if (e.phone && e.businessStatus === 'OPERATIONAL' && e.topIssues.length >= 2) return 'high'
  if (e.phone && e.topIssues.length >= 1) return 'medium'
  return 'low'
}

function ensureEvidenceBound(value) {
  return removeGenericPhrases(normalizeLeadInsight(value))
}

function removeGenericPhrases(insight) {
  const clone = { ...insight }
  for (const field of ['leadSummary', 'whyThisLeadIsInteresting', 'mainProblem', 'evidenceBasedAngle', 'callOpeningLine', 'recommendedOffer']) {
    let value = clean(clone[field])
    for (const phrase of GENERIC_PHRASES) value = value.replace(new RegExp(escapeRegExp(phrase), 'ig'), 'specific website evidence')
    clone[field] = value
  }
  return clone
}

function parseJsonResponse(response) {
  try { return JSON.parse(response) } catch {}
  const match = String(response || '').match(/\{[\s\S]*\}/)
  if (!match) return {}
  try { return JSON.parse(match[0]) } catch { return {} }
}

function cacheKey(item) {
  const basis = JSON.stringify({ id: item.id, url: item.url, score: item.leadScore, issues: item.issues, meta: item.sourceMetadata, title: item.pageTitle || item.title })
  return crypto.createHash('sha1').update(basis).digest('hex')
}

function hasCategory(categories, key) { return Number(categories?.[key] || 0) > 0 }
function includesAny(value, needles) { return needles.some((needle) => value.includes(needle)) }
function normalizeArray(value) { return Array.isArray(value) ? value.map(clean).filter(Boolean) : String(value || '').split('|').map(clean).filter(Boolean) }
function numeric(value, fallback) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
function clean(value) { return String(value == null ? '' : value).trim() }
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

module.exports = { buildLeadInsight, generateLeadInsight, normalizeLeadInsight, buildLeadInsightPrompt, compactLeadInput }
