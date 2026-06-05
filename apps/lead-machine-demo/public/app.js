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

const WORK_QUEUES = [
  { id: 'call_now', label: 'Ring nå' },
  { id: 'no_answer', label: 'Ingen svar' },
  { id: 'follow_up_today', label: 'Oppfølging i dag' },
  { id: 'interested', label: 'Interessert' },
  { id: 'verify_first', label: 'Må verifiseres' },
  { id: 'not_relevant', label: 'Ikke relevant' },
  { id: 'archived', label: 'Arkiv' },
]
const WORK_QUEUE_IDS = new Set(WORK_QUEUES.map((queue) => queue.id))

const state = { result: null, selectedIndex: 0, selectedLeadId: null, selectedQueue: 'call_now', cityFilter: '' }

initBetaAccess()

function initBetaAccess() {
  try {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('beta') || params.get('token')
    if (token) window.localStorage.setItem('leadMachineBetaAccessToken', token)
  } catch (_) {}
}

function betaAccessToken() {
  try { return window.localStorage.getItem('leadMachineBetaAccessToken') || '' } catch (_) { return '' }
}

function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = betaAccessToken()
  if (token) headers.set('x-beta-token', token)
  return fetch(url, { ...options, headers })
}

function withBetaToken(url) {
  const token = betaAccessToken()
  if (!token || !String(url || '').startsWith('/api/')) return url
  return String(url).includes('?') ? String(url) + '&token=' + encodeURIComponent(token) : String(url) + '?token=' + encodeURIComponent(token)
}

const QUICK_WORKFLOW_ACTIONS = [
  { id: 'mark_called', label: 'Called / done', shortLabel: 'Done', tone: 'neutral' },
  { id: 'no_answer', label: 'No answer', shortLabel: 'No answer', tone: 'warning' },
  { id: 'interested', label: 'Interested', shortLabel: 'Interested', tone: 'positive' },
  { id: 'not_relevant', label: 'Not relevant', shortLabel: 'Skip', tone: 'negative' },
  { id: 'archive', label: 'Archive', tone: 'neutral' },
]


const els = {
  profession: document.getElementById('professionSelect'),
  location: document.getElementById('locationInput'),
  locationOptions: document.getElementById('locationOptions'),
  query: document.getElementById('queryInput'),
  provider: document.getElementById('provider'),
  sellerIntent: document.getElementById('sellerIntent'),
  runMode: document.getElementById('runMode'),
  maxResults: document.getElementById('maxResults'),
  searchScope: document.getElementById('searchScope'),
  companyProfile: document.getElementById('companyProfile'),
  runButton: document.getElementById('runButton'),
  status: document.getElementById('statusPanel'),
  summary: document.getElementById('summaryPanel'),
  readiness: document.getElementById('readinessPanel'),
  commandCenter: document.getElementById('commandCenterPanel'),
  workflowBoard: document.getElementById('workflowBoard'),
  workQueueTabs: document.getElementById('workQueueTabs'),
  leadCards: document.getElementById('leadCards'),
  leadDetail: document.getElementById('leadDetail'),
  exportPanel: document.getElementById('exportPanel'),
  leadSort: document.getElementById('leadSort'),
  queuePresets: Array.from(document.querySelectorAll('.queue-preset')),
  leadFilters: Array.from(document.querySelectorAll('.lead-filter')),
  clearLeadFilters: document.getElementById('clearLeadFilters'),
  leadFilterSummary: document.getElementById('leadFilterSummary'),
  queryExamples: Array.from(document.querySelectorAll('[data-query-example]')),
  owner: document.getElementById('ownerInput'),
}

initStructuredSearch()
initOwnerControl()
els.runButton.addEventListener('click', runSearch)
els.query.addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch() })
els.queryExamples.forEach((button) => button.addEventListener('click', () => { els.query.value = button.dataset.queryExample || ''; els.query.focus() }))
els.location.addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch() })
els.profession.addEventListener('change', syncQueryFromStructuredSearch)
els.location.addEventListener('input', syncQueryFromStructuredSearch)
els.runMode.addEventListener('change', () => renderSummary(state.result))
els.leadSort.addEventListener('change', () => { state.selectedLeadId = null; renderAll() })
els.queuePresets.forEach((button) => button.addEventListener('click', () => applyQueuePreset(button.dataset.queuePreset)))
els.leadFilters.forEach((filter) => filter.addEventListener('change', () => { state.selectedLeadId = null; renderAll() }))
els.clearLeadFilters.addEventListener('click', () => { els.leadFilters.forEach((filter) => { filter.checked = false }); state.cityFilter = ''; state.selectedLeadId = null; renderAll() })
document.addEventListener('click', (event) => {
  const workQueueButton = event.target.closest('[data-work-queue]')
  if (workQueueButton) { state.selectedQueue = normalizeWorkQueue(workQueueButton.dataset.workQueue) || 'call_now'; state.selectedLeadId = null; renderAll(); return }
  const cityFilterButton = event.target.closest('[data-city-filter]')
  if (cityFilterButton) { state.cityFilter = cityFilterButton.dataset.cityFilter || ''; state.selectedLeadId = null; renderAll(); return }
  const commandQueueButton = event.target.closest('[data-command-queue]')
  if (commandQueueButton) { state.selectedQueue = normalizeWorkQueue(commandQueueButton.dataset.commandQueue) || state.selectedQueue; state.selectedLeadId = null; renderAll(); return }
  const commandLeadButton = event.target.closest('[data-command-lead-id]')
  if (commandLeadButton) { selectCommandLead(commandLeadButton.dataset.commandLeadId || ''); return }
  const workspaceExport = event.target.closest('[data-workspace-export]')
  if (workspaceExport) { exportWorkspaceSnapshot(); return }
  const pinSearch = event.target.closest('[data-saved-search-pin]')
  if (pinSearch) { updateSavedSearch(pinSearch, { pinned: pinSearch.dataset.pinned !== 'true' }); return }
  const labelSearch = event.target.closest('[data-saved-search-label]')
  if (labelSearch) { renameSavedSearch(labelSearch); return }
  const rerunSearch = event.target.closest('[data-rerun-search]')
  if (rerunSearch) { applySavedSearch(rerunSearch); runSearch(); return }
  const savedSearch = event.target.closest('[data-saved-search]')
  if (savedSearch) applySavedSearch(savedSearch)
})
renderSummary(null)
renderReadiness(null)
renderCommandCenter(null)
renderExport(null)
clearStatus()
loadLatestRun()

function initStructuredSearch() {
  els.profession.innerHTML = PROFESSIONS.map((item) => `<option value="${escapeAttr(item.value)}">${escapeHtml(item.label)}</option>`).join('')
  els.locationOptions.innerHTML = LOCATIONS.map((location) => `<option value="${escapeAttr(location)}"></option>`).join('')
  els.profession.value = 'rørlegger'
}

function initOwnerControl() {
  if (!els.owner) return
  els.owner.value = currentOwner()
  els.owner.addEventListener('input', () => {
    try { window.localStorage.setItem('leadMachineBetaOwner', String(els.owner.value || '').trim()) } catch (_) {}
  })
}

function currentOwner() {
  const live = String(els.owner?.value || '').trim()
  if (live) return live
  try { return String(window.localStorage.getItem('leadMachineBetaOwner') || '').trim() } catch (_) { return '' }
}

function syncQueryFromStructuredSearch() {
  const profession = els.profession.value.trim()
  const location = els.location.value.trim()
  if (profession && location) els.query.value = `${profession} i ${location}`
}

async function loadLatestRun() {
  try {
    const response = await apiFetch('/api/latest-run')
    if (response.status === 404) return
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Latest run failed')
    state.result = payload
    state.selectedIndex = 0
    state.selectedLeadId = null
    if (payload.parsedQuery?.normalizedQuery) els.query.value = payload.parsedQuery.normalizedQuery
    if (payload.summary?.sellerIntent && els.sellerIntent) els.sellerIntent.value = payload.summary.sellerIntent
    if (payload.summary?.searchScope && els.searchScope) els.searchScope.value = payload.summary.searchScope
    if (payload.summary?.marketSweep && els.leadSort) els.leadSort.value = 'city'
    selectBestQueueForResult(payload)
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
  renderCommandCenter(null)
  renderExport(null)

  try {
    const statusText = els.runMode.value === 'fast'
      ? 'running: fast discovery and lead-pack build'
      : 'running: Verify & Enrich for selected lead'
    setStatus(statusText, 'running')
    const response = await apiFetch('/api/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query,
        provider: els.provider.value,
        maxResults: Number(els.maxResults.value),
        searchScope: els.searchScope.value,
        sellerIntent: els.sellerIntent?.value || 'general_b2b',
        mode: els.runMode.value,
        enrichCompanyProfile: true,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Run failed')
    state.result = payload
    if (payload.summary?.marketSweep && els.leadSort) els.leadSort.value = 'city'
    selectBestQueueForResult(payload)
    clearStatus()
    renderAll()
  } catch (error) {
    setStatus(`failed: ${error.message || 'Run failed'}`, 'failed')
  } finally {
    els.runButton.disabled = false
  }
}

function selectBestQueueForResult(result) {
  state.cityFilter = ''
  const leads = result?.leadPacks || []
  if (!leads.length) {
    state.selectedQueue = 'call_now'
    return
  }
  const counts = workQueueCounts(leads)
  const preferredQueues = ['follow_up_today', 'call_now', 'interested', 'no_answer', 'verify_first', 'not_relevant', 'archived']
  state.selectedQueue = preferredQueues.find((queue) => counts[queue] > 0) || 'call_now'
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
    state.selectedLeadId = null
  }
  renderSummary(state.result)
  renderReadiness(state.result)
  renderCommandCenter(state.result)
  renderWorkQueueTabs(leads)
  renderWorkflowBoard(state.result)
  renderLeads(visibleLeads)
  renderDetail(visibleLeads.length ? leads[state.selectedIndex] : null)
  renderExport(state.result)
}

function renderSummary(result) {
  const summary = result?.summary || {}
  const leads = result?.leadPacks || []
  const counts = workQueueCounts(leads)
  els.summary.innerHTML = `
    ${metric('Leads', summary.includedLeadCount ?? summary.totalLeads ?? 0)}
    ${metric('Ring nå', counts.call_now)}
    ${metric('Ingen svar', counts.no_answer)}
    ${metric('Oppfølging', counts.follow_up_today)}
    ${metric('Interessert', counts.interested)}
    ${summary.marketSweep ? metric('Byer', Object.keys(summary.marketSweepCityCounts || {}).length) : ''}
    ${metric('Status', compactRunStatus(summary))}
  `
}

function renderReadiness(result) {
  if (!els.readiness) return
  const readiness = result?.readiness || defaultReadiness()
  const savedSearches = Array.isArray(result?.savedSearches) ? result.savedSearches : []
  const workspace = readiness.workspace || defaultWorkspace(readiness, savedSearches)
  const savedCount = workspace.savedSearchCount || savedSearches.length || 0
  const noteCount = workspace.workflowLeadCount || 0
  els.readiness.innerHTML = '<section class="saved-market-panel">' +
    '<div class="saved-market-head"><div><p class="eyebrow">Saved markets</p><h2>Return to useful searches</h2><small>' + escapeHtml(String(savedCount) + ' saved searches · ' + String(noteCount) + ' leads with notes') + '</small></div><button type="button" class="quiet-export" data-workspace-export>Download test data</button></div>' +
    (savedSearches.length ? '<div class="saved-searches saved-search-management">' + savedSearches.map(savedSearchButton).join('') + '</div>' : '<p class="readiness-note">Saved searches appear here after the first run.</p>') +
  '</section>' + marketSweepPanel(result)
}


function renderCommandCenter(result) {
  if (!els.commandCenter) return
  const command = result && result.commandCenter
  if (!command) {
    els.commandCenter.innerHTML = '<section class="command-center-empty"><p class="eyebrow">Today / Command Center</p><div class="empty-state compact-empty">Run a search to build today command center.</div></section>'
    return
  }
  const summary = command.summary || {}
  const primaryMove = commandPrimaryMove(command)
  els.commandCenter.innerHTML = '<section class="opportunity-command-center">' +
    '<div class="command-next-move"><div><p class="eyebrow">Today / Command Center</p><h2>' + escapeHtml(primaryMove.title) + '</h2><small>' + escapeHtml(primaryMove.note) + '</small></div><div class="command-next-actions">' + primaryMove.actions + '</div></div>' +
    '<div class="command-mini-queues">' +
      commandQueueTile('Call first', command.callTheseFirst, 'call_now', 'No ready calls') +
      commandQueueTile('Verify blockers', command.verifyBeforeCalling, 'verify_first', 'No blockers') +
      commandQueueTile('Follow up', command.overdueFollowUps, 'follow_up_today', 'Nothing due') +
    '</div>' +
    '<details class="command-center-details"><summary>Market and warning signals</summary><div class="command-center-grid">' +
      commandMarketList(command.bestMarketsNow) +
      commandWarningList('Wasted-time warnings', command.wastedTimeWarnings) +
      commandWarningList('Source warnings', command.sourceWarnings) +
    '</div></details>' +
    '<p class="command-center-footnote">' + escapeHtml(String(summary.phoneReadyCount || 0) + ' phone-ready · ' + String(summary.verifyFirstCount || 0) + ' verify first · ' + String(summary.overdueFollowUpCount || 0) + ' overdue') + '</p>' +
  '</section>'
}

function commandPrimaryMove(command = {}) {
  const overdue = Array.isArray(command.overdueFollowUps) ? command.overdueFollowUps[0] : null
  if (overdue) {
    return {
      title: 'Next: follow up ' + (overdue.company || 'lead'),
      note: [overdue.city, overdue.phone, (overdue.reasons || [])[0]].filter(Boolean).join(' · '),
      actions: commandActionButton('Open lead', { leadId: overdue.leadId }, 'primary') + commandActionButton('Open queue', { queue: 'follow_up_today' }),
    }
  }
  const callLead = Array.isArray(command.callTheseFirst) ? command.callTheseFirst[0] : null
  if (callLead) {
    return {
      title: 'Next: call ' + (callLead.company || 'best lead'),
      note: [callLead.city, callLead.phone, (callLead.reasons || [])[0]].filter(Boolean).join(' · '),
      actions: commandActionButton('Open lead', { leadId: callLead.leadId }, 'primary') + commandActionButton('Call queue', { queue: 'call_now' }),
    }
  }
  const verifyLead = Array.isArray(command.verifyBeforeCalling) ? command.verifyBeforeCalling[0] : null
  if (verifyLead) {
    return {
      title: 'Next: verify ' + (verifyLead.company || 'lead'),
      note: [verifyLead.city, (verifyLead.reasons || [])[0]].filter(Boolean).join(' · '),
      actions: commandActionButton('Open lead', { leadId: verifyLead.leadId }, 'primary') + commandActionButton('Verify queue', { queue: 'verify_first' }),
    }
  }
  const market = Array.isArray(command.bestMarketsNow) ? command.bestMarketsNow[0] : null
  if (market) {
    return {
      title: 'Next: work ' + (market.city || 'best market'),
      note: String(market.phoneReadyCount || 0) + '/' + String(market.leadCount || 0) + ' phone-ready in this market.',
      actions: commandActionButton('Filter city', { city: market.city }, 'primary'),
    }
  }
  return {
    title: 'Next: run a market search',
    note: 'Command Center appears after the first lead run.',
    actions: '',
  }
}

function commandActionButton(label, target = {}, variant) {
  const className = variant === 'primary' ? ' class="primary"' : ''
  if (target.leadId) return '<button type="button"' + className + ' data-command-lead-id="' + escapeAttr(target.leadId) + '">' + escapeHtml(label) + '</button>'
  if (target.queue) return '<button type="button"' + className + ' data-command-queue="' + escapeAttr(target.queue) + '">' + escapeHtml(label) + '</button>'
  if (target.city) return '<button type="button"' + className + ' data-city-filter="' + escapeAttr(target.city) + '">' + escapeHtml(label) + '</button>'
  return ''
}

function commandQueueTile(title, items, queue, emptyText) {
  const list = Array.isArray(items) ? items : []
  const first = list[0]
  const detail = first ? [first.company, first.city || first.phone].filter(Boolean).join(' · ') : emptyText
  return '<button type="button" class="command-queue-tile" data-command-queue="' + escapeAttr(queue) + '"><span>' + escapeHtml(title) + '</span><strong>' + escapeHtml(String(list.length)) + '</strong><small>' + escapeHtml(detail || emptyText) + '</small></button>'
}

function commandTopActionButton(action = {}) {
  const target = action.target || {}
  if (target.queue) return '<button type="button" data-command-queue="' + escapeAttr(target.queue) + '"><strong>' + escapeHtml(action.label || 'Action') + '</strong><span>' + escapeHtml(action.note || '') + '</span></button>'
  if (target.city) return '<button type="button" data-city-filter="' + escapeAttr(target.city) + '"><strong>' + escapeHtml(action.label || 'Market') + '</strong><span>' + escapeHtml(action.note || '') + '</span></button>'
  return '<button type="button" disabled><strong>' + escapeHtml(action.label || 'Action') + '</strong><span>' + escapeHtml(action.note || '') + '</span></button>'
}

function commandLeadList(title, items, queue) {
  const list = Array.isArray(items) ? items.slice(0, 4) : []
  const rows = list.length ? list.map((item) => '<button type="button" class="command-lead-row" data-command-lead-id="' + escapeAttr(item.leadId || item.id || '') + '"><strong>' + escapeHtml(item.company || 'Unknown company') + '</strong><span>' + escapeHtml([item.city, item.phone || workQueueLabel(item.queue || queue)].filter(Boolean).join(' · ')) + '</span><small>' + escapeHtml((item.reasons || []).slice(0, 2).join(' · ') || item.action || '') + '</small></button>').join('') : '<p class="muted">Nothing urgent here.</p>'
  return '<section class="command-center-card"><div class="command-card-title"><h3>' + escapeHtml(title) + '</h3><button type="button" data-command-queue="' + escapeAttr(queue) + '">Open queue</button></div>' + rows + '</section>'
}

function commandMarketList(items) {
  const markets = Array.isArray(items) ? items.slice(0, 5) : []
  const rows = markets.length ? markets.map((market) => '<button type="button" class="command-market-row" data-city-filter="' + escapeAttr(market.city || '') + '"><strong>' + escapeHtml(market.city || 'Unknown city') + '</strong><span>' + escapeHtml(String(market.phoneReadyCount || 0) + '/' + String(market.leadCount || 0) + ' phone-ready · ' + formatRatioPercent(market.verifyRate) + ' verify') + '</span><small>' + escapeHtml((market.reasons || []).slice(0, 2).join(' · ')) + '</small></button>').join('') : '<p class="muted">Run a Norway sweep to compare cities.</p>'
  return '<section class="command-center-card"><div class="command-card-title"><h3>Best markets now</h3><span>By city</span></div>' + rows + '</section>'
}

function commandWarningList(title, items) {
  const warnings = Array.isArray(items) ? items.slice(0, 4) : []
  const rows = warnings.length ? warnings.map((item) => '<div class="command-warning-row"><strong>' + escapeHtml(item.label || 'Warning') + '</strong><span>' + escapeHtml(item.note || (item.count ? String(item.count) + ' leads' : '')) + '</span></div>').join('') : '<p class="muted">No major warning.</p>'
  return '<section class="command-center-card"><div class="command-card-title"><h3>' + escapeHtml(title) + '</h3><span>Read-only</span></div>' + rows + '</section>'
}

function formatRatioPercent(value) {
  const number = Number(value || 0)
  return String(Math.round(number * 100)) + '%'
}

function selectCommandLead(id) {
  if (!id || !state.result || !Array.isArray(state.result.leadPacks)) return
  const index = state.result.leadPacks.findIndex((lead, candidateIndex) => (lead.workflow && lead.workflow.leadId || leadId(lead, candidateIndex)) === id)
  if (index < 0) return
  const lead = state.result.leadPacks[index]
  state.selectedQueue = leadWorkQueue(lead)
  state.cityFilter = ''
  state.selectedIndex = index
  state.selectedLeadId = leadId(lead, index)
  renderAll()
  focusLeadDetail({ block: 'start' })
}

async function refreshCommandCenter() {
  if (!state.result) return
  try {
    const response = await apiFetch('/api/opportunity-command-center')
    const payload = await response.json()
    if (response.ok) state.result.commandCenter = payload
  } catch (_) {}
}

function defaultReadiness() {
  return {
    sourceGuard: { proffStatus: 'disabled_optional', googleStatus: 'cost_guarded', searchCap: 25 },
    persistence: { status: 'sqlite_local', note: 'Local workspace keeps workflow and recent searches between reloads without SaaS auth or billing.' },
  }
}

function defaultWorkspace(readiness, savedSearches) {
  const persistence = readiness && readiness.persistence ? readiness.persistence : {}
  return {
    status: persistence.status || 'sqlite_local',
    storageMode: persistence.status === 'local_json' ? 'Local JSON fallback' : 'SQLite local workspace',
    workspaceDbPath: persistence.workspaceDbPath || '',
    workflowLeadCount: 0,
    savedSearchCount: Array.isArray(savedSearches) ? savedSearches.length : 0,
    activityCount: 0,
    canExport: false,
    exportPath: '/api/workspace-export',
  }
}

async function exportWorkspaceSnapshot() {
  try {
    setStatus('exporting workspace snapshot...', 'running')
    const response = await apiFetch('/api/workspace-export')
    if (!response.ok) throw new Error('Workspace export failed')
    const snapshot = await response.json()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lead-machine-workspace-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setStatus('workspace snapshot exported', '')
  } catch (error) {
    setStatus(error.message || 'workspace export failed', 'failed')
  }
}

function savedSearchButton(search) {
  const key = search.key || [search.query, search.sellerIntent, search.searchScope, search.provider].map((value) => String(value || '').toLowerCase()).join('::')
  const attrs = 'data-saved-search="' + escapeAttr(search.query || '') + '" data-saved-search-key="' + escapeAttr(key) + '" data-provider="' + escapeAttr(search.provider || 'balanced') + '" data-seller-intent="' + escapeAttr(search.sellerIntent || 'general_b2b') + '" data-search-scope="' + escapeAttr(search.searchScope || 'regional') + '"'
  const counts = String(search.leadCount || 0) + ' leads · ' + String(search.phoneCount || 0) + ' phone-ready'
  const title = search.label || search.query || 'saved search'
  const pinLabel = search.pinned ? 'Pinned' : 'Pin'
  return '<section class="saved-search-item ' + (search.pinned ? 'pinned' : '') + '">' +
    '<button type="button" class="saved-search-button" ' + attrs + '><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(search.query || '') + ' · ' + escapeHtml(sellerIntentLabel(search.sellerIntent)) + ' · ' + escapeHtml(readable(search.searchScope || 'regional')) + ' · ' + escapeHtml(counts) + '</small></button>' +
    '<div class="saved-search-actions"><button type="button" data-saved-search-pin data-saved-search-key="' + escapeAttr(key) + '" data-pinned="' + String(Boolean(search.pinned)) + '">' + escapeHtml(pinLabel) + '</button><button type="button" data-saved-search-label data-saved-search-key="' + escapeAttr(key) + '" data-current-label="' + escapeAttr(search.label || '') + '">Rename</button><button type="button" class="saved-search-rerun" data-rerun-search="' + escapeAttr(search.query || '') + '" data-provider="' + escapeAttr(search.provider || 'balanced') + '" data-seller-intent="' + escapeAttr(search.sellerIntent || 'general_b2b') + '" data-search-scope="' + escapeAttr(search.searchScope || 'regional') + '">Rerun</button></div>' +
  '</section>'
}

function applySavedSearch(button) {
  els.query.value = button.dataset.savedSearch || button.dataset.rerunSearch || ''
  if (els.sellerIntent) els.sellerIntent.value = button.dataset.sellerIntent || 'general_b2b'
  if (els.searchScope) els.searchScope.value = button.dataset.searchScope || 'regional'
  if (els.provider && button.dataset.provider) els.provider.value = button.dataset.provider
  els.query.focus()
  setStatus('saved search loaded - click Kjør søk to refresh it', '')
}

async function renameSavedSearch(button) {
  const current = button.dataset.currentLabel || ''
  const label = window.prompt('Saved search label', current)
  if (label === null) return
  await updateSavedSearch(button, { label })
}

async function updateSavedSearch(button, patch) {
  try {
    setStatus('saving search...', 'running')
    const response = await apiFetch('/api/saved-searches', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: button.dataset.savedSearchKey || '', ...patch }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Saved search update failed')
    if (state.result) state.result.savedSearches = payload.savedSearches || state.result.savedSearches || []
    renderReadiness(state.result)
    setStatus('saved search updated', '')
  } catch (error) {
    setStatus(error.message || 'saved search update failed', 'failed')
  }
}

function compactRunStatus(summary = {}) {
  const mode = readable(summary.mode || 'fast')
  if (!summary || Object.keys(summary).length === 0) return 'Ready'
  if (summary.marketSweep) return `Norge-sweep · ${summary.includedLeadCount || summary.totalLeads || 0}`
  if (summary.lowSupply) return `${mode} · low supply`
  if (summary.fallbackUsed) return `${mode} · fallback used`
  return mode
}

function renderWorkflowBoard(result) {
  if (!els.workflowBoard) return
  const leads = result?.leadPacks || []
  if (!leads.length) {
    els.workflowBoard.className = 'workflow-board empty'
    els.workflowBoard.textContent = 'Run a search to build the next work queue.'
    return
  }
  const queue = workQueueLeads(leads, state.selectedQueue)
  const next = queue[0]
  els.workflowBoard.className = 'workflow-board current-call-board'
  els.workflowBoard.innerHTML = next
    ? currentCallCard(next.lead, next.index, next.reason, queue.length, state.selectedQueue)
    : '<div class="empty-state compact-empty">No leads in ' + escapeHtml(workQueueLabel(state.selectedQueue)) + '. Choose another queue or run a new search.</div>'
  els.workflowBoard.querySelectorAll('.queue-select').forEach((button) => button.addEventListener('click', () => {
    state.selectedIndex = Number(button.dataset.index)
    state.selectedLeadId = leadId(leads[state.selectedIndex], state.selectedIndex)
    renderAll()
    focusLeadDetail()
  }))
}

function currentCallCard(lead, index, reason, queueCount, queueId) {
  const name = lead.company?.displayName || lead.companyName || 'Unknown company'
  const phone = lead.contact?.phone || lead.phone || ''
  const city = lead.contact?.city || lead.city || 'unknown'
  const followUpClass = followUpTiming(lead.workflow?.followUpDate)
  const readiness = callReadiness(lead)
  return `<article class="current-call-card queue-row ${followUpClass !== 'none' ? `follow-up-${followUpClass}` : ''}">
    <div class="current-call-head">
      <div>
        <span>${escapeHtml(workQueueLabel(queueId || state.selectedQueue))}</span>
        <strong>${escapeHtml(name)}</strong>
        <small>${escapeHtml(city)} · ${escapeHtml(reason)}</small><div class="current-readiness">${badge(readiness.key)}<span>${escapeHtml(readiness.note)}</span></div>
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
    ? QUICK_WORKFLOW_ACTIONS.filter((action) => ['mark_called', 'no_answer', 'interested', 'not_relevant'].includes(action.id))
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
  let previousCity = ''
  els.leadCards.innerHTML = visibleLeads.map(({ lead, index, id }) => {
    const contact = lead.contact || {}
    const places = lead.places || {}
    const company = lead.company || {}
    const primarySignal = sellerSignals(lead)[0] || humanize(lead.opportunityType || 'Lead pack')
    const salesEdge = salesEdgeAction(lead)
    const city = leadCity(lead)
    const cityHeading = state.result?.summary?.marketSweep && city !== previousCity ? '<div class="city-group-heading"><span>' + escapeHtml(city) + '</span><strong>' + escapeHtml(cityCountLabel(city)) + '</strong></div>' : ''
    previousCity = city
    return `
      ${cityHeading}
      <button class="lead-card ${id === state.selectedLeadId ? 'active' : ''}" type="button" data-index="${index}" data-id="${escapeAttr(id)}">
        <div class="badge-row">${badge(callReadiness(lead).key)}${sellerFitBadge(lead)}${badge(lead.callPriority || lead.priority)}${badge(workflowStatus(lead))}${badge(lead.sourceQuality?.locationMatchStatus)}${badge(brregStatusLabel(company))}${fastBadge(lead)}</div>
        <h3>${escapeHtml(company.displayName || lead.companyName || 'Unknown company')}</h3>
        <p>${escapeHtml(contact.city || lead.city || 'unknown')} · ${escapeHtml(contact.phone || lead.phone || 'phone unknown')}</p>
        <p class="queue-action"><strong>Next:</strong> <span class="sales-edge-action ${escapeAttr(salesEdge.key)}">${escapeHtml(salesEdge.label)}</span></p>
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

function cityCountLabel(city) {
  const counts = state.result?.summary?.marketSweepCityCounts || {}
  const count = counts[city] || 0
  return count ? String(count) + ' leads' : ''
}

function marketSweepPanel(result) {
  const summary = result?.summary || {}
  if (!summary.marketSweep) return ''
  const counts = summary.marketSweepCityCounts || {}
  const cityEntries = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right, 'nb'))
  const searchedCities = Array.isArray(summary.marketSweepCities) ? summary.marketSweepCities.length : 0
  const citiesWithLeads = cityEntries.length
  const activeCity = String(state.cityFilter || '')
  const totalCityLeads = cityEntries.reduce((sum, [, count]) => sum + Number(count || 0), 0)
  const allChip = '<button type="button" class="city-chip ' + (!activeCity ? 'active' : '') + '" data-city-filter=""><strong>Alle byer</strong> ' + escapeHtml(String(totalCityLeads)) + '</button>'
  const chips = cityEntries.length
    ? allChip + cityEntries.map(([city, count]) => '<button type="button" class="city-chip ' + (normalizeCityName(city) === normalizeCityName(activeCity) ? 'active' : '') + '" data-city-filter="' + escapeAttr(city) + '"><strong>' + escapeHtml(city) + '</strong> ' + escapeHtml(String(count)) + '</button>').join('')
    : '<span class="muted">Ingen bygrupper ennå.</span>'
  return '<section class="market-sweep-panel"><div><p class="eyebrow">Norge-sweep</p><h2>Leads gruppert etter by</h2><small>' + escapeHtml(String(searchedCities) + ' bysøk · ' + String(citiesWithLeads) + ' byer med treff · maks ' + String(summary.maxResults || 60) + ' leads') + '</small></div><div class="city-chip-row">' + chips + '</div></section>'
}

function focusLeadDetail(options = {}) {
  if (!els.leadDetail) return
  els.leadDetail.scrollIntoView({ behavior: 'smooth', block: options.block || 'start', inline: 'nearest' })
}

function applyQueuePreset(preset) {
  els.leadFilters.forEach((filter) => { filter.checked = false })
  if (preset === 'callNow') state.selectedQueue = 'call_now'
  else if (preset === 'verify') state.selectedQueue = 'verify_first'
  else if (preset === 'followUp') state.selectedQueue = 'follow_up_today'
  else if (preset === 'interested') state.selectedQueue = 'interested'
  els.leadSort.value = preset === 'followUp' ? 'followUp' : 'callQueue'
  state.selectedLeadId = null
  renderAll()
}

function renderWorkQueueTabs(leads) {
  if (!els.workQueueTabs) return
  const counts = workQueueCounts(leads || [])
  els.workQueueTabs.innerHTML = WORK_QUEUES.map((queue) => {
    const active = queue.id === state.selectedQueue
    return '<button type="button" class="work-queue-tab ' + (active ? 'active' : '') + '" data-work-queue="' + escapeAttr(queue.id) + '"><span>' + escapeHtml(queue.label) + '</span><strong>' + escapeHtml(counts[queue.id] || 0) + '</strong></button>'
  }).join('')
}

function workQueueCounts(leads) {
  return (Array.isArray(leads) ? leads : []).reduce((counts, lead) => {
    const queue = leadWorkQueue(lead)
    counts[queue] = (counts[queue] || 0) + 1
    return counts
  }, WORK_QUEUES.reduce((counts, queue) => ({ ...counts, [queue.id]: 0 }), {}))
}

function workQueueLeads(leads, queueId) {
  return (Array.isArray(leads) ? leads : [])
    .map((lead, index) => ({ lead, index, reason: workQueueReason(lead, queueId) }))
    .filter(({ lead }) => leadMatchesWorkQueue(lead, queueId))
    .sort((a, b) => callQueueSortScore(b.lead) - callQueueSortScore(a.lead))
}

function leadMatchesWorkQueue(lead, queueId) {
  const queue = normalizeWorkQueue(queueId) || 'call_now'
  return leadWorkQueue(lead) === queue
}

function queueQualityForLead(lead = {}) {
  const quality = lead.queueQuality
  return quality && typeof quality === 'object' && quality.rulesVersion === 'queue_quality_v1' ? quality : null
}

function leadWorkQueue(lead) {
  const backendQuality = queueQualityForLead(lead)
  const workflowQueue = normalizeWorkQueue(backendQuality?.workflowQueue || lead.workflow?.queue)
  if (workflowQueue) return workflowQueue
  const recommendedQueue = normalizeWorkQueue(backendQuality?.recommendedQueue)
  if (recommendedQueue) return recommendedQueue
  return fallbackLeadWorkQueue(lead)
}

function fallbackLeadWorkQueue(lead) {
  const workflow = lead.workflow || {}
  const explicit = normalizeWorkQueue(workflow.queue)
  const status = String(workflow.status || '').toLowerCase()
  const response = String(workflow.response || '').toLowerCase()
  const outcome = String(workflow.outcome || '').toLowerCase()
  if (explicit === 'archived' || workflow.archivedAt) return 'archived'
  if (status === 'rejected' || explicit === 'not_relevant' || outcome.includes('not relevant') || outcome.includes('rejected')) return 'not_relevant'
  if (isFollowUpDue(lead)) return 'follow_up_today'
  if (status === 'interested' || response === 'interested' || response === 'meeting_booked' || explicit === 'interested') return 'interested'
  if (response === 'no_answer' || response === 'no_response' || status === 'follow_up' || explicit === 'no_answer') return 'no_answer'
  if (explicit === 'call_now' || explicit === 'verify_first') return explicit
  const company = lead.company || {}
  const sourceQuality = lead.sourceQuality || {}
  const fusion = sourceFusionForLead(lead)
  const hasPhone = Boolean(lead.contact?.phone || lead.phone)
  const sellerAction = sellerRecommendedAction(lead)
  const fit = String(lead.sellerFit?.sellerFit || '').toLowerCase()
  const matchStatus = String(company.matchStatus || '').toLowerCase()
  const locationStatus = String(sourceQuality.locationMatchStatus || '').toLowerCase()
  const trustAction = String(fusion.recommendedTrustAction || '').toLowerCase()
  const identityConfidence = String(fusion.identityConfidence || '').toLowerCase()
  const contactConfidence = String(fusion.contactConfidence || '').toLowerCase()
  const locationConfidence = String(fusion.locationConfidence || '').toLowerCase()
  const quality = leadQueueQuality(lead, { company, sourceQuality, fusion, hasPhone, fit, sellerAction, trustAction, identityConfidence, contactConfidence, locationConfidence, matchStatus, locationStatus })
  if (sellerAction === 'skip' || trustAction === 'skip') return 'archived'
  if (trustAction === 'verify_first') return 'verify_first'
  if (!quality.hasPhone) return 'verify_first'
  if (quality.foreignPhone || quality.severeLocationRisk) return 'verify_first'
  if (quality.trustedToCall) return 'call_now'
  if (quality.needsVerifyBeforeCall) return 'verify_first'
  return 'verify_first'
}

function normalizeWorkQueue(value) {
  const queue = String(value || '').toLowerCase().trim()
  return WORK_QUEUE_IDS.has(queue) ? queue : ''
}

function workQueueLabel(value) {
  const queue = WORK_QUEUES.find((item) => item.id === normalizeWorkQueue(value))
  return queue ? queue.label : 'Ring nå'
}

function workQueueReason(lead, queueId) {
  const workflow = lead.workflow || {}
  const queue = normalizeWorkQueue(queueId) || leadWorkQueue(lead)
  if (queue === 'follow_up_today') return followUpQueueReason(lead)
  if (queue === 'no_answer') return workflow.followUpDate ? 'Ingen svar · next ' + workflow.followUpDate : 'Ingen svar · call again later'
  if (queue === 'interested') return workflow.nextAction || 'Interessert lead needs next action'
  if (queue === 'verify_first') return callReadiness(lead).note || 'Verify before call'
  if (queue === 'not_relevant') return 'Removed from active calling'
  if (queue === 'archived') return 'Hidden from active queues'
  return leadQueueActionLabel(lead)
}

function getVisibleLeads(leads) {
  const activeFilters = new Set(els.leadFilters.filter((filter) => filter.checked).map((filter) => filter.value))
  const wrapped = leads.map((lead, index) => ({ lead, index, id: leadId(lead, index) }))
    .filter(({ lead }) => leadMatchesWorkQueue(lead, state.selectedQueue))
    .filter(({ lead }) => matchesCityFilter(lead))
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
  if (filters.has('strongEnough')) {
    const fusion = sourceFusionForLead(lead)
    const fit = String(lead.sellerFit?.sellerFit || '').toLowerCase()
    const confidence = String(fusion.leadConfidence || '').toLowerCase()
    const trustAction = String(fusion.recommendedTrustAction || '').toLowerCase()
    if (fit === 'weak' || confidence === 'weak' || trustAction === 'skip') return false
  }
  return true
}

function compareLeads(a, b, sortKey) {
  if (sortKey === 'city') return compareLeadsByCity(a, b)
  const rankDiff = leadSortScore(b, sortKey) - leadSortScore(a, sortKey)
  if (rankDiff) return rankDiff
  return priorityScore(b) - priorityScore(a)
}

function compareLeadsByCity(a, b) {
  const cityDiff = leadCity(a).localeCompare(leadCity(b), 'nb')
  if (cityDiff) return cityDiff
  const queueDiff = callQueueSortScore(b) - callQueueSortScore(a)
  if (queueDiff) return queueDiff
  return String(a.company?.displayName || a.companyName || '').localeCompare(String(b.company?.displayName || b.companyName || ''), 'nb')
}

function leadCity(lead = {}) {
  return String(lead.contact?.city || lead.city || lead.sourceQuality?.marketSweepCity || 'unknown')
}

function normalizeCityName(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim()
}

function matchesCityFilter(lead) {
  if (!state.cityFilter) return true
  return normalizeCityName(leadCity(lead)) === normalizeCityName(state.cityFilter)
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
  if (sortKey === 'sellerFit') return sellerFitSortScore(lead)
  if (sortKey === 'callQueue') return callQueueSortScore(lead)
  return bestLeadScore(lead)
}

function callQueueSortScore(lead) {
  const workflow = lead.workflow || {}
  const company = lead.company || {}
  const contact = lead.contact || {}
  const sourceQuality = lead.sourceQuality || {}
  let score = bestLeadScore(lead)
  score += callReadiness(lead).rank
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
  score += sellerFitSortScore(lead)
  const backendQuality = queueQualityForLead(lead)
  if (backendQuality) {
    if (backendQuality.recommendedQueue === 'call_now') score += 160
    if (backendQuality.recommendedQueue === 'verify_first') score -= 90
    if ((backendQuality.blockers || []).includes('phone_format_not_norwegian') || (backendQuality.blockers || []).includes('location_conflict')) score -= 500
  } else {
    const quality = leadQueueQuality(lead)
    if (quality.trustedToCall) score += 160
    if (quality.needsVerifyBeforeCall) score -= 90
    if (quality.foreignPhone || quality.severeLocationRisk) score -= 500
  }
  if (sellerRecommendedAction(lead) === 'contact') score += 120
  if (sellerRecommendedAction(lead) === 'verify') score += 35
  if (sellerRecommendedAction(lead) === 'skip') score -= 500
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

function sellerFitSortScore(lead) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const sourceQuality = lead.sourceQuality || {}
  let score = sellerFitValue(lead) * 100
  score += sellerRecommendedActionScore(lead)
  if (contact.phone || lead.phone) score += 35
  else score -= 60
  if (company.organizationNumber) score += 25
  else if (company.candidateOrganizationNumber) score += 12
  if (sourceQuality.locationMatchStatus === 'exact_location') score += 20
  if (websiteValue(contact.website || lead.website)) score += 8
  score += Math.min(Number(places.reviewCount || 0), 100) / 10
  return score
}

function sellerFitValue(lead) {
  return { strong: 4, good: 3, review: 2, weak: 0 }[String(lead.sellerFit?.sellerFit || '').toLowerCase()] ?? 1
}

function sellerRecommendedAction(lead) {
  return String(lead.sellerFit?.recommendedAction || '').toLowerCase()
}

function callReadiness(lead) {
  const workflow = lead.workflow || {}
  if (workflow.status === 'rejected' || workflow.queue === 'not_relevant' || workflow.archivedAt) return { key: 'skip', label: 'Skip', note: 'Rejected or not relevant.', rank: -2000 }
  const backendQuality = queueQualityForLead(lead)
  if (backendQuality) return callReadinessFromQueueQuality(backendQuality)
  const company = lead.company || {}
  const sourceQuality = lead.sourceQuality || {}
  const fusion = sourceFusionForLead(lead)
  const hasPhone = Boolean(lead.contact?.phone || lead.phone)
  const sellerAction = sellerRecommendedAction(lead)
  const trustAction = String(fusion.recommendedTrustAction || '').toLowerCase()
  const identityConfidence = String(fusion.identityConfidence || '').toLowerCase()
  const contactConfidence = String(fusion.contactConfidence || '').toLowerCase()
  const locationConfidence = String(fusion.locationConfidence || '').toLowerCase()
  const matchStatus = String(company.matchStatus || '').toLowerCase()
  const locationStatus = String(sourceQuality.locationMatchStatus || '').toLowerCase()
  const quality = leadQueueQuality(lead, { company, sourceQuality, fusion, hasPhone, sellerAction, trustAction, identityConfidence, contactConfidence, locationConfidence, matchStatus, locationStatus })
  if (workflow.status === 'rejected') return { key: 'skip', label: 'Skip', note: 'Rejected or not relevant.', rank: -2000 }
  if (isFollowUpDue(lead)) return { key: 'follow_up_due', label: 'Follow-up due', note: workflow.followUpDate ? 'Due ' + workflow.followUpDate : 'Follow-up is due.', rank: 1800 }
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') return { key: 'follow_up_due', label: 'Follow-up', note: 'Interested lead needs follow-up.', rank: 1500 }
  if (!quality.hasPhone) return { key: 'needs_contact', label: 'Needs contact', note: 'No direct phone yet.', rank: -300 }
  if (sellerAction === 'skip' || trustAction === 'skip') return { key: 'skip', label: 'Skip', note: 'Seller-fit engine says deprioritize.', rank: -1200 }
  if (quality.foreignPhone) return { key: 'verify_first', label: 'Verify first', note: 'Phone format looks outside Norway.', rank: 250 }
  if (quality.severeLocationRisk) return { key: 'verify_first', label: 'Verify first', note: 'Resolve location conflict before calling.', rank: 350 }
  if (trustAction === 'verify_first') return { key: 'verify_first', label: 'Verify first', note: 'Source Fusion says identity, contact or location needs verification.', rank: 500 }
  if (quality.trustedToCall) return { key: 'ready_to_call', label: 'Ready to call', note: quality.locationFallback ? 'Phone-ready; confirm location during call.' : 'Phone-ready and not contacted.', rank: 1250 }
  if (quality.needsVerifyBeforeCall) return { key: 'verify_first', label: 'Verify first', note: 'Verify identity/location before calling.', rank: 500 }
  return { key: 'later', label: 'Later', note: 'Review when current queue is clear.', rank: 50 }
}

function callReadinessFromQueueQuality(queueQuality = {}) {
  const note = queueQuality.blockers?.length
    ? queueQuality.blockers.slice(0, 2).map(humanize).join(', ')
    : queueQuality.reasons?.slice(0, 2).map(humanize).join(', ') || 'Backend queue-quality facts are attached.'
  if (queueQuality.recommendedQueue === 'call_now') return { key: 'ready_to_call', label: 'Ready to call', note, rank: 1250 }
  if (queueQuality.recommendedQueue === 'follow_up_today') return { key: 'follow_up_due', label: 'Follow-up due', note, rank: 1800 }
  if (queueQuality.recommendedQueue === 'interested') return { key: 'follow_up_due', label: 'Follow-up', note, rank: 1500 }
  if (queueQuality.recommendedQueue === 'verify_first') return { key: 'verify_first', label: 'Verify first', note, rank: 500 }
  if (queueQuality.recommendedQueue === 'no_answer') return { key: 'no_answer', label: 'Call again', note, rank: 200 }
  if (queueQuality.recommendedQueue === 'not_relevant' || queueQuality.recommendedQueue === 'archived') return { key: 'skip', label: 'Skip', note, rank: -1200 }
  return { key: 'later', label: 'Later', note, rank: 50 }
}

function leadQueueQuality(lead = {}, context = {}) {
  const company = context.company || lead.company || {}
  const sourceQuality = context.sourceQuality || lead.sourceQuality || {}
  const fusion = context.fusion || sourceFusionForLead(lead)
  const phone = lead.contact?.phone || lead.phone || ''
  const hasPhone = context.hasPhone ?? Boolean(phone)
  const fit = String(context.fit ?? lead.sellerFit?.sellerFit ?? '').toLowerCase()
  const sellerAction = String(context.sellerAction ?? sellerRecommendedAction(lead)).toLowerCase()
  const trustAction = String(context.trustAction ?? fusion.recommendedTrustAction ?? '').toLowerCase()
  const identityConfidence = String(context.identityConfidence ?? fusion.identityConfidence ?? '').toLowerCase()
  const contactConfidence = String(context.contactConfidence ?? fusion.contactConfidence ?? '').toLowerCase()
  const locationConfidence = String(context.locationConfidence ?? fusion.locationConfidence ?? '').toLowerCase()
  const matchStatus = String(context.matchStatus ?? company.matchStatus ?? '').toLowerCase()
  const locationStatus = String(context.locationStatus ?? sourceQuality.locationMatchStatus ?? '').toLowerCase()
  const confirmedOrg = Boolean(company.organizationNumber)
  const candidateOrg = Boolean(company.candidateOrganizationNumber)
  const exactLocation = locationStatus === 'exact_location' || locationConfidence === 'exact'
  const locationFallback = locationStatus === 'regional_fallback' || locationConfidence === 'fallback' || locationConfidence === 'unknown'
  const identityUnknown = identityConfidence === 'unknown' && !candidateOrg && !confirmedOrg
  const severeIdentityRisk = ['no_match', 'error'].includes(matchStatus) || identityUnknown
  const severeLocationRisk = ['out_of_area', 'conflict', 'location_conflict'].includes(locationStatus) || locationConfidence === 'conflict'
  const foreignPhone = Boolean(phone) && !isLikelyNorwegianPhone(phone)
  const trustedToCall = hasPhone && !foreignPhone && !severeLocationRisk && (confirmedOrg || exactLocation || trustAction === 'call' || (candidateOrg && ['strong', 'good'].includes(fit) && !locationFallback) || (sellerAction === 'contact' && !identityUnknown && !locationFallback))
  const needsVerifyBeforeCall = !hasPhone || foreignPhone || severeLocationRisk || severeIdentityRisk && !confirmedOrg || trustAction === 'verify_first' && !trustedToCall || contactConfidence === 'weak'
  return { hasPhone, confirmedOrg, candidateOrg, exactLocation, locationFallback, identityUnknown, severeIdentityRisk, severeLocationRisk, foreignPhone, trustedToCall, needsVerifyBeforeCall }
}

function isLikelyNorwegianPhone(value) {
  const raw = String(value || '').trim()
  const digits = raw.replace(/\D/g, '')
  if (!digits) return false
  if (/^\+?47[\s\d]+$/.test(raw) && digits.length === 10 && digits.startsWith('47')) return true
  if (digits.length === 8) return /^[2-9]/.test(digits)
  return false
}

function callFocusStrip(lead, command) {
  const readiness = callReadiness(lead)
  const workflow = lead.workflow || {}
  return '<section class="call-focus-strip">' +
    commandMetric('Call readiness', readiness.label, readiness.note) +
    commandMetric('Best contact', command.bestContact, command.bestContactNote) +
    commandMetric('Next action', command.nextAction, command.nextActionNote) +
    commandMetric('Last log', workflow.activities && workflow.activities[0] ? formatActivityTime(workflow.activities[0].at) : 'No log yet', workflow.activities && workflow.activities[0] ? activitySummary(workflow.activities[0]) : 'Save the first note.') +
  '</section>'
}

function sellerRecommendedActionScore(lead) {
  return { contact: 90, verify: 35, review: 10, skip: -200 }[sellerRecommendedAction(lead)] || 0
}

function sellerFitBadge(lead) {
  const fit = String(lead.sellerFit?.sellerFit || '').toLowerCase()
  if (!fit) return ''
  return badge(`${fit}_fit`)
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
  score += callReadiness(lead).rank
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
  return salesEdgeAction(lead).label
}

function salesEdgeAction(lead = {}) {
  const workflow = lead.workflow || {}
  const rejected = workflow.status === 'rejected' || workflow.queue === 'not_relevant' || String(workflow.outcome || '').toLowerCase().includes('not relevant')
  if (rejected) return { key: 'skip', label: 'Hopp over', note: 'Marked not relevant; keep out of seller focus.' }
  const backendQuality = queueQualityForLead(lead)
  if (backendQuality) return salesEdgeActionFromQueueQuality(backendQuality)
  const fusion = sourceFusionForLead(lead)
  const trustAction = String(fusion.recommendedTrustAction || '').toLowerCase()
  const sellerAction = sellerRecommendedAction(lead)
  const hasPhone = Boolean(lead.contact?.phone || lead.phone)
  const readiness = callReadiness(lead)
  const followUpDate = workflow.nextFollowUpAt || workflow.followUpDate || ''
  if (isFollowUpDue(lead)) return { key: 'follow_up_today', label: 'Følg opp i dag', note: followUpDate ? 'Due ' + followUpDate + '.' : 'Follow-up is due.' }
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') return { key: 'follow_up_today', label: 'Følg opp i dag', note: 'Interested lead needs a concrete next step.' }
  if (trustAction === 'skip' || sellerAction === 'skip' || readiness.key === 'skip') return { key: 'skip', label: 'Hopp over', note: 'Weak fit or source confidence; review only if you have a reason.' }
  if (!hasPhone && trustAction === 'skip') return { key: 'skip', label: 'Hopp over', note: 'No useful contact path found.' }
  if (!hasPhone) return { key: 'verify_first', label: 'Verifiser først', note: 'Find or verify a direct contact path before calling.' }
  if (readiness.key === 'verify_first' || readiness.key === 'needs_contact' || trustAction === 'verify_first') return { key: 'verify_first', label: 'Verifiser først', note: readiness.note || 'Verify identity, contact or location before calling.' }
  if ((trustAction === 'call' || readiness.key === 'ready_to_call') && hasPhone) return { key: 'call', label: 'Ring nå', note: readiness.note || 'Phone, identity and location are strong enough to work.' }
  if (isFastLead(lead)) return { key: 'verify_enrich', label: 'Verify & Enrich', note: 'Run a focused selected-lead check if this one is worth more context.' }
  if (String(fusion.leadConfidence || '').toLowerCase() === 'review') return { key: 'verify_enrich', label: 'Verify & Enrich', note: 'Source confidence needs a focused check before prioritizing.' }
  if (hasPhone) return { key: 'call', label: 'Ring nå', note: readiness.note || 'Phone is available and no hard blocker is visible.' }
  return { key: 'verify_first', label: 'Verifiser først', note: 'Verify contactability before sales work.' }
}

function salesEdgeActionFromQueueQuality(queueQuality = {}) {
  const note = queueQuality.blockers?.length
    ? queueQuality.blockers.slice(0, 2).map(humanize).join(', ')
    : queueQuality.reasons?.slice(0, 2).map(humanize).join(', ') || 'Backend queue-quality recommendation.'
  if (queueQuality.recommendedAction === 'call') return { key: 'call', label: 'Ring nå', note }
  if (queueQuality.recommendedAction === 'follow_up_today' || queueQuality.recommendedQueue === 'follow_up_today') return { key: 'follow_up_today', label: 'Følg opp i dag', note }
  if (queueQuality.recommendedAction === 'verify_first') return { key: 'verify_first', label: 'Verifiser først', note }
  if (queueQuality.recommendedAction === 'skip') return { key: 'skip', label: 'Hopp over', note }
  if (queueQuality.recommendedAction === 'call_again') return { key: 'follow_up_today', label: 'Følg opp', note }
  if (queueQuality.recommendedAction === 'follow_up') return { key: 'follow_up_today', label: 'Følg opp', note }
  return { key: 'verify_enrich', label: 'Verify & Enrich', note }
}

function updateFilterSummary(visible, total) {
  if (!els.leadFilterSummary) return
  const active = els.leadFilters.filter((filter) => filter.checked).map((filter) => filter.parentElement.textContent.trim())
  if (state.cityFilter) active.unshift('By: ' + state.cityFilter)
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
  const salesEdge = salesEdgeAction(lead)
  els.leadDetail.innerHTML = `
    <section class="instant-lead-view">
      <div class="instant-lead-main">
        <div class="instant-lead-title">
          <p class="eyebrow">Selected lead</p>
          <div class="lead-name-line">
            <h2>${escapeHtml(company.displayName || lead.companyName || 'Unknown company')}</h2>
          </div>
          <p class="muted">${escapeHtml(company.legalName || 'Legal name unknown')}</p>
          <div class="badge-row instant-badges">${badge(callReadiness(lead).key)}${sourceFusionBadge(lead)}${badge(lead.callPriority || lead.priority)}${badge(brregStatusLabel(company))}${badge(sourceQuality.locationMatchStatus)}${fastBadge(lead)}</div>
        </div>
        <div class="instant-call-box">
          <span>Best contact</span>
          ${titlePhone(contact.phone || lead.phone)}
          <small>${escapeHtml(command.bestContactNote)}</small>
          <div class="lead-header-actions">
            ${phoneHref(contact.phone || lead.phone) ? `<a class="call-now primary-call" href="${escapeAttr(phoneHref(contact.phone || lead.phone))}">Call now</a>` : ''}
            <button type="button" id="nextLeadButton" class="next-lead-button" ${nextLeadDisabledAttr()}>Next lead</button>
          </div>
        </div>
      </div>
      ${callSessionPanel(lead, command)}
      ${sellerDeskCards(lead, command, { includeDetails: false })}
      <div class="instant-decision-grid">
        ${commandMetric('Do this now', salesEdge.label, salesEdge.note)}
        ${commandMetric('Verify before use', command.mainRisk, command.mainRiskNote)}
        ${commandMetric('Company identity', command.verification, command.verificationNote)}
        ${commandMetric('Business type', command.businessType, command.businessTypeNote)}
      </div>
    </section>

    ${mobileCallBar(lead)}

    ${workflowPanel(lead)}

    ${sellerDeskCards(lead, command, { includeTop: false })}

    ${sellerCommandCard(command)}

    ${osintPanel(lead)}

    <section class="detail-tools">
      <details class="detail-tool">
        <summary>Why inspect?</summary>
        <section class="leverage-panel compact">
          <div>
            <p class="eyebrow">Seller context</p>
            <h3>Reasons to review</h3>
          </div>
          ${bullets(leverage)}
        </section>
      </details>
      ${enrichmentTool(lead)}
      <details class="detail-tool">
        <summary>Sources</summary>
        <div class="source-grid">
        ${sourceCard('Google Places', places.provider || 'available', [
          ['Rating', formatRating(places)],
          ['Place ID', places.placeId || 'unknown'],
          ['Reviews', places.reviewCount ?? 'unknown'],
        ])}
        ${sourceCard('Digital presence check', website.auditStatus || 'available', [
          ['Contactability', website.contactability || 'unknown'],
          ['Top signal', (website.topEvidence || [])[0] || 'none'],
          ['CTA profile', website.ctaProfile ? 'available' : 'unknown'],
        ])}
        ${brregSourceCard(company)}
        ${sourceCard('Source strategy', sourceStrategyStatus(company, sourceQuality, places), [
          ['Identity source', isBrregUnavailable(company) ? 'brreg not confirmed' : (sourceQuality.identitySource || company.source || 'unknown')],
          ['Presence source', sourceQuality.presenceSource || places.provider || 'unknown'],
          ['Strategy', sourceStrategyLabel(company, sourceQuality)],
        ])}
        ${sourceCard('Economy / Proff', economy.status || 'not_enabled', [
          ['Revenue', economy.revenue ?? 'not enabled'],
          ['Profit', economy.profit ?? 'not enabled'],
          ['Employees', economy.employees ?? 'not enabled'],
          ['Source', economy.source || 'not enabled'],
          ['Warnings', normalizeList(economy.warnings).map(humanize).join(', ') || 'none'],
        ])}
        ${sourceCard('Discovery quality', discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown', [
          ['Score', discoveryQuality.score == null ? 'unknown' : `${discoveryQuality.score}/100`],
          ['Reasons', (discoveryQuality.reasons || []).slice(0, 3).map(humanize).join(', ') || 'unknown'],
          ['Warnings', (discoveryQuality.warnings || []).slice(0, 3).map(humanize).join(', ') || 'none'],
        ])}
        </div>
      </details>
      ${deepEnrichmentModules(lead, command)}
      <details class="detail-tool">
        <summary>Raw data</summary>
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
      ['Seller intent', humanize(lead.sellerFit?.sellerIntent || state.result?.summary?.sellerIntent || 'general_b2b')],
      ['Seller fit', humanize(lead.sellerFit?.sellerFit || 'unknown')],
      ['Recommended action', humanize(lead.sellerFit?.recommendedAction || 'unknown')],
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
    </section>
  `
  const nextButton = document.getElementById('nextLeadButton')
  if (nextButton) nextButton.addEventListener('click', selectNextVisibleLead)
}

function callSessionPanel(lead, command) {
  const phone = lead.contact?.phone || lead.phone || ''
  const callHref = phoneHref(phone)
  const queue = leadWorkQueue(lead)
  const queueCount = workQueueLeads(state.result?.leadPacks || [], queue).length
  return '<section class="call-session-panel queue-row" aria-label="Call session">' +
    '<div class="call-session-copy"><p class="eyebrow">Seller next action</p><h3>' + escapeHtml(workQueueLabel(queue)) + ' · ' + escapeHtml(String(queueCount)) + ' leads</h3><p>' + escapeHtml(command.nextActionNote || callReadiness(lead).note) + '</p></div>' +
    '<div class="call-session-actions">' +
      (callHref ? '<a class="call-session-button primary" href="' + escapeAttr(callHref) + '">Call now</a>' : '<span class="call-session-button disabled">No phone</span>') +
      '<button type="button" class="call-session-button warning" data-workflow-action="no_answer" data-index="' + escapeAttr(String(state.selectedIndex)) + '">No answer</button>' +
      '<button type="button" class="call-session-button positive" data-workflow-action="interested" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Interested</button>' +
      '<button type="button" class="call-session-button" data-workflow-action="mark_called" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Called / done</button>' +
      '<button type="button" class="call-session-button negative" data-workflow-action="not_relevant" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Not relevant</button>' +
      '<button type="button" class="call-session-button" data-next-visible-lead ' + nextLeadDisabledAttr() + '>Next lead</button>' +
    '</div></section>'
}

function mobileCallBar(lead) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const phone = contact.phone || lead.phone || ''
  const callHref = phoneHref(phone)
  const name = company.displayName || lead.companyName || 'Selected lead'
  return '<aside class="mobile-call-bar queue-row" aria-label="Mobile call actions">' +
    '<div class="mobile-call-main"><strong>' + escapeHtml(name) + '</strong><span>' + escapeHtml(phone || workQueueLabel(leadWorkQueue(lead))) + '</span></div>' +
    '<div class="mobile-call-actions">' +
    (callHref ? '<a class="mobile-call-button primary" href="' + escapeAttr(callHref) + '">Ring</a>' : '<span class="mobile-call-button disabled">Ingen tlf</span>') +
    '<button type="button" class="mobile-call-button warning" data-workflow-action="no_answer" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Ingen svar</button>' +
    '<button type="button" class="mobile-call-button positive" data-workflow-action="interested" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Interessert</button>' +
    '<button type="button" class="mobile-call-button" data-workflow-action="mark_called" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Ferdig</button>' +
    '<button type="button" class="mobile-call-button" data-next-visible-lead ' + nextLeadDisabledAttr() + '>Neste</button>' +
    '</div></aside>'
}

function queueGuidanceNote(lead = {}) {
  const quality = queueQualityForLead(lead)
  if (!quality || !quality.queueMismatch) return ''
  const actualQueue = workQueueLabel(leadWorkQueue(lead))
  const recommendedQueue = workQueueLabel(quality.recommendedQueue)
  return '<p class="queue-guidance-note">System suggests ' + escapeHtml(recommendedQueue) + '; current workflow stays ' + escapeHtml(actualQueue) + ' until you change it.</p>'
}

function nextLeadDisabledAttr() {
  return getVisibleLeads(state.result?.leadPacks || []).length > 1 ? '' : 'disabled'
}

function selectNextVisibleLead() {
  const visibleLeads = getVisibleLeads(state.result?.leadPacks || [])
  if (visibleLeads.length <= 1) return
  const currentPosition = Math.max(0, visibleLeads.findIndex(({ id }) => id === state.selectedLeadId))
  const next = visibleLeads[(currentPosition + 1) % visibleLeads.length]
  state.selectedIndex = next.index
  state.selectedLeadId = next.id
  renderAll()
  focusLeadDetail({ block: 'start' })
}

function workflowPanel(lead) {
  const workflow = { status: 'new', queue: leadWorkQueue(lead), owner: currentOwner(), contacted: false, channel: '', response: '', personReached: '', notes: '', followUpDate: '', nextFollowUpAt: '', lastContactedAt: '', nextAction: 'review', outcome: '', archivedAt: '', activities: [], ...(lead.workflow || {}) }
  const currentQueue = leadWorkQueue({ ...lead, workflow })
  workflow.queue = currentQueue
  workflow.nextFollowUpAt = workflow.nextFollowUpAt || workflow.followUpDate || ''
  const queueGuidance = queueGuidanceNote({ ...lead, workflow })
  const phone = lead.contact?.phone || lead.phone || ''
  const callHref = phoneHref(phone)
  const savedText = workflow.updatedAt ? `Saved ${escapeHtml(workflow.updatedAt)}` : 'Not saved yet'
  const lastContacted = workflow.lastContactedAt ? formatActivityTime(workflow.lastContactedAt) : 'Not contacted yet'
  const nextFollowUp = workflow.nextFollowUpAt || workflow.followUpDate || 'Not set'
  return `<section class="workflow-panel compact-workflow-panel seller-next-panel">
    <div class="workflow-head compact-workflow-head">
      <div>
        <p class="eyebrow">Lead workflow</p>
        <h3>Outcome and next action</h3>
      </div>
      <div class="workflow-head-actions">
        ${badge(currentQueue)}
        ${badge(workflow.status || 'new')}
        ${callHref ? '<a class="call-now compact-call" href="' + escapeAttr(callHref) + '">Call now</a>' : ''}
      </div>
    </div>
    <div class="workflow-state-strip seller-next-state">
      ${commandMetric('Current queue', workQueueLabel(currentQueue), workQueueReason({ ...lead, workflow }, currentQueue))}
      ${commandMetric('Last contacted', lastContacted, workflow.response ? readable(workflow.response) : 'No latest outcome yet')}
      ${commandMetric('Next follow-up', nextFollowUp, followUpTiming(workflow.nextFollowUpAt || workflow.followUpDate) === 'overdue' ? 'Overdue follow-up' : 'Date controls follow-up queue')}
    </div>
    ${queueGuidance}
    <form id="workflowForm" class="workflow-form compact-workflow-form seller-next-form">
      <input type="hidden" name="queue" value="${escapeAttr(currentQueue)}">
      <input type="hidden" name="status" value="${escapeAttr(workflow.status || 'new')}">
      <label><span>Outcome</span><select name="response">${workflowOptions(['', 'no_answer', 'no_response', 'negative', 'neutral', 'interested', 'meeting_booked'], workflow.response)}</select></label>
      <label><span>Follow-up date</span><input type="date" name="followUpDate" value="${escapeAttr(workflow.followUpDate || workflow.nextFollowUpAt || '')}"></label>
      <label class="workflow-next-action"><span>Next action</span><input name="nextAction" value="${escapeAttr(workflow.nextAction || '')}" placeholder="call again / book meeting / send info"></label>
      <label class="workflow-notes compact-notes"><span>Note</span><textarea name="notes" rows="3" placeholder="Short call note">${escapeHtml(formatWorkflowNotes(workflow.notes || ''))}</textarea></label>
      <input type="hidden" name="contacted" value="${escapeAttr(String(Boolean(workflow.contacted)))}">
      <input type="hidden" name="channel" value="${escapeAttr(workflow.channel || '')}">
      <input type="hidden" name="personReached" value="${escapeAttr(workflow.personReached || '')}">
      <input type="hidden" name="outcome" value="${escapeAttr(workflow.outcome || '')}">
      <input type="hidden" name="owner" value="${escapeAttr(workflow.owner || '')}">
      <input type="hidden" name="lastContactedAt" value="${escapeAttr(workflow.lastContactedAt || '')}">
      <input type="hidden" name="archivedAt" value="${escapeAttr(workflow.archivedAt || '')}">
      <div class="workflow-actions compact-save"><small>${savedText}</small><button type="submit" data-save-note>Save note</button><button type="button" class="secondary-action" data-archive-lead>Archive</button></div>
      <details class="workflow-more">
        <summary>More logging fields</summary>
        <div class="workflow-form workflow-form-more">
          <label><span>Queue</span><select name="queueMore" data-workflow-sync="queue">${workflowQueueOptions(currentQueue)}</select></label>
          <label><span>Status</span><select name="statusMore" data-workflow-sync="status">${workflowOptions(['new', 'reviewed', 'contacted', 'follow_up', 'interested', 'rejected'], workflow.status)}</select></label>
          <label><span>Owner</span><input name="ownerMore" data-workflow-sync="owner" value="${escapeAttr(workflow.owner || '')}" placeholder="Seller / team"></label>
          <label><span>Contacted</span><select name="contactedMore" data-workflow-sync="contacted">${workflowOptions(['false', 'true'], String(Boolean(workflow.contacted)))}</select></label>
          <label><span>Channel</span><select name="channelMore" data-workflow-sync="channel">${workflowOptions(['', 'phone', 'email', 'contact_form', 'linkedin', 'other'], workflow.channel)}</select></label>
          <label><span>Person reached</span><input name="personReachedMore" data-workflow-sync="personReached" value="${escapeAttr(workflow.personReached || '')}" placeholder="Name / role"></label>
          <label><span>Outcome detail</span><input name="outcomeMore" data-workflow-sync="outcome" value="${escapeAttr(workflow.outcome || '')}" placeholder="pending / not relevant / meeting"></label>
        </div>
      </details>
      ${workflowTimeline(workflow)}
    </form>
  </section>`
}

function workflowTimeline(workflow = {}) {
  const activities = Array.isArray(workflow.activities) ? workflow.activities.slice(0, 8) : []
  return `<section class="activity-timeline"><div class="activity-timeline-head"><h4>Logged activity</h4><span>${activities.length ? (activities.length + ' latest') : 'No saved log yet'}</span></div>${activities.length ? `<ol>${activities.map((activity) => `
    <li><div><strong>${escapeHtml(readable(activity.status || 'new'))}</strong><span>${escapeHtml(formatActivityTime(activity.at))}</span></div><p>${escapeHtml(activitySummary(activity))}</p></li>`).join('')}</ol>` : '<p class="muted">Save a note or use a quick action to create the first log entry.</p>'}</section>`
}

function formatActivityTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function activitySummary(activity = {}) {
  return [
    activity.type ? `Type: ${readable(activity.type)}` : '',
    activity.toQueue ? `Queue: ${workQueueLabel(activity.toQueue)}` : activity.queue ? `Queue: ${workQueueLabel(activity.queue)}` : '',
    activity.channel ? `Channel: ${readable(activity.channel)}` : '',
    activity.response ? `Response: ${readable(activity.response)}` : '',
    activity.personReached ? `Person: ${activity.personReached}` : '',
    activity.followUpDate ? `Follow-up: ${activity.followUpDate}` : '',
    activity.nextAction ? `Next: ${activity.nextAction}` : '',
    cleanWorkflowNote(activity.notes) ? `Note: ${cleanWorkflowNote(activity.notes)}` : '',
  ].filter(Boolean).join(' · ') || 'Lead note saved.'
}

function workflowOptions(values, selected) {
  return values.map((value) => `<option value="${escapeAttr(value)}" ${String(value) === String(selected || '') ? 'selected' : ''}>${escapeHtml(value ? readable(value) : 'Not set')}</option>`).join('')
}

function workflowQueueOptions(selected) {
  return WORK_QUEUES.map((queue) => `<option value="${escapeAttr(queue.id)}" ${queue.id === selected ? 'selected' : ''}>${escapeHtml(queue.label)}</option>`).join('')
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
  const formElement = event.currentTarget
  if (!formElement || formElement.dataset.saving === 'true') return
  formElement.dataset.saving = 'true'
  const saveButton = formElement.querySelector('[data-save-note]')
  const saveText = formElement.querySelector('.workflow-actions small')
  const originalButtonText = saveButton ? saveButton.textContent : ''
  if (saveButton) {
    saveButton.disabled = true
    saveButton.textContent = 'Saving...'
  }
  if (saveText) saveText.textContent = 'Saving note...'
  formElement.querySelectorAll('[data-workflow-sync]').forEach((field) => {
    const target = formElement.elements[field.dataset.workflowSync]
    if (target) target.value = field.value
  })
  try {
    const lead = state.result?.leadPacks?.[state.selectedIndex]
    if (!lead) throw new Error('No selected lead to save')
    const form = new FormData(formElement)
    const status = form.get('status')
    const workflow = {
      status,
      contacted: form.get('contacted') === 'true' || ['contacted', 'follow_up', 'interested', 'rejected'].includes(status),
      channel: form.get('channel'),
      response: form.get('response'),
      personReached: form.get('personReached'),
      followUpDate: form.get('followUpDate'),
      nextAction: form.get('nextAction'),
      outcome: form.get('outcome'),
      queue: form.get('queue'),
      owner: currentOwner() || form.get('owner'),
      lastContactedAt: form.get('lastContactedAt'),
      nextFollowUpAt: form.get('followUpDate'),
      archivedAt: form.get('archivedAt'),
      notes: form.get('notes'),
    }
    applyWorkflowDefaults(workflow)
    setStatus('saving note...', 'running')
    const response = await apiFetch('/api/workflow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.workflow?.leadId || leadId(lead, state.selectedIndex),
        runId: state.result?.runId,
        leadName: lead.company?.displayName || lead.companyName || '',
        workflow: { ...workflow, owner: currentOwner() || workflow.owner || '' },
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Note save failed')
    lead.workflow = payload.workflow
    await refreshCommandCenter()
    if (saveText) saveText.textContent = 'Saved now'
    setStatus('note saved', '')
    renderAll()
  } catch (error) {
    const message = noteSaveErrorMessage(error)
    if (saveText) saveText.textContent = message
    setStatus('failed: ' + message, 'failed')
  } finally {
    formElement.dataset.saving = ''
    if (saveButton) {
      saveButton.disabled = false
      saveButton.textContent = originalButtonText || 'Save note'
    }
  }
}

function applyWorkflowDefaults(workflow) {
  const response = String(workflow.response || '').toLowerCase()
  const status = String(workflow.status || '').toLowerCase()
  const now = new Date().toISOString()
  const needsNoAnswerFollowUp = response === 'no_answer' || response === 'no_response' || status === 'follow_up'
  const needsInterestedFollowUp = response === 'interested' || response === 'meeting_booked' || status === 'interested'
  if (!workflow.owner) workflow.owner = currentOwner()
  if ((needsNoAnswerFollowUp || needsInterestedFollowUp) && !workflow.followUpDate) {
    workflow.followUpDate = isoDateOffset(1)
  }
  if (needsNoAnswerFollowUp) {
    workflow.status = 'follow_up'
    workflow.queue = 'no_answer'
    workflow.contacted = true
    workflow.channel = workflow.channel || 'phone'
    workflow.lastContactedAt = workflow.lastContactedAt || now
  }
  if (needsInterestedFollowUp) {
    workflow.status = 'interested'
    workflow.queue = 'interested'
    workflow.contacted = true
    workflow.channel = workflow.channel || 'phone'
    workflow.lastContactedAt = workflow.lastContactedAt || now
  }
  if (workflow.followUpDate) workflow.nextFollowUpAt = workflow.followUpDate
  if (needsNoAnswerFollowUp && (!workflow.nextAction || workflow.nextAction === 'review')) workflow.nextAction = 'call again'
  if (needsInterestedFollowUp && (!workflow.nextAction || workflow.nextAction === 'review')) workflow.nextAction = 'follow up interested lead'
  return workflow
}

function noteSaveErrorMessage(error) {
  const detail = error && error.message ? String(error.message) : 'Note save failed'
  if (/fetch|network|load failed/i.test(detail)) return 'Could not save - local server is not running. Restart it and try again.'
  return 'Could not save - ' + detail
}

function modeGuidance(summary) {
  const mode = summary.mode || els.runMode.value || 'fast'
  if (!summary || Object.keys(summary).length === 0) {
    return mode === 'deep' ? 'Verify & Enrich adds selected-lead proof modules.' : 'Fast scan finds candidates; verify and enrich only the leads that need more context.'
  }
  const included = Number(summary.includedLeadCount ?? summary.totalLeads ?? 0)
  if (mode === 'fast' && included > 0) return 'These are candidates. Use Verify & Enrich only on leads that need more context.'
  return summary.nextRecommendedAction || 'These leads include enrichment signals.'
}

function fastBadge(lead) {
  return isFastLead(lead) ? '<span class="badge audit-skipped">Fast scan</span>' : ''
}

function isFastLead(lead) {
  return lead?.meta?.mode === 'fast' || lead?.website?.auditStatus === 'skipped_fast_mode' || lead?.leadClass === 'fast_discovery'
}

function enrichmentTool(lead) {
  if (isHostedContextRefresh(lead)) return `<section class="detail-tool detail-tool-status"><strong>Hosted Verify & Enrich</strong><span>Light company/contact/source refresh. Full local audit not run.</span></section>`
  if (!isFastLead(lead)) return `<section class="detail-tool detail-tool-status"><strong>Verified & enriched</strong><span>Selected-lead verification has run. Digital presence is one secondary module.</span></section>`
  return `<section class="detail-tool enrichment-tool">
    <div><strong>Need stronger proof?</strong><span>Keep it fast unless this lead is worth a focused identity, contact and source check.</span></div>
    <button type="button" id="runDeepQualification">Verify & Enrich</button>
  </section>`
}


function isHostedContextRefresh(lead = {}) {
  return lead.enrichment?.enrichmentMode === 'hosted_context_refresh' || lead.meta?.enrichmentMode === 'hosted_context_refresh'
}

function deepEnrichmentModules(lead, command) {
  const company = lead.company || {}
  const website = lead.website || {}
  const economy = lead.economy || {}
  const liveModules = Array.isArray(lead.enrichmentModules) && lead.enrichmentModules.length
    ? lead.enrichmentModules
    : Array.isArray(lead.enrichment?.modules) ? lead.enrichment.modules : []
  const modules = liveModules.length ? liveModules : [
    { name: 'Digital presence check', status: isFastLead(lead) ? 'not_run' : (website.auditStatus || 'completed'), summary: isFastLead(lead) ? 'Run enrichment to check digital presence.' : 'Digital presence signals are attached.' },
    { name: 'Brreg verification', status: company.organizationNumber ? 'completed' : company.candidateOrganizationNumber ? 'manual_verify' : brregStatusLabel(company), summary: company.organizationNumber ? 'Official identity is confirmed.' : company.candidateOrganizationNumber ? 'Candidate identity needs manual verify.' : 'Not confirmed in fast search; Verify & Enrich retries Brreg for this company.' },
    { name: 'Economy / Proff', status: economy.status || 'not_enabled', summary: economyModuleSummary(economy) },
    { name: 'Social/source signals', status: 'not_enabled', summary: 'Later module: Facebook, LinkedIn, news and public source links.' },
    { name: 'Decision makers', status: 'not_enabled', summary: 'Later module: public role/contact hints when available.' },
    { name: 'Recent activity', status: 'not_enabled', summary: 'Later module: hiring, news, website updates and public activity.' },
    { name: 'Seller fit summary', status: command.sellerReadinessKey === 'weak' ? 'manual_verify' : 'completed', summary: 'Uses seller intent plus contact, company, location and source signals.' },
    { name: 'OSINT public evidence', status: lead.osint ? 'completed' : 'not_run', summary: lead.osint ? osintSummaryText(lead.osint) : 'Runs on selected-lead enrichment from public business evidence.' },
  ]
  return `<details class="detail-tool enrichment-modules">
    <summary>Enrichment modules</summary>
    <div class="module-grid">
      ${modules.map((module) => `<div class="module-card"><div>${badge(module.status)}<strong>${escapeHtml(module.name)}</strong></div><small>${escapeHtml(module.summary || module.note || '')}</small></div>`).join('')}
    </div>
  </details>`
}

function osintPanel(lead) {
  const osint = lead.osint || null
  if (!osint) return ''
  const summary = osint.summary || {}
  const groups = [
    ['Company identity', osint.companyIdentity],
    ['Contactability', osint.contactability],
    ['Digital presence', osint.digitalPresence],
    ['Market proof', osint.marketProof],
    ['Recent activity', osint.recentActivity],
    ['Risk / verify', osint.riskVerify],
  ]
  return '<details class="detail-collapse osint-panel" open>' +
    '<summary>OSINT public evidence</summary>' +
    '<section class="osint-summary">' +
      commandMetric('Evidence', String(summary.evidenceCount || 0), 'Public business signals found') +
      commandMetric('Risks', String(summary.riskCount || 0), 'Checks before seller use') +
      commandMetric('Sources', String(summary.sourceCount || 0), 'Public source references') +
    '</section>' +
    '<div class="source-grid osint-grid">' +
      groups.map(([title, items]) => osintGroupCard(title, items)).join('') +
      sourceCard('OSINT sources', osint.status || 'completed', [
        ['Mode', readable(osint.mode || 'selected_lead')],
        ['Observed', osint.observedAt || 'unknown'],
        ['Top signal', (summary.topSignals || [])[0] || 'none'],
        ['Top risk', (summary.topRisks || [])[0] || 'none'],
      ]) +
    '</div>' +
  '</details>'
}

function osintGroupCard(title, items) {
  const list = Array.isArray(items) ? items.slice(0, 4) : []
  const rows = list.length
    ? list.map((item) => [item.label || 'Signal', osintSignalText(item)])
    : [['Status', 'No public evidence recorded yet']]
  const status = title.toLowerCase().includes('risk') && list.length ? 'verify' : list.length ? 'completed' : 'not_run'
  return sourceCard(title, status, rows)
}

function osintSignalText(item = {}) {
  const value = item.value || 'unknown'
  const source = item.source && item.source.name ? item.source.name : 'public source'
  return value + ' (' + (item.confidence || 'medium') + ' confidence, ' + source + ')'
}

function osintSummaryText(osint = {}) {
  const summary = osint.summary || {}
  return String(summary.evidenceCount || 0) + ' evidence signals, ' + String(summary.riskCount || 0) + ' checks, ' + String(summary.sourceCount || 0) + ' sources.'
}

function economyModuleSummary(economy = {}) {
  if (economy.status === 'success') return 'Proff economy fields are attached for confirmed org.nr.'
  if (economy.status === 'disabled') return 'Set PROFF_API_KEY to enable Proff enrichment.'
  if (economy.status === 'not_eligible') return 'Skipped because org.nr is not confirmed.'
  if (economy.status === 'error') return 'Proff lookup failed; retry later.'
  return 'Requires confirmed org.nr and Proff integration.'
}

function sellerCommandCard(command) {
  return `<section class="command-card">
    <div class="command-main compact-command-main">
      <div>
        <p class="eyebrow">Call brief</p>
        <h3>${escapeHtml(command.nextAction)}</h3>
        <p>${escapeHtml(command.summary)}</p>
      </div>
    </div>
    <div class="command-grid compact-command-grid">
      ${commandMetric('Best first contact', command.bestContact, command.bestContactNote)}
      ${commandMetric('Business type', command.businessType, command.businessTypeNote)}
      ${commandMetric('Company identity', command.verification, command.verificationNote)}
      ${commandMetric('Check before use', command.mainRisk, command.mainRiskNote)}
    </div>
  </section>`
}

function commandMetric(label, value, note) {
  return `<div class="command-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`
}

function sellerDeskCards(lead, command, options = {}) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const website = lead.website || {}
  const sourceQuality = lead.sourceQuality || {}
  const discoveryQuality = sourceQuality.discoveryQuality || {}
  const economy = lead.economy || {}
  const fit = lead.sellerFit || {}
  const fusion = sourceFusionForLead(lead)
  const fusionSummary = sourceFusionUiSummary(fusion)
  const fitReasonText = normalizeList(fit.fitReasons).slice(0, 3).map(humanize).join(', ') || command.companyFitNote
  const riskReasonText = normalizeList(fit.riskReasons).slice(0, 3).map(humanize).join(', ') || command.mainRiskNote
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
  const fitRows = [
    ['Seller fit', command.sellerReadiness],
    ['Intent', sellerIntentLabel(fit.sellerIntent || state.result?.summary?.sellerIntent)],
    ['Recommended action', command.nextAction],
    ['Why', fitReasonText],
  ]
  const actionRows = [
    ['Important signals', normalizeList(fit.importantSignals).slice(0, 2).map(humanize).join(', ') || command.nextActionNote],
    ['Digital presence', command.websiteOpportunity],
    ['Source confidence', command.sourceConfidence],
    ['Next action', command.nextAction],
  ]
  const qualificationRows = [
    ['Mode', isFastLead(lead) ? 'Fast candidate' : 'Verified/enriched'],
    ['Fit', command.sellerReadiness],
    ['Digital presence', command.websiteOpportunity],
    ['Main risk', command.mainRisk],
    ['Source confidence', command.sourceConfidence],
  ]
  const riskRows = [
    ['Verification', command.verification],
    ['Risk reasons', riskReasonText],
    ['Warnings', normalizeList(company.warnings).map(humanize).join(', ') || 'none'],
    ['Economy', readable(economy.status || 'not_enabled')],
    ['Export state', company.organizationNumber ? 'identity ready' : company.candidateOrganizationNumber ? 'verify candidate org.nr' : 'identity not confirmed'],
  ]
  const proofRiskRows = [
    ['Google', formatRating(places)],
    ['Location', readable(sourceQuality.locationMatchStatus || 'unknown')],
    ['Verification', command.verification],
    ['Main check', command.mainRisk],
  ]
  const confidenceRows = [
    ['Lead confidence', leadConfidenceLabel(fusion.leadConfidence)],
    ['Trust action', trustActionLabel(fusion.recommendedTrustAction)],
    ['Identity', identityConfidenceLabel(fusion.identityConfidence)],
    ['Contact', contactConfidenceLabel(fusion.contactConfidence)],
    ['Location', locationConfidenceLabel(fusion.locationConfidence)],
  ]
  const sourceCoverageRows = [
    ['Source coverage', fusionSummary.coverage || 'none'],
    ['Verified fields', fusionSummary.verified || 'none'],
    ['Proof', fusionSummary.proof || 'none'],
    ['Risk', fusionSummary.risk || 'none'],
    ['Warnings', fusionSummary.warnings || 'none'],
  ]

  const topCards = `<section class="seller-desk-v2 lead-brief-grid">
    ${sellerDeskCard('Contact', contact.phone ? 'phone_available' : 'contact_missing', contactRows, command.bestContactNote)}
    ${sellerDeskCard('Company', orgStatus, identityRows, brregPublicLink(company))}
    ${sellerDeskCard('Proof & checks', command.verification === 'Confirmed org.nr' ? 'confirmed_org' : sourceQuality.locationMatchStatus || command.sellerReadinessKey, proofRiskRows, command.mainRiskNote)}
    ${sellerDeskCard('Proof & confidence', fusion.recommendedTrustAction || fusion.leadConfidence, confidenceRows, sourceFusionFooter(fusion))}
  </section>`
  const details = `<details class="detail-collapse lead-brief-details">
    <summary>Qualification and verification details</summary>
    <div class="seller-desk-v2 secondary-brief-grid">
      ${sellerDeskCard('Company fit', command.sellerReadinessKey, fitRows, 'Seller fit interprets existing data; it does not change source truth.')}
      ${sellerDeskCard('Source coverage', fusion.leadConfidence || 'unknown', sourceCoverageRows, 'Brreg is legal identity; website/contact is one source signal.')}
      ${sellerDeskCard('Market proof', sourceQuality.locationMatchStatus || 'unknown', marketRows, places.placeId ? `Place ID: ${places.placeId}` : '')}
      ${sellerDeskCard('Sales signals', command.sellerReadinessKey, actionRows, 'No script generated; seller owns angle and wording.')}
      ${sellerDeskCard('Risk / verify', command.verification === 'Confirmed org.nr' ? 'confirmed_org' : command.sellerReadinessKey, riskRows, command.mainRiskNote)}
      ${sellerDeskCard('Qualification', isFastLead(lead) ? 'audit_skipped' : 'completed', qualificationRows, isFastLead(lead) ? 'Verify & Enrich has not run yet.' : 'Verify & Enrich modules included.')}
    </div>
  </details>`
  const includeTop = options.includeTop !== false
  const includeDetails = options.includeDetails !== false
  return [includeTop ? topCards : '', includeDetails ? details : ''].filter(Boolean).join('\n')
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

  let sellerReadinessKey = sellerScore >= 10 ? 'strong' : sellerScore >= 7 ? 'good' : sellerScore >= 4 ? 'verify' : 'weak'
  let sellerReadiness = {
    strong: 'Ready now',
    good: 'Usable contact',
    verify: 'Verify first',
    weak: 'Needs contact',
  }[sellerReadinessKey]

  const websiteOpportunity = {
    high: 'Strong digital signal',
    medium: 'Medium digital signal',
    low: 'Low digital signal',
    verify: fast ? 'Not checked yet' : 'Needs review',
  }[priority] || 'Needs review'
  const websiteOpportunityNote = fast
    ? 'Fast mode has not audited the website yet.'
    : priority === 'low'
      ? 'Digital presence did not show strong pain; this can still be a usable B2B lead.'
      : 'Digital presence signals can support the seller if relevant.'

  const bestContact = hasPhone ? (contact.phone || lead.phone) : (contact.email || lead.email || 'unknown')
  const bestContactNote = hasPhone ? 'Direct phone is available.' : contact.email ? 'Email exists, phone missing.' : 'Find a direct contact before sales work.'
  const businessType = businessActivityLabel(company) || 'Unknown activity'
  const businessTypeNote = businessType === 'Unknown activity'
    ? 'No NACE/business activity found yet.'
    : 'Registered business activity from Brreg/NACE.'

  const verification = confirmedOrg ? 'Confirmed org.nr' : candidateOrg ? 'Candidate org.nr' : brregUnavailable ? 'Identity pending' : 'Not verified'
  const verificationNote = confirmedOrg ? `${company.organizationNumber} · ${company.matchConfidence ?? 'unknown'} confidence` : candidateOrg ? 'Manual verify before export.' : brregUnavailable ? 'Brreg not confirmed in fast search; use Verify & Enrich for a focused retry.' : 'Brreg returned no confirmed identity.'

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
    mainRiskNote = contact.website ? 'Google supplied a URL; enrichment can verify whether it is real and relevant.' : 'Digital presence check and deeper enrichment are skipped.'
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
    nextAction = confirmedOrg ? 'Verify & Enrich if more context is needed' : candidateOrg ? 'Verify org.nr, then use Verify & Enrich if needed' : brregUnavailable ? 'Verify & Enrich for Brreg retry' : 'Verify & Enrich if needed'
    nextActionNote = 'Fast found a usable candidate; Verify & Enrich adds optional context modules.'
  } else if (priority === 'low' && sellerReadinessKey !== 'weak') {
    nextAction = 'Usable lead; weak digital angle'
    nextActionNote = 'Do not treat LOW digital signal as a bad business lead.'
  } else if (priority === 'high') {
    nextAction = 'Review first'
    nextActionNote = 'Enrichment evidence supports website/opportunity urgency.'
  }

  const sourceConfidence = discoveryLevel === 'unknown' ? 'Unknown' : readable(discoveryLevel)
  const sourceConfidenceNote = discoveryQuality.score == null ? 'No discovery score available.' : `Discovery score ${discoveryQuality.score}/100.`

  const fit = lead.sellerFit || null
  if (fit) {
    if (fit.sellerFit === 'strong') sellerReadiness = 'Strong fit'
    else if (fit.sellerFit === 'good') sellerReadiness = 'Good fit'
    else if (fit.sellerFit === 'review') sellerReadiness = 'Review fit'
    else sellerReadiness = 'Weak fit'
    sellerReadinessKey = fit.sellerFit === 'review' ? 'verify' : fit.sellerFit
    if (fit.recommendedAction === 'contact') nextAction = 'Contact now'
    else if (fit.recommendedAction === 'verify') nextAction = 'Verify first'
    else if (fit.recommendedAction === 'skip') nextAction = 'Skip or deprioritize'
    nextActionNote = (fit.fitReasons || []).slice(0, 2).join(' · ') || nextActionNote
  }

  const headline = fit ? `${sellerIntentLabel(fit.sellerIntent)} · ${sellerReadiness}` : verification
  const summary = buildCommandSummary({ company, contact, places, confirmedOrg, candidateOrg, exactLocation, fast, employees, priority, websiteOpportunity })

  return { headline, summary, callReadiness: sellerReadiness, readinessKey: sellerReadinessKey, sellerReadiness, sellerReadinessKey, websiteOpportunity, websiteOpportunityNote, bestContact, bestContactNote, businessType, businessTypeNote, companyFit, companyFitNote, verification, verificationNote, mainRisk, mainRiskNote, nextAction, nextActionNote, sourceConfidence, sourceConfidenceNote }
}

function sellerIntentLabel(value) {
  return {
    general_b2b: 'General B2B',
    web_it: 'Web/IT',
    ads_marketing: 'Ads/marketing',
    telecom: 'Telecom',
    accounting: 'Accounting',
    insurance: 'Insurance',
    finance: 'Finance',
    recruiting: 'Recruiting',
    other: 'Other',
  }[String(value || 'general_b2b')] || 'General B2B'
}

function buildCommandSummary({ company, contact, places, confirmedOrg, candidateOrg, exactLocation, fast, employees, priority, websiteOpportunity }) {
  const activity = businessActivityLabel(company)
  const parts = []
  if (activity) parts.push(`Registered as ${activity}`)
  if (contact.phone) parts.push(`direct phone ${contact.phone} is available`)
  if (employees != null && employees !== '' && !Number.isNaN(Number(employees))) parts.push(`${employees} employees registered`)
  if (places.rating) parts.push(`Google ${places.rating}/5${places.reviewCount != null ? ` from ${places.reviewCount} reviews` : ''}`)
  if (exactLocation) parts.push('location matches the search')
  if (confirmedOrg) parts.push(`org.nr is confirmed${company.organizationNumber ? ` (${company.organizationNumber})` : ''}`)
  else if (candidateOrg) parts.push('org.nr has a candidate match and must be verified')
  else parts.push('company identity is not verified yet')
  if (fast) parts.push(contact.website ? 'website is only a presence signal until enrichment runs' : 'enrichment has not run yet')
  else parts.push(`digital presence signal is ${websiteOpportunity || String(priority || 'unknown').toUpperCase()}`)
  return `${parts.join('; ')}.`
}

function businessActivityLabel(company = {}) {
  const nace = [company.naceCode, company.naceDescription].filter(Boolean).join(' - ')
  if (nace) return nace
  if (company.organizationForm) return readable(company.organizationForm)
  return ''
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
  if (isBrregUnavailable(company)) return 'Brreg ikke bekreftet'
  return 'not verified'
}

function companyIdNote(company = {}) {
  if (company.organizationNumber) return 'Confirmed official identity'
  if (company.candidateOrganizationNumber) return 'Candidate org.nr; verify before export'
  if (isBrregUnavailable(company)) return 'Fast search could not confirm Brreg; use Verify & Enrich for a focused retry'
  return brregStatusLabel(company)
}

function sourceStrategyStatus(company = {}, sourceQuality = {}, places = {}) {
  if (isBrregUnavailable(company)) return 'brreg_unavailable'
  return sourceQuality.identitySource || sourceQuality.presenceSource || places.provider || 'unknown'
}

function sourceStrategyLabel(company = {}, sourceQuality = {}) {
  if (isBrregUnavailable(company)) return 'Presence-first fallback; Verify & Enrich retries Brreg for this company'
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
    ['Brønnøysund', brregPublicLink(company) || 'unknown'],
  ]
  return sourceCard('Brreg firmaprofil', brregStatusLabel(company), rows)
}

function brregPublicLink(company = {}) {
  const href = brregPublicUrl(company)
  return href ? `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer" title="${escapeAttr(href)}">Åpne i Brønnøysund</a>` : ''
}

function brregPublicUrl(company = {}) {
  const orgNumber = String(company.organizationNumber || company.candidateOrganizationNumber || '').replace(/\D/g, '')
  return orgNumber ? `https://virksomhet.brreg.no/nb/oppslag/enheter/${orgNumber}` : ''
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
  else if (isBrregUnavailable(company)) signals.push('Brreg is not confirmed from the fast run; use Verify & Enrich for a focused retry.')
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
  if (text.includes('technical_trust_risk') || text.includes('technical trust')) return 'Digital trust or reliability signals may be weaker than the business itself.'
  if (text.includes('many_failed_requests') || text.includes('failed network')) return 'Digital reliability evidence exists; verify before using it as a sales point.'
  if (text.includes('accessibility') || text.includes('usability')) return 'Usability/accessibility friction may affect customer confidence.'
  if (text.includes('high_value_service') || text.includes('service_line')) return 'High-value services are present and may deserve clearer lead paths.'
  if (text.includes('local_visibility')) return 'Local visibility lead: contact and location are clear, but urgency may be lower without stronger pain.'
  if (text.includes('strong_existing_conversion_flow')) return 'Contact flow already looks strong, so urgency should not be overstated.'
  if (text.includes('contact_maturity_requires_stronger_technical_pain')) return 'Contact maturity is high; treat this as shortlist unless technical pain is clear.'
  if (text.includes('visible_technical_trust_pain')) return 'Visible technical trust evidence supports a deeper review.'
  if (text.includes('no social links')) return 'Social proof links were not detected in the digital presence check.'
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
  if (priority === 'low') return 'Usable lead; weak digital angle'
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
  const leads = result.summary?.marketSweep ? (result.leadPacks || []).slice().sort(compareLeadsByCity) : (result.leadPacks || [])
  els.exportPanel.innerHTML = `
    <p class="eyebrow">Export</p>
    <p class="muted">Run path: <code>${escapeHtml(result.outputDir)}</code></p>
    <p><a href="${escapeAttr(withBetaToken(result.downloads.csv))}">Download CSV</a> · <a href="${escapeAttr(withBetaToken(result.downloads.json))}">Download JSON</a> · <button type="button" id="copyPath">Copy run path</button></p>
    ${callListLinks(result.downloads || {})}
    <table>
      <thead><tr><th>rank</th><th>company</th><th>phone</th><th>city</th><th>queue</th><th>priority</th><th>confidence</th><th>osint</th><th>workflow</th><th>response</th><th>follow-up</th><th>last contacted</th><th>next action</th></tr></thead>
      <tbody>${leads.map((lead, index) => { const workflow = lead.workflow || {}; return `<tr><td>${index + 1}</td><td>${escapeHtml(lead.company?.displayName || lead.companyName || '')}</td><td>${phoneLink(lead.contact?.phone || lead.phone || '')}</td><td>${escapeHtml(lead.contact?.city || lead.city || '')}</td><td>${escapeHtml(workQueueLabel(leadWorkQueue(lead)))}</td><td>${escapeHtml(lead.callPriority || lead.priority || '')}</td><td>${escapeHtml(sourceFusionExportCell(lead))}</td><td>${escapeHtml(osintExportCell(lead))}</td><td>${escapeHtml(readable(workflow.status || 'new'))}</td><td>${escapeHtml(readable(workflow.response || ''))}</td><td>${escapeHtml(workflow.nextFollowUpAt || workflow.followUpDate || '')}</td><td>${escapeHtml(workflow.lastContactedAt || '')}</td><td>${escapeHtml(workflow.nextAction || '')}</td></tr>` }).join('')}</tbody>
    </table>
  `
  const copy = document.getElementById('copyPath')
  copy?.addEventListener('click', () => navigator.clipboard?.writeText(result.outputDir))
}

document.addEventListener('submit', (event) => {
  if (event.target && event.target.id === 'workflowForm') saveWorkflow(event)
})

document.addEventListener('click', (event) => {
  const saveNoteButton = event.target.closest('[data-save-note]')
  if (saveNoteButton) {
    const form = saveNoteButton.closest('#workflowForm')
    if (form) {
      event.preventDefault()
      saveWorkflow({ preventDefault() {}, currentTarget: form })
    }
    return
  }
  const archiveLeadButton = event.target.closest('[data-archive-lead]')
  if (archiveLeadButton) {
    const form = archiveLeadButton.closest('#workflowForm')
    if (form) {
      event.preventDefault()
      const workflow = buildQuickWorkflow('archive', readWorkflowDraft(form, state.result?.leadPacks?.[state.selectedIndex]?.workflow || {}))
      setWorkflowFormValues(form, workflow)
      saveWorkflow({ preventDefault() {}, currentTarget: form })
    }
    return
  }
  const quickActionButton = event.target.closest('[data-workflow-action]')
  if (quickActionButton) {
    if (!quickActionButton.closest('.queue-row')) {
      applyWorkflowQuickActionDraft(quickActionButton)
      return
    }
    runWorkflowQuickAction(quickActionButton)
    return
  }
  const nextVisibleButton = event.target.closest('[data-next-visible-lead]')
  if (nextVisibleButton) {
    selectNextVisibleLead()
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
  workflow.owner = currentOwner() || workflow.owner || ''
  const advanceQueue = Boolean(button.closest('.queue-row'))
  state.selectedIndex = index
  state.selectedLeadId = leadId(lead, index)
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Saving...'
  setStatus(`saving note: ${originalText}`, 'running')
  try {
    const response = await apiFetch('/api/workflow', {
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
    await refreshCommandCenter()
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

function applyWorkflowQuickActionDraft(button) {
  const form = document.getElementById('workflowForm')
  const index = Number(button.dataset.index ?? state.selectedIndex)
  const lead = state.result?.leadPacks?.[index]
  if (!form || !lead) return setStatus('failed: no selected lead for note draft', 'failed')
  const workflow = buildQuickWorkflow(button.dataset.workflowAction, readWorkflowDraft(form, lead.workflow || {}))
  if (!workflow) return setStatus('failed: unknown quick action', 'failed')
  setWorkflowFormValues(form, workflow)
  const saveText = form.querySelector('.workflow-actions small')
  if (saveText) saveText.textContent = 'Draft only - click Save note to log it'
  setStatus('note draft updated - click Save note to log it', 'running')
}

function readWorkflowDraft(form, current = {}) {
  const data = new FormData(form)
  return {
    status: data.get('status') || current.status || 'new',
    contacted: String(data.get('contacted') ?? current.contacted ?? 'false') === 'true',
    channel: data.get('channel') || current.channel || '',
    response: data.get('response') || current.response || '',
    personReached: data.get('personReached') || current.personReached || '',
    notes: data.get('notes') || current.notes || '',
    followUpDate: data.get('followUpDate') || current.followUpDate || '',
    nextAction: data.get('nextAction') || current.nextAction || 'review',
    outcome: data.get('outcome') || current.outcome || '',
    queue: data.get('queue') || current.queue || '',
    owner: currentOwner() || data.get('owner') || current.owner || '',
    nextFollowUpAt: data.get('followUpDate') || current.nextFollowUpAt || current.followUpDate || '',
    lastContactedAt: data.get('lastContactedAt') || current.lastContactedAt || '',
    archivedAt: data.get('archivedAt') || current.archivedAt || '',
  }
}

function setWorkflowFormValues(form, workflow = {}) {
  setFormValue(form, 'status', workflow.status || 'new')
  setFormValue(form, 'queue', normalizeWorkQueue(workflow.queue) || 'call_now')
  setFormValue(form, 'response', workflow.response || '')
  setFormValue(form, 'followUpDate', workflow.followUpDate || workflow.nextFollowUpAt || '')
  setFormValue(form, 'notes', formatWorkflowNotes(workflow.notes || ''))
  setFormValue(form, 'contacted', String(Boolean(workflow.contacted)))
  setFormValue(form, 'channel', workflow.channel || '')
  setFormValue(form, 'personReached', workflow.personReached || '')
  setFormValue(form, 'nextAction', workflow.nextAction || '')
  setFormValue(form, 'outcome', workflow.outcome || '')
  setFormValue(form, 'owner', workflow.owner || '')
  setFormValue(form, 'lastContactedAt', workflow.lastContactedAt || '')
  setFormValue(form, 'archivedAt', workflow.archivedAt || '')
  form.querySelectorAll('[data-workflow-sync]').forEach((field) => {
    const value = workflow[field.dataset.workflowSync]
    if (value !== undefined) field.value = String(value)
  })
}

function setFormValue(form, name, value) {
  const field = form.elements[name]
  if (field) field.value = String(value)
}

function selectNextQueueLead(previousLead) {
  const leads = state.result?.leadPacks || []
  const previousId = leadId(previousLead, state.selectedIndex)
  const next = workQueueLeads(leads, state.selectedQueue).find(({ lead, index }) => leadId(lead, index) !== previousId)
  if (!next) return
  state.selectedIndex = next.index
  state.selectedLeadId = leadId(next.lead, next.index)
}

function buildQuickWorkflow(action, current = {}) {
  const base = { status: 'new', queue: '', owner: currentOwner(), contacted: false, channel: '', response: '', personReached: '', notes: '', followUpDate: '', nextFollowUpAt: '', lastContactedAt: '', nextAction: 'review', outcome: '', archivedAt: '', ...current }
  base.owner = currentOwner() || base.owner || ''
  const now = new Date().toISOString()
  const tomorrow = isoDateOffset(1)
  const nextWeek = isoDateOffset(7)
  if (action === 'mark_called') return { ...base, status: 'contacted', queue: 'archived', contacted: true, lastContactedAt: base.lastContactedAt || now, channel: base.channel || 'phone', response: base.response || 'neutral', followUpDate: '', nextFollowUpAt: '', nextAction: 'done' }
  if (action === 'no_answer') return { ...base, status: 'follow_up', queue: 'no_answer', contacted: true, lastContactedAt: base.lastContactedAt || now, channel: base.channel || 'phone', response: 'no_answer', followUpDate: tomorrow, nextFollowUpAt: tomorrow, nextAction: 'call again' }
  if (action === 'interested') return { ...base, status: 'interested', queue: 'interested', contacted: true, lastContactedAt: base.lastContactedAt || now, channel: base.channel || 'phone', response: 'interested', followUpDate: tomorrow, nextFollowUpAt: tomorrow, nextAction: base.nextAction && base.nextAction !== 'review' ? base.nextAction : 'follow up interested lead', outcome: base.outcome || 'interested' }
  if (action === 'not_relevant') return { ...base, status: 'rejected', queue: 'not_relevant', contacted: true, lastContactedAt: base.lastContactedAt || now, channel: base.channel || 'phone', response: 'negative', followUpDate: '', nextFollowUpAt: '', nextAction: 'do not contact', outcome: 'not relevant' }
  if (action === 'follow_up_tomorrow') return { ...base, status: 'follow_up', queue: base.queue === 'interested' ? 'interested' : 'no_answer', followUpDate: tomorrow, nextFollowUpAt: tomorrow, nextAction: 'follow up tomorrow' }
  if (action === 'follow_up_next_week') return { ...base, status: 'follow_up', queue: base.queue === 'interested' ? 'interested' : 'no_answer', followUpDate: nextWeek, nextFollowUpAt: nextWeek, nextAction: 'follow up next week' }
  if (action === 'archive') return { ...base, queue: 'archived', archivedAt: base.archivedAt || now, nextAction: 'archived' }
  return null
}

function cleanWorkflowNote(notes) {
  return String(notes || '')
    .replace(/\.\s*(?=Quick action:)/g, '.\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !line.toLowerCase().startsWith('quick action:'))
    .join('\n')
}

function formatWorkflowNotes(notes) {
  return cleanWorkflowNote(notes)
}
function isoDateOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + Number(days || 0))
  return date.toISOString().slice(0, 10)
}

async function runSelectedDeepQualification(button) {
  const lead = state.result?.leadPacks?.[state.selectedIndex]
  if (!lead) return setStatus('failed: no selected lead to qualify', 'failed')
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Verifying...'
  setStatus(`running: Verify & Enrich for ${lead.company?.displayName || 'selected lead'}`, 'running')
  try {
    const response = await apiFetch('/api/deep-qualify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: state.result?.parsedQuery?.normalizedQuery || els.query.value.trim(),
        lead,
        sellerIntent: els.sellerIntent?.value || state.result?.summary?.sellerIntent || 'general_b2b',
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
    setStatus('completed: selected lead verified and enriched', '')
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

function sourceFusionForLead(lead = {}) {
  if (lead.sourceFusion && typeof lead.sourceFusion === 'object') return lead.sourceFusion
  const company = lead.company || {}
  const contact = lead.contact || {}
  const sourceQuality = lead.sourceQuality || {}
  const hasPhone = Boolean(contact.phone || lead.phone)
  const hasEmail = Boolean(contact.email || lead.email)
  const hasWebsite = Boolean(contact.website || lead.website)
  const identityConfidence = company.organizationNumber ? 'confirmed' : company.candidateOrganizationNumber || ['manual_verify', 'weak_match'].includes(String(company.matchStatus || '').toLowerCase()) ? 'manual_verify' : 'unknown'
  const contactConfidence = hasPhone && (hasEmail || hasWebsite) ? 'strong' : hasPhone ? 'good' : hasEmail || hasWebsite ? 'review' : 'weak'
  const locationConfidence = sourceQuality.locationMatchStatus === 'exact_location' ? 'exact' : sourceQuality.locationMatchStatus === 'regional_fallback' ? 'fallback' : sourceQuality.locationMatchStatus === 'out_of_area' ? 'conflict' : 'unknown'
  const sellerFit = String(lead.sellerFit?.sellerFit || 'unknown').toLowerCase()
  const recommendedTrustAction = contactConfidence === 'weak' ? 'skip' : identityConfidence === 'manual_verify' || ['fallback', 'conflict', 'unknown'].includes(locationConfidence) ? 'verify_first' : ['strong', 'good'].includes(sellerFit) ? 'call' : 'review'
  return {
    leadConfidence: recommendedTrustAction === 'call' ? 'good' : recommendedTrustAction === 'skip' ? 'weak' : 'review',
    identityConfidence,
    contactConfidence,
    locationConfidence,
    sellerFit,
    recommendedTrustAction,
    sourceCoverage: [],
    verifiedFields: { phone: hasPhone, email: hasEmail, website: hasWebsite, address: Boolean(contact.address || lead.address || company.registeredAddress), organizationNumber: identityConfidence === 'confirmed', location: ['exact'].includes(locationConfidence) },
    proofReasons: [],
    riskReasons: [],
    conflicts: [],
    warnings: [],
  }
}

function sourceFusionBadge(lead) {
  const fusion = sourceFusionForLead(lead)
  const action = fusion.recommendedTrustAction || fusion.leadConfidence || 'unknown'
  return '<span class="badge ' + escapeAttr(String(action).toLowerCase()) + '">' + escapeHtml(trustActionLabel(action)) + '</span>'
}

function sourceFusionUiSummary(fusion = {}) {
  return {
    coverage: sourceCoverageLabels(fusion.sourceCoverage).join(', '),
    verified: verifiedFieldLabels(fusion.verifiedFields).join(', '),
    proof: normalizeList(fusion.proofReasons).slice(0, 2).join(' · '),
    risk: normalizeList(fusion.riskReasons).slice(0, 2).join(' · '),
    warnings: [...normalizeList(fusion.warnings), ...normalizeList(fusion.conflicts)].slice(0, 2).join(' · '),
  }
}

function sourceFusionFooter(fusion = {}) {
  const summary = sourceFusionUiSummary(fusion)
  return summary.warnings || summary.risk || summary.proof || 'Uses existing Google, Brreg and contact signals.'
}

function sourceCoverageLabels(values = []) {
  const labels = { google_places: 'Google Places', brreg: 'Brreg', contact_data: 'Contact data', website_contact_profile: 'Website/contact profile', workflow: 'Workflow' }
  return normalizeList(values).map((value) => labels[value] || humanize(value))
}

function verifiedFieldLabels(fields = {}) {
  const labels = { phone: 'phone', email: 'email', website: 'website', address: 'address', organizationNumber: 'org.nr', location: 'location' }
  return Object.entries(fields || {}).filter(([, value]) => Boolean(value)).map(([key]) => labels[key] || humanize(key))
}

function leadConfidenceLabel(value) {
  return { strong: 'Trygg å ringe', good: 'Trygg nok', review: 'Bør vurderes', weak: 'Svak/usikker', unknown: 'Ukjent' }[String(value || '').toLowerCase()] || humanize(value)
}

function trustActionLabel(value) {
  return { call: 'Trygg å ringe', review: 'Bør vurderes', verify_first: 'Verifiser først', skip: 'Svak/usikker' }[String(value || '').toLowerCase()] || leadConfidenceLabel(value)
}

function identityConfidenceLabel(value) {
  return { confirmed: 'Confirmed company', candidate: 'Candidate org.nr', manual_verify: 'Manual verify', unknown: 'Unknown identity' }[String(value || '').toLowerCase()] || humanize(value)
}

function contactConfidenceLabel(value) {
  return { strong: 'Contact available', good: 'Phone available', review: 'Missing phone', weak: 'No contact path', unknown: 'Unknown contact' }[String(value || '').toLowerCase()] || humanize(value)
}

function locationConfidenceLabel(value) {
  return { exact: 'Exact location', nearby: 'Nearby location', fallback: 'Regional fallback', conflict: 'Location conflict', unknown: 'Unknown location' }[String(value || '').toLowerCase()] || humanize(value)
}

function sourceFusionExportCell(lead) {
  const fusion = sourceFusionForLead(lead)
  return trustActionLabel(fusion.recommendedTrustAction) + ' / ' + leadConfidenceLabel(fusion.leadConfidence)
}

function osintExportCell(lead) {
  const summary = lead.osint?.summary
  if (!summary) return ''
  return String(summary.evidenceCount || 0) + ' evidence / ' + String(summary.riskCount || 0) + ' checks'
}

function callListLinks(downloads) {
  if (!downloads.callList) return ''
  const queueLinks = WORK_QUEUES.map((queue) => '<a href="' + escapeAttr(withBetaToken(downloads.callList + '?view=' + queue.id)) + '">' + escapeHtml(queue.label) + '</a>').join(' · ')
  return `<p class="export-actions">call-list.csv includes workflowQueue and lastActivityAt. <a href="${escapeAttr(withBetaToken(downloads.callList))}">All</a> · ${queueLinks}</p>`
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

function titlePhone(value) {
  const raw = String(value || '').trim()
  const href = phoneHref(raw)
  if (!raw || raw === 'unknown' || !href) return ''
  return `<a href="${escapeAttr(href)}" class="title-phone">${escapeHtml(raw)}</a>`
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
function readable(value) { return { new: 'New lead', reviewed: 'Reviewed', contacted: 'Contacted', follow_up: 'Follow-up', interested: 'Interested', rejected: 'Rejected', no_answer: 'No answer', no_response: 'No response', negative: 'Negative', neutral: 'Neutral', meeting_booked: 'Meeting booked', phone: 'Phone', email: 'Email', contact_form: 'Contact form', linkedin: 'LinkedIn', other: 'Other', exact_location: 'Exact location', regional_fallback: 'Regional fallback', not_enabled: 'Not enabled', disabled: 'Disabled', success: 'Success', not_eligible: 'Not eligible', manual_verify: 'Manual verify', confirmed_org: 'Confirmed org.nr', candidate_org: 'Candidate org.nr', no_match: 'No match', not_run: 'Not run', brreg_unavailable: 'Brreg ikke bekreftet', phone_available: 'Phone available', contact_missing: 'Contact missing', audit_skipped: 'Fast scan', completed: 'Completed', good: 'Good', strong: 'Strong', weak: 'Weak', high: 'High', medium: 'Medium', low: 'Low', verify: 'Verify', fast: 'Fast', deep: 'Deep', mixed: 'Mixed', ready_to_call: 'Ready to call', call_now: 'Ring nå', no_answer: 'Ingen svar', verify_first: 'Må verifiseres', follow_up_today: 'Oppfølging i dag', not_relevant: 'Ikke relevant', archived: 'Arkiv', needs_contact: 'Needs contact', follow_up_due: 'Follow-up due', later: 'Later', skip: 'Skip', queue_change: 'Queue change', follow_up_set: 'Follow-up set', contact_attempt: 'Contact attempt', status_change: 'Status change', note: 'Note', call: 'Trygg å ringe', review: 'Bør vurderes', exact: 'Exact location', nearby: 'Nearby location', fallback: 'Regional fallback', conflict: 'Conflict', confirmed: 'Confirmed company', candidate: 'Candidate org.nr', unknown: 'Unknown', google_places: 'Google Places', brreg: 'Brreg', contact_data: 'Contact data', website_contact_profile: 'Website/contact profile', workflow: 'Workflow' }[value] || String(value).toUpperCase() }
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
