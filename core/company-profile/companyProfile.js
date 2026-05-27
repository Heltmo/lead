const BRREG_BASE_URL = 'https://data.brreg.no/enhetsregisteret/api'

const MATCH_STATUSES = new Set(['exact_match', 'strong_match', 'weak_match', 'manual_verify', 'no_match', 'error'])
const COMPANY_SUFFIXES = new Set(['as', 'asa', 'da', 'ba', 'sa', 'ans', 'enk', 'nuf', 'hf', 'sf', 'iks', 'kf'])
const MARKETING_WORDS = new Set(['avd', 'avdeling', 'klinikk', 'tannklinikk', 'tannlegesenter', 'legesenter', 'kontor', 'firmaet'])
const CHAIN_WORDS = ['odontia', 'oris', 'vb', 'vvs eksperten', 'vvseksperten', 'kjede', 'franchise', 'gruppen', 'group', 'flow']
const DEFAULT_TIMEOUT_MS = 8000
const DEFAULT_RETRIES = 1
const requestCache = new Map()

async function enrichCompanyProfile(input = {}, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') {
    return errorProfile(input, 'fetch_unavailable')
  }

  try {
    const candidates = await searchBrregCandidates(input, { ...options, fetchImpl })
    return matchCompanyProfile(input, candidates, options)
  } catch (error) {
    return errorProfile(input, error && error.message ? error.message : 'brreg_request_failed')
  }
}

async function searchBrregCandidates(input = {}, options = {}) {
  const baseUrl = options.baseUrl || BRREG_BASE_URL
  const fetchImpl = options.fetchImpl || globalThis.fetch
  const size = Number(options.size || 10)
  const query = buildSearchQuery(input.companyName || input.name || '')
  if (!query) return []

  const endpoints = ['/enheter', '/underenheter']
  const results = []
  for (const endpoint of endpoints) {
    const url = new URL(baseUrl.replace(/\/$/, '') + endpoint)
    url.searchParams.set('navn', query)
    url.searchParams.set('navnMetodeForSoek', 'FORTLOEPENDE')
    url.searchParams.set('size', String(size))
    url.searchParams.set('page', '0')
    const json = await fetchBrregJson(url.toString(), {
      endpoint,
      fetchImpl,
      timeoutMs: options.timeoutMs,
      retries: options.retries,
      cache: options.cache,
    })
    results.push(...extractEmbedded(json, endpoint === '/enheter' ? 'entity' : 'subunit'))
  }
  return dedupeCandidates(results)
}

async function fetchBrregJson(url, options = {}) {
  const cache = options.cache === false ? null : (options.cache || requestCache)
  if (cache && cache.has(url)) return cache.get(url)

  const retries = Number.isFinite(Number(options.retries)) ? Number(options.retries) : DEFAULT_RETRIES
  let lastError = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(options.fetchImpl, url, {
        timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS,
        headers: { accept: 'application/json' },
      })
      if (!response || !response.ok) {
        const status = response && response.status ? `status_${response.status}` : 'request_failed'
        throw new Error(`brreg_${options.endpoint.slice(1)}_${status}`)
      }
      let json
      try {
        json = await response.json()
      } catch (error) {
        throw new Error(`parse_error:${error && error.message ? error.message : 'invalid_json'}`)
      }
      if (cache) cache.set(url, json)
      return json
    } catch (error) {
      lastError = error
      if (classifyError(error && error.message) === 'timeout') break
    }
  }
  throw lastError || new Error('unknown_error')
}

async function fetchWithTimeout(fetchImpl, url, options = {}) {
  const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS)
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  let timeout
  try {
    const request = fetchImpl(url, { headers: options.headers, signal: controller ? controller.signal : undefined })
    const timer = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        if (controller) controller.abort()
        reject(new Error('timeout'))
      }, timeoutMs)
    })
    return await Promise.race([request, timer])
  } catch (error) {
    if (error && (error.name === 'AbortError' || String(error.message || '').toLowerCase().includes('abort'))) throw new Error('timeout')
    throw error
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

function matchCompanyProfile(input = {}, candidates = [], options = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return emptyProfile('no_match', 0, ['no_plausible_candidate'])
  }

  const scored = candidates
    .map((candidate) => scoreCandidate(input, candidate, options))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  const plausible = scored.filter((candidate) => candidate.score >= 0.55)
  if (!best || best.score < 0.55) {
    return emptyProfile('no_match', 0, ['no_candidate_above_weak_threshold'], scored.slice(0, 5))
  }

  const closeAlternatives = plausible.filter((candidate) => candidate !== best && Math.abs(best.score - candidate.score) <= 0.12)
  const multiplePlausible = closeAlternatives.length > 0 && !candidateClearlyDominates(best, closeAlternatives)
  const unitSubunitAmbiguous = hasUnitSubunitAmbiguity(best, plausible)
  const chainAmbiguous = best.warnings.includes('chain_ambiguity') && !hasStrongChainCorroboration(best)
  const branchAmbiguous = (best.warnings.includes('branch_ambiguity') || best.warnings.includes('branch_location_uncertain')) && !hasStrongBranchCorroboration(best)
  const brandMismatch = best.warnings.includes('brand_legal_name_mismatch') && best.score < 0.92
  const locationMismatch = best.warnings.includes('municipality_mismatch') || best.warnings.includes('address_mismatch')
  const lacksCorroboration = !hasCorroboratingEvidence(best)
  const manualWarnings = [
    multiplePlausible ? 'multiple_plausible_candidates' : null,
    unitSubunitAmbiguous ? 'unit_subunit_ambiguity' : null,
    unitSubunitAmbiguous ? 'branch_location_uncertain' : null,
  ].filter(Boolean)

  if (multiplePlausible || unitSubunitAmbiguous || chainAmbiguous || branchAmbiguous || brandMismatch || locationMismatch || lacksCorroboration) {
    return toProfile(best.candidate, {
      matchConfidence: roundConfidence(best.score),
      matchStatus: 'manual_verify',
      matchReasons: [...best.reasons, multiplePlausible ? 'multiple_plausible_matches' : null, lacksCorroboration ? 'name_match_without_supporting_evidence' : null].filter(Boolean),
      warnings: unique([...best.warnings, ...manualWarnings, ...closeAlternatives.map((item) => `alternative:${item.candidate.navn || item.candidate.organisasjonsnummer}`)]),
      includeOrganizationNumber: false,
      candidates: plausible.length ? plausible : scored.slice(0, 5),
    })
  }

  if (best.score >= 0.95) {
    return toProfile(best.candidate, {
      matchConfidence: roundConfidence(best.score),
      matchStatus: 'exact_match',
      matchReasons: best.reasons,
      warnings: best.warnings,
      includeOrganizationNumber: true,
      candidates: [best],
    })
  }

  if (best.score >= 0.8) {
    return toProfile(best.candidate, {
      matchConfidence: roundConfidence(best.score),
      matchStatus: 'strong_match',
      matchReasons: best.reasons,
      warnings: best.warnings,
      includeOrganizationNumber: true,
      candidates: [best],
    })
  }

  return toProfile(best.candidate, {
    matchConfidence: roundConfidence(best.score),
    matchStatus: 'weak_match',
    matchReasons: best.reasons,
    warnings: best.warnings,
    includeOrganizationNumber: false,
    candidates: plausible.length ? plausible : [best],
  })
}

function scoreCandidate(input = {}, candidate = {}, options = {}) {
  const discovered = normalizeName(input.companyName || input.name || '')
  const legal = normalizeName(candidate.navn || '')
  const discoveredTokens = tokenSet(discovered)
  const legalTokens = tokenSet(legal)
  let score = 0
  const reasons = []
  const warnings = []

  if (discovered && legal && discovered === legal) {
    score += 0.82
    reasons.push('normalized_name_exact')
  } else {
    const similarity = tokenSimilarity(discoveredTokens, legalTokens)
    score += similarity * 0.62
    if (similarity >= 0.9) reasons.push('name_tokens_near_exact')
    else if (similarity >= 0.65) reasons.push('name_tokens_overlap')
    if (isSubstringMatch(discovered, legal)) {
      score += 0.08
      reasons.push('name_substring_match')
    }
  }

  const inputCity = normalizeText(input.city || '')
  const inputAddress = normalizeText(input.address || '')
  const address = candidate.forretningsadresse || candidate.beliggenhetsadresse || candidate.postadresse || {}
  const candidateCity = normalizeText(address.poststed || address.kommune || '')
  const candidateAddress = normalizeText([...(address.adresse || []), address.poststed, address.kommune].filter(Boolean).join(' '))
  if (inputCity && candidateCity && inputCity === candidateCity) {
    score += 0.1
    reasons.push('city_match')
  } else if (inputCity && candidateAddress.includes(inputCity)) {
    score += 0.08
    reasons.push('address_contains_city')
  } else if (inputCity && candidateCity) {
    score -= 0.12
    warnings.push('municipality_mismatch')
  }
  if (inputAddress && candidateAddress && addressOverlap(inputAddress, candidateAddress)) {
    score += 0.08
    reasons.push('address_overlap')
  } else if (inputAddress && candidateAddress && inputCity && candidateCity && inputCity !== candidateCity) {
    warnings.push('address_mismatch')
  }

  const domain = normalizeDomain(input.website || '')
  const homepage = normalizeDomain(candidate.hjemmeside || '')
  if (domain && homepage && domain === homepage) {
    score += 0.09
    reasons.push('domain_match')
  }

  const phone = digitsOnly(input.phone || '')
  const candidatePhones = [candidate.telefon, candidate.mobil].map(digitsOnly).filter(Boolean)
  if (phone && candidatePhones.includes(phone)) {
    score += 0.08
    reasons.push('phone_match')
  }

  if (candidate.type === 'subunit') {
    warnings.push('subunit_candidate')
    if (!hasAnyReason(reasons, ['city_match', 'address_contains_city', 'address_overlap', 'domain_match', 'phone_match'])) {
      warnings.push('branch_location_uncertain')
      score -= 0.04
    }
  }

  const combinedText = normalizeText([input.companyName, input.website, candidate.navn, candidate.hjemmeside].filter(Boolean).join(' '))
  if (CHAIN_WORDS.some((word) => combinedText.includes(normalizeText(word)))) {
    warnings.push('chain_ambiguity')
    if (!hasAnyReason(reasons, ['domain_match', 'address_overlap', 'phone_match', 'city_match'])) score -= 0.12
  }

  const discoveredExtra = [...discoveredTokens].filter((token) => !legalTokens.has(token) && !MARKETING_WORDS.has(token))
  const legalExtra = [...legalTokens].filter((token) => !discoveredTokens.has(token) && !MARKETING_WORDS.has(token))
  if (discoveredExtra.length >= 2 && score < 0.9) {
    warnings.push('branch_ambiguity')
    score -= 0.05
  }
  if (CHAIN_WORDS.some((word) => discovered.includes(normalizeText(word))) && legalExtra.length >= 1 && discoveredExtra.length >= 1) {
    warnings.push('brand_legal_name_mismatch')
    score -= 0.04
  }

  return { candidate, score: clamp(score), reasons: unique(reasons), warnings: unique(warnings) }
}

function toProfile(candidate = {}, match = {}) {
  const address = candidate.forretningsadresse || candidate.beliggenhetsadresse || candidate.postadresse || null
  const nace = Array.isArray(candidate.naeringskode1) ? candidate.naeringskode1[0] : candidate.naeringskode1
  const candidateOrgNumber = valueOrNull(candidate.organisasjonsnummer)
  const orgNumber = match.includeOrganizationNumber ? candidateOrgNumber : null
  return {
    organizationNumber: orgNumber,
    candidateOrganizationNumber: candidateOrgNumber,
    legalName: valueOrNull(candidate.navn),
    candidateLegalName: valueOrNull(candidate.navn),
    organizationForm: valueOrNull(candidate.organisasjonsform && (candidate.organisasjonsform.beskrivelse || candidate.organisasjonsform.kode)),
    registeredAddress: formatAddress(address),
    municipality: valueOrNull(address && address.kommune),
    unitType: unitType(candidate),
    naceCode: valueOrNull(nace && nace.kode),
    naceDescription: valueOrNull(nace && nace.beskrivelse),
    employees: typeof candidate.antallAnsatte === 'number' ? candidate.antallAnsatte : null,
    registrationDate: valueOrNull(candidate.registreringsdatoEnhetsregisteret || candidate.registreringsdatoForetaksregisteret),
    activeStatus: activeStatus(candidate),
    source: 'brreg',
    sourceUrl: valueOrNull(candidate._links && candidate._links.self && candidate._links.self.href),
    errorType: null,
    matchConfidence: roundConfidence(match.matchConfidence || 0),
    matchStatus: normalizeStatus(match.matchStatus),
    matchReasons: normalizeArray(match.matchReasons),
    warnings: normalizeArray(match.warnings),
    candidates: (match.candidates || []).map(candidateSummary),
  }
}

function candidateSummary(scored = {}) {
  const candidate = scored.candidate || scored
  const address = candidate.forretningsadresse || candidate.beliggenhetsadresse || candidate.postadresse || null
  return {
    candidateOrganizationNumber: valueOrNull(candidate.organisasjonsnummer),
    candidateLegalName: valueOrNull(candidate.navn),
    organizationForm: valueOrNull(candidate.organisasjonsform && (candidate.organisasjonsform.beskrivelse || candidate.organisasjonsform.kode)),
    municipality: valueOrNull(address && address.kommune),
    address: formatAddress(address),
    unitType: unitType(candidate),
    score: roundConfidence(scored.score || 0),
    matchReasons: normalizeArray(scored.reasons),
    warnings: normalizeArray(scored.warnings),
  }
}

function emptyProfile(status, confidence, reasons = [], candidates = []) {
  return {
    organizationNumber: null,
    candidateOrganizationNumber: null,
    legalName: null,
    candidateLegalName: null,
    organizationForm: null,
    registeredAddress: null,
    municipality: null,
    unitType: null,
    naceCode: null,
    naceDescription: null,
    employees: null,
    registrationDate: null,
    activeStatus: null,
    source: 'brreg',
    sourceUrl: null,
    errorType: null,
    matchConfidence: roundConfidence(confidence),
    matchStatus: normalizeStatus(status),
    matchReasons: normalizeArray(reasons),
    warnings: [],
    candidates: candidates.map(candidateSummary),
  }
}

function errorProfile(input, reason) {
  return { ...emptyProfile('error', 0, ['brreg_error']), errorType: classifyError(reason), warnings: [String(reason || 'unknown_error')] }
}

function classifyError(reason) {
  const text = String(reason || '').toLowerCase()
  if (text.includes('timeout') || text.includes('abort')) return 'timeout'
  if (text.includes('parse') || text.includes('json')) return 'parse_error'
  if (text.includes('status_')) return 'api_error'
  if (text.includes('fetch') || text.includes('network') || text.includes('request')) return 'network_error'
  return 'unknown_error'
}

function extractEmbedded(json = {}, type) {
  const embedded = json._embedded || {}
  const items = embedded.enheter || embedded.underenheter || []
  return items.map((item) => ({ ...item, type }))
}

function dedupeCandidates(candidates = []) {
  const seen = new Set()
  const output = []
  for (const candidate of candidates) {
    const key = candidate.organisasjonsnummer || candidate.navn
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(candidate)
  }
  return output
}

function hasCorroboratingEvidence(scored = {}) {
  const reasons = new Set(scored.reasons || [])
  return ['city_match', 'address_contains_city', 'address_overlap', 'domain_match', 'phone_match'].some((reason) => reasons.has(reason))
}

function hasStrongChainCorroboration(scored = {}) {
  const reasons = new Set(scored.reasons || [])
  return reasons.has('address_overlap') || reasons.has('phone_match') || (reasons.has('domain_match') && (reasons.has('address_overlap') || reasons.has('phone_match')))
}

function hasStrongBranchCorroboration(scored = {}) {
  const reasons = new Set(scored.reasons || [])
  return ['address_overlap', 'phone_match'].some((reason) => reasons.has(reason)) || (reasons.has('city_match') && reasons.has('domain_match'))
}

function candidateClearlyDominates(best, alternatives = []) {
  if (!alternatives.length) return true
  const second = alternatives[0]
  if (!second) return true
  return best.score - second.score > 0.12 && hasCorroboratingEvidence(best)
}

function hasUnitSubunitAmbiguity(best, plausible = []) {
  const types = new Set(plausible.map((item) => unitType(item.candidate)))
  if (!(types.has('enhet') && types.has('underenhet'))) return false
  const alternatives = plausible.filter((item) => item !== best)
  if (candidateClearlyDominates(best, alternatives) && hasStrongBranchCorroboration(best)) return false
  return true
}

function unitType(candidate = {}) {
  if (candidate.type === 'subunit') return 'underenhet'
  if (candidate.type === 'entity') return 'enhet'
  return 'unknown'
}

function hasAnyReason(reasons, wanted) {
  return wanted.some((reason) => reasons.includes(reason))
}

function buildSearchQuery(name) {
  return normalizeText(name).split(' ').filter((token) => token.length > 1 && !COMPANY_SUFFIXES.has(token)).slice(0, 6).join(' ')
}

function normalizeName(value) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token && !COMPANY_SUFFIXES.has(token))
    .join(' ')
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/&/g, ' og ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function tokenSet(value) {
  return new Set(String(value || '').split(' ').filter((token) => token.length > 1 && !COMPANY_SUFFIXES.has(token)))
}

function tokenSimilarity(a, b) {
  if (!a.size || !b.size) return 0
  const intersection = [...a].filter((token) => b.has(token)).length
  const union = new Set([...a, ...b]).size
  return union ? intersection / union : 0
}

function isSubstringMatch(a, b) {
  if (!a || !b) return false
  return a.length >= 5 && b.length >= 5 && (a.includes(b) || b.includes(a))
}

function addressOverlap(inputAddress, candidateAddress) {
  const input = tokenSet(inputAddress)
  const candidate = tokenSet(candidateAddress)
  const overlap = [...input].filter((token) => candidate.has(token)).length
  return overlap >= Math.min(2, input.size)
}

function normalizeDomain(value) {
  try {
    const url = String(value || '').startsWith('http') ? new URL(value) : new URL(`https://${value}`)
    return url.hostname.replace(/^www\./, '').toLowerCase()
  } catch (_) {
    return ''
  }
}

function activeStatus(candidate = {}) {
  if (candidate.konkurs) return 'bankrupt'
  if (candidate.underAvvikling || candidate.underTvangsavviklingEllerTvangsopplosning) return 'winding_up'
  if (candidate.slettedato || candidate.erSlettet) return 'deleted'
  return 'active'
}

function formatAddress(address) {
  if (!address) return null
  const parts = [...(address.adresse || []), address.postnummer, address.poststed].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (value === null || value === undefined || value === '') return []
  return String(value).split('|').map((part) => part.trim()).filter(Boolean)
}

function normalizeStatus(value) {
  const status = String(value || 'manual_verify')
  return MATCH_STATUSES.has(status) ? status : 'manual_verify'
}

function roundConfidence(value) {
  return Math.round(clamp(Number(value || 0)) * 100) / 100
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

function valueOrNull(value) {
  return value === undefined || value === null || value === '' ? null : String(value)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function clamp(value) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

module.exports = {
  BRREG_BASE_URL,
  enrichCompanyProfile,
  searchBrregCandidates,
  matchCompanyProfile,
  scoreCandidate,
  normalizeName,
  normalizeText,
  classifyError,
}
