function buildCompressedOpportunity(item = {}) {
  const profile = item.businessSignalProfile || {}
  const insight = item.leadInsight || {}
  const ctx = collectContext(item, profile, insight)
  const strategy = selectStrategy(ctx)
  return normalizeCompressedOpportunity({
    type: strategy.type,
    businessImpact: strategy.businessImpact,
    urgency: urgency(ctx, strategy),
    primaryOpportunity: strategy.primaryOpportunity(ctx),
    whyThisMatters: strategy.whyThisMatters(ctx).filter(Boolean).slice(0, 3),
    outreachAngle: strategy.outreachAngle(ctx),
    callOpener: strategy.callOpener(ctx),
  })
}

function normalizeCompressedOpportunity(value = {}) {
  return {
    type: clean(value.type) || 'manual_review',
    businessImpact: clean(value.businessImpact) || 'conversion',
    urgency: clamp(Number(value.urgency || 0.45)),
    primaryOpportunity: clean(value.primaryOpportunity) || 'Review this lead manually before outreach.',
    whyThisMatters: normalizeArray(value.whyThisMatters).slice(0, 3),
    outreachAngle: clean(value.outreachAngle) || 'Use the audit evidence to ask whether website improvements are already a priority.',
    callOpener: clean(value.callOpener) || 'Hi, I reviewed your website and noticed one specific improvement opportunity. Is this something you are actively looking at?',
  }
}

function collectContext(item, profile, insight) {
  const signals = profile.signals || []
  const contradictions = profile.contradictions || []
  const signalById = new Map(signals.map((signal) => [signal.id, signal]))
  const contradictionById = new Map(contradictions.map((contradiction) => [contradiction.id, contradiction]))
  const meta = item.sourceMetadata || {}
  const pageSignals = item.pageSignals || {}
  const technologies = normalizeArray(item.technologies)
  const issues = normalizeArray(item.issues)
  const text = searchableText(item, profile, insight)
  const name = clean(item.name || meta.businessName || item.title || item.pageTitle || 'this business')
  const pageTitle = clean(item.pageTitle || item.title)
  return {
    item,
    profile,
    insight,
    signals,
    contradictions,
    signalById,
    contradictionById,
    name,
    pageTitle,
    url: clean(item.url),
    rating: clean(meta.rating),
    reviewCount: Number(meta.reviewCount || 0),
    phone: clean(meta.phone || (item.phones || [])[0]),
    emailFound: (item.emails || []).length > 0,
    technologies,
    topIssues: issues.slice(0, 4),
    issues,
    issueCategories: item.issueCategories || {},
    performance: item.performance || {},
    leadScore: Number(item.leadScore || 0),
    primaryOpportunityId: (profile.topOpportunities || [])[0]?.id || '',
    pageSignals,
    text,
    businessStatus: clean(meta.businessStatus),
    address: clean(meta.address),
    providerTypes: normalizeArray(meta.providerTypes),
    hasOnlineBooking: hasSignalId(signalById, 'online_booking'),
    hasMissingCta: hasSignalId(signalById, 'missing_primary_cta'),
    hasSpecialist: hasSignalId(signalById, 'specialist_service'),
    hasReviews: hasSignalId(signalById, 'local_review_proof'),
    hasTeam: hasSignalId(signalById, 'team_authority'),
    hasPricing: hasSignalId(signalById, 'pricing_transparency'),
    hasNewPatientSignal: hasSignalId(signalById, 'new_patient_signal'),
  }
}

function selectStrategy(ctx) {
  return rankCandidates(ctx)[0].strategy
}

function rankCandidates(input) {
  const ctx = input && input.signalById ? input : collectContext(input || {}, input?.businessSignalProfile || {}, input?.leadInsight || {})
  const candidates = [
    candidate(strategies.brandIdentity, brandIdentityScore(ctx)),
    candidate(strategies.modernCampaign, modernCampaignScore(ctx)),
    candidate(strategies.specialistVisibility, specialistScore(ctx)),
    candidate(strategies.trustToConversion, trustScore(ctx)),
    candidate(strategies.localSeoConsistency, localSeoScore(ctx)),
    candidate(strategies.bookingVisibility, bookingVisibilityScore(ctx)),
    candidate(strategies.bookingFriction, bookingFrictionScore(ctx)),
    candidate(strategies.technicalTrust, technicalScore(ctx)),
    candidate(strategies.manualReview, 0.1),
  ]
  return candidates.sort((a, b) => b.score - a.score)
}

function candidate(strategy, score) { return { strategy, score: Number(score || 0) } }

const strategies = {
  brandIdentity: {
    type: 'brand_identity_confusion',
    businessImpact: 'trust',
    primaryOpportunity: () => 'The clinic appears to be in a brand transition, but the website identity is not fully aligned across name, title, and domain.',
    whyThisMatters: (ctx) => [
      brandMismatchSummary(ctx),
      'Brand inconsistency can weaken local search trust and make patients unsure which clinic they are contacting.',
      contactSummary(ctx),
    ],
    outreachAngle: () => 'Focus on cleaning up brand, title, domain, and local search consistency before broader redesign work.',
    callOpener: (ctx) => `I noticed ${ctx.name} appears to be in a name or brand transition, but the website identity still looks mixed. Is search and brand consistency something you are already cleaning up?`,
  },
  modernCampaign: {
    type: 'modern_site_campaign_optimization',
    businessImpact: 'growth',
    primaryOpportunity: () => 'The site already looks conversion-ready; the stronger opportunity is campaign-specific growth rather than a basic redesign.',
    whyThisMatters: (ctx) => [
      trustSummary(ctx) || 'The clinic already has visible trust signals.',
      modernSiteSummary(ctx),
      signalSummary(ctx, 'specialist_service') || 'Specific treatment or patient segments can be promoted through focused landing paths.',
    ],
    outreachAngle: () => 'Position the offer around campaign landing pages, treatment-specific funnels, or measurable new-patient growth instead of general website cleanup.',
    callOpener: (ctx) => `I noticed ${ctx.name} already has a strong site and trust profile. Are you testing dedicated campaigns or landing pages for the treatments you most want to grow?`,
  },
  specialistVisibility: {
    type: 'specialist_to_booking_gap',
    businessImpact: 'positioning',
    primaryOpportunity: () => 'Specialist or high-value services are visible, but treatment interest is not guided clearly enough into booking.',
    whyThisMatters: (ctx) => [
      signalSummary(ctx, 'specialist_service') || 'Specialist or high-value services are promoted.',
      signalSummary(ctx, 'online_booking') || 'A booking path exists but needs clearer connection to services.',
      signalSummary(ctx, 'missing_primary_cta') || 'The next action is not prominent enough.',
    ],
    outreachAngle: () => 'Connect specialist/treatment pages directly to booking so interested patients know exactly what to do next.',
    callOpener: (ctx) => `I noticed ${ctx.name} promotes specialist or high-value treatments, but the path from treatment interest to booking could be sharper. Are those treatments an area you want more enquiries for?`,
  },
  trustToConversion: {
    type: 'trust_to_conversion_gap',
    businessImpact: 'conversion',
    primaryOpportunity: () => 'Strong local trust signals are not being translated into a clear next-step action on the website.',
    whyThisMatters: (ctx) => [
      trustSummary(ctx) || 'Google review proof is present.',
      signalSummary(ctx, 'missing_primary_cta') || 'The main next action is not clear enough.',
      contactSummary(ctx),
    ],
    outreachAngle: () => 'Turn existing trust into more calls, bookings, or enquiries with a clearer conversion path.',
    callOpener: (ctx) => `I noticed ${ctx.name} has solid local trust signals, but the website does not make the next step as clear as it could. Are new patient enquiries a current priority?`,
  },
  localSeoConsistency: {
    type: 'local_seo_consistency_gap',
    businessImpact: 'discovery',
    primaryOpportunity: () => 'The business is contactable, but search identity and page structure may make it harder for local patients to evaluate quickly.',
    whyThisMatters: (ctx) => [
      ctx.pageTitle ? `Current page title: ${ctx.pageTitle}.` : '',
      issueIncludes(ctx, 'Expected exactly one h1') ? 'The audit found weak H1 structure, which can reduce page clarity.' : '',
      contactSummary(ctx),
    ],
    outreachAngle: () => 'Improve local search clarity, title/H1 structure, and clinic identity before pushing more traffic to the site.',
    callOpener: (ctx) => `I noticed ${ctx.name} is easy to contact, but the page structure and search identity could be clearer. Is local visibility something you are working on?`,
  },
  bookingVisibility: {
    type: 'booking_visibility_gap',
    businessImpact: 'conversion',
    primaryOpportunity: () => 'High-intent patients may drop off before booking because the booking path exists but is not visually dominant.',
    whyThisMatters: (ctx) => [
      signalSummary(ctx, 'online_booking') || 'Online booking exists.',
      signalSummary(ctx, 'missing_primary_cta') || 'The audit still found weak primary CTA visibility.',
      trustSummary(ctx) || signalSummary(ctx, 'specialist_service') || 'The clinic has enough demand signals to make booking clarity commercially relevant.',
    ],
    outreachAngle: () => 'Focus on making the treatment-to-booking path visible and obvious for new patients.',
    callOpener: (ctx) => `I noticed ${ctx.name} already has online booking, but it is harder to spot than expected. Is improving patient booking conversion something you are actively looking at?`,
  },
  bookingFriction: {
    type: 'conversion_path_friction',
    businessImpact: 'conversion',
    primaryOpportunity: () => 'Potential patient intent may leak because the website does not make the next action obvious enough.',
    whyThisMatters: (ctx) => [
      signalSummary(ctx, 'missing_primary_cta') || 'The audit found weak CTA clarity.',
      contactSummary(ctx),
      ctx.topIssues[0] ? `Supporting evidence: ${ctx.topIssues[0]}.` : '',
    ],
    outreachAngle: () => 'Improve first-screen CTA clarity and contact paths before broader redesign work.',
    callOpener: (ctx) => `I noticed ${ctx.name}'s website could make the next patient action clearer. Do most new enquiries come through the site today?`,
  },
  technicalTrust: {
    type: 'technical_trust_risk',
    businessImpact: 'trust',
    primaryOpportunity: () => 'Technical issues may weaken trust even if the clinic itself appears contactable and operational.',
    whyThisMatters: (ctx) => [
      failedRequestSummary(ctx),
      accessibilitySummary(ctx),
      contactSummary(ctx),
    ],
    outreachAngle: () => 'Frame the offer as a trust and reliability cleanup, not a generic redesign.',
    callOpener: (ctx) => `I noticed ${ctx.name}'s site has a few technical reliability signals that could affect patient trust. Is website maintenance handled internally or by an external partner?`,
  },
  manualReview: {
    type: 'manual_review',
    businessImpact: 'review',
    primaryOpportunity: () => 'This lead has enough data for review, but no single dominant commercial opportunity was isolated.',
    whyThisMatters: (ctx) => [
      trustSummary(ctx),
      ctx.topIssues[0] ? `Top audit evidence: ${ctx.topIssues[0]}.` : '',
      contactSummary(ctx),
    ],
    outreachAngle: () => 'Inspect the screenshots and report before deciding whether to contact this lead.',
    callOpener: (ctx) => `I reviewed ${ctx.name}'s website and wanted to ask who handles updates to the site today.`,
  },
}

function brandIdentityScore(ctx) {
  let score = 0
  if (brandMismatchSummary(ctx)) score += 1.05
  if (ctx.text.includes('heter') && (ctx.text.includes('nå') || ctx.text.includes('tidligere'))) score += 0.25
  if (ctx.url && ctx.name && !domainMatchesName(ctx.url, ctx.name)) score += 0.08
  return score
}

function modernCampaignScore(ctx) {
  let score = 0
  if (isStrongModernSite(ctx)) score += 0.95
  if (ctx.hasSpecialist) score += 0.18
  if (ctx.hasNewPatientSignal) score += 0.12
  if (hasContradiction(ctx, 'booking_exists_but_cta_weak')) score -= 0.2
  if (brandIdentityScore(ctx) > 0.8) score -= 0.5
  return score
}

function specialistScore(ctx) {
  let score = 0
  if (ctx.hasSpecialist) score += 0.72
  if (hasContradiction(ctx, 'specialist_service_but_weak_action_path')) score += 0.28
  if (ctx.hasOnlineBooking) score += 0.1
  if (isStrongModernSite(ctx)) score -= 0.22
  if (brandIdentityScore(ctx) > 0.8) score -= 0.3
  return score
}

function trustScore(ctx) {
  let score = 0
  if (ctx.reviewCount >= 100) score += 0.72
  else if (ctx.reviewCount >= 20) score += 0.48
  else if (ctx.reviewCount > 0) score += 0.22
  if (hasContradiction(ctx, 'strong_reviews_but_weak_conversion')) score += 0.2
  if (isStrongModernSite(ctx)) score -= 0.3
  if (brandIdentityScore(ctx) > 0.8) score -= 0.35
  return score
}

function localSeoScore(ctx) {
  let score = 0
  if (issueIncludes(ctx, 'Expected exactly one h1')) score += 0.42
  if (ctx.pageTitle && ctx.name && !similarName(ctx.pageTitle, ctx.name)) score += 0.22
  if (ctx.phone) score += 0.08
  if (brandIdentityScore(ctx) > 0.8) score -= 0.3
  return score
}

function bookingVisibilityScore(ctx) {
  let score = 0
  if (hasContradiction(ctx, 'booking_exists_but_cta_weak')) score += 0.62
  if (ctx.hasOnlineBooking && ctx.hasMissingCta) score += 0.12
  if (ctx.hasSpecialist) score -= 0.22
  if (isStrongModernSite(ctx)) score -= 0.4
  if (brandIdentityScore(ctx) > 0.8) score -= 0.45
  return score
}

function bookingFrictionScore(ctx) {
  let score = 0
  if (ctx.hasMissingCta) score += 0.46
  if (!ctx.hasOnlineBooking) score += 0.12
  if (ctx.phone || ctx.emailFound) score += 0.08
  if (isStrongModernSite(ctx)) score -= 0.28
  if (brandIdentityScore(ctx) > 0.8) score -= 0.3
  return score
}

function technicalScore(ctx) {
  let score = 0
  const failed = Number(ctx.performance.failedRequestCount || 0)
  const consoleErrors = Number(ctx.performance.consoleErrorCount || 0)
  if (failed >= 2) score += 0.38
  if (consoleErrors >= 1) score += 0.24
  if (Number(ctx.issueCategories.accessibility || 0) > 0) score += 0.18
  if (brandIdentityScore(ctx) > 0.8) score -= 0.2
  return score
}

function urgency(ctx, strategy) {
  let score = 0.35
  if (strategy.type === 'brand_identity_confusion') score += 0.38
  if (strategy.type === 'modern_site_campaign_optimization') score += 0.18
  if (strategy.type === 'specialist_to_booking_gap') score += 0.28
  if (strategy.type === 'trust_to_conversion_gap') score += 0.24
  if (strategy.type === 'booking_visibility_gap') score += 0.22
  if (strategy.type === 'technical_trust_risk') score += 0.18
  if (ctx.reviewCount >= 100) score += 0.12
  else if (ctx.reviewCount >= 20) score += 0.08
  if (ctx.hasOnlineBooking) score += 0.06
  if (ctx.hasMissingCta && !isStrongModernSite(ctx)) score += 0.08
  if (ctx.hasSpecialist) score += 0.06
  if (!ctx.phone) score -= 0.2
  return score
}

function isStrongModernSite(ctx) {
  const hasVendor = includesAny(ctx.text, ['dental markedsføring', 'utviklet av', 'webdesign', 'by '])
  const strongReviews = ctx.reviewCount >= 80 && Number(ctx.rating || 0) >= 4.7
  const patientFlow = includesAny(ctx.text, ['ny pasient', 'nye pasient', 'fra bestilling til besøk', 'faste priser', 'uten skjulte kostnader'])
  return Boolean(strongReviews && ctx.hasOnlineBooking && (hasVendor || patientFlow) && (ctx.phone || ctx.emailFound))
}

function brandMismatchSummary(ctx) {
  const text = ctx.text
  const pageTitle = ctx.pageTitle.toLowerCase()
  const name = ctx.name.toLowerCase()
  if (text.includes('tannlegene berg') && text.includes('sydsiden tannhelsesenter')) {
    return 'The page references both Tannlegene Berg and Sydsiden Tannhelsesenter, which suggests an active or incomplete rebrand.'
  }
  if (text.includes('nå heter') || text.includes('heter nå')) return 'The page explicitly says the business has changed name, so brand/search consistency should be verified.'
  if (pageTitle && name && !similarName(pageTitle, name) && pageTitle.includes('hjem')) {
    return `The page title (${ctx.pageTitle}) does not clearly reinforce the discovered business name (${ctx.name}).`
  }
  return ''
}

function modernSiteSummary(ctx) {
  if (includesAny(ctx.text, ['dental markedsføring'])) return 'The site appears professionally maintained by a dental marketing vendor, so generic redesign outreach is likely weak.'
  if (ctx.hasOnlineBooking && ctx.hasPricing && ctx.hasTeam) return 'Booking, pricing, and team trust signals are already present.'
  if (ctx.hasOnlineBooking && ctx.hasNewPatientSignal) return 'The site already has a visible new-patient journey and booking path.'
  return 'The site already has several conversion and trust fundamentals in place.'
}

function signalSummary(ctx, id) {
  const signal = ctx.signalById.get(id)
  if (!signal) return ''
  const evidence = signal.observation?.evidence || signal.interpretation?.opportunity || id
  if (id === 'online_booking') return signal.observation?.ctaProminence < 0.45 ? 'Online booking exists, but its CTA prominence is low.' : 'Online booking exists.'
  if (id === 'missing_primary_cta') return 'The audit classified the page as missing a clear primary CTA.'
  if (id === 'specialist_service') {
    const detail = evidence && evidence !== 'specialist_service_positioning' ? ` (${evidence})` : ''
    return `Specialist/high-value service positioning is visible${detail}.`
  }
  if (id === 'local_review_proof') return trustSummary(ctx)
  return evidence
}

function trustSummary(ctx) {
  if (ctx.rating && ctx.reviewCount) return `Google proof is strong enough to matter commercially: rating ${ctx.rating} from ${ctx.reviewCount} reviews.`
  if (ctx.rating) return `Google rating is visible: ${ctx.rating}.`
  return ''
}

function contactSummary(ctx) {
  if (ctx.phone && ctx.emailFound) return 'Phone and email are available, so outreach/contact paths are practical.'
  if (ctx.phone) return 'Phone is available, so the lead is call-ready even if email is not visible.'
  if (ctx.emailFound) return 'Email is available, but phone was not found in provider metadata.'
  return 'Contact path is weak; verify manually before outreach.'
}

function failedRequestSummary(ctx) {
  const count = Number(ctx.performance.failedRequestCount || 0)
  if (count > 0) return `The browser observed ${count} failed request(s), which can weaken reliability.`
  const issue = ctx.topIssues.find((item) => item.toLowerCase().includes('failed request'))
  return issue || ''
}

function accessibilitySummary(ctx) {
  if (Number(ctx.issueCategories.accessibility || 0) > 0) return 'Accessibility issues may make the page harder to use for some visitors.'
  const issue = ctx.topIssues.find((item) => item.toLowerCase().includes('accessibility'))
  return issue || ''
}

function hasSignal(ctx, id) { return ctx.signalById.has(id) }
function hasContradiction(ctx, id) { return ctx.contradictionById.has(id) }
function hasSignalId(signalById, id) { return signalById.has(id) }
function issueIncludes(ctx, text) { return ctx.issues.some((item) => item.toLowerCase().includes(text.toLowerCase())) }
function normalizeArray(value) { return Array.isArray(value) ? value.map(clean).filter(Boolean) : String(value || '').split('|').map(clean).filter(Boolean) }
function clean(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim() }
function clamp(value) { return Math.max(0, Math.min(1, Math.round(Number(value || 0) * 100) / 100)) }
function includesAny(value, needles) { return needles.some((needle) => String(value || '').toLowerCase().includes(needle.toLowerCase())) }
function searchableText(item, profile, insight) {
  const pageSignals = item.pageSignals || {}
  const headings = Array.isArray(pageSignals.headings) ? pageSignals.headings.map((item) => typeof item === 'string' ? item : item?.text) : []
  const links = Array.isArray(pageSignals.links) ? pageSignals.links.map((item) => `${item?.text || ''} ${item?.href || ''}`) : []
  return [
    item.name,
    item.title,
    item.pageTitle,
    item.url,
    pageSignals.metaDescription,
    ...(item.issues || []),
    ...headings,
    ...links,
    ...(profile.signals || []).map((signal) => `${signal.id} ${signal.observation?.evidence || ''}`),
    insight.leadSummary,
    insight.evidenceBasedAngle,
  ].join(' ').toLowerCase()
}
function similarName(a, b) {
  const aa = simplifyName(a)
  const bb = simplifyName(b)
  if (!aa || !bb) return true
  return aa.includes(bb) || bb.includes(aa) || tokenOverlap(aa, bb) >= 0.5
}
function domainMatchesName(url, name) {
  const domain = simplifyName(String(url).replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').split('.')[0])
  const n = simplifyName(name)
  if (!domain || !n) return true
  return n.includes(domain) || domain.includes(n.split(' ')[0])
}
function simplifyName(value) {
  return clean(value).toLowerCase().replace(/å/g, 'a').replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/[^a-z0-9 ]+/g, ' ').replace(/\b(as|da|clinic|klinikk|tannklinikk|tannhelsesenter|tannlegene|hjem|velkommen|til)\b/g, ' ').replace(/\s+/g, ' ').trim()
}
function tokenOverlap(a, b) {
  const aa = new Set(a.split(' ').filter(Boolean))
  const bb = b.split(' ').filter(Boolean)
  if (!aa.size || !bb.length) return 0
  return bb.filter((token) => aa.has(token)).length / Math.max(aa.size, bb.length)
}

module.exports = { buildCompressedOpportunity, normalizeCompressedOpportunity, rankCandidates }
