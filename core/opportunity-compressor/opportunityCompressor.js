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
  return {
    item,
    profile,
    insight,
    signals,
    contradictions,
    signalById,
    contradictionById,
    name: clean(item.name || meta.businessName || item.title || 'this business'),
    rating: clean(meta.rating),
    reviewCount: Number(meta.reviewCount || 0),
    phone: clean(meta.phone || (item.phones || [])[0]),
    emailFound: (item.emails || []).length > 0,
    technologies: item.technologies || [],
    topIssues: (item.issues || []).slice(0, 4),
    leadScore: Number(item.leadScore || 0),
    primaryOpportunityId: (profile.topOpportunities || [])[0]?.id || '',
  }
}

function selectStrategy(ctx) {
  if (hasContradiction(ctx, 'booking_exists_but_cta_weak')) return strategies.bookingVisibility
  if (hasContradiction(ctx, 'strong_reviews_but_weak_conversion')) return strategies.trustToConversion
  if (hasContradiction(ctx, 'specialist_service_but_weak_action_path')) return strategies.specialistVisibility
  if (hasSignal(ctx, 'specialist_service')) return strategies.specialistVisibility
  if (hasSignal(ctx, 'missing_primary_cta')) return strategies.bookingFriction
  if (hasSignal(ctx, 'local_review_proof')) return strategies.trustToConversion
  return strategies.manualReview
}

const strategies = {
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
  specialistVisibility: {
    type: 'specialist_visibility_gap',
    businessImpact: 'positioning',
    primaryOpportunity: () => 'Specialist services are present, but the website does not turn that positioning into a focused patient acquisition path.',
    whyThisMatters: (ctx) => [
      signalSummary(ctx, 'specialist_service') || 'Specialist or high-value services are promoted.',
      signalSummary(ctx, 'online_booking') || 'A booking path exists but needs clearer connection to services.',
      signalSummary(ctx, 'missing_primary_cta') || 'The next action is not prominent enough.',
    ],
    outreachAngle: () => 'Connect specialist/treatment pages directly to booking so interested patients know what to do next.',
    callOpener: (ctx) => `I noticed ${ctx.name} promotes specialist services, but the path from treatment interest to booking could be clearer. Are those treatments an area you want more enquiries for?`,
  },
  bookingFriction: {
    type: 'booking_friction',
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

function urgency(ctx, strategy) {
  let score = 0.35
  if (strategy.type === 'booking_visibility_gap') score += 0.32
  if (strategy.type === 'trust_to_conversion_gap') score += 0.24
  if (strategy.type === 'specialist_visibility_gap') score += 0.22
  if (ctx.reviewCount >= 100) score += 0.12
  else if (ctx.reviewCount >= 20) score += 0.08
  if (hasSignal(ctx, 'online_booking')) score += 0.08
  if (hasSignal(ctx, 'missing_primary_cta')) score += 0.12
  if (hasSignal(ctx, 'specialist_service')) score += 0.08
  if (!ctx.phone) score -= 0.2
  return score
}

function signalSummary(ctx, id) {
  const signal = ctx.signalById.get(id)
  if (!signal) return ''
  const evidence = signal.observation?.evidence || signal.interpretation?.opportunity || id
  if (id === 'online_booking') return signal.observation?.ctaProminence < 0.45 ? 'Online booking exists, but its CTA prominence is low.' : 'Online booking exists.'
  if (id === 'missing_primary_cta') return 'The audit classified the page as missing a clear primary CTA.'
  if (id === 'specialist_service') return `Specialist/high-value service positioning is visible${evidence ? ` (${evidence})` : ''}.`
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

function hasSignal(ctx, id) { return ctx.signalById.has(id) }
function hasContradiction(ctx, id) { return ctx.contradictionById.has(id) }
function normalizeArray(value) { return Array.isArray(value) ? value.map(clean).filter(Boolean) : String(value || '').split('|').map(clean).filter(Boolean) }
function clean(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim() }
function clamp(value) { return Math.max(0, Math.min(1, Math.round(Number(value || 0) * 100) / 100)) }

module.exports = { buildCompressedOpportunity, normalizeCompressedOpportunity }
