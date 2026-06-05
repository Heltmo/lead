const { buildOpportunityCommandCenter } = require('../opportunityCommandCenter')

const leadPacks = [
  {
    company: { displayName: 'Bergen Rør AS', organizationNumber: '999888777', matchStatus: 'exact_match', employees: 12 },
    contact: { phone: '55550000', city: 'Bergen' },
    places: { rating: 4.7, reviewCount: 31 },
    sourceQuality: { locationMatchStatus: 'exact_location' },
    sellerFit: { sellerFit: 'strong', recommendedAction: 'contact' },
    sourceFusion: { leadConfidence: 'strong', identityConfidence: 'confirmed', contactConfidence: 'good', locationConfidence: 'exact', recommendedTrustAction: 'call', warnings: [], conflicts: [] },
    workflow: { status: 'new', queue: 'call_now', contacted: false },
  },
  {
    company: { displayName: 'Oslo Candidate VVS', candidateOrganizationNumber: '111222333', matchStatus: 'manual_verify', warnings: ['multiple_plausible_candidates'] },
    contact: { phone: '22223333', city: 'Oslo' },
    places: { rating: 4.1, reviewCount: 4 },
    sourceQuality: { locationMatchStatus: 'regional_fallback' },
    sellerFit: { sellerFit: 'review', recommendedAction: 'verify' },
    sourceFusion: { leadConfidence: 'review', identityConfidence: 'manual_verify', contactConfidence: 'good', locationConfidence: 'fallback', recommendedTrustAction: 'verify_first', warnings: ['Regional fallback: do not treat this as an exact local lead.'], conflicts: [] },
    workflow: { status: 'new', queue: 'verify_first', contacted: false },
  },
  {
    company: { displayName: 'Ålesund Follow AS', organizationNumber: '123456789', matchStatus: 'exact_match' },
    contact: { phone: '70112233', city: 'Ålesund' },
    places: { rating: 4.3, reviewCount: 11 },
    sourceQuality: { locationMatchStatus: 'exact_location' },
    sellerFit: { sellerFit: 'good', recommendedAction: 'contact' },
    sourceFusion: { leadConfidence: 'good', identityConfidence: 'confirmed', contactConfidence: 'good', locationConfidence: 'exact', recommendedTrustAction: 'call', warnings: [], conflicts: [] },
    workflow: { status: 'follow_up', response: 'no_answer', followUpDate: '2026-06-03', nextFollowUpAt: '2026-06-03', contacted: true },
  },
  {
    company: { displayName: 'No Phone Drift AS', matchStatus: 'no_match' },
    contact: { city: 'Oslo' },
    sourceQuality: { locationMatchStatus: 'regional_fallback' },
    sellerFit: { sellerFit: 'review', recommendedAction: 'verify' },
    sourceFusion: { leadConfidence: 'review', identityConfidence: 'unknown', contactConfidence: 'weak', locationConfidence: 'fallback', recommendedTrustAction: 'verify_first', warnings: [], conflicts: [] },
    workflow: { status: 'new', contacted: false },
  },
]

const commandCenter = buildOpportunityCommandCenter({
  leadPacks,
  savedSearches: [{ query: 'rørlegger', sellerIntent: 'telecom' }],
  summary: { marketSweep: true, marketSweepCityCounts: { Bergen: 1, Oslo: 2, 'Ålesund': 1 } },
  generatedAt: '2026-06-04T09:00:00.000Z',
  today: '2026-06-04',
})

assert(commandCenter.status === 'ready', 'command center should be ready when leads exist')
assert(commandCenter.topActions.length >= 3, 'command center should produce top actions')
assert(commandCenter.callTheseFirst.some((item) => item.company === 'Bergen Rør AS'), 'command center should recommend call-first leads')
assert(commandCenter.verifyBeforeCalling.some((item) => item.company === 'Oslo Candidate VVS'), 'command center should recommend verify-first leads')
assert(commandCenter.verifyBeforeCalling.find((item) => item.company === 'Oslo Candidate VVS').reasons.join(' ').toLowerCase().includes('candidate'), 'verify recommendation should include traceable reason')
assert(commandCenter.overdueFollowUps.some((item) => item.company === 'Ålesund Follow AS' && item.timing === 'overdue'), 'command center should surface overdue follow-ups')
assert(commandCenter.bestMarketsNow[0].city === 'Bergen', 'best market should favor high-quality phone-ready city')
assert(commandCenter.wastedTimeWarnings.some((item) => item.id === 'high verification burden' || item.id === 'verify_first'), 'command center should warn about verification burden')
assert(commandCenter.sourceWarnings.some((item) => item.label.toLowerCase().includes('regional fallback')), 'command center should summarize source warnings')

const empty = buildOpportunityCommandCenter({ leadPacks: [], generatedAt: '2026-06-04T09:00:00.000Z' })
assert(empty.status === 'empty', 'empty command center should be explicit')
assert(empty.topActions.some((item) => item.id === 'run_search'), 'empty command center should suggest running a search')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
