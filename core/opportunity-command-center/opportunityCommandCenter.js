const { evaluateSourceFusion } = require('../source-fusion/sourceFusion')

function buildOpportunityCommandCenter(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString()
  const today = normalizeDate(input.today) || generatedAt.slice(0, 10)
  const leadPacks = Array.isArray(input.leadPacks) ? input.leadPacks : []
  const savedSearches = Array.isArray(input.savedSearches) ? input.savedSearches : []
  const summary = input.summary && typeof input.summary === 'object' ? input.summary : {}
  const leadItems = leadPacks.map((lead, index) => analyzeLead(lead, index, today))
  const queueCounts = countBy(leadItems, (item) => item.queue)
  const bestMarketsNow = buildBestMarketsNow(leadItems, summary)
  const overdueFollowUps = leadItems
    .filter((item) => item.followUpTiming === 'overdue' || item.followUpTiming === 'today')
    .sort((a, b) => followUpSortKey(a).localeCompare(followUpSortKey(b)) || b.score - a.score)
    .slice(0, 8)
    .map((item) => recommendationFromLead(item, {
      action: 'follow_up',
      reasons: item.followUpTiming === 'overdue'
        ? [`Forfalt oppfølging: ${item.workflow.followUpDate}`]
        : [`Due today: ${item.workflow.followUpDate}`],
    }))

  const callTheseFirst = leadItems
    .filter((item) => item.queue === 'call_now' && item.hasPhone && !item.workflow.contacted)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => recommendationFromLead(item, { action: 'call', reasons: callReasons(item) }))

  const verifyBeforeCalling = leadItems
    .filter((item) => item.queue === 'verify_first')
    .sort((a, b) => b.verifyScore - a.verifyScore || b.score - a.score)
    .slice(0, 8)
    .map((item) => recommendationFromLead(item, { action: 'verify', reasons: verifyReasons(item) }))

  const wastedTimeWarnings = buildWastedTimeWarnings({ leadItems, summary })
  const sourceWarnings = buildSourceWarnings(leadItems)
  const topActions = buildTopActions({ callTheseFirst, verifyBeforeCalling, overdueFollowUps, bestMarketsNow, wastedTimeWarnings, queueCounts, leadItems, savedSearches })

  return {
    generatedAt,
    status: leadItems.length ? 'ready' : 'empty',
    summary: {
      leadCount: leadItems.length,
      savedSearchCount: savedSearches.length,
      queueCounts,
      phoneReadyCount: leadItems.filter((item) => item.hasPhone && !item.foreignPhone).length,
      confirmedOrgCount: leadItems.filter((item) => item.confirmedOrg).length,
      verifyFirstCount: queueCounts.verify_first || 0,
      overdueFollowUpCount: overdueFollowUps.filter((item) => item.timing === 'overdue').length,
    },
    topActions,
    callTheseFirst,
    verifyBeforeCalling,
    overdueFollowUps,
    bestMarketsNow,
    wastedTimeWarnings,
    sourceWarnings,
  }
}

function analyzeLead(lead = {}, index = 0, today) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const sourceQuality = lead.sourceQuality || {}
  const sellerFit = lead.sellerFit || {}
  const workflow = normalizeWorkflow(lead.workflow || {})
  const sourceFusion = lead.sourceFusion || evaluateSourceFusion({
    lead,
    googlePlaces: places,
    brregCompanyProfile: company,
    contactProfile: contact,
    sourceQuality,
    sellerFit,
    workflow,
  })
  const phone = contact.phone || lead.phone || ''
  const hasPhone = Boolean(phone)
  const foreignPhone = hasPhone && !isLikelyNorwegianPhone(phone)
  const city = leadCity(lead)
  const fit = String(sellerFit.sellerFit || '').toLowerCase()
  const sellerAction = String(sellerFit.recommendedAction || '').toLowerCase()
  const leadConfidence = String(sourceFusion.leadConfidence || '').toLowerCase()
  const trustAction = String(sourceFusion.recommendedTrustAction || '').toLowerCase()
  const contactConfidence = String(sourceFusion.contactConfidence || '').toLowerCase()
  const identityConfidence = String(sourceFusion.identityConfidence || '').toLowerCase()
  const locationConfidence = String(sourceFusion.locationConfidence || '').toLowerCase()
  const matchStatus = String(company.matchStatus || '').toLowerCase()
  const locationStatus = String(sourceQuality.locationMatchStatus || '').toLowerCase()
  const confirmedOrg = Boolean(company.organizationNumber)
  const candidateOrg = Boolean(company.candidateOrganizationNumber || ['manual_verify', 'weak_match'].includes(matchStatus))
  const exactLocation = locationStatus === 'exact_location' || locationConfidence === 'exact'
  const locationFallback = locationStatus === 'regional_fallback' || locationConfidence === 'fallback'
  const sourceConflict = locationConfidence === 'conflict' || ['out_of_area', 'conflict', 'location_conflict'].includes(locationStatus) || normalizeList(sourceFusion.conflicts).length > 0
  const followUpTiming = followUpTimingFor(workflow.followUpDate, today, workflow)
  const queue = inferQueue({ workflow, hasPhone, foreignPhone, confirmedOrg, candidateOrg, sourceConflict, locationFallback, trustAction, sellerAction, fit, contactConfidence, identityConfidence })
  const score = callScore({ lead, company, places, sourceQuality, workflow, hasPhone, foreignPhone, confirmedOrg, candidateOrg, exactLocation, locationFallback, fit, sellerAction, leadConfidence, trustAction, queue, followUpTiming })
  const verifyScore = verifyPriorityScore({ hasPhone, foreignPhone, confirmedOrg, candidateOrg, sourceConflict, locationFallback, contactConfidence, identityConfidence, locationConfidence, matchStatus, trustAction })

  return {
    lead,
    index,
    leadId: lead.workflow?.leadId || leadId(lead, index),
    name: company.displayName || lead.companyName || 'Ukjent firma',
    phone,
    city,
    queue,
    workflow,
    sourceFusion,
    sellerFit,
    score,
    verifyScore,
    hasPhone,
    foreignPhone,
    confirmedOrg,
    candidateOrg,
    exactLocation,
    locationFallback,
    sourceConflict,
    followUpTiming,
    fit,
    sellerAction,
    leadConfidence,
    trustAction,
    contactConfidence,
    identityConfidence,
    locationConfidence,
    matchStatus,
    googleReviews: Number(places.reviewCount || 0),
    googleRating: Number(places.rating || 0),
  }
}

function inferQueue(context) {
  const { workflow, hasPhone, foreignPhone, confirmedOrg, sourceConflict, locationFallback, trustAction, sellerAction, fit, contactConfidence, identityConfidence } = context
  if (workflow.queue === 'archived' || workflow.archivedAt) return 'archived'
  if (workflow.status === 'rejected' || workflow.queue === 'not_relevant') return 'not_relevant'
  if (workflow.followUpDue) return 'follow_up_today'
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked' || workflow.queue === 'interested') return 'interested'
  if (workflow.response === 'no_answer' || workflow.response === 'no_response' || workflow.status === 'follow_up' || workflow.queue === 'no_answer') return 'no_answer'
  if (workflow.queue === 'call_now' || workflow.queue === 'verify_first') return workflow.queue
  if (sellerAction === 'skip' || trustAction === 'skip') return 'archived'
  if (!hasPhone || foreignPhone || sourceConflict || contactConfidence === 'weak') return 'verify_first'
  if (confirmedOrg && !locationFallback) return 'call_now'
  if (trustAction === 'call') return 'call_now'
  if (sellerAction === 'contact' && identityConfidence !== 'unknown' && ['strong', 'good'].includes(fit)) return 'call_now'
  return 'verify_first'
}

function callScore(context) {
  const { lead, company, places, sourceQuality, workflow, hasPhone, foreignPhone, confirmedOrg, candidateOrg, exactLocation, locationFallback, fit, sellerAction, leadConfidence, trustAction, queue, followUpTiming } = context
  let score = 0
  if (queue === 'follow_up_today') score += 1000
  if (followUpTiming === 'overdue') score += 400
  if (followUpTiming === 'today') score += 250
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') score += 360
  if (!workflow.contacted) score += 180
  if (hasPhone && !foreignPhone) score += 160
  if (confirmedOrg) score += 130
  else if (candidateOrg) score += 45
  if (exactLocation) score += 110
  if (locationFallback) score -= 45
  if (['strong', 'good'].includes(fit)) score += fit === 'strong' ? 100 : 70
  if (sellerAction === 'contact') score += 80
  if (sellerAction === 'verify') score -= 20
  if (sellerAction === 'skip') score -= 300
  if (trustAction === 'call') score += 80
  if (trustAction === 'verify_first') score -= 35
  if (leadConfidence === 'strong') score += 90
  if (leadConfidence === 'good') score += 60
  if (leadConfidence === 'weak') score -= 220
  score += Math.min(Number(places.reviewCount || 0), 100) / 2
  score += Number(places.rating || 0) * 5
  if (sourceQuality.discoveryQuality?.score) score += Number(sourceQuality.discoveryQuality.score) / 5
  if (company.employees) score += Math.min(Number(company.employees || 0), 50) / 2
  if (lead.meta?.mode === 'fast' || lead.website?.auditStatus === 'skipped_fast_mode') score += 8
  if (foreignPhone) score -= 500
  if (!hasPhone) score -= 260
  return Math.round(score)
}

function verifyPriorityScore(context) {
  const { hasPhone, foreignPhone, confirmedOrg, candidateOrg, sourceConflict, locationFallback, contactConfidence, identityConfidence, locationConfidence, matchStatus, trustAction } = context
  let score = 0
  if (!hasPhone) score += 180
  if (foreignPhone) score += 170
  if (!confirmedOrg && candidateOrg) score += 140
  if (!confirmedOrg && identityConfidence === 'unknown') score += 120
  if (sourceConflict) score += 150
  if (locationFallback || locationConfidence === 'fallback') score += 90
  if (contactConfidence === 'weak') score += 120
  if (['no_match', 'error'].includes(matchStatus)) score += 100
  if (trustAction === 'verify_first') score += 80
  return score
}

function callReasons(item) {
  return [
    item.hasPhone && !item.foreignPhone ? 'Direkte telefon er tilgjengelig.' : '',
    item.confirmedOrg ? 'Brreg-identitet er bekreftet.' : item.candidateOrg ? 'Kandidat-org.nr finnes; verifiser underveis.' : '',
    item.exactLocation ? 'Stedet matcher søkeområdet.' : item.locationFallback ? 'Stedet bør bekreftes under samtalen.' : '',
    ['strong', 'good'].includes(item.fit) ? `Seller fit is ${item.fit}.` : '',
    ['strong', 'good'].includes(item.leadConfidence) ? `Lead-trygghet er ${item.leadConfidence}.` : '',
    item.googleReviews ? `Google proof: ${item.googleReviews} reviews.` : '',
    !item.workflow.contacted ? 'Ikke kontaktet ennå.' : '',
  ].filter(Boolean).slice(0, 5)
}

function verifyReasons(item) {
  return [
    !item.hasPhone ? 'Ingen direkte telefon funnet.' : '',
    item.foreignPhone ? 'Telefonnummeret ser ikke norsk ut.' : '',
    !item.confirmedOrg && item.candidateOrg ? 'Bare kandidat-org.nr er tilgjengelig.' : '',
    !item.confirmedOrg && item.identityConfidence === 'unknown' ? 'Juridisk identitet er ikke bekreftet.' : '',
    item.sourceConflict ? 'Kildekonflikt må løses.' : '',
    item.locationFallback ? 'Stedet er fallback/usikkert.' : '',
    item.contactConfidence === 'weak' ? 'Kontakttryggheten er svak.' : '',
    item.trustAction === 'verify_first' ? 'Kildesjekken anbefaler verifisering først.' : '',
  ].filter(Boolean).slice(0, 5)
}

function recommendationFromLead(item, options = {}) {
  const reasons = Array.isArray(options.reasons) && options.reasons.length ? options.reasons : callReasons(item)
  return {
    id: item.leadId,
    leadId: item.leadId,
    index: item.index,
    action: options.action || 'review',
    company: item.name,
    city: item.city,
    phone: item.phone || '',
    queue: item.queue,
    score: item.score,
    timing: item.followUpTiming,
    confidence: {
      lead: item.sourceFusion.leadConfidence || 'unknown',
      identity: item.sourceFusion.identityConfidence || 'unknown',
      contact: item.sourceFusion.contactConfidence || 'unknown',
      location: item.sourceFusion.locationConfidence || 'unknown',
      trustAction: item.sourceFusion.recommendedTrustAction || 'review',
    },
    reasons,
  }
}

function buildBestMarketsNow(leadItems, summary = {}) {
  const groups = new Map()
  for (const item of leadItems) {
    const city = item.city || 'unknown'
    if (!groups.has(city)) {
      groups.set(city, { city, leadCount: 0, phoneReadyCount: 0, confirmedOrgCount: 0, verifyFirstCount: 0, callNowCount: 0, interestedCount: 0, noAnswerCount: 0, weakCount: 0, score: 0 })
    }
    const group = groups.get(city)
    group.leadCount += 1
    if (item.hasPhone && !item.foreignPhone) group.phoneReadyCount += 1
    if (item.confirmedOrg) group.confirmedOrgCount += 1
    if (item.queue === 'verify_first') group.verifyFirstCount += 1
    if (item.queue === 'call_now') group.callNowCount += 1
    if (item.queue === 'interested') group.interestedCount += 1
    if (item.queue === 'no_answer') group.noAnswerCount += 1
    if (item.leadConfidence === 'weak' || item.trustAction === 'skip') group.weakCount += 1
    group.score += marketLeadScore(item)
  }

  const cityCounts = summary.marketSweepCityCounts || {}
  for (const [city, count] of Object.entries(cityCounts)) {
    if (!groups.has(city)) groups.set(city, { city, leadCount: Number(count || 0), phoneReadyCount: 0, confirmedOrgCount: 0, verifyFirstCount: 0, callNowCount: 0, interestedCount: 0, noAnswerCount: 0, weakCount: 0, score: 0 })
  }

  return Array.from(groups.values())
    .map((group) => {
      const phoneReadyRatio = ratio(group.phoneReadyCount, group.leadCount)
      const confirmedOrgRatio = ratio(group.confirmedOrgCount, group.leadCount)
      const verifyRate = ratio(group.verifyFirstCount, group.leadCount)
      const marketScore = Math.round(group.score + phoneReadyRatio * 220 + confirmedOrgRatio * 160 - verifyRate * 120 + group.callNowCount * 35 + group.interestedCount * 40)
      return {
        city: group.city,
        leadCount: group.leadCount,
        phoneReadyCount: group.phoneReadyCount,
        confirmedOrgCount: group.confirmedOrgCount,
        verifyFirstCount: group.verifyFirstCount,
        callNowCount: group.callNowCount,
        interestedCount: group.interestedCount,
        noAnswerCount: group.noAnswerCount,
        weakCount: group.weakCount,
        phoneReadyRatio,
        confirmedOrgRatio,
        verifyRate,
        score: marketScore,
        reasons: marketReasons({ ...group, phoneReadyRatio, confirmedOrgRatio, verifyRate }),
      }
    })
    .filter((group) => group.leadCount > 0)
    .sort((a, b) => b.score - a.score || b.phoneReadyRatio - a.phoneReadyRatio || a.city.localeCompare(b.city, 'nb'))
    .slice(0, 8)
}

function marketLeadScore(item) {
  let score = 0
  if (item.hasPhone && !item.foreignPhone) score += 120
  if (item.confirmedOrg) score += 100
  else if (item.candidateOrg) score += 25
  if (item.exactLocation) score += 80
  if (item.locationFallback) score -= 60
  if (item.queue === 'call_now') score += 80
  if (item.queue === 'verify_first') score -= 45
  if (item.leadConfidence === 'strong') score += 70
  else if (item.leadConfidence === 'good') score += 45
  else if (item.leadConfidence === 'weak') score -= 120
  if (item.trustAction === 'call') score += 50
  if (item.trustAction === 'verify_first') score -= 25
  if (item.trustAction === 'skip') score -= 180
  if (item.foreignPhone) score -= 180
  if (!item.hasPhone) score -= 100
  return Math.max(0, Math.round(score))
}

function marketReasons(group) {
  return [
    `${group.leadCount} leads.`,
    `${group.phoneReadyCount} med telefon.`,
    group.confirmedOrgCount ? `${group.confirmedOrgCount} bekreftet org.nr.` : '',
    group.verifyFirstCount ? `${group.verifyFirstCount} må verifiseres.` : 'Lite å verifisere.',
  ].filter(Boolean)
}

function buildWastedTimeWarnings({ leadItems, summary }) {
  if (!leadItems.length) return []
  const count = leadItems.length
  const missingPhone = leadItems.filter((item) => !item.hasPhone).length
  const verifyFirst = leadItems.filter((item) => item.queue === 'verify_first').length
  const weak = leadItems.filter((item) => item.leadConfidence === 'weak' || item.trustAction === 'skip').length
  const candidateIdentity = leadItems.filter((item) => !item.confirmedOrg && item.candidateOrg).length
  const fallbackLocation = leadItems.filter((item) => item.locationFallback).length
  const warnings = []
  addWarning(warnings, missingPhone / count >= 0.35, 'Mange leads mangler direkte telefon', `${missingPhone}/${count} leads mangler direkte telefon.`, 'phone')
  addWarning(warnings, verifyFirst / count >= 0.35, 'Mye må verifiseres', `${verifyFirst}/${count} leads ligger i verifiser-først.`, 'verify_first')
  addWarning(warnings, weak / count >= 0.25, 'Svak lead-dekning', `${weak}/${count} leads ser svake ut eller kan hoppes over.`, 'weak')
  addWarning(warnings, candidateIdentity / count >= 0.35, 'Mange kandidat-org.nr', `${candidateIdentity}/${count} leads trenger identitetsbekreftelse.`, 'identity')
  addWarning(warnings, fallbackLocation / count >= 0.35, 'Sted via fallback er vanlig', `${fallbackLocation}/${count} leads har fallback/usikkert sted.`, 'location')
  if (summary.lowSupply) warnings.push({ id: 'low_supply', label: 'Lavt markedstilfang', note: 'Søket ga færre leads enn ønsket.', severity: 'medium', target: { type: 'market' } })
  return warnings.slice(0, 6)
}

function addWarning(warnings, condition, label, note, id) {
  if (condition) warnings.push({ id, label, note, severity: 'medium', target: { type: id } })
}

function buildSourceWarnings(leadItems) {
  const warnings = new Map()
  for (const item of leadItems) {
    for (const warning of [
      ...normalizeList(item.sourceFusion.warnings),
      ...normalizeList(item.sourceFusion.conflicts),
      ...normalizeList(item.lead.company?.warnings),
      ...normalizeList(item.lead.sourceQuality?.locationWarnings),
    ]) {
      const key = humanize(warning)
      if (!warnings.has(key)) warnings.set(key, { id: slug(key), label: key, note: 'Kildevarsel finnes på gjeldende leads.', count: 0, leadIds: [] })
      const entry = warnings.get(key)
      entry.count += 1
      if (entry.leadIds.length < 5) entry.leadIds.push(item.leadId)
    }
  }
  return Array.from(warnings.values()).sort((a, b) => b.count - a.count).slice(0, 8)
}

function buildTopActions(context) {
  const actions = []
  const { callTheseFirst, verifyBeforeCalling, overdueFollowUps, bestMarketsNow, wastedTimeWarnings, queueCounts, leadItems, savedSearches } = context
  if (overdueFollowUps.length) {
    actions.push({ id: 'handle_followups', label: 'Ta oppfølgingene først', note: `${overdueFollowUps.length} oppfølginger har forfalt.`, priority: 1, target: { queue: 'follow_up_today' } })
  }
  if (callTheseFirst.length) {
    actions.push({ id: 'call_first', label: 'Ring disse først', note: `${callTheseFirst.length} leads med telefon ser verdt å jobbe med nå.`, priority: 2, target: { queue: 'call_now' } })
  }
  if (verifyBeforeCalling.length) {
    actions.push({ id: 'clear_verification', label: 'Rydd verifiseringsstoppere', note: `${verifyBeforeCalling.length} leads trenger identitets-, kontakt- eller stedssjekk.`, priority: 3, target: { queue: 'verify_first' } })
  }
  if (bestMarketsNow.length) {
    const market = bestMarketsNow[0]
    actions.push({ id: 'best_market', label: 'Beste marked nå', note: `${market.city}: ${market.phoneReadyCount}/${market.leadCount} med telefon.`, priority: 4, target: { city: market.city } })
  }
  if (wastedTimeWarnings.length) {
    actions.push({ id: 'avoid_waste', label: 'Unngå tidssløsing', note: wastedTimeWarnings[0].note, priority: 5, target: wastedTimeWarnings[0].target })
  }
  if (!actions.length) {
    actions.push({ id: 'run_search', label: savedSearches.length ? 'Oppdater et lagret marked' : 'Kjør et markedssøk', note: leadItems.length ? 'Ingen hastestoppere funnet.' : 'Søk i et marked for å bygge dagens kommandosenter.', priority: 9, target: {} })
  }
  actions.push({ id: 'queue_snapshot', label: 'Købilde', note: `${queueCounts.call_now || 0} call now, ${queueCounts.verify_first || 0} verify first, ${queueCounts.follow_up_today || 0} follow-ups.`, priority: 10, target: {} })
  return actions.slice(0, 6)
}

function normalizeWorkflow(workflow = {}) {
  const followUpDate = normalizeDate(workflow.nextFollowUpAt || workflow.followUpDate)
  return {
    status: String(workflow.status || 'new').toLowerCase(),
    queue: String(workflow.queue || '').toLowerCase(),
    response: String(workflow.response || '').toLowerCase(),
    contacted: workflow.contacted === true || workflow.contacted === 'true' || ['contacted', 'follow_up', 'interested', 'rejected'].includes(String(workflow.status || '').toLowerCase()) || Boolean(workflow.response),
    followUpDate,
    followUpDue: false,
    nextAction: String(workflow.nextAction || '').trim(),
    archivedAt: workflow.archivedAt || '',
  }
}

function followUpTimingFor(value, today, workflow = {}) {
  const date = normalizeDate(value)
  if (!date || workflow.status === 'rejected') return 'none'
  workflow.followUpDue = date <= today
  if (date < today) return 'overdue'
  if (date === today) return 'today'
  return 'future'
}

function followUpSortKey(item) {
  return item.workflow.followUpDate || '9999-99-99'
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item) || 'unknown'
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})
}

function ratio(part, whole) {
  if (!whole) return 0
  return Number((part / whole).toFixed(3))
}

function normalizeDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : ''
}

function leadCity(lead = {}) {
  return String(lead.contact?.city || lead.city || lead.sourceQuality?.marketSweepCity || lead.company?.municipality || 'unknown')
}

function leadId(lead, index) {
  return [lead.company?.organizationNumber, lead.company?.candidateOrganizationNumber, lead.places?.placeId, lead.company?.displayName, index].filter(Boolean).join('::')
}

function isLikelyNorwegianPhone(value) {
  const raw = String(value || '').trim()
  const digits = raw.replace(/\D/g, '')
  if (!digits) return false
  if (/^\+?47[\s\d]+$/.test(raw) && digits.length === 10 && digits.startsWith('47')) return true
  if (digits.length === 8) return /^[2-9]/.test(digits)
  return false
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (!value) return []
  return [String(value).trim()].filter(Boolean)
}

function humanize(value) {
  return String(value || '').replace(/[_:]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^./, (char) => char.toUpperCase())
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'warning'
}

module.exports = { buildOpportunityCommandCenter }
