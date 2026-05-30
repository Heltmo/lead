const DEFAULT_BASE_URL = 'https://api.proff.no/api'

async function enrichProffCompany(input = {}, options = {}) {
  const organizationNumber = digits(input.organizationNumber)
  const matchStatus = String(input.matchStatus || '').toLowerCase()
  const confirmed = Boolean(organizationNumber && ['exact_match', 'strong_match', 'confirmed_org'].includes(matchStatus))
  const apiKey = options.apiKey || process.env.PROFF_API_KEY || ''

  if (!apiKey) return disabledProfile(organizationNumber)
  if (!confirmed) return notEligibleProfile(organizationNumber, 'confirmed_org_number_required')

  const fetchImpl = options.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') return errorProfile(organizationNumber, 'fetch_unavailable', ['fetch_unavailable'])

  const baseUrl = String(options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const timeoutMs = Number(options.timeoutMs || 10000)
  const urls = candidateUrls(baseUrl, organizationNumber)
  let lastError = null
  for (const url of urls) {
    try {
      const response = await withTimeout(fetchImpl(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Token ${apiKey}`,
        },
      }), timeoutMs)
      if (!response || !response.ok) {
        lastError = new Error(`api_error:${response ? response.status : 'unknown'}`)
        if (response && response.status === 404) continue
        return errorProfile(organizationNumber, 'api_error', [`proff_api_${response ? response.status : 'unknown'}`])
      }
      const data = await response.json()
      return mapProffResponse(data, { organizationNumber, sourceUrl: url })
    } catch (error) {
      lastError = error
    }
  }
  const errorType = lastError && String(lastError.message || '').includes('timeout') ? 'timeout' : 'network_error'
  return errorProfile(organizationNumber, errorType, [lastError?.message || 'proff_lookup_failed'])
}

function candidateUrls(baseUrl, organizationNumber) {
  return [
    `${baseUrl}/companies/register/NO/${organizationNumber}`,
    `${baseUrl}/companies/register/${organizationNumber}`,
    `${baseUrl}/company/${organizationNumber}`,
  ]
}

function mapProffResponse(data, context) {
  const root = unwrap(data)
  const accounts = firstArray(root.accounts, root.annualAccounts, root.companyAccounts, root.financialStatements, root.finance)
  const latest = accounts && accounts.length ? accounts[0] : root
  const revenue = firstNumber(
    findDeep(latest, ['revenue', 'operatingRevenue', 'turnover', 'salesRevenue', 'totalRevenue', 'driftsinntekter']),
    findDeep(root, ['revenue', 'operatingRevenue', 'turnover', 'salesRevenue', 'totalRevenue', 'driftsinntekter'])
  )
  const profit = firstNumber(
    findDeep(latest, ['profit', 'result', 'netProfit', 'ordinaryResult', 'operatingProfit', 'annualResult', 'arsresultat']),
    findDeep(root, ['profit', 'result', 'netProfit', 'ordinaryResult', 'operatingProfit', 'annualResult', 'arsresultat'])
  )
  const employees = firstNumber(findDeep(root, ['employees', 'numberOfEmployees', 'employeeCount', 'antallAnsatte']))
  return {
    source: 'proff',
    enrichmentStatus: 'success',
    organizationNumber: context.organizationNumber,
    companyName: firstString(findDeep(root, ['name', 'companyName', 'legalName', 'businessName'])),
    revenue: revenue ?? null,
    profit: profit ?? null,
    employees: employees ?? null,
    roles: normalizeList(findDeep(root, ['roles', 'management', 'boardMembers'])),
    owners: normalizeList(findDeep(root, ['owners', 'shareholders', 'beneficialOwners'])),
    creditScore: firstString(findDeep(root, ['creditScore', 'rating', 'creditRating', 'score'])),
    paymentRemarks: findDeep(root, ['paymentRemarks', 'remarks', 'betalingsanmerkninger']) ?? null,
    rawAvailableFields: Object.keys(root || {}).slice(0, 40),
    warnings: [],
    sourceUrl: context.sourceUrl,
  }
}

function unwrap(data) {
  if (!data || typeof data !== 'object') return {}
  if (Array.isArray(data)) return data[0] || {}
  return data.company || data.data || data.result || data.results?.[0] || data
}

function disabledProfile(organizationNumber) {
  return { source: 'proff', enrichmentStatus: 'disabled', organizationNumber: organizationNumber || null, companyName: null, revenue: null, profit: null, employees: null, roles: [], owners: [], creditScore: null, paymentRemarks: null, rawAvailableFields: [], warnings: ['PROFF_API_KEY_missing'], sourceUrl: null }
}

function notEligibleProfile(organizationNumber, reason) {
  return { source: 'proff', enrichmentStatus: 'not_eligible', organizationNumber: organizationNumber || null, companyName: null, revenue: null, profit: null, employees: null, roles: [], owners: [], creditScore: null, paymentRemarks: null, rawAvailableFields: [], warnings: [reason], sourceUrl: null }
}

function errorProfile(organizationNumber, errorType, warnings = []) {
  return { source: 'proff', enrichmentStatus: 'error', errorType, organizationNumber: organizationNumber || null, companyName: null, revenue: null, profit: null, employees: null, roles: [], owners: [], creditScore: null, paymentRemarks: null, rawAvailableFields: [], warnings, sourceUrl: null }
}

function withTimeout(promise, timeoutMs) {
  let timeout
  return Promise.race([
    promise,
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('timeout')), timeoutMs) }),
  ]).finally(() => clearTimeout(timeout))
}

function findDeep(value, keys) {
  if (!value || typeof value !== 'object') return null
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key) && value[key] !== null && value[key] !== undefined && value[key] !== '') return value[key]
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') {
      const found = findDeep(child, keys)
      if (found !== null && found !== undefined && found !== '') return found
    }
  }
  return null
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value) && value.length) || null
}

function firstNumber(...values) {
  for (const value of values) {
    const n = Number(String(value ?? '').replace(/\s/g, '').replace(',', '.'))
    if (Number.isFinite(n)) return n
  }
  return null
}

function firstString(value) {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

function normalizeList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.slice(0, 20)
  if (typeof value === 'object') return Object.values(value).slice(0, 20)
  return [String(value)]
}

function digits(value) {
  return String(value || '').replace(/\D/g, '')
}

module.exports = { enrichProffCompany, mapProffResponse }
