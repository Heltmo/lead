const state = { result: null, selectedIndex: 0 }

const els = {
  query: document.getElementById('queryInput'),
  provider: document.getElementById('provider'),
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

els.runButton.addEventListener('click', runSearch)
els.query.addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch() })
renderSummary(null)
renderExport(null)

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
  els.leadCards.innerHTML = leads.map((lead, index) => `
    <button class="lead-card ${index === state.selectedIndex ? 'active' : ''}" type="button" data-index="${index}">
      <div class="badge-row">${badge(lead.callPriority || lead.priority)}${badge(lead.sourceQuality?.locationMatchStatus)}</div>
      <h3>${escapeHtml(lead.company?.displayName || lead.companyName || 'Unknown company')}</h3>
      <p>${escapeHtml(lead.contact?.city || lead.city || 'unknown')} · ${escapeHtml(lead.contact?.phone || lead.phone || 'phone unknown')}</p>
      <p>${escapeHtml((lead.ranking?.whyRanked || lead.whyRanked || [])[0] || lead.opportunityType || 'Lead pack')}</p>
    </button>
  `).join('')
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
  els.leadDetail.innerHTML = `
    <div class="detail-title">
      <div>
        <p class="eyebrow">Selected lead</p>
        <h2>${escapeHtml(company.displayName || lead.companyName || 'Unknown company')}</h2>
        <p class="muted">${escapeHtml(company.legalName || 'Legal name unknown')}</p>
      </div>
      <div class="badge-row">${badge(lead.callPriority || lead.priority)}${badge(company.matchStatus)}${badge(sourceQuality.locationMatchStatus)}</div>
    </div>
    ${section('Company and contact', kv([
      ['Confirmed org.nr', company.organizationNumber || 'none'],
      ['Candidate org.nr', company.candidateOrganizationNumber || 'none'],
      ['Match status', company.matchStatus || 'not_run'],
      ['Website', link(contact.website || lead.website)],
      ['Phone', contact.phone || lead.phone || 'unknown'],
      ['Email', contact.email || lead.email || 'unknown'],
      ['Address', contact.address || lead.address || 'unknown'],
      ['City', contact.city || lead.city || 'unknown'],
    ]))}
    ${section('Lead intelligence', kv([
      ['Lead class', lead.leadClass || 'unknown'],
      ['Opportunity', lead.opportunityType || 'unknown'],
      ['Sales ease', ranking.salesEase || 'unknown'],
      ['Pain score', ranking.painScore ?? 'unknown'],
      ['Location', sourceQuality.locationMatchStatus || 'unknown'],
      ['Economy', lead.economy?.status || 'not_enabled'],
    ]))}
    ${section('Why ranked', bullets(ranking.whyRanked || lead.whyRanked || []))}
    ${section('Evidence', bullets(website.topEvidence || lead.topEvidence || lead.evidence || []))}
    ${section('Caution', bullets(ranking.caution || lead.caution || []))}
  `
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
