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

const state = { result: null, selectedIndex: 0, selectedLeadId: null }

const QUICK_WORKFLOW_ACTIONS = [
  { id: 'mark_called', label: 'Mark called', tone: 'neutral' },
  { id: 'no_answer', label: 'No answer', tone: 'warning' },
  { id: 'interested', label: 'Interested', tone: 'positive' },
  { id: 'not_relevant', label: 'Not relevant', tone: 'negative' },
  { id: 'follow_up_tomorrow', label: 'Follow up tomorrow', shortLabel: 'Tomorrow', tone: 'warning' },
  { id: 'follow_up_next_week', label: 'Follow up next week', shortLabel: 'Next week', tone: 'warning' },
]


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
  workflowBoard: document.getElementById('workflowBoard'),
  leadCards: document.getElementById('leadCards'),
  leadDetail: document.getElementById('leadDetail'),
  exportPanel: document.getElementById('exportPanel'),
  leadSort: document.getElementById('leadSort'),
  queuePresets: Array.from(document.querySelectorAll('.queue-preset')),
  leadFilters: Array.from(document.querySelectorAll('.lead-filter')),
  clearLeadFilters: document.getElementById('clearLeadFilters'),
  leadFilterSummary: document.getElementById('leadFilterSummary'),
}

initStructuredSearch()
els.runButton.addEventListener('click', runSearch)
els.query.addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch() })
els.location.addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch() })
els.profession.addEventListener('change', syncQueryFromStructuredSearch)
els.location.addEventListener('input', syncQueryFromStructuredSearch)
els.runMode.addEventListener('change', () => renderSummary(state.result))
els.leadSort.addEventListener('change', () => { state.selectedLeadId = null; renderAll() })
els.queuePresets.forEach((button) => button.addEventListener('click', () => applyQueuePreset(button.dataset.queuePreset)))
els.leadFilters.forEach((filter) => filter.addEventListener('change', () => { state.selectedLeadId = null; renderAll() }))
els.clearLeadFilters.addEventListener('click', () => { els.leadFilters.forEach((filter) => { filter.checked = false }); state.selectedLeadId = null; renderAll() })
renderSummary(null)
renderExport(null)
clearStatus()
loadLatestRun()

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

async function loadLatestRun() {
  try {
    const response = await fetch('/api/latest-run')
    if (response.status === 404) return
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Latest run failed')
    state.result = payload
    state.selectedIndex = 0
    state.selectedLeadId = null
    if (payload.parsedQuery?.normalizedQuery) els.query.value = payload.parsedQuery.normalizedQuery
    clearStatus()
    renderAll()
  } catch (error) {
    setStatus('Ready. Previous run could not be loaded; run a new search.', '')
  }
}

async function runSearch() {
  const query = els.query.value.trim()
  if (!query) return setStatus('Skriv inn et søk først.', 'failed')
  setStatus('running: queued', 'running')
  els.runButton.disabled = true
  state.result = null
  state.selectedIndex = 0
  state.selectedLeadId = null
  renderSummary(null)
  renderLeads([])
  renderDetail(null)
  renderExport(null)

  try {
    const statusText = els.runMode.value === 'fast'
      ? 'running: fast discovery and lead-pack build'
      : 'running: selected lead enrichment; website audit is one module'
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
    clearStatus()
    renderAll()
  } catch (error) {
    setStatus(`failed: ${error.message || 'Run failed'}`, 'failed')
  } finally {
    els.runButton.disabled = false
  }
}

function renderAll() {
  const leads = state.result?.leadPacks || []
  const visibleLeads = getVisibleLeads(leads)
  if (visibleLeads.length) {
    const selectedStillVisible = visibleLeads.some(({ id }) => id === state.selectedLeadId)
    if (!state.selectedLeadId || !selectedStillVisible) state.selectedLeadId = visibleLeads[0].id
    state.selectedIndex = visibleLeads.find(({ id }) => id === state.selectedLeadId)?.index ?? 0
  } else {
    state.selectedIndex = 0
  }
  renderSummary(state.result)
  renderWorkflowBoard(state.result)
  renderLeads(visibleLeads)
  renderDetail(leads[state.selectedIndex] || null)
  renderExport(state.result)
}

function renderSummary(result) {
  const summary = result?.summary || {}
  const leads = result?.leadPacks || []
  const counts = workflowCounts(leads)
  els.summary.innerHTML = `
    ${metric('Leads', summary.includedLeadCount ?? summary.totalLeads ?? 0)}
    ${metric('Call today', todayCallQueue(leads).length)}
    ${metric('Follow-up', counts.followUpDue)}
    ${metric('Interested', counts.interested)}
    ${metric('Status', compactRunStatus(summary))}
  `
}

function compactRunStatus(summary = {}) {
  const mode = readable(summary.mode || 'fast')
  if (!summary || Object.keys(summary).length === 0) return 'Ready'
  if (summary.lowSupply) return `${mode} · low supply`
  if (summary.fallbackUsed) return `${mode} · fallback used`
  return mode
}

function renderWorkflowBoard(result) {
  if (!els.workflowBoard) return
  const leads = result?.leadPacks || []
  if (!leads.length) {
    els.workflowBoard.className = 'workflow-board empty'
    els.workflowBoard.textContent = 'Run a search to build the next call.'
    return
  }
  const queue = todayCallQueue(leads)
  const next = queue[0]
  els.workflowBoard.className = 'workflow-board current-call-board'
  els.workflowBoard.innerHTML = next
    ? currentCallCard(next.lead, next.index, next.reason, queue.length)
    : '<div class="empty-state compact-empty">No phone-ready lead in the current filters. Clear filters or run a new search.</div>'
  els.workflowBoard.querySelectorAll('.queue-select').forEach((button) => button.addEventListener('click', () => {
    state.selectedIndex = Number(button.dataset.index)
    state.selectedLeadId = leadId(leads[state.selectedIndex], state.selectedIndex)
    renderAll()
    focusLeadDetail()
  }))
}

function currentCallCard(lead, index, reason, queueCount) {
  const name = lead.company?.displayName || lead.companyName || 'Unknown company'
  const phone = lead.contact?.phone || lead.phone || ''
  const city = lead.contact?.city || lead.city || 'unknown'
  const followUpClass = followUpTiming(lead.workflow?.followUpDate)
  return `<article class="current-call-card queue-row ${followUpClass !== 'none' ? `follow-up-${followUpClass}` : ''}">
    <div class="current-call-head">
      <div>
        <span>Next call</span>
        <strong>${escapeHtml(name)}</strong>
        <small>${escapeHtml(city)} · ${escapeHtml(reason)}</small>
      </div>
      <div class="queue-count"><span>In queue</span><strong>${queueCount}</strong></div>
    </div>
    <div class="current-call-phone">
      ${phoneLink(phone)}
      <button type="button" class="queue-select" data-index="${index}">Inspect</button>
    </div>
    ${quickActionsHtml(index, 'queue')}
  </article>`
}


function quickActionsHtml(index, variant = 'full') {
  const actions = variant === 'queue'
    ? QUICK_WORKFLOW_ACTIONS.filter((action) => ['mark_called', 'no_answer', 'interested', 'follow_up_tomorrow', 'follow_up_next_week'].includes(action.id))
    : QUICK_WORKFLOW_ACTIONS
  return `<div class="quick-actions ${variant === 'queue' ? 'compact' : ''}" aria-label="Quick workflow actions">
    ${actions.map((action) => `<button type="button" class="quick-action ${escapeAttr(action.tone)}" data-workflow-action="${escapeAttr(action.id)}" data-index="${index}">${escapeHtml(variant === 'queue' ? (action.shortLabel || action.label) : action.label)}</button>`).join('')}
  </div>`
}

function renderLeads(visibleLeads) {
  const total = state.result?.leadPacks?.length || 0
  updateFilterSummary(visibleLeads.length, total)
  if (!visibleLeads.length) {
    els.leadCards.innerHTML = '<div class="empty-state">No leads match these filters.</div>'
    return
  }
  els.leadCards.innerHTML = visibleLeads.map(({ lead, index, id }) => {
    const contact = lead.contact || {}
    const places = lead.places || {}
    const company = lead.company || {}
    const primarySignal = sellerSignals(lead)[0] || humanize(lead.opportunityType || 'Lead pack')
    const queueAction = leadQueueActionLabel(lead)
    return `
      <button class="lead-card ${id === state.selectedLeadId ? 'active' : ''}" type="button" data-index="${index}" data-id="${escapeAttr(id)}">
        <div class="badge-row">${badge(lead.callPriority || lead.priority)}${badge(workflowStatus(lead))}${badge(lead.sourceQuality?.locationMatchStatus)}${badge(brregStatusLabel(company))}${fastBadge(lead)}</div>
        <h3>${escapeHtml(company.displayName || lead.companyName || 'Unknown company')}</h3>
        <p>${escapeHtml(contact.city || lead.city || 'unknown')} · ${escapeHtml(contact.phone || lead.phone || 'phone unknown')}</p>
        <p class="queue-action"><strong>Next:</strong> ${escapeHtml(queueAction)}</p>
        <p class="card-signal">${escapeHtml(primarySignal)}</p>
        <p class="card-meta">${escapeHtml(formatRating(places))} · ${escapeHtml(workflowCardNote(lead))}</p>
      </button>
    `
  }).join('')
  els.leadCards.querySelectorAll('.lead-card').forEach((button) => button.addEventListener('click', () => {
    state.selectedIndex = Number(button.dataset.index)
    state.selectedLeadId = button.dataset.id
    renderAll()
    focusLeadDetail({ block: 'nearest' })
  }))
}

function focusLeadDetail(options = {}) {
  if (!els.leadDetail) return
  els.leadDetail.scrollIntoView({ behavior: 'smooth', block: options.block || 'start', inline: 'nearest' })
}

function applyQueuePreset(preset) {
  els.leadFilters.forEach((filter) => { filter.checked = false })
  const enable = (value) => {
    const filter = els.leadFilters.find((item) => item.value === value)
    if (filter) filter.checked = true
  }
  if (preset === 'callNow') {
    enable('phone')
    enable('notContacted')
    els.leadSort.value = 'callQueue'
  } else if (preset === 'verify') {
    enable('brregIssue')
    els.leadSort.value = 'callQueue'
  } else if (preset === 'followUp') {
    enable('followUpDue')
    els.leadSort.value = 'followUp'
  } else if (preset === 'interested') {
    enable('interested')
    els.leadSort.value = 'callQueue'
  }
  state.selectedLeadId = null
  renderAll()
}

function getVisibleLeads(leads) {
  const activeFilters = new Set(els.leadFilters.filter((filter) => filter.checked).map((filter) => filter.value))
  const wrapped = leads.map((lead, index) => ({ lead, index, id: leadId(lead, index) }))
    .filter(({ lead }) => matchesLeadFilters(lead, activeFilters))
  return wrapped.sort((a, b) => compareLeads(a.lead, b.lead, els.leadSort.value))
}

function matchesLeadFilters(lead, filters) {
  if (!filters.size) return true
  const company = lead.company || {}
  const contact = lead.contact || {}
  const sourceQuality = lead.sourceQuality || {}
  if (filters.has('phone') && !(contact.phone || lead.phone)) return false
  if (filters.has('confirmed') && !company.organizationNumber) return false
  if (filters.has('candidate') && !company.candidateOrganizationNumber) return false
  if (filters.has('website') && !websiteValue(contact.website || lead.website)) return false
  if (filters.has('exact') && sourceQuality.locationMatchStatus !== 'exact_location') return false
  if (filters.has('needsDeep') && !isFastLead(lead)) return false
  if (filters.has('brregIssue') && !['candidate_org', 'no_match', 'brreg_unavailable', 'not_run'].includes(brregStatusLabel(company))) return false
  const workflow = lead.workflow || {}
  if (filters.has('notContacted') && (workflow.contacted || ['contacted', 'follow_up', 'interested'].includes(workflow.status))) return false
  if (filters.has('contacted') && !(workflow.contacted || ['contacted', 'follow_up', 'interested'].includes(workflow.status))) return false
  if (filters.has('followUpDue') && !isFollowUpDue(lead)) return false
  if (filters.has('interested') && workflow.status !== 'interested' && workflow.response !== 'interested' && workflow.response !== 'meeting_booked') return false
  return true
}

function compareLeads(a, b, sortKey) {
  const rankDiff = leadSortScore(b, sortKey) - leadSortScore(a, sortKey)
  if (rankDiff) return rankDiff
  return priorityScore(b) - priorityScore(a)
}

function leadSortScore(lead, sortKey) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const discovery = lead.sourceQuality?.discoveryQuality || {}
  if (sortKey === 'phone') return contact.phone || lead.phone ? 1 : 0
  if (sortKey === 'confirmed') return company.organizationNumber ? 1 : 0
  if (sortKey === 'reviews') return Number(places.reviewCount || 0)
  if (sortKey === 'employees') return Number(company.employees || 0)
  if (sortKey === 'discovery') return Number(discovery.score || 0)
  if (sortKey === 'followUp') return followUpSortScore(lead)
  if (sortKey === 'callQueue') return callQueueSortScore(lead)
  return bestLeadScore(lead)
}

function callQueueSortScore(lead) {
  const workflow = lead.workflow || {}
  const company = lead.company || {}
  const contact = lead.contact || {}
  const sourceQuality = lead.sourceQuality || {}
  let score = bestLeadScore(lead)
  if (workflow.status === 'rejected') score -= 10000
  if (isFollowUpDue(lead)) score += 1000
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') score += 700
  if ((contact.phone || lead.phone) && !workflow.contacted && !['contacted', 'follow_up', 'interested'].includes(workflow.status)) score += 500
  if (contact.phone || lead.phone) score += 80
  else score -= 120
  if (company.organizationNumber) score += 70
  else if (company.candidateOrganizationNumber) score += 35
  if (sourceQuality.locationMatchStatus === 'exact_location') score += 50
  if (websiteValue(contact.website || lead.website)) score += 20
  if (isFastLead(lead)) score += 15
  return score
}

function bestLeadScore(lead) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const sourceQuality = lead.sourceQuality || {}
  let score = priorityScore(lead) * 10
  if (contact.phone || lead.phone) score += 8
  if (company.organizationNumber) score += 7
  else if (company.candidateOrganizationNumber) score += 4
  if (websiteValue(contact.website || lead.website)) score += 3
  if (sourceQuality.locationMatchStatus === 'exact_location') score += 5
  score += Math.min(Number(places.reviewCount || 0), 100) / 20
  score += Number(places.rating || 0)
  if (isFastLead(lead)) score += 1
  return score
}

function workflowCounts(leads) {
  return (Array.isArray(leads) ? leads : []).reduce((counts, lead) => {
    const workflow = lead.workflow || {}
    const contacted = workflow.contacted || ['contacted', 'follow_up', 'interested'].includes(workflow.status)
    if (!contacted) counts.notContacted += 1
    if (contacted) counts.contacted += 1
    if (isFollowUpDue(lead)) counts.followUpDue += 1
    if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') counts.interested += 1
    return counts
  }, { notContacted: 0, contacted: 0, followUpDue: 0, interested: 0 })
}

function workflowCountsLabel(leads) {
  const counts = workflowCounts(leads)
  return `new:${counts.notContacted} contacted:${counts.contacted} follow-up:${counts.followUpDue} interested:${counts.interested}`
}

function todayCallQueue(leads) {
  return (Array.isArray(leads) ? leads : [])
    .map((lead, index) => ({ lead, index, reason: todayCallReason(lead) }))
    .filter(({ lead, reason }) => Boolean(reason) && Boolean(lead.contact?.phone || lead.phone))
    .sort((a, b) => todayCallScore(b.lead) - todayCallScore(a.lead))
}

function todayCallReason(lead) {
  const workflow = lead.workflow || {}
  if (workflow.status === 'rejected') return ''
  if (isFollowUpDue(lead)) return followUpQueueReason(lead)
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') return 'Interested lead'
  if (!workflow.contacted && !['contacted', 'follow_up'].includes(workflow.status)) return 'Not contacted yet'
  return ''
}

function todayCallScore(lead) {
  const workflow = lead.workflow || {}
  let score = bestLeadScore(lead)
  if (isFollowUpDue(lead)) score += 1000
  if (!workflow.contacted && !['contacted', 'follow_up', 'interested'].includes(workflow.status)) score += 500
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') score += 300
  return score
}

function isFollowUpDue(lead) {
  const date = lead.workflow?.followUpDate
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return false
  const today = new Date().toISOString().slice(0, 10)
  return date <= today && !['rejected'].includes(lead.workflow?.status)
}

function followUpTiming(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return 'none'
  const today = new Date().toISOString().slice(0, 10)
  if (date < today) return 'overdue'
  if (date === today) return 'today'
  return 'future'
}

function followUpQueueReason(lead) {
  const date = lead.workflow?.followUpDate
  const timing = followUpTiming(date)
  if (timing === 'overdue') return `Overdue: ${date}`
  if (timing === 'today') return `Due today: ${date}`
  if (timing === 'future') return `Future follow-up: ${date}`
  return 'Follow-up needed'
}

function followUpSortScore(lead) {
  if (!lead.workflow?.followUpDate) return 0
  const date = lead.workflow.followUpDate
  const today = new Date().toISOString().slice(0, 10)
  return date <= today ? 1000000 : Math.max(1, 1000000 - Number(date.replace(/-/g, '')))
}

function priorityScore(lead) {
  return { high: 4, medium: 3, verify: 2, low: 1 }[String(lead.callPriority || lead.priority || '').toLowerCase()] || 0
}

function leadId(lead, index) {
  return [lead.company?.organizationNumber, lead.company?.candidateOrganizationNumber, lead.places?.placeId, lead.company?.displayName, index].filter(Boolean).join('::')
}

function leadQueueActionLabel(lead) {
  const workflow = lead.workflow || {}
  const company = lead.company || {}
  const hasPhone = Boolean(lead.contact?.phone || lead.phone)
  const brregStatus = brregStatusLabel(company)
  if (workflow.status === 'rejected') return 'Rejected; keep out of call queue'
  if (isFollowUpDue(lead)) return `Follow up today: ${workflow.followUpDate}`
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') return 'Interested: follow up'
  if (hasPhone && !workflow.contacted && !['contacted', 'follow_up'].includes(workflow.status)) return 'Call now'
  if (workflow.status === 'follow_up') return workflow.followUpDate ? `Follow up ${workflow.followUpDate}` : 'Follow up'
  if (['candidate_org', 'no_match', 'brreg_unavailable', 'not_run', 'manual_verify', 'weak_match'].includes(brregStatus)) return 'Verify company identity'
  if (isFastLead(lead)) return 'Enrich if more context is needed'
  return 'Review lead pack'
}

function updateFilterSummary(visible, total) {
  if (!els.leadFilterSummary) return
  const active = els.leadFilters.filter((filter) => filter.checked).map((filter) => filter.parentElement.textContent.trim())
  const prefix = total ? `${visible}/${total} leads shown` : 'No leads yet'
  els.leadFilterSummary.textContent = active.length ? `${prefix} · ${active.join(', ')}` : `${prefix} · no filters applied`
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

    ${workflowPanel(lead)}

    <details class="detail-collapse lead-brief-details">
      <summary>Why this lead is interesting</summary>
      <section class="leverage-panel compact">
        <div>
          <p class="eyebrow">Seller leverage</p>
          <h3>Supporting reasons</h3>
        </div>
        ${bullets(leverage)}
      </section>
    </details>

    ${fastQualificationPanel(lead)}

    ${deepEnrichmentModules(lead, command)}

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
      ['Phone', phoneLink(contact.phone || lead.phone || 'unknown')],
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


function workflowPanel(lead) {
  const workflow = { status: 'new', contacted: false, channel: '', response: '', personReached: '', notes: '', followUpDate: '', nextAction: 'review', outcome: '', activities: [], ...(lead.workflow || {}) }
  const phone = lead.contact?.phone || lead.phone || ''
  const callHref = phoneHref(phone)
  return `<section class="workflow-panel">
    <div class="workflow-head">
      <div>
        <p class="eyebrow">Seller workflow</p>
        <h3>${escapeHtml(readable(workflow.status || 'new'))}</h3>
        <p class="muted">Track manual contact, response and follow-up. No calls or emails are sent from this form.</p>
      </div>
      ${badge(workflow.contacted ? 'contacted' : 'new')}
    </div>
    ${quickActionsHtml(state.selectedIndex, 'full')}
    <form id="workflowForm" class="workflow-form">
      <label><span>Status</span><select name="status">${workflowOptions(['new', 'reviewed', 'contacted', 'follow_up', 'interested', 'rejected'], workflow.status)}</select></label>
      <label><span>Contacted</span><select name="contacted">${workflowOptions(['false', 'true'], String(Boolean(workflow.contacted)))}</select></label>
      <label><span>Channel</span><select name="channel">${workflowOptions(['', 'phone', 'email', 'contact_form', 'linkedin', 'other'], workflow.channel)}</select></label>
      <label><span>Response</span><select name="response">${workflowOptions(['', 'no_answer', 'no_response', 'negative', 'neutral', 'interested', 'meeting_booked'], workflow.response)}</select></label>
      <label><span>Person reached</span><input name="personReached" value="${escapeAttr(workflow.personReached || '')}" placeholder="Name / role"></label>
      <label><span>Follow-up date</span><input type="date" name="followUpDate" value="${escapeAttr(workflow.followUpDate || '')}"></label>
      <label><span>Next action</span><input name="nextAction" value="${escapeAttr(workflow.nextAction || '')}" placeholder="review / call / follow up"></label>
      <label><span>Outcome</span><input name="outcome" value="${escapeAttr(workflow.outcome || '')}" placeholder="pending / not relevant / meeting"></label>
      <label class="workflow-notes"><span>Notes</span><textarea name="notes" rows="3" placeholder="Short factual note from manual work">${escapeHtml(workflow.notes || '')}</textarea></label>
      <div class="workflow-actions"><small>${workflow.updatedAt ? `Saved ${escapeHtml(workflow.updatedAt)}` : 'Not saved yet'}</small><div>${callHref ? `<a class="call-now" href="${escapeAttr(callHref)}">Call now</a>` : ''}<button type="submit">Save workflow</button></div></div>
    </form>
    ${workflowTimeline(workflow)}
  </section>`
}

function workflowTimeline(workflow = {}) {
  const activities = Array.isArray(workflow.activities) ? workflow.activities.slice(0, 5) : []
  return `<div class="activity-timeline"><h4>Activity timeline</h4>${activities.length ? `<ol>${activities.map((activity) => `
    <li><strong>${escapeHtml(readable(activity.status || 'new'))}</strong><span>${escapeHtml(activity.at || '')}</span><p>${escapeHtml(activitySummary(activity))}</p></li>`).join('')}</ol>` : '<p class="muted">No activity logged yet.</p>'}</div>`
}

function activitySummary(activity = {}) {
  return [
    activity.channel ? `Channel: ${readable(activity.channel)}` : '',
    activity.response ? `Response: ${readable(activity.response)}` : '',
    activity.personReached ? `Person: ${activity.personReached}` : '',
    activity.followUpDate ? `Follow-up: ${activity.followUpDate}` : '',
    activity.nextAction ? `Next: ${activity.nextAction}` : '',
    activity.notes ? `Note: ${activity.notes}` : '',
  ].filter(Boolean).join(' · ') || 'Workflow updated.'
}

function workflowOptions(values, selected) {
  return values.map((value) => `<option value="${escapeAttr(value)}" ${String(value) === String(selected || '') ? 'selected' : ''}>${escapeHtml(value ? readable(value) : 'Not set')}</option>`).join('')
}

function workflowStatus(lead) {
  return lead.workflow?.status || 'new'
}

function workflowCardNote(lead) {
  const workflow = lead.workflow || {}
  if (workflow.followUpDate) return `follow-up ${workflow.followUpDate}`
  if (workflow.response) return readable(workflow.response)
  return lead.contact?.website ? 'website found' : 'website unknown'
}

async function saveWorkflow(event) {
  event.preventDefault()
  const lead = state.result?.leadPacks?.[state.selectedIndex]
  if (!lead) return setStatus('failed: no selected lead for workflow save', 'failed')
  const form = new FormData(event.currentTarget)
  const workflow = {
    status: form.get('status'),
    contacted: form.get('contacted') === 'true',
    channel: form.get('channel'),
    response: form.get('response'),
    personReached: form.get('personReached'),
    followUpDate: form.get('followUpDate'),
    nextAction: form.get('nextAction'),
    outcome: form.get('outcome'),
    notes: form.get('notes'),
  }
  setStatus('saving workflow...', 'running')
  try {
    const response = await fetch('/api/workflow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.workflow?.leadId || leadId(lead, state.selectedIndex),
        runId: state.result?.runId,
        leadName: lead.company?.displayName || lead.companyName || '',
        workflow,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Workflow save failed')
    lead.workflow = payload.workflow
    setStatus('workflow saved', '')
    renderAll()
  } catch (error) {
    setStatus(`failed: ${error.message || 'Workflow save failed'}`, 'failed')
  }
}

function modeGuidance(summary) {
  const mode = summary.mode || els.runMode.value || 'fast'
  if (!summary || Object.keys(summary).length === 0) {
    return mode === 'deep' ? 'Deep enrich adds modules to selected leads.' : 'Fast scan finds candidates; enrich selected leads when more context is needed.'
  }
  const included = Number(summary.includedLeadCount ?? summary.totalLeads ?? 0)
  if (mode === 'fast' && included > 0) return 'These are candidates. Enrich only the leads that need more context.'
  return summary.nextRecommendedAction || 'These leads include enrichment signals.'
}

function fastBadge(lead) {
  return isFastLead(lead) ? '<span class="badge audit-skipped">Audit skipped</span>' : ''
}

function isFastLead(lead) {
  return lead?.meta?.mode === 'fast' || lead?.website?.auditStatus === 'skipped_fast_mode' || lead?.leadClass === 'fast_discovery'
}

function fastQualificationPanel(lead) {
  if (!isFastLead(lead)) return '<section class="qualification-panel deep"><strong>Deep enriched</strong><span>This lead includes selected enrichment modules. Website audit is one module.</span></section>'
  return `<section class="qualification-panel fast">
    <div><strong>Enrichment optional</strong><span>Fast scan found this candidate. Enrich only if you need more context than phone, location and company identity.</span></div>
    <button type="button" id="runDeepQualification">Enrich selected lead</button>
  </section>`
}


function deepEnrichmentModules(lead, command) {
  const company = lead.company || {}
  const website = lead.website || {}
  const economy = lead.economy || {}
  const liveModules = Array.isArray(lead.enrichmentModules) && lead.enrichmentModules.length
    ? lead.enrichmentModules
    : Array.isArray(lead.enrichment?.modules) ? lead.enrichment.modules : []
  const modules = liveModules.length ? liveModules : [
    { name: 'Website audit', status: isFastLead(lead) ? 'not_run' : (website.auditStatus || 'completed'), summary: isFastLead(lead) ? 'Run enrichment to audit website quality.' : 'Website/audit signals are attached.' },
    { name: 'Brreg verification', status: company.organizationNumber ? 'completed' : company.candidateOrganizationNumber ? 'manual_verify' : brregStatusLabel(company), summary: company.organizationNumber ? 'Official identity is confirmed.' : company.candidateOrganizationNumber ? 'Candidate identity needs manual verify.' : 'No confirmed identity yet.' },
    { name: 'Economy / Proff', status: economy.status || 'not_enabled', summary: 'Requires confirmed org.nr and Proff integration.' },
    { name: 'Social/source signals', status: 'not_enabled', summary: 'Later module: Facebook, LinkedIn, news and public source links.' },
    { name: 'Decision makers', status: 'not_enabled', summary: 'Later module: public role/contact hints when available.' },
    { name: 'Recent activity', status: 'not_enabled', summary: 'Later module: hiring, news, website updates and public activity.' },
    { name: 'Seller leverage summary', status: command.sellerReadinessKey === 'weak' ? 'manual_verify' : 'completed', summary: 'Uses current contact, company, location and source signals.' },
  ]
  return `<details class="detail-collapse enrichment-modules">
    <summary>Deep enrichment modules</summary>
    <div class="module-grid">
      ${modules.map((module) => `<div class="module-card"><div>${badge(module.status)}<strong>${escapeHtml(module.name)}</strong></div><small>${escapeHtml(module.summary || module.note || '')}</small></div>`).join('')}
    </div>
  </details>`
}

function sellerCommandCard(command) {
  return `<section class="command-card">
    <div class="command-main compact-command-main">
      <div>
        <p class="eyebrow">Call brief</p>
        <h3>${escapeHtml(command.verification)}</h3>
        <p>${escapeHtml(command.summary)}</p>
      </div>
    </div>
    <div class="command-grid compact-command-grid">
      ${commandMetric('Best first contact', command.bestContact, command.bestContactNote)}
      ${commandMetric('Company fit', command.companyFit, command.companyFitNote)}
      ${commandMetric('Verification', command.verification, command.verificationNote)}
      ${commandMetric('Next action', command.nextAction, command.nextActionNote)}
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
    ['Employees', company.employees ?? 'unknown'],
    ['NACE', [company.naceCode, company.naceDescription].filter(Boolean).join(' - ') || 'unknown'],
  ]
  const contactRows = [
    ['Phone', phoneLink(contact.phone || lead.phone || 'unknown')],
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
  const actionRows = [
    ['Call status', command.sellerReadiness],
    ['Website opportunity', command.websiteOpportunity],
    ['Next action', command.nextAction],
    ['Main risk', command.mainRisk],
  ]
  const qualificationRows = [
    ['Mode', isFastLead(lead) ? 'Fast candidate' : 'Deep enriched'],
    ['Call status', command.sellerReadiness],
    ['Website opportunity', command.websiteOpportunity],
    ['Main risk', command.mainRisk],
    ['Source confidence', command.sourceConfidence],
  ]
  const riskRows = [
    ['Verification', command.verification],
    ['Warnings', normalizeList(company.warnings).map(humanize).join(', ') || 'none'],
    ['Economy', readable(economy.status || 'not_enabled')],
    ['Export state', company.organizationNumber ? 'identity ready' : company.candidateOrganizationNumber ? 'verify candidate org.nr' : 'identity not confirmed'],
    ['Why', command.nextActionNote],
  ]

  return `<section class="seller-desk-v2 lead-brief-grid">
    ${sellerDeskCard('Company identity', orgStatus, identityRows, company.sourceUrl ? link(company.sourceUrl) : '')}
    ${sellerDeskCard('Contactability', contact.phone ? 'phone_available' : 'contact_missing', contactRows, command.bestContactNote)}
    ${sellerDeskCard('Market proof', sourceQuality.locationMatchStatus || 'unknown', marketRows, places.placeId ? `Place ID: ${places.placeId}` : '')}
    ${sellerDeskCard('Action and risk', command.sellerReadinessKey, actionRows, 'No script generated; seller owns angle and wording.')}
  </section>
  <details class="detail-collapse lead-brief-details">
    <summary>Qualification and verification details</summary>
    <div class="seller-desk-v2 secondary-brief-grid">
      ${sellerDeskCard('Qualification', isFastLead(lead) ? 'audit_skipped' : 'completed', qualificationRows, isFastLead(lead) ? 'Enrichment has not run yet.' : 'Selected enrichment modules included.')}
      ${sellerDeskCard('Verification and caution', command.verification === 'Confirmed org.nr' ? 'confirmed_org' : command.sellerReadinessKey, riskRows, command.mainRiskNote)}
    </div>
  </details>`
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
  const reviewCount = Number(places.reviewCount || 0)
  const employees = Number(company.employees || 0)
  const active = !company.activeStatus || String(company.activeStatus).toLowerCase() === 'active'
  const discoveryLevel = String(discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown').toLowerCase()
  const brregUnavailable = isBrregUnavailable(company)

  let fitScore = 0
  if (exactLocation) fitScore += 2
  if (hasPhone) fitScore += 2
  if (hasWebsite) fitScore += 1
  if (confirmedOrg) fitScore += 2
  if (candidateOrg) fitScore += 1
  if (rating >= 4.3) fitScore += 1
  if (reviewCount >= 10) fitScore += 1
  if (employees >= 5) fitScore += 1
  const companyFit = fitScore >= 7 ? 'Strong fit' : fitScore >= 5 ? 'Good fit' : fitScore >= 3 ? 'Review fit' : 'Weak fit'
  const companyFitNote = [
    exactLocation ? 'right location' : 'location needs review',
    confirmedOrg ? 'confirmed identity' : candidateOrg ? 'candidate identity' : 'identity not verified',
    hasPhone ? 'phone available' : 'phone missing',
  ].join(' · ')

  let sellerScore = 0
  if (active) sellerScore += 2
  if (exactLocation) sellerScore += 2
  if (hasPhone) sellerScore += 3
  if (confirmedOrg) sellerScore += 3
  else if (candidateOrg) sellerScore += 1
  if (employees > 0) sellerScore += 1
  if (employees >= 5) sellerScore += 1
  if (rating >= 4) sellerScore += 1
  if (reviewCount >= 5) sellerScore += 1
  if (brregUnavailable) sellerScore -= 1
  if (!hasPhone) sellerScore -= 3
  if (!exactLocation) sellerScore -= 2

  const sellerReadinessKey = sellerScore >= 10 ? 'strong' : sellerScore >= 7 ? 'good' : sellerScore >= 4 ? 'verify' : 'weak'
  const sellerReadiness = {
    strong: 'Ready now',
    good: 'Usable contact',
    verify: 'Verify first',
    weak: 'Needs contact',
  }[sellerReadinessKey]

  const websiteOpportunity = {
    high: 'High website opportunity',
    medium: 'Medium website opportunity',
    low: 'Low website opportunity',
    verify: fast ? 'Not checked yet' : 'Needs review',
  }[priority] || 'Needs review'
  const websiteOpportunityNote = fast
    ? 'Fast mode has not audited the website yet.'
    : priority === 'low'
      ? 'Website audit did not find strong website pain; this can still be a usable B2B lead.'
      : 'Website/audit signals can inform the sales angle if relevant.'

  const bestContact = hasPhone ? (contact.phone || lead.phone) : (contact.email || lead.email || 'unknown')
  const bestContactNote = hasPhone ? 'Direct phone is available.' : contact.email ? 'Email exists, phone missing.' : 'Find a direct contact before sales work.'

  const verification = confirmedOrg ? 'Confirmed org.nr' : candidateOrg ? 'Candidate org.nr' : brregUnavailable ? 'Identity pending' : 'Not verified'
  const verificationNote = confirmedOrg ? `${company.organizationNumber} · ${company.matchConfidence ?? 'unknown'} confidence` : candidateOrg ? 'Manual verify before export.' : brregUnavailable ? 'Brreg is unavailable right now; retry before export.' : 'Brreg returned no confirmed identity.'

  let mainRisk = 'Low data risk'
  let mainRiskNote = 'Core contact and identity fields look usable.'
  if (!hasPhone) {
    mainRisk = 'No direct phone'
    mainRiskNote = 'This is harder to use for calling until contact data is improved.'
  } else if (!confirmedOrg && candidateOrg) {
    mainRisk = 'Identity uncertain'
    mainRiskNote = 'Candidate org.nr must be verified.'
  } else if (!exactLocation) {
    mainRisk = 'Location fallback'
    mainRiskNote = 'Do not treat this as an exact local lead.'
  } else if (fast) {
    mainRisk = contact.website ? 'Website unverified' : 'Fast mode only'
    mainRiskNote = contact.website ? 'Google supplied a URL; enrichment can verify whether it is real and relevant.' : 'Website audit and deeper enrichment are skipped.'
  } else if ((ranking.caution || []).length) {
    mainRisk = 'Review caution'
    mainRiskNote = humanizeEvidence((ranking.caution || [])[0])
  }

  let nextAction = 'Use as B2B lead'
  let nextActionNote = 'Contactability and company context decide sales usability; website pain is separate.'
  if (!hasPhone) {
    nextAction = 'Find contact first'
    nextActionNote = 'Do not prioritize for calling until a direct contact is found.'
  } else if (fast) {
    nextAction = confirmedOrg ? 'Enrich if more context is needed' : candidateOrg ? 'Verify org.nr, then enrich if needed' : brregUnavailable ? 'Retry Brreg before export' : 'Enrich if needed'
    nextActionNote = 'Fast found a usable candidate; enrichment adds optional context modules.'
  } else if (priority === 'low' && sellerReadinessKey !== 'weak') {
    nextAction = 'Usable lead; weak website angle'
    nextActionNote = 'Do not treat LOW website opportunity as a bad business lead.'
  } else if (priority === 'high') {
    nextAction = 'Review first'
    nextActionNote = 'Enrichment evidence supports website/opportunity urgency.'
  }

  const sourceConfidence = discoveryLevel === 'unknown' ? 'Unknown' : readable(discoveryLevel)
  const sourceConfidenceNote = discoveryQuality.score == null ? 'No discovery score available.' : `Discovery score ${discoveryQuality.score}/100.`

  const headline = verification
  const summary = buildCommandSummary({ company, contact, places, confirmedOrg, candidateOrg, exactLocation, fast, employees, priority, websiteOpportunity })

  return { headline, summary, callReadiness: sellerReadiness, readinessKey: sellerReadinessKey, sellerReadiness, sellerReadinessKey, websiteOpportunity, websiteOpportunityNote, bestContact, bestContactNote, companyFit, companyFitNote, verification, verificationNote, mainRisk, mainRiskNote, nextAction, nextActionNote, sourceConfidence, sourceConfidenceNote }
}

function buildCommandSummary({ company, contact, places, confirmedOrg, candidateOrg, exactLocation, fast, employees, priority, websiteOpportunity }) {
  const parts = []
  if (confirmedOrg) parts.push(`Legal identity is confirmed${company.organizationNumber ? ` (${company.organizationNumber})` : ''}`)
  else if (candidateOrg) parts.push('Legal identity has a candidate match but needs manual verification')
  else parts.push('Legal identity is not verified')
  if (contact.phone) parts.push(`phone ${contact.phone} is available`)
  if (employees) parts.push(`${employees} employees registered`)
  if (places.rating) parts.push(`Google rating ${places.rating}/5`)
  if (exactLocation) parts.push('location matches the search')
  if (fast) parts.push(contact.website ? 'website URL is unverified until enrichment runs' : 'deeper enrichment has not run yet')
  else parts.push(`website opportunity is ${websiteOpportunity || String(priority || 'unknown').toUpperCase()}`)
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

  if (isFastLead(lead) && contact.website) signals.push('Website is from discovery and has not been verified yet; enrich before using website quality as leverage.')

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
  if (priority === 'low') return 'Usable lead; weak website angle'
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
    ${callListLinks(result.downloads || {})}
    <table>
      <thead><tr><th>rank</th><th>company</th><th>phone</th><th>city</th><th>priority</th><th>workflow</th><th>response</th><th>follow-up</th><th>next action</th></tr></thead>
      <tbody>${leads.map((lead, index) => { const workflow = lead.workflow || {}; return `<tr><td>${index + 1}</td><td>${escapeHtml(lead.company?.displayName || lead.companyName || '')}</td><td>${phoneLink(lead.contact?.phone || lead.phone || '')}</td><td>${escapeHtml(lead.contact?.city || lead.city || '')}</td><td>${escapeHtml(lead.callPriority || lead.priority || '')}</td><td>${escapeHtml(readable(workflow.status || 'new'))}</td><td>${escapeHtml(readable(workflow.response || ''))}</td><td>${escapeHtml(workflow.followUpDate || '')}</td><td>${escapeHtml(workflow.nextAction || '')}</td></tr>` }).join('')}</tbody>
    </table>
  `
  const copy = document.getElementById('copyPath')
  copy?.addEventListener('click', () => navigator.clipboard?.writeText(result.outputDir))
}

document.addEventListener('submit', (event) => {
  if (event.target && event.target.id === 'workflowForm') saveWorkflow(event)
})

document.addEventListener('click', (event) => {
  const quickActionButton = event.target.closest('[data-workflow-action]')
  if (quickActionButton) {
    runWorkflowQuickAction(quickActionButton)
    return
  }
  if (event.target && event.target.id === 'runDeepQualification') {
    runSelectedDeepQualification(event.target)
  }
})

async function runWorkflowQuickAction(button) {
  const index = Number(button.dataset.index ?? state.selectedIndex)
  const lead = state.result?.leadPacks?.[index]
  if (!lead) return setStatus('failed: no selected lead for quick action', 'failed')
  const action = button.dataset.workflowAction
  const workflow = buildQuickWorkflow(action, lead.workflow || {})
  if (!workflow) return setStatus('failed: unknown quick action', 'failed')
  const advanceQueue = Boolean(button.closest('.queue-row'))
  state.selectedIndex = index
  state.selectedLeadId = leadId(lead, index)
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Saving...'
  setStatus(`saving workflow: ${originalText}`, 'running')
  try {
    const response = await fetch('/api/workflow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.workflow?.leadId || leadId(lead, index),
        runId: state.result?.runId,
        leadName: lead.company?.displayName || lead.companyName || '',
        workflow,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Workflow quick action failed')
    lead.workflow = payload.workflow
    clearStatus()
    if (advanceQueue) selectNextQueueLead(lead)
    renderAll()
    if (advanceQueue) focusLeadDetail({ block: 'nearest' })
  } catch (error) {
    setStatus(`failed: ${error.message || 'Workflow quick action failed'}`, 'failed')
  } finally {
    button.disabled = false
    button.textContent = originalText
  }
}

function selectNextQueueLead(previousLead) {
  const leads = state.result?.leadPacks || []
  const previousId = leadId(previousLead, state.selectedIndex)
  const next = todayCallQueue(leads).find(({ lead, index }) => leadId(lead, index) !== previousId)
  if (!next) return
  state.selectedIndex = next.index
  state.selectedLeadId = leadId(next.lead, next.index)
}

function buildQuickWorkflow(action, current = {}) {
  const base = { status: 'new', contacted: false, channel: '', response: '', personReached: '', notes: '', followUpDate: '', nextAction: 'review', outcome: '', ...current }
  const tomorrow = isoDateOffset(1)
  const nextWeek = isoDateOffset(7)
  if (action === 'mark_called') return { ...base, status: 'contacted', contacted: true, channel: base.channel || 'phone', response: base.response || 'neutral', nextAction: 'review call result', notes: appendQuickNote(base.notes, 'Quick action: marked called.') }
  if (action === 'no_answer') return { ...base, status: 'follow_up', contacted: true, channel: base.channel || 'phone', response: 'no_answer', followUpDate: base.followUpDate || tomorrow, nextAction: 'call again', notes: appendQuickNote(base.notes, 'Quick action: no answer.') }
  if (action === 'interested') return { ...base, status: 'interested', contacted: true, channel: base.channel || 'phone', response: 'interested', nextAction: 'follow up interested lead', outcome: base.outcome || 'interested', notes: appendQuickNote(base.notes, 'Quick action: interested.') }
  if (action === 'not_relevant') return { ...base, status: 'rejected', contacted: true, channel: base.channel || 'phone', response: 'negative', nextAction: 'do not contact', outcome: 'not relevant', notes: appendQuickNote(base.notes, 'Quick action: not relevant.') }
  if (action === 'follow_up_tomorrow') return { ...base, status: 'follow_up', followUpDate: tomorrow, nextAction: 'follow up tomorrow', notes: appendQuickNote(base.notes, 'Quick action: follow up tomorrow.') }
  if (action === 'follow_up_next_week') return { ...base, status: 'follow_up', followUpDate: nextWeek, nextAction: 'follow up next week', notes: appendQuickNote(base.notes, 'Quick action: follow up next week.') }
  return null
}

function appendQuickNote(notes, line) {
  const current = String(notes || '').trim()
  if (current.includes(line)) return current
  return [current, line].filter(Boolean).join('\n').slice(0, 2000)
}

function isoDateOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + Number(days || 0))
  return date.toISOString().slice(0, 10)
}

async function runSelectedDeepQualification(button) {
  const lead = state.result?.leadPacks?.[state.selectedIndex]
  if (!lead) return setStatus('failed: no selected lead to qualify', 'failed')
  if (!(lead.contact?.website || lead.website)) return setStatus('failed: selected lead has no website to audit', 'failed')
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Enriching...'
  setStatus(`running: enrichment for ${lead.company?.displayName || 'selected lead'}`, 'running')
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
    if (!response.ok) throw new Error(payload.error || 'Lead enrichment failed')
    const updatedLead = payload.leadPack
    if (!updatedLead) throw new Error('Lead enrichment returned no lead pack')
    updatedLead.workflow = lead.workflow || updatedLead.workflow
    state.result.leadPacks[state.selectedIndex] = updatedLead
    state.result.summary = updateSummaryAfterLeadReplacement(state.result.summary || {}, state.result.leadPacks)
    setStatus('completed: selected lead enriched', '')
    renderAll()
  } catch (error) {
    setStatus(`failed: ${error.message || 'Lead enrichment failed'}`, 'failed')
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

function callListLinks(downloads) {
  if (!downloads.callList) return ''
  return `<p class="export-actions">call-list.csv includes lastActivityAt. <a href="${escapeAttr(downloads.callList)}">All</a> · <a href="${escapeAttr(downloads.callListToday)}">Today call queue</a> · <a href="${escapeAttr(downloads.callListNotContacted)}">Not contacted</a> · <a href="${escapeAttr(downloads.callListFollowUps)}">Follow-ups due</a> · <a href="${escapeAttr(downloads.callListInterested)}">Interested</a></p>`
}

function phoneHref(value) {
  const raw = String(value || '').trim()
  const digits = raw.replace(/[^+\d]/g, '')
  return digits ? `tel:${digits}` : ''
}

function phoneLink(value) {
  const raw = String(value || '').trim()
  const href = phoneHref(raw)
  if (!raw || raw === 'unknown' || !href) return escapeHtml(raw || 'unknown')
  return `<a href="${escapeAttr(href)}" class="phone-link">${escapeHtml(raw)}</a>`
}

function clearStatus() {
  els.status.hidden = true
  els.status.className = 'status-panel'
  els.status.textContent = ''
}
function setStatus(text, cls) {
  if (!text) return clearStatus()
  els.status.hidden = false
  els.status.className = `status-panel ${cls || ''}`
  els.status.textContent = text
}
function metric(label, value) { return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>` }
function section(title, content) { return `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${content}</section>` }
function kv(items) { return items.map(([k,v]) => `<div class="kv"><span>${escapeHtml(k)}</span><span>${isHtml(v) ? v : escapeHtml(v)}</span></div>`).join('') }
function bullets(items) { return items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="muted">None.</p>' }
function badge(value) { if (!value) return ''; const text = readable(value); return `<span class="badge ${escapeAttr(String(value).toLowerCase())}">${escapeHtml(text)}</span>` }
function readable(value) { return { new: 'New lead', reviewed: 'Reviewed', contacted: 'Contacted', follow_up: 'Follow-up', interested: 'Interested', rejected: 'Rejected', no_answer: 'No answer', no_response: 'No response', negative: 'Negative', neutral: 'Neutral', meeting_booked: 'Meeting booked', phone: 'Phone', email: 'Email', contact_form: 'Contact form', linkedin: 'LinkedIn', other: 'Other', exact_location: 'Exact location', regional_fallback: 'Regional fallback', not_enabled: 'Not enabled', manual_verify: 'Manual verify', confirmed_org: 'Confirmed org.nr', candidate_org: 'Candidate org.nr', no_match: 'No match', not_run: 'Not run', brreg_unavailable: 'Brreg unavailable', phone_available: 'Phone available', contact_missing: 'Contact missing', audit_skipped: 'Audit skipped', completed: 'Completed', good: 'Good', strong: 'Strong', weak: 'Weak', high: 'High', medium: 'Medium', low: 'Low', verify: 'Verify', fast: 'Fast', deep: 'Deep', mixed: 'Mixed' }[value] || String(value).toUpperCase() }
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
