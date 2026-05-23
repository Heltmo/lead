const DOMAIN_RULES = [
  { domain: 'legelisten.no', sourceType: 'directory', reason: 'known healthcare directory' },
  { domain: '1881.no', sourceType: 'directory', reason: 'known business directory' },
  { domain: 'gulesider.no', sourceType: 'directory', reason: 'known business directory' },
  { domain: 'proff.no', sourceType: 'governmentRegistry', reason: 'known company registry/profile site' },
  { domain: 'facebook.com', sourceType: 'social', reason: 'known social platform' },
  { domain: 'instagram.com', sourceType: 'social', reason: 'known social platform' },
  { domain: 'linkedin.com', sourceType: 'social', reason: 'known social platform' },
  { domain: 'tannlegerinorge.no', sourceType: 'directory', reason: 'known dental directory' },
]

function classifyDiscoveryTarget(website) {
  const domain = normalizeDomain(website)
  const rule = DOMAIN_RULES.find((item) => domain === item.domain || domain.endsWith('.' + item.domain))
  const sourceType = rule ? rule.sourceType : classifyUnknownDomain(domain)
  const auditEligible = sourceType === 'directBusiness' || sourceType === 'unknown'
  return {
    sourceType,
    auditEligible,
    auditExclusionReason: auditEligible ? '' : (rule ? rule.reason : sourceType + ' target'),
  }
}

function classifyUnknownDomain(domain) {
  if (!domain) return 'unknown'
  return 'directBusiness'
}

function normalizeDomain(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

module.exports = { DOMAIN_RULES, classifyDiscoveryTarget }
