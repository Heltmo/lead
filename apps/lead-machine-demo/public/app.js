const PROFESSIONS = [
  { label: 'Rørlegger', value: 'rørlegger' },
  { label: 'Elektriker', value: 'elektriker' },
  { label: 'Tannlege', value: 'tannlege' },
  { label: 'Advokat', value: 'advokat' },
  { label: 'Fysioterapeut', value: 'fysioterapeut' },
  { label: 'Regnskapsfører', value: 'regnskapsfører' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Bilverksted', value: 'bilverksted' },
  { label: 'Frisør', value: 'frisør' },
  { label: 'Eiendomsmegler', value: 'eiendomsmegler' },
]

const LOCATIONS = [
  'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 'Drammen', 'Fredrikstad', 'Sarpsborg', 'Moss', 'Halden',
  'Ålesund', 'Molde', 'Kristiansund', 'Bodø', 'Tromsø', 'Alta', 'Narvik', 'Harstad', 'Hamar', 'Lillehammer',
  'Gjøvik', 'Elverum', 'Kongsvinger', 'Tønsberg', 'Sandefjord', 'Larvik', 'Skien', 'Porsgrunn', 'Arendal', 'Grimstad',
  'Mandal', 'Flekkefjord', 'Bryne', 'Sandnes', 'Haugesund', 'Karmøy', 'Stord', 'Voss', 'Førde', 'Florø',
  'Sogndal', 'Gol', 'Geilo', 'Hønefoss', 'Kongsberg', 'Notodden', 'Ringerike', 'Lillestrøm', 'Jessheim', 'Ski',
  'Asker', 'Bærum', 'Lørenskog', 'Eidsvoll', 'Ullensaker', 'Nesodden', 'Nittedal', 'Råde', 'Rygge', 'Rolvsøy',
  'Namsos', 'Steinkjer', 'Levanger', 'Stjørdal', 'Mo i Rana', 'Mosjøen', 'Brønnøysund', 'Sortland', 'Svolvær', 'Hammerfest',
]

const state = { result: null, selectedIndex: 0 }

const els = {
  profession: document.getElementById('professionSelect'),
  location: document.getElementById('locationInput'),
  locationOptions: document.getElementById('locationOptions'),
  query: document.getElementById('queryInput'),
  provider: document.getElementById('provider'),
  runMode: document.getElementById('runMode'),
  maxResults: document.getElementById('maxResults'),
  searchScope: document.getElementById('searchScope'),
  companyProfile: document.getElementById('companyProfile'),
  runButton: document.getElementById('runButton'),
  status: document.getElementById('statusPanel'),
  summary: document.getElementById('summaryPanel'),
  leadCards: document.getElementById('leadCards'),
  leadDetail: document.getElementById('leadDetail'),
  exportPanel: document.getElementById('exportPanel'),
}

initStructuredSearch()
els.runButton.addEventListener('click', runSearch)
els.query.addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch() })
els.location.addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch() })
els.profession.addEventListener('change', syncQueryFromStructuredSearch)
els.location.addEventListener('input', syncQueryFromStructuredSearch)
els.runMode.addEventListener('change', () => renderSummary(state.result))
renderSummary(null)
renderExport(null)

function initStructuredSearch() {
  els.profession.innerHTML = PROFESSIONS.map((item) => `<option value="${escapeAttr(item.value)}">${escapeHtml(item.label)}</option>`).join('')
  els.locationOptions.innerHTML = LOCATIONS.map((location) => `<option value="${escapeAttr(location)}"></option>`).join('')
  els.profession.value = 'rørlegger'
  syncQueryFromStructuredSearch()
}

function syncQueryFromStructuredSearch() {
  const profession = els.profession.value.trim()
  const location = els.location.value.trim()
  if (profession && location) els.query.value = `${profession} i ${location}`
}

async function runSearch() {
  const query = els.query.value.trim()
  if (!query) return setStatus('Skriv inn et søk først.', 'failed')
  setStatus('running: queued', 'running')
  els.runButton.disabled = true
  state.result = null
  state.selectedIndex = 0
  renderSummary(null)
  renderLeads([])
  renderDetail(null)
  renderExport(null)

  try {
    const statusText = els.runMode.value === 'fast'
      ? 'running: fast discovery and lead-pack build'
      : 'running: deep website audit and scoring; this can take a few minutes'
    setStatus(statusText, 'running')
    const response = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query,
        provider: els.provider.value,
        maxResults: Number(els.maxResults.value),
        searchScope: els.searchScope.value,
        mode: els.runMode.value,
        enrichCompanyProfile: true,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Run failed')
    state.result = payload
    setStatus('completed', '')
    renderAll()
  } catch (error) {
    setStatus(`failed: ${error.message || 'Run failed'}`, 'failed')
  } finally {
    els.runButton.disabled = false
  }
}

function renderAll() {
  const leads = state.result?.leadPacks || []
  renderSummary(state.result)
  renderLeads(leads)
  renderDetail(leads[state.selectedIndex] || null)
  renderExport(state.result)
}

function renderSummary(result) {
  const summary = result?.summary || {}
  els.summary.innerHTML = `
    ${metric('Included', summary.includedLeadCount ?? summary.totalLeads ?? 0)}
    ${metric('Mode', readable(summary.mode || 'fast'))}
    ${metric('Discovered', summary.totalDiscovered ?? 'unknown')}
    ${metric('Low supply', summary.lowSupply ? 'Yes' : 'No')}
    ${metric('Fallback', summary.fallbackUsed ? 'Used' : (summary.fallbackAvailable ? 'Available' : 'No'))}
    ${metric('Priority counts', formatCounts(summary.callPriorityCounts || summary.priorityCounts || {}))}
    ${metric('Next action', modeGuidance(summary))}
  `
}

function renderLeads(leads) {
  if (!leads.length) {
    els.leadCards.innerHTML = '<div class="empty-state">No lead packs yet.</div>'
    return
  }
  els.leadCards.innerHTML = leads.map((lead, index) => {
    const contact = lead.contact || {}
    const places = lead.places || {}
    const company = lead.company || {}
    const primarySignal = sellerSignals(lead)[0] || humanize(lead.opportunityType || 'Lead pack')
    return `
      <button class="lead-card ${index === state.selectedIndex ? 'active' : ''}" type="button" data-index="${index}">
        <div class="badge-row">${badge(lead.callPriority || lead.priority)}${badge(lead.sourceQuality?.locationMatchStatus)}${badge(brregStatusLabel(company))}${fastBadge(lead)}</div>
        <h3>${escapeHtml(company.displayName || lead.companyName || 'Unknown company')}</h3>
        <p>${escapeHtml(contact.city || lead.city || 'unknown')} · ${escapeHtml(contact.phone || lead.phone || 'phone unknown')}</p>
        <p class="card-signal">${escapeHtml(primarySignal)}</p>
        <p class="card-meta">${escapeHtml(formatRating(places))} · ${escapeHtml(contact.website ? 'website found' : 'website unknown')}</p>
      </button>
    `
  }).join('')
  els.leadCards.querySelectorAll('.lead-card').forEach((button) => button.addEventListener('click', () => {
    state.selectedIndex = Number(button.dataset.index)
    renderAll()
  }))
}

function renderDetail(lead) {
  if (!lead) {
    els.leadDetail.innerHTML = '<div class="empty-state">Run a search to inspect company profile, contact data, evidence and caution.</div>'
    return
  }
  const company = lead.company || {}
  const contact = lead.contact || {}
  const ranking = lead.ranking || {}
  const website = lead.website || {}
  const sourceQuality = lead.sourceQuality || {}
  const places = lead.places || {}
  const economy = lead.economy || {}
  const discoveryQuality = sourceQuality.discoveryQuality || {}
  const leverage = sellerSignals(lead)
  const command = sellerCommand(lead)
  const nextStep = command.nextAction
  els.leadDetail.innerHTML = `
    <div class="detail-title">
      <div>
        <p class="eyebrow">Selected lead</p>
        <h2>${escapeHtml(company.displayName || lead.companyName || 'Unknown company')}</h2>
        <p class="muted">${escapeHtml(company.legalName || 'Legal name unknown')}</p>
      </div>
      <div class="badge-row">${badge(lead.callPriority || lead.priority)}${badge(brregStatusLabel(company))}${badge(sourceQuality.locationMatchStatus)}${fastBadge(lead)}</div>
    </div>

    ${sellerCommandCard(command)}

    ${sellerDeskCards(lead, command)}

    <section class="leverage-panel compact">
      <div>
        <p class="eyebrow">Seller leverage</p>
        <h3>Supporting reasons</h3>
      </div>
      ${bullets(leverage)}
    </section>

    ${fastQualificationPanel(lead)}

    <details class="detail-collapse">
      <summary>Source intelligence</summary>
      <div class="source-grid">
      ${sourceCard('Google Places', places.provider || 'available', [
        ['Rating', formatRating(places)],
        ['Place ID', places.placeId || 'unknown'],
        ['Reviews', places.reviewCount ?? 'unknown'],
      ])}
      ${sourceCard('Website audit', website.auditStatus || 'available', [
        ['Contactability', website.contactability || 'unknown'],
        ['Top signal', (website.topEvidence || [])[0] || 'none'],
        ['CTA profile', website.ctaProfile ? 'available' : 'unknown'],
      ])}
      ${brregSourceCard(company)}
      ${sourceCard('Source strategy', sourceStrategyStatus(company, sourceQuality, places), [
        ['Identity source', isBrregUnavailable(company) ? 'brreg unavailable' : (sourceQuality.identitySource || company.source || 'unknown')],
        ['Presence source', sourceQuality.presenceSource || places.provider || 'unknown'],
        ['Strategy', sourceStrategyLabel(company, sourceQuality)],
      ])}
      ${sourceCard('Economy / Proff', economy.status || 'not_enabled', [
        ['Revenue', economy.revenue ?? 'not enabled'],
        ['Employees', economy.employees ?? 'not enabled'],
        ['Source', economy.source || 'not enabled'],
      ])}
      ${sourceCard('Discovery quality', discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown', [
        ['Score', discoveryQuality.score == null ? 'unknown' : `${discoveryQuality.score}/100`],
        ['Reasons', (discoveryQuality.reasons || []).slice(0, 3).map(humanize).join(', ') || 'unknown'],
        ['Warnings', (discoveryQuality.warnings || []).slice(0, 3).map(humanize).join(', ') || 'none'],
      ])}
      </div>
    </details>

    <details class="detail-collapse">
      <summary>Raw lead data</summary>
    ${section('Company and contact', kv([
      ['Confirmed org.nr', company.organizationNumber || 'none'],
      ['Candidate org.nr', company.candidateOrganizationNumber || 'none'],
      ['Legal name', company.legalName || 'unknown'],
      ['Candidate legal name', company.candidateLegalName || 'none'],
      ['Organization form', company.organizationForm || 'unknown'],
      ['Registered address', company.registeredAddress || 'unknown'],
      ['Municipality', company.municipality || 'unknown'],
      ['NACE', [company.naceCode, company.naceDescription].filter(Boolean).join(' - ') || 'unknown'],
      ['Employees', company.employees ?? 'unknown'],
      ['Registered', company.registrationDate || 'unknown'],
      ['Status', company.activeStatus || 'unknown'],
      ['Match status', readable(company.matchStatus || 'not_run')],
      ['Match confidence', company.matchConfidence ?? 'unknown'],
      ['Warnings', normalizeList(company.warnings).map(humanize).join(', ') || 'none'],
      ['Brreg source', link(company.sourceUrl)],
      ['Website', link(websiteValue(contact.website || lead.website))],
      ['Phone', contact.phone || lead.phone || 'unknown'],
      ['Email', contact.email || lead.email || 'unknown'],
      ['Address', contact.address || lead.address || 'unknown'],
      ['City', contact.city || lead.city || 'unknown'],
    ]))}
    ${candidateSection(company)}
    ${section('Lead intelligence', kv([
      ['Lead class', humanize(lead.leadClass || 'unknown')],
      ['Opportunity', humanize(lead.opportunityType || 'unknown')],
      ['Sales ease', readable(ranking.salesEase || 'unknown')],
      ['Pain score', ranking.painScore ?? 'unknown'],
      ['Location', readable(sourceQuality.locationMatchStatus || 'unknown')],
      ['Economy', readable(economy.status || 'not_enabled')],
      ['Discovery confidence', readable(discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown')],
      ['Identity source', sourceQuality.identitySource || company.source || 'unknown'],
      ['Presence source', sourceQuality.presenceSource || places.provider || 'unknown'],
    ]))}
    ${section('Evidence', bullets((website.topEvidence || lead.topEvidence || lead.evidence || []).map(humanizeEvidence)))}
    ${section('Caution', bullets((ranking.caution || lead.caution || []).map(humanizeEvidence)))}
    </details>
  `
}

function modeGuidance(summary) {
  const mode = summary.mode || els.runMode.value || 'fast'
  if (!summary || Object.keys(summary).length === 0) {
    return mode === 'deep' ? 'Deep mode qualifies leads with full audit/scoring.' : 'Fast mode finds candidates; use Deep to qualify selected leads.'
  }
  const included = Number(summary.includedLeadCount ?? summary.totalLeads ?? 0)
  if (mode === 'fast' && included > 0) return 'These are candidates, not fully qualified leads. Run Deep on promising ones.'
  return summary.nextRecommendedAction || 'These leads include audit/scoring signals.'
}

function fastBadge(lead) {
  return isFastLead(lead) ? '<span class="badge audit-skipped">Audit skipped</span>' : ''
}

function isFastLead(lead) {
  return lead?.meta?.mode === 'fast' || lead?.website?.auditStatus === 'skipped_fast_mode' || lead?.leadClass === 'fast_discovery'
}

function fastQualificationPanel(lead) {
  if (!isFastLead(lead)) return '<section class="qualification-panel deep"><strong>Deep qualified</strong><span>This lead includes website audit and scoring signals.</span></section>'
  return `<section class="qualification-panel fast">
    <div><strong>Needs Deep qualification</strong><span>Fast mode found this candidate quickly. Full audit and scoring are not run yet.</span></div>
    <button type="button" id="runDeepQualification">Run Deep qualification for this lead</button>
  </section>`
}


function sellerCommandCard(command) {
  return `<section class="command-card">
    <div class="command-main">
      <div>
        <p class="eyebrow">Seller command</p>
        <h3>${escapeHtml(command.headline)}</h3>
        <p>${escapeHtml(command.summary)}</p>
      </div>
      <div class="command-score ${escapeAttr(command.readinessKey)}">
        <span>Call readiness</span>
        <strong>${escapeHtml(command.callReadiness)}</strong>
      </div>
    </div>
    <div class="command-grid">
      ${commandMetric('Best first contact', command.bestContact, command.bestContactNote)}
      ${commandMetric('Company fit', command.companyFit, command.companyFitNote)}
      ${commandMetric('Verification', command.verification, command.verificationNote)}
      ${commandMetric('Main risk', command.mainRisk, command.mainRiskNote)}
      ${commandMetric('Next action', command.nextAction, command.nextActionNote)}
      ${commandMetric('Source confidence', command.sourceConfidence, command.sourceConfidenceNote)}
    </div>
  </section>`
}

function commandMetric(label, value, note) {
  return `<div class="command-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`
}

function sellerDeskCards(lead, command) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const website = lead.website || {}
  const sourceQuality = lead.sourceQuality || {}
  const discoveryQuality = sourceQuality.discoveryQuality || {}
  const economy = lead.economy || {}
  const orgStatus = brregStatusLabel(company)
  const websiteUrl = websiteValue(contact.website || lead.website)
  const locationText = [contact.address || lead.address, contact.city || lead.city].filter(Boolean).join(', ') || 'unknown'
  const identityRows = [
    ['Legal name', company.legalName || company.candidateLegalName || 'unknown'],
    ['Org.nr', company.organizationNumber || company.candidateOrganizationNumber || 'unknown'],
    ['Status', company.activeStatus || 'unknown'],
    ['Employees', company.employees ?? 'unknown'],
    ['NACE', [company.naceCode, company.naceDescription].filter(Boolean).join(' - ') || 'unknown'],
  ]
  const contactRows = [
    ['Phone', contact.phone || lead.phone || 'unknown'],
    ['Email', contact.email || lead.email || 'unknown'],
    ['Website', websiteUrl ? link(websiteUrl) : 'unknown'],
    ['Address', locationText],
  ]
  const marketRows = [
    ['Google', formatRating(places)],
    ['Location', readable(sourceQuality.locationMatchStatus || 'unknown')],
    ['Discovery', discoveryQuality.score == null ? readable(discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown') : `${discoveryQuality.score}/100`],
    ['Presence', sourceQuality.presenceSource || places.provider || 'unknown'],
  ]
  const qualificationRows = [
    ['Mode', isFastLead(lead) ? 'Fast candidate' : 'Deep qualified'],
    ['Priority', readable(lead.callPriority || lead.priority || 'unknown')],
    ['Lead class', humanize(lead.leadClass || 'unknown')],
    ['Opportunity', humanize(lead.opportunityType || 'unknown')],
  ]
  const riskRows = [
    ['Readiness', command.callReadiness],
    ['Main risk', command.mainRisk],
    ['Verification', command.verification],
    ['Warnings', normalizeList(company.warnings).map(humanize).join(', ') || 'none'],
  ]
  const nextRows = [
    ['Next action', command.nextAction],
    ['Why', command.nextActionNote],
    ['Economy', readable(economy.status || 'not_enabled')],
    ['Export state', company.organizationNumber ? 'identity ready' : company.candidateOrganizationNumber ? 'verify candidate org.nr' : 'identity not confirmed'],
  ]

  return `<section class="seller-desk-v2">
    ${sellerDeskCard('Company identity', orgStatus, identityRows, company.sourceUrl ? link(company.sourceUrl) : '')}
    ${sellerDeskCard('Contactability', contact.phone ? 'phone_available' : 'contact_missing', contactRows, command.bestContactNote)}
    ${sellerDeskCard('Market proof', sourceQuality.locationMatchStatus || 'unknown', marketRows, places.placeId ? `Place ID: ${places.placeId}` : '')}
    ${sellerDeskCard('Qualification', isFastLead(lead) ? 'audit_skipped' : 'completed', qualificationRows, isFastLead(lead) ? 'Candidate until Deep runs.' : 'Audit/scoring included.')}
    ${sellerDeskCard('Risk and caution', command.readinessKey, riskRows, command.mainRiskNote)}
    ${sellerDeskCard('Seller next step', lead.callPriority || lead.priority || 'verify', nextRows, 'No script generated; seller owns angle and wording.')}
  </section>`
}

function sellerDeskCard(title, status, rows, footer = '') {
  return `<section class="seller-desk-card">
    <div class="seller-desk-title"><h3>${escapeHtml(title)}</h3>${badge(status)}</div>
    ${kv(rows)}
    ${footer ? `<p class="seller-desk-note">${isHtml(footer) ? footer : escapeHtml(footer)}</p>` : ''}
  </section>`
}

function sellerCommand(lead) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const sourceQuality = lead.sourceQuality || {}
  const discoveryQuality = sourceQuality.discoveryQuality || {}
  const ranking = lead.ranking || {}
  const priority = String(lead.callPriority || lead.priority || 'verify').toLowerCase()
  const fast = isFastLead(lead)
  const confirmedOrg = Boolean(company.organizationNumber && ['exact_match', 'strong_match'].includes(String(company.matchStatus || '').toLowerCase()))
  const candidateOrg = Boolean(company.candidateOrganizationNumber || ['manual_verify', 'weak_match'].includes(String(company.matchStatus || '').toLowerCase()))
  const exactLocation = sourceQuality.locationMatchStatus === 'exact_location'
  const hasPhone = Boolean(contact.phone || lead.phone)
  const hasWebsite = Boolean(contact.website || lead.website)
  const rating = Number(places.rating || 0)
  const employees = Number(company.employees || 0)
  const discoveryLevel = String(discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown').toLowerCase()

  let readinessKey = 'verify'
  if (!hasPhone) readinessKey = 'weak'
  else if (fast || priority === 'verify' || candidateOrg || !confirmedOrg) readinessKey = 'verify'
  else if (priority === 'high') readinessKey = 'strong'
  else readinessKey = 'good'

  const callReadiness = {
    strong: 'Strong',
    good: 'Good',
    verify: 'Verify first',
    weak: 'Weak',
  }[readinessKey]

  const bestContact = hasPhone ? (contact.phone || lead.phone) : (contact.email || lead.email || 'unknown')
  const bestContactNote = hasPhone ? 'Direct phone is available.' : contact.email ? 'Email exists, phone missing.' : 'Find a direct contact before sales work.'

  let fitScore = 0
  if (exactLocation) fitScore += 2
  if (hasPhone) fitScore += 2
  if (hasWebsite) fitScore += 1
  if (confirmedOrg) fitScore += 2
  if (candidateOrg) fitScore += 1
  if (rating >= 4.3) fitScore += 1
  if (employees >= 5) fitScore += 1
  const companyFit = fitScore >= 7 ? 'Strong fit' : fitScore >= 5 ? 'Good fit' : fitScore >= 3 ? 'Review fit' : 'Weak fit'
  const companyFitNote = [
    exactLocation ? 'right location' : 'location needs review',
    confirmedOrg ? 'confirmed identity' : candidateOrg ? 'candidate identity' : 'identity not verified',
    hasPhone ? 'phone available' : 'phone missing',
  ].join(' · ')

  const brregUnavailable = isBrregUnavailable(company)
  const verification = confirmedOrg ? 'Confirmed org.nr' : candidateOrg ? 'Candidate org.nr' : brregUnavailable ? 'Identity pending' : 'Not verified'
  const verificationNote = confirmedOrg ? `${company.organizationNumber} · ${company.matchConfidence ?? 'unknown'} confidence` : candidateOrg ? 'Manual verify before export.' : brregUnavailable ? 'Brreg is unavailable right now; retry before export.' : 'Brreg returned no confirmed identity.'

  let mainRisk = 'Low data risk'
  let mainRiskNote = 'Core contact and identity fields look usable.'
  if (fast) {
    mainRisk = contact.website ? 'Website unverified' : 'Fast mode only'
    mainRiskNote = contact.website ? 'Google supplied a URL, but Deep must verify it is real and relevant.' : 'Website audit and full scoring are skipped.'
  } else if (!confirmedOrg && candidateOrg) {
    mainRisk = 'Identity uncertain'
    mainRiskNote = 'Candidate org.nr must be verified.'
  } else if (!exactLocation) {
    mainRisk = 'Location fallback'
    mainRiskNote = 'Do not treat this as an exact local lead.'
  } else if ((ranking.caution || []).length) {
    mainRisk = 'Review caution'
    mainRiskNote = humanizeEvidence((ranking.caution || [])[0])
  }

  let nextAction = nextSellerStep(lead)
  let nextActionNote = 'Use the lead pack evidence before sales work.'
  if (fast) {
    nextAction = confirmedOrg && hasPhone ? 'Run Deep qualification' : candidateOrg ? 'Verify org.nr, then Deep' : brregUnavailable ? 'Run Deep; retry Brreg before export' : 'Run Deep qualification'
    nextActionNote = 'Fast scan found the candidate; qualify before call-first.'
  } else if (priority === 'high') {
    nextAction = 'Review first'
    nextActionNote = 'Deep evidence supports high priority.'
  }

  const sourceConfidence = discoveryLevel === 'unknown' ? 'Unknown' : readable(discoveryLevel)
  const sourceConfidenceNote = discoveryQuality.score == null ? 'No discovery score available.' : `Discovery score ${discoveryQuality.score}/100.`

  const headline = `${companyFit} · ${verification}`
  const summary = buildCommandSummary({ company, contact, places, confirmedOrg, candidateOrg, exactLocation, fast, employees, priority })

  return { headline, summary, callReadiness, readinessKey, bestContact, bestContactNote, companyFit, companyFitNote, verification, verificationNote, mainRisk, mainRiskNote, nextAction, nextActionNote, sourceConfidence, sourceConfidenceNote }
}

function buildCommandSummary({ company, contact, places, confirmedOrg, candidateOrg, exactLocation, fast, employees, priority }) {
  const parts = []
  if (confirmedOrg) parts.push(`Legal identity is confirmed${company.organizationNumber ? ` (${company.organizationNumber})` : ''}`)
  else if (candidateOrg) parts.push('Legal identity has a candidate match but needs manual verification')
  else parts.push('Legal identity is not verified')
  if (contact.phone) parts.push(`phone ${contact.phone} is available`)
  if (employees) parts.push(`${employees} employees registered`)
  if (places.rating) parts.push(`Google rating ${places.rating}/5`)
  if (exactLocation) parts.push('location matches the search')
  if (fast) parts.push(contact.website ? 'website URL is unverified until Deep runs' : 'full website audit is not run yet')
  else parts.push(`priority is ${String(priority || 'unknown').toUpperCase()}`)
  return `${parts.join('; ')}.`
}

function factCard(label, value, note) {
  return `<div class="fact-card"><span>${escapeHtml(label)}</span><strong>${isHtml(value) ? value : escapeHtml(value)}</strong><small>${isHtml(note) ? note : escapeHtml(note)}</small></div>`
}

function sourceCard(title, status, rows) {
  return `<section class="source-card"><div class="source-title"><h3>${escapeHtml(title)}</h3>${badge(status)}</div>${kv(rows)}</section>`
}

function companyIdValue(company = {}) {
  if (company.organizationNumber) return company.organizationNumber
  if (company.candidateOrganizationNumber) return company.candidateOrganizationNumber
  if (isBrregUnavailable(company)) return 'Brreg unavailable'
  return 'not verified'
}

function companyIdNote(company = {}) {
  if (company.organizationNumber) return 'Confirmed official identity'
  if (company.candidateOrganizationNumber) return 'Candidate org.nr; verify before export'
  if (isBrregUnavailable(company)) return 'Registry lookup failed; retry later'
  return brregStatusLabel(company)
}

function sourceStrategyStatus(company = {}, sourceQuality = {}, places = {}) {
  if (isBrregUnavailable(company)) return 'brreg_unavailable'
  return sourceQuality.identitySource || sourceQuality.presenceSource || places.provider || 'unknown'
}

function sourceStrategyLabel(company = {}, sourceQuality = {}) {
  if (isBrregUnavailable(company)) return 'Presence-first fallback; Brreg should be retried before export'
  if (sourceQuality.identitySource === 'brreg') return 'Brreg-first identity with presence enrichment'
  return 'Presence-first discovery'
}

function brregSourceCard(company) {
  const rows = [
    ['Confirmed org.nr', company.organizationNumber || 'none'],
    ['Candidate org.nr', company.candidateOrganizationNumber || 'none'],
    ['Legal name', company.legalName || 'unknown'],
    ['Candidate legal name', company.candidateLegalName || 'none'],
    ['Org form', company.organizationForm || 'unknown'],
    ['Municipality', company.municipality || 'unknown'],
    ['NACE', [company.naceCode, company.naceDescription].filter(Boolean).join(' - ') || 'unknown'],
    ['Employees', company.employees ?? 'unknown'],
    ['Status', company.activeStatus || 'unknown'],
    ['Confidence', company.matchConfidence ?? 'unknown'],
    ['Warnings', normalizeList(company.warnings).length ? normalizeList(company.warnings).map(humanize).join(', ') : 'none'],
  ]
  return sourceCard('Brreg firmaprofil', brregStatusLabel(company), rows)
}

function brregStatusLabel(company = {}) {
  if (isBrregUnavailable(company)) return 'brreg_unavailable'
  const status = String(company.matchStatus || 'not_run').toLowerCase()
  if (company.organizationNumber && ['exact_match', 'strong_match'].includes(status)) return 'confirmed_org'
  if (company.candidateOrganizationNumber || status === 'manual_verify' || status === 'weak_match') return 'candidate_org'
  if (status === 'no_match') return 'no_match'
  if (status === 'error') return 'brreg_unavailable'
  return status || 'not_run'
}

function isBrregUnavailable(company = {}) {
  const status = String(company.matchStatus || '').toLowerCase()
  const errorType = String(company.errorType || '').toLowerCase()
  const warnings = normalizeList(company.warnings).join(' ').toLowerCase()
  return status === 'error' || errorType.includes('network') || warnings.includes('fetch failed') || warnings.includes('timeout')
}

function candidateSection(company = {}) {
  const candidates = Array.isArray(company.candidates) ? company.candidates.slice(0, 3) : []
  if (!candidates.length) return ''
  return section('Brreg candidates', `<div class="candidate-list">${candidates.map((candidate) => `
    <div class="candidate-row">
      <strong>${escapeHtml(candidate.candidateLegalName || 'Unknown legal name')}</strong>
      <span>${escapeHtml(candidate.candidateOrganizationNumber || 'no org.nr')} · ${escapeHtml(candidate.unitType || 'unknown')} · ${escapeHtml(candidate.municipality || 'unknown')} · score ${escapeHtml(candidate.score ?? 'unknown')}</span>
      <small>${escapeHtml(candidate.address || '')}</small>
    </div>
  `).join('')}</div>`)
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (!value) return []
  return String(value).split('|').map((item) => item.trim()).filter(Boolean)
}

function sellerSignals(lead) {
  const ranking = lead.ranking || {}
  const website = lead.website || {}
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const raw = [lead.opportunityType, lead.leadClass, ...(ranking.whyRanked || []), ...(website.topEvidence || [])].filter(Boolean)
  const signals = []

  if (contact.phone) signals.push(`Phone is available: ${contact.phone}. This is contactable, not just a website lead.`)
  else if (contact.email) signals.push(`Email is available: ${contact.email}. Direct qualification is possible.`)

  if (places.rating) signals.push(`Google proof: ${formatRating(places)}. Use this to judge market presence before prioritizing.`)

  if (isFastLead(lead) && contact.website) signals.push('Website is from discovery and has not been verified yet; run Deep before using website quality as leverage.')

  if (company.organizationNumber) signals.push(`Brreg confirmed: org.nr ${company.organizationNumber}. Legal identity is ready for export.`)
  else if (company.candidateOrganizationNumber || company.matchStatus === 'manual_verify') signals.push('Brreg candidate exists, but legal identity should be verified before export.')
  else if (isBrregUnavailable(company)) signals.push('Brreg is unavailable right now; this is a source gap, not a weak lead signal.')
  else signals.push('Legal identity is not verified yet; Brreg returned no confirmed firm profile.')

  if (isLawLead(lead)) signals.push('Law-firm context: credibility, trust and client enquiry quality matter more than generic booking language.')

  for (const item of raw) {
    const mapped = leverageLabel(item)
    if (mapped && !signals.includes(mapped)) signals.push(mapped)
  }

  if (!signals.length) signals.push('Lead has enough contact and source context to review manually.')
  return signals.filter(Boolean).slice(0, 7)
}

function leverageLabel(value) {
  const text = String(value || '').toLowerCase()
  if (isInternalLabel(text)) return null
  if (text.includes('brand_identity_confusion') || text.includes('brand identity confusion')) return 'Brand/domain alignment may be unclear. Verify that the company name, website and legal entity point to the same business.'
  if (text === 'brand_identity' || text.includes('leadclass:brand_identity')) return 'Identity signal: verify whether the public brand and legal firm name are aligned.'
  if (text.includes('technical_trust_risk') || text.includes('technical trust')) return 'Website trust or reliability signals may be weaker than the business itself.'
  if (text.includes('many_failed_requests') || text.includes('failed network')) return 'Website reliability evidence exists; verify before using it as a sales point.'
  if (text.includes('accessibility') || text.includes('usability')) return 'Usability/accessibility friction may affect customer confidence.'
  if (text.includes('high_value_service') || text.includes('service_line')) return 'High-value services are present and may deserve clearer lead paths.'
  if (text.includes('local_visibility')) return 'Local visibility lead: contact and location are clear, but urgency may be lower without stronger pain.'
  if (text.includes('strong_existing_conversion_flow')) return 'Contact flow already looks strong, so urgency should not be overstated.'
  if (text.includes('contact_maturity_requires_stronger_technical_pain')) return 'Contact maturity is high; treat this as shortlist unless technical pain is clear.'
  if (text.includes('visible_technical_trust_pain')) return 'Visible technical trust evidence supports a deeper review.'
  if (text.includes('no social links')) return 'Social proof links were not detected in the website audit.'
  if (text.includes('no recognized technology stack')) return 'Technology stack was not recognized; this can be a manual review signal for site age or custom setup.'
  if (text.includes('fetch failed') || text.includes('network error')) return 'Registry lookup was unavailable; retry Brreg before export.'
  if (text.includes('contactable')) return 'Business appears reachable from available contact data.'
  return null
}

function isInternalLabel(text) {
  return /^callpriority[:\s]/.test(text)
    || /^leadclass[:\s]/.test(text)
    || /^opportunitytype[:\s]/.test(text)
    || text === 'medium'
    || text === 'low'
    || text === 'high'
    || text === 'verify'
}

function isLawLead(lead) {
  const haystack = [lead.company?.displayName, lead.leadClass, lead.opportunityType, lead.contact?.website].filter(Boolean).join(' ').toLowerCase()
  return haystack.includes('advokat') || haystack.includes('law')
}

function nextSellerStep(lead) {
  const priority = String(lead.callPriority || lead.priority || '').toLowerCase()
  const match = String(lead.company?.matchStatus || '').toLowerCase()
  if (match === 'manual_verify' || match === 'weak_match') return 'Verify company identity first'
  if (priority === 'high') return 'Review first'
  if (priority === 'medium') return 'Shortlist and inspect evidence'
  if (priority === 'low') return 'Keep as low-urgency reference'
  if (priority === 'verify') return 'Manual verification required'
  return 'Review source data'
}

function formatRating(places) {
  if (!places || places.rating === null || places.rating === undefined) return 'rating unknown'
  const reviews = places.reviewCount === null || places.reviewCount === undefined ? 'reviews unknown' : `${places.reviewCount} reviews`
  return `${places.rating} / 5 · ${reviews}`
}

function humanizeEvidence(value) {
  const mapped = leverageLabel(value)
  return mapped || humanize(value)
}

function humanize(value) {
  return String(value || 'unknown')
    .replace(/[_:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function renderExport(result) {
  if (!result) {
    els.exportPanel.innerHTML = '<p class="eyebrow">Export</p><div class="empty-state">CSV and JSON links appear after a completed run.</div>'
    return
  }
  const leads = result.leadPacks || []
  els.exportPanel.innerHTML = `
    <p class="eyebrow">Export</p>
    <p class="muted">Run path: <code>${escapeHtml(result.outputDir)}</code></p>
    <p><a href="${escapeAttr(result.downloads.csv)}">Download CSV</a> · <a href="${escapeAttr(result.downloads.json)}">Download JSON</a> · <button type="button" id="copyPath">Copy run path</button></p>
    <table>
      <thead><tr><th>rank</th><th>company</th><th>phone</th><th>website</th><th>city</th><th>priority</th><th>leadClass</th><th>matchStatus</th></tr></thead>
      <tbody>${leads.map((lead, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(lead.company?.displayName || lead.companyName || '')}</td><td>${escapeHtml(lead.contact?.phone || lead.phone || '')}</td><td>${escapeHtml(lead.contact?.website || lead.website || '')}</td><td>${escapeHtml(lead.contact?.city || lead.city || '')}</td><td>${escapeHtml(lead.callPriority || lead.priority || '')}</td><td>${escapeHtml(lead.leadClass || '')}</td><td>${escapeHtml(lead.company?.matchStatus || '')}</td></tr>`).join('')}</tbody>
    </table>
  `
  const copy = document.getElementById('copyPath')
  copy?.addEventListener('click', () => navigator.clipboard?.writeText(result.outputDir))
}

document.addEventListener('click', (event) => {
  if (event.target && event.target.id === 'runDeepQualification') {
    runSelectedDeepQualification(event.target)
  }
})

async function runSelectedDeepQualification(button) {
  const lead = state.result?.leadPacks?.[state.selectedIndex]
  if (!lead) return setStatus('failed: no selected lead to qualify', 'failed')
  if (!(lead.contact?.website || lead.website)) return setStatus('failed: selected lead has no website to audit', 'failed')
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Running Deep...'
  setStatus(`running: deep qualification for ${lead.company?.displayName || 'selected lead'}`, 'running')
  try {
    const response = await fetch('/api/deep-qualify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: state.result?.parsedQuery?.normalizedQuery || els.query.value.trim(),
        lead,
        enrichCompanyProfile: true,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Deep qualification failed')
    const updatedLead = payload.leadPack
    if (!updatedLead) throw new Error('Deep qualification returned no lead pack')
    state.result.leadPacks[state.selectedIndex] = updatedLead
    state.result.summary = updateSummaryAfterLeadReplacement(state.result.summary || {}, state.result.leadPacks)
    setStatus('completed: selected lead deep-qualified', '')
    renderAll()
  } catch (error) {
    setStatus(`failed: ${error.message || 'Deep qualification failed'}`, 'failed')
  } finally {
    button.disabled = false
    button.textContent = originalText
  }
}

function updateSummaryAfterLeadReplacement(summary, leads) {
  const callPriorityCounts = leads.reduce((counts, lead) => {
    const key = String(lead.callPriority || lead.priority || 'unknown').toLowerCase()
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})
  return {
    ...summary,
    callPriorityCounts,
    priorityCounts: callPriorityCounts,
    includedLeadCount: leads.length,
    totalIncluded: leads.length,
    totalLeads: leads.length,
    mode: 'mixed',
    nextRecommendedAction: callPriorityCounts.high ? 'Review HIGH leads first.' : callPriorityCounts.medium ? 'Review top MEDIUM leads as shortlist.' : 'Review verified leads and remaining Fast candidates.',
  }
}

function setStatus(text, cls) {
  els.status.className = `status-panel ${cls || ''}`
  els.status.textContent = text
}
function metric(label, value) { return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>` }
function section(title, content) { return `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${content}</section>` }
function kv(items) { return items.map(([k,v]) => `<div class="kv"><span>${escapeHtml(k)}</span><span>${isHtml(v) ? v : escapeHtml(v)}</span></div>`).join('') }
function bullets(items) { return items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="muted">None.</p>' }
function badge(value) { if (!value) return ''; const text = readable(value); return `<span class="badge ${escapeAttr(String(value).toLowerCase())}">${escapeHtml(text)}</span>` }
function readable(value) { return { exact_location: 'Exact location', regional_fallback: 'Regional fallback', not_enabled: 'Not enabled', manual_verify: 'Manual verify', confirmed_org: 'Confirmed org.nr', candidate_org: 'Candidate org.nr', no_match: 'No match', not_run: 'Not run', brreg_unavailable: 'Brreg unavailable', phone_available: 'Phone available', contact_missing: 'Contact missing', audit_skipped: 'Audit skipped', completed: 'Completed', good: 'Good', strong: 'Strong', weak: 'Weak', high: 'High', medium: 'Medium', low: 'Low', verify: 'Verify', fast: 'Fast', deep: 'Deep', mixed: 'Mixed' }[value] || String(value).toUpperCase() }
function formatCounts(counts) { const entries = Object.entries(counts); return entries.length ? entries.map(([k,v]) => `${k}:${v}`).join(' ') : 'none' }
function link(value) { const href = websiteValue(value); return href && href !== 'unknown' ? `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer" title="${escapeAttr(href)}">${escapeHtml(displayUrl(href))}</a>` : 'unknown' }
function websiteValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value.href || value.url || value.website || value.uri || ''
  return String(value || '')
}
function displayUrl(value) {
  const text = websiteValue(value)
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    const clean = `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`
    return clean.length > 58 ? `${clean.slice(0, 55)}...` : clean
  } catch {
    return text.length > 58 ? `${text.slice(0, 55)}...` : text
  }
}
function isHtml(value) { return typeof value === 'string' && value.trim().startsWith('<') }
function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;') }
function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#096;') }
