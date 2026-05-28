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
    setStatus('running: discovery, website audit and lead-pack build', 'running')
    const response = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query,
        provider: els.provider.value,
        maxResults: Number(els.maxResults.value),
        searchScope: els.searchScope.value,
        mode: els.runMode.value,
        enrichCompanyProfile: els.companyProfile.checked,
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
    ${metric('Next action', summary.nextRecommendedAction || 'Run a search')}
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
        <div class="badge-row">${badge(lead.callPriority || lead.priority)}${badge(lead.sourceQuality?.locationMatchStatus)}${badge(company.matchStatus)}</div>
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
  const leverage = sellerSignals(lead)
  const nextStep = nextSellerStep(lead)
  els.leadDetail.innerHTML = `
    <div class="detail-title">
      <div>
        <p class="eyebrow">Selected lead</p>
        <h2>${escapeHtml(company.displayName || lead.companyName || 'Unknown company')}</h2>
        <p class="muted">${escapeHtml(company.legalName || 'Legal name unknown')}</p>
      </div>
      <div class="badge-row">${badge(lead.callPriority || lead.priority)}${badge(company.matchStatus)}${badge(sourceQuality.locationMatchStatus)}</div>
    </div>

    <div class="quick-facts">
      ${factCard('Phone', contact.phone || lead.phone || 'unknown', 'Best first contact field')}
      ${factCard('Website', contact.website ? 'available' : 'unknown', contact.website ? link(contact.website) : 'No website in lead pack')}
      ${factCard('Google', formatRating(places), places.placeId ? `Place ID: ${places.placeId}` : 'No place ID')}
      ${factCard('Company ID', company.organizationNumber || company.candidateOrganizationNumber || 'not verified', company.matchStatus || 'not_run')}
      ${factCard('Location', readable(sourceQuality.locationMatchStatus || 'unknown'), contact.address || contact.city || 'unknown')}
      ${factCard('Priority', readable(lead.callPriority || lead.priority || 'unknown'), nextStep)}
    </div>

    <section class="leverage-panel">
      <div>
        <p class="eyebrow">Seller leverage</p>
        <h3>What makes this worth a look</h3>
      </div>
      ${bullets(leverage)}
    </section>

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
      ${sourceCard('Brreg firmaprofil', company.matchStatus || 'not_run', [
        ['Confirmed org.nr', company.organizationNumber || 'none'],
        ['Candidate org.nr', company.candidateOrganizationNumber || 'none'],
        ['Confidence', company.matchConfidence ?? 'unknown'],
      ])}
      ${sourceCard('Economy / Proff', economy.status || 'not_enabled', [
        ['Revenue', economy.revenue ?? 'not enabled'],
        ['Employees', economy.employees ?? 'not enabled'],
        ['Source', economy.source || 'not enabled'],
      ])}
    </div>

    ${section('Company and contact', kv([
      ['Confirmed org.nr', company.organizationNumber || 'none'],
      ['Candidate org.nr', company.candidateOrganizationNumber || 'none'],
      ['Match status', readable(company.matchStatus || 'not_run')],
      ['Website', link(contact.website || lead.website)],
      ['Phone', contact.phone || lead.phone || 'unknown'],
      ['Email', contact.email || lead.email || 'unknown'],
      ['Address', contact.address || lead.address || 'unknown'],
      ['City', contact.city || lead.city || 'unknown'],
    ]))}
    ${section('Lead intelligence', kv([
      ['Lead class', humanize(lead.leadClass || 'unknown')],
      ['Opportunity', humanize(lead.opportunityType || 'unknown')],
      ['Sales ease', readable(ranking.salesEase || 'unknown')],
      ['Pain score', ranking.painScore ?? 'unknown'],
      ['Location', readable(sourceQuality.locationMatchStatus || 'unknown')],
      ['Economy', readable(economy.status || 'not_enabled')],
    ]))}
    ${section('Evidence', bullets((website.topEvidence || lead.topEvidence || lead.evidence || []).map(humanizeEvidence)))}
    ${section('Caution', bullets((ranking.caution || lead.caution || []).map(humanizeEvidence)))}
  `
}

function factCard(label, value, note) {
  return `<div class="fact-card"><span>${escapeHtml(label)}</span><strong>${isHtml(value) ? value : escapeHtml(value)}</strong><small>${isHtml(note) ? note : escapeHtml(note)}</small></div>`
}

function sourceCard(title, status, rows) {
  return `<section class="source-card"><div class="source-title"><h3>${escapeHtml(title)}</h3>${badge(status)}</div>${kv(rows)}</section>`
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

  if (company.organizationNumber) signals.push(`Brreg confirmed: org.nr ${company.organizationNumber}. Legal identity is ready for export.`)
  else if (company.candidateOrganizationNumber || company.matchStatus === 'manual_verify') signals.push('Brreg candidate exists, but legal identity should be verified before export.')
  else signals.push('Legal identity is not verified yet. Turn on Brreg firmaprofil when org.nr matters.')

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

function setStatus(text, cls) {
  els.status.className = `status-panel ${cls || ''}`
  els.status.textContent = text
}
function metric(label, value) { return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>` }
function section(title, content) { return `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${content}</section>` }
function kv(items) { return items.map(([k,v]) => `<div class="kv"><span>${escapeHtml(k)}</span><span>${isHtml(v) ? v : escapeHtml(v)}</span></div>`).join('') }
function bullets(items) { return items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="muted">None.</p>' }
function badge(value) { if (!value) return ''; const text = readable(value); return `<span class="badge ${escapeAttr(String(value).toLowerCase())}">${escapeHtml(text)}</span>` }
function readable(value) { return { exact_location: 'Exact location', regional_fallback: 'Regional fallback', not_enabled: 'Not enabled', manual_verify: 'Manual verify' }[value] || String(value).toUpperCase() }
function formatCounts(counts) { const entries = Object.entries(counts); return entries.length ? entries.map(([k,v]) => `${k}:${v}`).join(' ') : 'none' }
function link(value) { return value && value !== 'unknown' ? `<a href="${escapeAttr(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>` : 'unknown' }
function isHtml(value) { return typeof value === 'string' && value.trim().startsWith('<') }
function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;') }
function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#096;') }
