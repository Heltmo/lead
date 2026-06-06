const {
  contactProviderEvidenceForSourceFusion,
  hasContactProviderResult,
} = require('../contact-data/contactData')

const CONFIDENCE = new Set(['strong', 'good', 'review', 'weak', 'unknown'])
const IDENTITY = new Set(['confirmed', 'candidate', 'manual_verify', 'unknown'])
const CONTACT = new Set(['strong', 'good', 'review', 'weak', 'unknown'])
const LOCATION = new Set(['exact', 'nearby', 'fallback', 'conflict', 'unknown'])
const TRUST_ACTION = new Set(['call', 'review', 'verify_first', 'skip'])

function evaluateSourceFusion(input = {}) {
  const lead = input.lead || input || {}
  const company = input.brregCompanyProfile || lead.company || {}
  const contact = input.contactProfile || lead.contact || {}
  const places = input.googlePlaces || lead.places || {}
  const sourceQuality = input.sourceQuality || lead.sourceQuality || {}
  const sellerFit = input.sellerFit || lead.sellerFit || {}
  const workflow = input.workflow || lead.workflow || {}
  const website = lead.website && typeof lead.website === 'object' ? lead.website : {}
  const contactProviderInput = input.contactDataProviderResult || input.contactData || lead.contactData || lead.contactProviderResult || null
  const contactProvider = hasContactProviderResult(contactProviderInput) ? contactProviderEvidenceForSourceFusion(contactProviderInput) : null

  const proofReasons = []
  const riskReasons = []
  const conflicts = []
  const warnings = []

  const hasProviderPhone = Boolean(contactProvider && contactProvider.status === 'matched' && contactProvider.hasPhone)
  const hasProviderEmail = Boolean(contactProvider && contactProvider.status === 'matched' && contactProvider.hasEmail)
  const hasProviderWebsite = Boolean(contactProvider && contactProvider.status === 'matched' && contactProvider.hasWebsite)
  const hasProviderAddress = Boolean(contactProvider && contactProvider.status === 'matched' && contactProvider.hasAddress)
  const hasPhone = Boolean(clean(contact.phone || lead.phone)) || hasProviderPhone
  const hasEmail = Boolean(clean(contact.email || lead.email)) || hasProviderEmail
  const hasWebsite = Boolean(clean(contact.website || website.url || lead.website)) || hasProviderWebsite
  const hasAddress = Boolean(clean(contact.address || lead.address || company.registeredAddress)) || hasProviderAddress
  const hasOrg = Boolean(clean(company.organizationNumber))
  const hasCandidateOrg = Boolean(clean(company.candidateOrganizationNumber))
  const matchStatus = String(company.matchStatus || '').toLowerCase()
  const companyWarnings = normalizeList(company.warnings)
  const sourceWarnings = normalizeList(sourceQuality.locationWarnings)
  const contactWarnings = normalizeList(contact.warnings)

  const identityConfidence = identityConfidenceFor({ hasOrg, hasCandidateOrg, matchStatus, companyWarnings, warnings, conflicts, proofReasons, riskReasons })
  const contactConfidence = contactConfidenceFor({ hasPhone, hasEmail, hasWebsite, contactWarnings, contactProvider, warnings, conflicts, proofReasons, riskReasons })
  const locationConfidence = locationConfidenceFor({ sourceQuality, warnings, conflicts, proofReasons, riskReasons })
  const normalizedSellerFit = normalizeSellerFit(sellerFit.sellerFit)

  const verifiedFields = {
    phone: hasPhone,
    email: hasEmail,
    website: hasWebsite,
    address: hasAddress,
    organizationNumber: identityConfidence === 'confirmed',
    location: ['exact', 'nearby'].includes(locationConfidence),
  }

  for (const warning of sourceWarnings) addUnique(warnings, humanWarning(warning))
  if (places.placeId || places.provider || places.rating || places.reviewCount) addUnique(proofReasons, 'Google Places presence is available.')
  if (hasAddress) addUnique(proofReasons, 'Address is available for location review.')
  if (normalizedSellerFit === 'weak') addUnique(riskReasons, 'Seller fit is weak for the selected sales context.')
  if (normalizedSellerFit === 'unknown') addUnique(warnings, 'Seller fit is not available yet.')

  const leadConfidence = leadConfidenceFor({ identityConfidence, contactConfidence, locationConfidence, sellerFit: normalizedSellerFit })
  const recommendedTrustAction = trustActionFor({ leadConfidence, identityConfidence, contactConfidence, locationConfidence, sellerFit: normalizedSellerFit, conflicts, riskReasons })

  return {
    leadConfidence: normalizeEnum(leadConfidence, CONFIDENCE, 'unknown'),
    identityConfidence: normalizeEnum(identityConfidence, IDENTITY, 'unknown'),
    contactConfidence: normalizeEnum(contactConfidence, CONTACT, 'unknown'),
    locationConfidence: normalizeEnum(locationConfidence, LOCATION, 'unknown'),
    sellerFit: normalizedSellerFit,
    recommendedTrustAction: normalizeEnum(recommendedTrustAction, TRUST_ACTION, 'review'),
    sourceCoverage: sourceCoverageFor({ company, contact, places, website, sourceQuality, workflow, contactProvider }),
    verifiedFields,
    proofReasons: proofReasons.slice(0, 8),
    riskReasons: riskReasons.slice(0, 8),
    conflicts: conflicts.slice(0, 8),
    warnings: warnings.slice(0, 8),
  }
}

function identityConfidenceFor(context) {
  const { hasOrg, hasCandidateOrg, matchStatus, companyWarnings, warnings, conflicts, proofReasons, riskReasons } = context
  const warningText = companyWarnings.join(' ').toLowerCase()
  const conflict = hasConflictText(warningText) || ['conflict', 'mismatch'].includes(matchStatus)
  if (conflict) {
    addUnique(conflicts, 'Company identity has conflicting source signals.')
    addUnique(warnings, 'Manual identity verification is required.')
    return 'manual_verify'
  }
  if (hasOrg) {
    addUnique(proofReasons, 'Brreg confirmed organization number.')
    return 'confirmed'
  }
  if (hasCandidateOrg || ['manual_verify', 'weak_match', 'candidate_org'].includes(matchStatus)) {
    addUnique(riskReasons, 'Organization number is a candidate and needs manual verification.')
    return 'manual_verify'
  }
  if (['no_match', 'not_run', 'error', 'brreg_unavailable'].includes(matchStatus)) {
    addUnique(riskReasons, 'Legal identity is not confirmed yet.')
    return 'unknown'
  }
  return 'unknown'
}

function contactConfidenceFor(context) {
  const { hasPhone, hasEmail, hasWebsite, contactWarnings, contactProvider, warnings, conflicts, proofReasons, riskReasons } = context
  if (contactProvider && contactProvider.status !== 'no_match') {
    for (const reason of normalizeList(contactProvider.proofReasons)) addUnique(proofReasons, reason)
    for (const reason of normalizeList(contactProvider.riskReasons)) addUnique(riskReasons, reason)
    for (const warning of normalizeList(contactProvider.warnings)) addUnique(warnings, warning)
    for (const conflict of normalizeList(contactProvider.conflicts)) addUnique(conflicts, conflict)
    if (contactProvider.status === 'conflict' || normalizeList(contactProvider.conflicts).length) return 'review'
    if (contactProvider.status === 'weak_match') return 'review'
  }
  const warningText = contactWarnings.join(' ').toLowerCase()
  if (hasConflictText(warningText)) {
    addUnique(conflicts, 'Contact data has conflicting source signals.')
    addUnique(warnings, 'Verify phone/contact data before using this lead.')
    return 'review'
  }
  if (hasPhone && (hasEmail || hasWebsite)) {
    addUnique(proofReasons, 'Phone and another contact path are available.')
    return 'strong'
  }
  if (hasPhone) {
    addUnique(proofReasons, 'Phone is available for seller contact.')
    return 'good'
  }
  if (hasEmail || hasWebsite) {
    addUnique(riskReasons, 'No phone found; only indirect contact path is available.')
    return 'review'
  }
  addUnique(riskReasons, 'No phone, email, website or contact path found.')
  return 'weak'
}

function locationConfidenceFor({ sourceQuality, warnings, conflicts, proofReasons, riskReasons }) {
  const status = String(sourceQuality.locationMatchStatus || '').toLowerCase()
  if (['exact_location', 'exact'].includes(status)) {
    addUnique(proofReasons, 'Location appears exact for the search area.')
    return 'exact'
  }
  if (['nearby_location', 'nearby'].includes(status)) {
    addUnique(proofReasons, 'Location is nearby the requested area.')
    return 'nearby'
  }
  if (['regional_fallback', 'fallback'].includes(status)) {
    addUnique(warnings, 'Regional fallback: do not treat this as an exact local lead.')
    addUnique(riskReasons, 'Location should be verified before local outreach.')
    return 'fallback'
  }
  if (['out_of_area', 'conflict', 'location_conflict'].includes(status)) {
    addUnique(conflicts, 'Location conflicts with the requested area.')
    addUnique(riskReasons, 'Location conflict must be resolved before using this lead.')
    return 'conflict'
  }
  if (clean(sourceQuality.requestedLocation)) {
    addUnique(warnings, 'Requested location is not confirmed for this lead.')
    addUnique(riskReasons, 'Location should be verified before treating this as a local lead.')
    return 'fallback'
  }
  addUnique(warnings, 'Location confidence is unknown.')
  return 'unknown'
}

function leadConfidenceFor({ identityConfidence, contactConfidence, locationConfidence, sellerFit }) {
  if (identityConfidence === 'unknown' && ['weak', 'unknown'].includes(contactConfidence)) return 'weak'
  if (locationConfidence === 'conflict') return contactConfidence === 'weak' ? 'weak' : 'review'
  if (contactConfidence === 'weak') return identityConfidence === 'confirmed' ? 'review' : 'weak'
  if (sellerFit === 'weak') return contactConfidence === 'strong' && ['exact', 'nearby'].includes(locationConfidence) ? 'review' : 'weak'
  if (identityConfidence === 'confirmed' && ['strong', 'good'].includes(contactConfidence) && ['exact', 'nearby'].includes(locationConfidence) && ['strong', 'good'].includes(sellerFit)) return contactConfidence === 'strong' && sellerFit === 'strong' ? 'strong' : 'good'
  if (identityConfidence === 'manual_verify' && ['strong', 'good'].includes(contactConfidence) && locationConfidence === 'exact') return 'review'
  if (locationConfidence === 'fallback') return ['strong', 'good'].includes(contactConfidence) ? 'review' : 'weak'
  if (['strong', 'good'].includes(contactConfidence) && ['exact', 'nearby'].includes(locationConfidence)) return identityConfidence === 'unknown' ? 'review' : 'good'
  if (contactConfidence === 'review' || locationConfidence === 'unknown') return 'review'
  return 'unknown'
}

function trustActionFor({ leadConfidence, identityConfidence, contactConfidence, locationConfidence, sellerFit, conflicts }) {
  if (leadConfidence === 'weak' && contactConfidence === 'weak') return 'skip'
  if (contactConfidence === 'weak') return leadConfidence === 'weak' ? 'skip' : 'verify_first'
  if (locationConfidence === 'conflict') return contactConfidence === 'weak' ? 'skip' : 'verify_first'
  if (sellerFit === 'weak') return leadConfidence === 'weak' ? 'skip' : 'review'
  if (conflicts.length) return 'verify_first'
  if (identityConfidence === 'manual_verify' || locationConfidence === 'fallback' || contactConfidence === 'review') return 'verify_first'
  if (['strong', 'good'].includes(leadConfidence) && ['strong', 'good'].includes(contactConfidence) && ['exact', 'nearby'].includes(locationConfidence)) return 'call'
  if (leadConfidence === 'review') return 'review'
  return 'review'
}

function sourceCoverageFor({ company, contact, places, website, sourceQuality, workflow, contactProvider }) {
  const coverage = []
  if (places.placeId || places.provider || places.rating || places.reviewCount || sourceQuality.presenceSource) coverage.push('google_places')
  if (company.organizationNumber || company.candidateOrganizationNumber || company.matchStatus || company.source === 'brreg' || sourceQuality.identitySource === 'brreg') coverage.push('brreg')
  if (contact.phone || contact.email || contact.address || contact.city) coverage.push('contact_data')
  if (contactProvider && contactProvider.status && contactProvider.status !== 'no_match') coverage.push('contact_provider')
  if (contact.website || website.auditStatus || website.contactability || website.topEvidence) coverage.push('website_contact_profile')
  if (workflow.status || workflow.queue || workflow.updatedAt || Array.isArray(workflow.activities) && workflow.activities.length) coverage.push('workflow')
  return Array.from(new Set(coverage))
}

function normalizeSellerFit(value) {
  return normalizeEnum(String(value || '').toLowerCase(), CONFIDENCE, 'unknown')
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = String(value || '').toLowerCase()
  return allowed.has(normalized) ? normalized : fallback
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (!value) return []
  return [String(value).trim()].filter(Boolean)
}

function clean(value) {
  if (value && typeof value === 'object') return clean(value.url || value.href || value.website || value.value)
  const text = String(value || '').trim()
  return text && !['unknown', 'none', 'null', 'undefined'].includes(text.toLowerCase()) ? text : ''
}

function humanWarning(value) {
  return String(value || '').replace(/_/g, ' ')
}

function hasConflictText(value) {
  const text = String(value || '').toLowerCase()
  return ['conflict', 'mismatch', 'wrong', 'different'].some((item) => text.includes(item))
}

function addUnique(list, value) {
  const text = String(value || '').trim()
  if (text && !list.includes(text)) list.push(text)
}

function sourceFusionSummary(fusion = {}) {
  return {
    sourceCoverage: normalizeList(fusion.sourceCoverage).join(' | '),
    verifiedFields: Object.entries(fusion.verifiedFields || {}).filter(([, value]) => Boolean(value)).map(([key]) => key).join(' | '),
    proofReasons: normalizeList(fusion.proofReasons).join(' | '),
    riskReasons: normalizeList(fusion.riskReasons).join(' | '),
    warnings: [...normalizeList(fusion.warnings), ...normalizeList(fusion.conflicts)].join(' | '),
  }
}

module.exports = { evaluateSourceFusion, sourceFusionSummary }
