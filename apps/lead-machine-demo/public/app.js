

const WORK_QUEUES = [
  { id: 'call_now', label: 'Ring nå' },
  { id: 'no_answer', label: 'Ingen svar' },
  { id: 'follow_up_today', label: 'Oppfølging i dag' },
  { id: 'interested', label: 'Interessert' },
  { id: 'verify_first', label: 'Må verifiseres' },
  { id: 'not_relevant', label: 'Nei' },
  { id: 'archived', label: 'Arkiv' },
]
const WORK_QUEUE_IDS = new Set(WORK_QUEUES.map((queue) => queue.id))

const state = { result: null, selectedIndex: 0, selectedLeadId: null, selectedQueue: 'call_now', cityFilter: '', callFocus: null, mobileMoreOpen: false, mobileNoteDrafts: {}, mobileNoteOpenLeadId: '', mobileSearchOpen: false, mobileQueueDone: null }

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
  { id: 'sale', label: 'Salg', shortLabel: 'Salg', tone: 'positive' },
  { id: 'interested', label: 'Interessert', shortLabel: 'Interessert', tone: 'positive' },
  { id: 'no_answer', label: 'Ingen svar', shortLabel: 'Ingen svar', tone: 'warning' },
  { id: 'not_relevant', label: 'Nei', shortLabel: 'Nei', tone: 'negative' },
  { id: 'archive', label: 'Arkiv', tone: 'neutral' },
]


const els = {
  appHeader: document.querySelector('.app-header'),
  mobileActiveBar: document.getElementById('mobileActiveBar'),
  query: document.getElementById('queryInput'),
  provider: document.getElementById('provider'),
  runMode: document.getElementById('runMode'),
  maxResults: document.getElementById('maxResults'),
  searchScope: document.getElementById('searchScope'),
  companyProfile: document.getElementById('companyProfile'),
  runButton: document.getElementById('runButton'),
  status: document.getElementById('statusPanel'),
  cityChips: document.getElementById('cityChips'),
  callFocusOverlay: document.getElementById('callFocusOverlay'),
  commandCenter: document.getElementById('commandCenterPanel'),
  dailyCheckin: document.getElementById('dailyCheckin'),
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

initOwnerControl()
els.runButton.addEventListener('click', runSearch)
els.query.addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch() })
els.queryExamples.forEach((button) => button.addEventListener('click', () => { els.query.value = button.dataset.queryExample || ''; els.query.focus() }))
els.leadSort.addEventListener('change', () => { clearMobileQueueDone(); state.selectedLeadId = null; state.mobileNoteOpenLeadId = ''; renderAll() })
els.queuePresets.forEach((button) => button.addEventListener('click', () => applyQueuePreset(button.dataset.queuePreset)))
els.leadFilters.forEach((filter) => filter.addEventListener('change', () => { clearMobileQueueDone(); state.selectedLeadId = null; state.mobileNoteOpenLeadId = ''; renderAll() }))
els.clearLeadFilters.addEventListener('click', () => { els.leadFilters.forEach((filter) => { filter.checked = false }); clearMobileQueueDone(); state.cityFilter = ''; state.selectedLeadId = null; state.mobileNoteOpenLeadId = ''; renderAll() })
document.addEventListener('click', (event) => {
  const workQueueButton = event.target.closest('[data-work-queue]')
  if (workQueueButton) { clearMobileQueueDone(); state.mobileNoteOpenLeadId = ''; state.selectedQueue = normalizeWorkQueue(workQueueButton.dataset.workQueue) || 'call_now'; state.selectedLeadId = null; renderAll(); return }
  const cityFilterButton = event.target.closest('[data-city-filter]')
  if (cityFilterButton) { clearMobileQueueDone(); state.mobileNoteOpenLeadId = ''; state.cityFilter = cityFilterButton.dataset.cityFilter || ''; state.selectedLeadId = null; renderAll(); return }
  const commandQueueButton = event.target.closest('[data-command-queue]')
  if (commandQueueButton) { clearMobileQueueDone(); state.mobileNoteOpenLeadId = ''; state.selectedQueue = normalizeWorkQueue(commandQueueButton.dataset.commandQueue) || state.selectedQueue; state.selectedLeadId = null; renderAll(); return }
  const commandLeadButton = event.target.closest('[data-command-lead-id]')
  if (commandLeadButton) { clearMobileQueueDone(); state.mobileNoteOpenLeadId = ''; selectCommandLead(commandLeadButton.dataset.commandLeadId || ''); return }
  const mobileEditSearch = event.target.closest('[data-mobile-edit-search]')
  if (mobileEditSearch) { toggleMobileSearch(); return }
  const workspaceExport = event.target.closest('[data-workspace-export]')
  if (workspaceExport) { exportWorkspaceSnapshot(); return }
  const dailyCheckinButton = event.target.closest('[data-daily-checkin]')
  if (dailyCheckinButton) { saveDailyCheckin(); return }
  const mobileMoreToggle = event.target.closest('[data-mobile-more]')
  if (mobileMoreToggle && !event.target.closest('[data-mobile-more-menu]')) { state.mobileMoreOpen = !state.mobileMoreOpen; renderAll(); return }
  if (event.target.closest('[data-mobile-more-menu]')) state.mobileMoreOpen = false
  const cardNoteButton = event.target.closest('[data-save-card-note]')
  if (cardNoteButton) { saveCardNote(cardNoteButton); return }
  const salesAnglesButton = event.target.closest('[data-run-sales-angles]')
  if (salesAnglesButton) { runSalesAngles(salesAnglesButton); return }
})
renderCommandCenter(null)
renderDailyCheckin(null)
renderExport(null)
clearStatus()
loadLatestRun()

function currentSellerProfile() {
  return { territory: '', goodCustomer: '', disqualifiers: '' }
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

async function loadLatestRun() {
  try {
    const response = await apiFetch('/api/latest-run')
    if (response.status === 404) return
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Latest run failed')
    state.result = payload
    state.selectedIndex = 0
    state.selectedLeadId = null
    state.mobileSearchOpen = false
    state.mobileQueueDone = null
    if (payload.parsedQuery?.normalizedQuery) els.query.value = payload.parsedQuery.normalizedQuery
    if (payload.summary?.marketSweep && els.leadSort) els.leadSort.value = 'city'
    selectBestQueueForResult(payload)
    clearStatus()
    renderAll()
  } catch (error) {
    setStatus('Klar. Forrige kjøring kunne ikke lastes; kjør et nytt søk.', '')
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
  state.mobileSearchOpen = false
  state.mobileQueueDone = null
  renderMobileActiveBar(null)
  renderLeads([])
  renderDetail(null)
  renderCommandCenter(null)
  renderDailyCheckin(null)
  renderExport(null)

  try {
    const statusText = els.runMode.value === 'fast'
      ? 'kjører: raskt søk og lead-bygging'
      : 'kjører: Verifiser firma for valgt lead'
    setStatus(statusText, 'running')
    const response = await apiFetch('/api/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query,
        provider: els.provider.value,
        maxResults: Number(els.maxResults.value),
        searchScope: els.searchScope?.value || 'regional',
        sellerIntent: 'web_it',
        sellerProfile: currentSellerProfile(),
        mode: els.runMode.value,
        enrichCompanyProfile: true,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Run failed')
    state.result = payload
    state.mobileSearchOpen = false
    state.mobileQueueDone = null
    if (payload.summary?.marketSweep && els.leadSort) els.leadSort.value = 'city'
    selectBestQueueForResult(payload)
    const providerError = friendlyProviderError(payload.summary?.providerErrors)
    if (providerError && !(payload.leadPacks || []).length) setStatus(providerError, 'failed')
    else clearStatus()
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
  renderMobileActiveBar(state.result)
  const leads = state.result?.leadPacks || []
  const visibleLeads = getVisibleLeads(leads)
  syncSelectedLeadToActiveCallFocus(visibleLeads)
  if (visibleLeads.length) {
    const selectedStillVisible = visibleLeads.some(({ id }) => id === state.selectedLeadId)
    if (!state.selectedLeadId || !selectedStillVisible) state.selectedLeadId = visibleLeads[0].id
    state.selectedIndex = visibleLeads.find(({ id }) => id === state.selectedLeadId)?.index ?? 0
  } else {
    state.selectedIndex = 0
    state.selectedLeadId = null
  }
  renderCityChips(state.result)
  renderCommandCenter(state.result)
  renderDailyCheckin(state.result)
  renderWorkQueueTabs(leads)
  renderWorkflowBoard(state.result)
  renderLeads(visibleLeads)
  const showMobileQueueDone = Boolean(state.mobileQueueDone && state.mobileQueueDone.queue === state.selectedQueue)
  renderDetail(showMobileQueueDone ? null : (visibleLeads.length ? leads[state.selectedIndex] : null))
  renderExport(state.result)
  renderCallFocus()
}

function renderCityChips(result) {
  if (!els.cityChips) return
  const summary = result?.summary || {}
  if (!summary.marketSweep) { els.cityChips.innerHTML = ''; return }
  const cityEntries = Object.entries(summary.marketSweepCityCounts || {}).sort(([left], [right]) => left.localeCompare(right, 'nb'))
  const activeCity = String(state.cityFilter || '')
  const totalCityLeads = cityEntries.reduce((sum, [, count]) => sum + Number(count || 0), 0)
  const allChip = '<button type="button" class="city-chip ' + (!activeCity ? 'active' : '') + '" data-city-filter=""><strong>Alle byer</strong> ' + escapeHtml(String(totalCityLeads)) + '</button>'
  els.cityChips.innerHTML = allChip + cityEntries.map(([city, count]) => '<button type="button" class="city-chip ' + (normalizeCityName(city) === normalizeCityName(activeCity) ? 'active' : '') + '" data-city-filter="' + escapeAttr(city) + '"><strong>' + escapeHtml(city) + '</strong> ' + escapeHtml(String(count)) + '</button>').join('')
}


function renderMobileActiveBar(result) {
  const hasLeads = Boolean(result && Array.isArray(result.leadPacks) && result.leadPacks.length)
  document.body.classList.toggle('has-active-results', hasLeads)
  document.body.classList.toggle('mobile-search-open', hasLeads && state.mobileSearchOpen)
  document.body.classList.toggle('mobile-note-open', hasLeads && Boolean(state.mobileNoteOpenLeadId && state.mobileNoteOpenLeadId === state.selectedLeadId))
  document.body.classList.toggle('mobile-queue-done', hasLeads && Boolean(state.mobileQueueDone))
  els.appHeader?.classList.toggle('has-active-search', hasLeads)
  if (!els.mobileActiveBar) return
  if (!hasLeads) {
    els.mobileActiveBar.hidden = true
    els.mobileActiveBar.innerHTML = ''
    return
  }
  const query = activeSearchLabel(result)
  const queue = workQueueLabel(state.selectedQueue)
  const count = getVisibleLeads(result.leadPacks || []).length
  const sessionCount = callFocusAvailableCount()
  els.mobileActiveBar.hidden = false
  els.mobileActiveBar.innerHTML = '<div class="mobile-active-copy"><strong>Lead Machine</strong><span>' + escapeHtml(query) + '</span></div>' +
    '<div class="mobile-active-meta"><span>' + escapeHtml(queue) + ' · ' + escapeHtml(String(count)) + '</span><button type="button" class="mobile-session-start" data-start-call-focus ' + callFocusStartDisabledAttr() + '>Ringeøkt' + (sessionCount ? ' ' + escapeHtml(String(sessionCount)) : '') + '</button><button type="button" data-mobile-edit-search>' + (state.mobileSearchOpen ? 'Lukk' : 'Søk') + '</button></div>'
}

function activeSearchLabel(result = state.result) {
  return result?.parsedQuery?.normalizedQuery || result?.summary?.query || els.query?.value || 'Aktivt søk'
}

function toggleMobileSearch() {
  state.mobileSearchOpen = !state.mobileSearchOpen
  renderMobileActiveBar(state.result)
  if (state.mobileSearchOpen) {
    els.query?.focus()
    els.query?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function clearMobileQueueDone() {
  state.mobileQueueDone = null
}

function renderCommandCenter(result) {
  if (!els.commandCenter) return
  const command = result && result.commandCenter
  if (!command) {
    els.commandCenter.innerHTML = ''
    return
  }
  const primaryMove = commandPrimaryMove(command)
  els.commandCenter.innerHTML = '<section class="opportunity-command-center">' +
    '<div class="command-next-move"><div><p class="eyebrow">I dag / kommandosenter</p><h2>' + escapeHtml(primaryMove.title) + '</h2><small>' + escapeHtml(primaryMove.note) + '</small></div><div class="command-next-actions">' + primaryMove.actions + '</div></div>' +
  '</section>'
}

function commandPrimaryMove(command = {}) {
  const overdue = Array.isArray(command.overdueFollowUps) ? command.overdueFollowUps[0] : null
  if (overdue) {
    return {
      title: 'Neste: følg opp ' + (overdue.company || 'lead'),
      note: [overdue.city, overdue.phone, (overdue.reasons || [])[0]].filter(Boolean).join(' · '),
      actions: commandActionButton('Åpne lead', { leadId: overdue.leadId }, 'primary') + '<button type="button" data-start-callback-focus ' + callbackFocusStartDisabledAttr() + '>Start ring-tilbake-økt</button>' + commandActionButton('Åpne kø', { queue: 'follow_up_today' }),
    }
  }
  const callLead = Array.isArray(command.callTheseFirst) ? command.callTheseFirst[0] : null
  if (callLead) {
    return {
      title: 'Neste: ring ' + (callLead.company || 'best lead'),
      note: [callLead.city, callLead.phone, (callLead.reasons || [])[0]].filter(Boolean).join(' · '),
      actions: commandActionButton('Åpne lead', { leadId: callLead.leadId }, 'primary') + '<button type="button" data-start-call-focus>Start ringeøkt</button>',
    }
  }
  const verifyLead = Array.isArray(command.verifyBeforeCalling) ? command.verifyBeforeCalling[0] : null
  if (verifyLead) {
    return {
      title: 'Neste: verifiser ' + (verifyLead.company || 'lead'),
      note: [verifyLead.city, (verifyLead.reasons || [])[0]].filter(Boolean).join(' · '),
      actions: commandActionButton('Åpne lead', { leadId: verifyLead.leadId }, 'primary') + commandActionButton('Verifiser-kø', { queue: 'verify_first' }),
    }
  }
  const market = Array.isArray(command.bestMarketsNow) ? command.bestMarketsNow[0] : null
  if (market) {
    return {
      title: 'Neste: jobb med ' + (market.city || 'beste marked'),
      note: String(market.phoneReadyCount || 0) + '/' + String(market.leadCount || 0) + ' med telefon i dette markedet.',
      actions: commandActionButton('Filter city', { city: market.city }, 'primary'),
    }
  }
  return {
    title: 'Neste: kjør et markedssøk',
    note: 'Kommandosenteret vises etter første kjøring.',
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


function renderDailyCheckin(result) {
  if (!els.dailyCheckin) return
  const leads = result?.leadPacks || []
  const today = localDateKey()
  const saved = readDailyCheckin(today)
  if (!leads.length) {
    els.dailyCheckin.innerHTML = '<div class="daily-checkin-head"><div><p class="eyebrow">I dag</p><h2>Dagens innsjekk</h2><small>' + escapeHtml(today) + '</small></div></div><p class="daily-empty">Kjør et søk for å bygge dagslisten.</p>'
    return
  }
  const stats = dailyDeskStats(leads)
  const nextItems = dailyNextItems(leads)
  const calledCustomers = latestCalledCustomers(leads)
  const checkedLabel = saved?.at ? 'Innsjekket ' + formatDailyCheckinTime(saved.at) : 'Sjekk inn i dag'
  els.dailyCheckin.innerHTML = '<div class="daily-checkin-head"><div><p class="eyebrow">I dag</p><h2>Dagens innsjekk</h2><small>' + escapeHtml([today, activeSearchLabel(result)].filter(Boolean).join(' · ')) + '</small></div>' +
    '<button type="button" class="daily-checkin-action ' + (saved?.at ? 'checked' : '') + '" data-daily-checkin>' + escapeHtml(checkedLabel) + '</button></div>' +
    '<div class="daily-metrics" aria-label="Dagens salgstall">' +
      dailyMetricButton('Oppfølging', stats.followUpToday, 'follow_up_today') +
      dailyMetricButton('Ring nå', stats.callNow, 'call_now') +
      dailyMetricButton('SALG', stats.sales, 'interested', 'sales') +
      dailyMetricButton('Ingen svar', stats.noAnswer, 'no_answer') +
      dailyMetricButton('Nei', stats.no, 'not_relevant') +
      '<div class="daily-metric passive"><span>Nye</span><strong>' + escapeHtml(String(stats.notContacted)) + '</strong></div>' +
    '</div>' +
    '<section class="daily-checkin-section"><div class="daily-section-head"><h3>Neste</h3><span>' + escapeHtml(String(nextItems.length)) + '</span></div>' +
      (nextItems.length ? '<div class="daily-next-list">' + nextItems.map(dailyNextRow).join('') + '</div>' : '<p class="daily-empty">Ingen aktive leads i dagslisten.</p>') +
    '</section>' +
    '<section class="daily-checkin-section"><div class="daily-section-head"><h3>Siste ringt</h3><span>' + escapeHtml(String(calledCustomers.length)) + '/10</span></div>' +
      (calledCustomers.length ? '<ol class="daily-log-list">' + calledCustomers.map(dailyCalledCustomerRow).join('') + '</ol>' : '<p class="daily-empty">Ingen ringte kunder ennå.</p>') +
    '</section>'
}

function dailyMetricButton(label, value, queue, extraClass = '') {
  return '<button type="button" class="daily-metric ' + escapeAttr(extraClass) + '" data-command-queue="' + escapeAttr(queue) + '"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(String(value || 0)) + '</strong></button>'
}

function dailyDeskStats(leads) {
  const counts = workQueueCounts(leads)
  const notContacted = (Array.isArray(leads) ? leads : []).filter((lead) => {
    const workflow = lead.workflow || {}
    return !workflow.contacted && !workflow.response && !workflow.lastContactedAt && !workflow.updatedAt
  }).length
  return {
    followUpToday: counts.follow_up_today || 0,
    callNow: counts.call_now || 0,
    sales: (Array.isArray(leads) ? leads : []).filter((lead) => isSalesLead(lead)).length,
    noAnswer: counts.no_answer || 0,
    no: counts.not_relevant || 0,
    notContacted,
  }
}

function dailyNextItems(leads) {
  const rank = { follow_up_today: 0, interested: 1, call_now: 2, no_answer: 3, verify_first: 4 }
  return (Array.isArray(leads) ? leads : [])
    .map((lead, index) => ({ lead, index, id: leadId(lead, index), queue: leadWorkQueue(lead) }))
    .filter(({ queue }) => rank[queue] !== undefined)
    .sort((a, b) => (rank[a.queue] - rank[b.queue]) || (callQueueSortScore(b.lead) - callQueueSortScore(a.lead)) || leadDisplayName(a.lead).localeCompare(leadDisplayName(b.lead), 'nb'))
    .slice(0, 5)
}

function dailyNextRow(entry) {
  const { lead, id, queue } = entry
  const city = lead.contact?.city || lead.city || ''
  const phone = lead.contact?.phone || lead.phone || ''
  const label = isSalesLead(lead) ? positiveOutcomeLabel(lead) : workQueueLabel(queue)
  const note = lead.workflow?.nextAction || workQueueReason(lead, queue)
  return '<button type="button" class="daily-next-row" data-command-lead-id="' + escapeAttr(id) + '">' +
    '<span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(leadDisplayName(lead)) + '</strong>' +
    '<small>' + escapeHtml([city, phone].filter(Boolean).join(' · ') || 'Kontaktinfo mangler') + '</small>' +
    (note ? '<em>' + escapeHtml(note) + '</em>' : '') +
  '</button>'
}

function latestCalledCustomers(leads) {
  return (Array.isArray(leads) ? leads : []).map((lead, index) => {
    const workflow = lead.workflow || {}
    const activity = latestCallActivity(workflow)
    const at = activity?.at || activity?.lastContactedAt || workflow.updatedAt || workflow.lastContactedAt || ''
    if (!activity && !workflow.contacted && !workflow.response && !workflow.lastContactedAt) return null
    return { lead, index, id: leadId(lead, index), activity: activity || workflow, at, category: dailyCallCategory(lead, activity || workflow) }
  }).filter(Boolean).sort((a, b) => String(b.at || '').localeCompare(String(a.at || ''))).slice(0, 10)
}

function latestCallActivity(workflow = {}) {
  const activities = Array.isArray(workflow.activities) ? workflow.activities : []
  return activities.find((activity) => activity.response || activity.lastContactedAt || activity.channel === 'phone' || activity.type === 'contact_attempt') || null
}

function dailyCalledCustomerRow(entry) {
  const lead = entry.lead || {}
  const activity = entry.activity || {}
  const city = lead.contact?.city || lead.city || ''
  const phone = lead.contact?.phone || lead.phone || ''
  const note = activity.nextAction || lead.workflow?.nextAction || latestLeadNote(lead) || activitySummary(activity)
  return '<li><button type="button" data-command-lead-id="' + escapeAttr(entry.id) + '">' +
    '<div><span class="daily-log-category ' + escapeAttr(entry.category.key) + '">' + escapeHtml(entry.category.label) + '</span><strong>' + escapeHtml(leadDisplayName(lead)) + '</strong></div>' +
    '<small>' + escapeHtml([formatActivityTime(entry.at), city, phone].filter(Boolean).join(' · ')) + '</small>' +
    (note ? '<p>' + escapeHtml(note) + '</p>' : '') +
  '</button></li>'
}

function dailyCallCategory(lead = {}, activity = {}) {
  const response = String(activity.response || '').toLowerCase()
  const outcome = String(activity.outcome || '').toLowerCase()
  const queue = normalizeWorkQueue(activity.toQueue || activity.queue) || leadWorkQueue(lead)
  if (response === 'meeting_booked' || outcome.includes('sale') || outcome.includes('salg')) return { label: 'Salg', key: 'sale' }
  if (response === 'interested' || queue === 'interested') return { label: 'Interessert', key: 'interested' }
  if (response === 'no_answer' || response === 'no_response' || queue === 'no_answer') return { label: 'Ingen svar', key: 'no_answer' }
  if (response === 'negative' || outcome.includes('nei') || queue === 'not_relevant') return { label: 'Nei', key: 'not_relevant' }
  return { label: 'Kontaktet', key: 'contacted' }
}

function saveDailyCheckin() {
  const leads = state.result?.leadPacks || []
  if (!leads.length) return
  const snapshot = {
    date: localDateKey(),
    at: new Date().toISOString(),
    owner: currentOwner(),
    query: activeSearchLabel(state.result),
    stats: dailyDeskStats(leads),
  }
  try { window.localStorage.setItem(dailyCheckinStorageKey(snapshot.date), JSON.stringify(snapshot)) } catch (_) {}
  setStatus('daglig innsjekk lagret', '')
  renderDailyCheckin(state.result)
}

function dailyCheckinStorageKey(date = localDateKey()) {
  return 'leadMachineDailyCheckin:' + date
}

function readDailyCheckin(date = localDateKey()) {
  try {
    const value = window.localStorage.getItem(dailyCheckinStorageKey(date))
    return value ? JSON.parse(value) : null
  } catch (_) {
    return null
  }
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function formatDailyCheckinTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

async function exportWorkspaceSnapshot() {
  try {
    setStatus('exporting workspace snapshot...', 'running')
    const response = await apiFetch('/api/workspace-export')
    if (!response.ok) throw new Error('Eksport av arbeidsområde feilet')
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
    setStatus(error.message || 'eksport av arbeidsområde feilet', 'failed')
  }
}



function renderWorkflowBoard(result) {
  if (!els.workflowBoard) return
  const leads = result?.leadPacks || []
  if (!leads.length) {
    els.workflowBoard.className = 'workflow-board empty'
    els.workflowBoard.textContent = 'Kjør et søk for å bygge neste arbeidskø.'
    return
  }
  const queue = workQueueLeads(leads, state.selectedQueue)
  const next = queue[0]
  els.workflowBoard.className = 'workflow-board current-call-board'
  els.workflowBoard.innerHTML = next
    ? currentCallCard(next.lead, next.index, next.reason, queue.length, state.selectedQueue)
    : '<div class="empty-state compact-empty">Ingen leads i ' + escapeHtml(workQueueLabel(state.selectedQueue)) + '. Velg en annen kø eller kjør et nytt søk.</div>'
  els.workflowBoard.querySelectorAll('.queue-select').forEach((button) => button.addEventListener('click', () => {
    state.selectedIndex = Number(button.dataset.index)
    state.selectedLeadId = leadId(leads[state.selectedIndex], state.selectedIndex)
    renderAll()
    focusLeadDetail()
  }))
}

function currentCallCard(lead, index, reason, queueCount, queueId) {
  const name = lead.company?.displayName || lead.companyName || 'Ukjent firma'
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
      <button type="button" class="queue-select" data-index="${index}">Inspiser</button>
    </div>
    ${queueVerificationPanel(lead, index, queueId)}
    ${quickActionsHtml(index, 'queue')}
  </article>`
}


function queueVerificationPanel(lead, index, queueId) {
  if ((normalizeWorkQueue(queueId) || leadWorkQueue(lead)) !== 'verify_first') return ''
  const guidance = verificationGuidance(lead)
  return '<section class="verify-queue-guidance">' +
    '<div><strong>' + escapeHtml(guidance.primary.title) + '</strong><span>' + escapeHtml(guidance.primary.note) + '</span></div>' +
    '<button type="button" data-run-verify-enrich data-index="' + escapeAttr(String(index)) + '">Verifiser firma</button>' +
  '</section>'
}

function quickActionsHtml(index, variant = 'full') {
  const actions = variant === 'queue'
    ? QUICK_WORKFLOW_ACTIONS.filter((action) => ['sale', 'interested', 'no_answer', 'not_relevant'].includes(action.id))
    : QUICK_WORKFLOW_ACTIONS
  return `<div class="quick-actions ${variant === 'queue' ? 'compact' : ''}" aria-label="Quick workflow actions">
    ${actions.map((action) => `<button type="button" class="quick-action ${escapeAttr(action.tone)}" data-workflow-action="${escapeAttr(action.id)}" data-index="${index}">${escapeHtml(variant === 'queue' ? (action.shortLabel || action.label) : action.label)}</button>`).join('')}
  </div>`
}

function renderLeads(visibleLeads) {
  const total = state.result?.leadPacks?.length || 0
  updateFilterSummary(visibleLeads.length, total)
  if (!visibleLeads.length) {
    els.leadCards.innerHTML = '<div class="empty-state">' + escapeHtml(emptyLeadsMessage(total)) + '</div>'
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
        <div class="badge-row">${websiteSalesBadge(lead)}${badge(callReadiness(lead).key)}${sellerFitBadge(lead)}${badge(lead.callPriority || lead.priority)}${badge(workflowStatus(lead))}${verticalMatchBadge(lead)}${badge(lead.sourceQuality?.locationMatchStatus)}${badge(brregStatusLabel(company))}${fastBadge(lead)}</div>
        <h3>${escapeHtml(company.displayName || lead.companyName || 'Ukjent firma')}</h3>
        <p>${escapeHtml(contact.city || lead.city || 'unknown')} · ${escapeHtml(contact.phone || lead.phone || 'telefon ukjent')}</p>
        <p class="queue-action"><strong>Next:</strong> <span class="sales-edge-action ${escapeAttr(salesEdge.key)}">${escapeHtml(salesEdge.label)}</span></p>
        <p class="card-signal">${escapeHtml(primarySignal)}</p>
        ${latestLeadNote(lead) ? '<p class="card-note">Notat: ' + escapeHtml(latestLeadNote(lead).length > 70 ? latestLeadNote(lead).slice(0, 67) + '...' : latestLeadNote(lead)) + '</p>' : ''}
        <p class="card-meta">${escapeHtml(formatRating(places))} · ${escapeHtml(workflowCardNote(lead))}${openingStatusFor(lead).state === 'closed' ? ' · <span class="opening-closed">' + escapeHtml(openingStatusFor(lead).label) + '</span>' : ''}</p>
      </button>
    `
  }).join('')
  els.leadCards.querySelectorAll('.lead-card').forEach((button) => button.addEventListener('click', () => {
    clearMobileQueueDone()
    state.mobileNoteOpenLeadId = ''
    state.selectedIndex = Number(button.dataset.index)
    state.selectedLeadId = button.dataset.id
    renderAll()
    focusLeadDetail({ block: 'nearest' })
  }))
}

function emptyLeadsMessage(total) {
  if (total) return 'Ingen leads matcher disse filtrene.'
  const providerError = friendlyProviderError(state.result?.summary?.providerErrors)
  if (providerError) return providerError
  const expanded = state.result?.summary?.expandedQueries || []
  if (expanded.length > 1) return 'Ingen direkte treff for denne bransjen/stedet. Prøv Hele Norge eller bredere søkeord.'
  return 'Ingen leads funnet. Prøv et sted, Hele Norge eller bredere søkeord.'
}

function friendlyProviderError(errors) {
  const list = Array.isArray(errors) ? errors.filter(Boolean) : []
  if (!list.length) return ''
  const joined = list.join(' · ')
  if (/429/.test(joined)) return 'Google Places-kvoten er midlertidig brukt opp (HTTP 429). Vent noen minutter og kjør søket på nytt - dette er ikke et tomt marked.'
  if (/403|key|denied/i.test(joined)) return 'Google Places avviste nøkkelen (sjekk GOOGLE_PLACES_API_KEY i .env): ' + joined
  return 'Kilden feilet under søket: ' + joined
}

function cityCountLabel(city) {
  const counts = state.result?.summary?.marketSweepCityCounts || {}
  const count = counts[city] || 0
  return count ? String(count) + ' leads' : ''
}


function focusLeadDetail(options = {}) {
  if (!els.leadDetail) return
  els.leadDetail.scrollIntoView({ behavior: 'smooth', block: options.block || 'start', inline: 'nearest' })
}

function applyQueuePreset(preset) {
  clearMobileQueueDone()
  state.mobileNoteOpenLeadId = ''
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
  const queueSelect = '<label class="queue-select-mobile"><span>Kø</span><select data-queue-select>' + WORK_QUEUES.map((queue) =>
    '<option value="' + escapeAttr(queue.id) + '" ' + (queue.id === state.selectedQueue ? 'selected' : '') + '>' + escapeHtml(queue.label + ' · ' + (counts[queue.id] || 0)) + '</option>'
  ).join('') + '</select></label>'
  els.workQueueTabs.innerHTML = queueSelect + WORK_QUEUES.map((queue) => {
    const active = queue.id === state.selectedQueue
    return '<button type="button" class="work-queue-tab ' + (active ? 'active' : '') + '" data-work-queue="' + escapeAttr(queue.id) + '"><span>' + escapeHtml(queue.label) + '</span><strong>' + escapeHtml(counts[queue.id] || 0) + '</strong></button>'
  }).join('') + '<button type="button" class="start-call-focus" data-start-call-focus ' + ((counts.call_now || 0) + (counts.verify_first || 0) ? '' : 'disabled') + '>Start ringeøkt</button>'
    + '<button type="button" class="start-call-focus start-callback-focus" data-start-callback-focus ' + callbackFocusStartDisabledAttr() + '>Start ring-tilbake-økt</button>'
  const select = els.workQueueTabs.querySelector('[data-queue-select]')
  if (select) select.addEventListener('change', () => {
    state.selectedQueue = normalizeWorkQueue(select.value) || 'call_now'
    renderAll()
  })
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
  if (status === 'rejected' || explicit === 'not_relevant' || outcome.includes('not relevant') || outcome.includes('rejected') || outcome.includes('nei')) return 'not_relevant'
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
  if (queue === 'no_answer') return workflow.followUpDate ? 'Ingen svar · neste ' + workflow.followUpDate : 'Ingen svar · ring igjen senere'
  if (queue === 'interested') return workflow.nextAction || 'Interessert lead trenger neste handling'
  if (queue === 'verify_first') return callReadiness(lead).note || 'Verifiser før du ringer'
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
  score += websiteSalesSortScore(lead)
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
  if (workflow.status === 'rejected' || workflow.queue === 'not_relevant' || workflow.archivedAt) return { key: 'skip', label: 'Hopp over', note: 'Rejected or not relevant.', rank: -2000 }
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
  if (workflow.status === 'rejected') return { key: 'skip', label: 'Hopp over', note: 'Rejected or not relevant.', rank: -2000 }
  if (isFollowUpDue(lead)) return { key: 'follow_up_due', label: 'Oppfølging forfalt', note: workflow.followUpDate ? 'Due ' + workflow.followUpDate : 'Oppfølging har forfalt.', rank: 1800 }
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') return { key: 'follow_up_due', label: 'Oppfølging', note: 'Interessert lead trenger oppfølging.', rank: 1500 }
  if (!quality.hasPhone) return { key: 'needs_contact', label: 'Trenger kontakt', note: 'Ingen direkte telefon ennå.', rank: -300 }
  if (sellerAction === 'skip' || trustAction === 'skip') return { key: 'skip', label: 'Hopp over', note: 'Seller-fit engine says deprioritize.', rank: -1200 }
  if (quality.foreignPhone) return { key: 'verify_first', label: 'Verifiser først', note: 'Telefonnummeret ser utenlandsk ut.', rank: 250 }
  if (quality.severeLocationRisk) return { key: 'verify_first', label: 'Verifiser først', note: 'Løs stedskonflikten før du ringer.', rank: 350 }
  if (trustAction === 'verify_first') return { key: 'verify_first', label: 'Verifiser først', note: 'Kildesjekken sier at identitet, kontakt eller sted må verifiseres.', rank: 500 }
  if (quality.trustedToCall) return { key: 'ready_to_call', label: 'Klar til å ringe', note: quality.locationFallback ? 'Telefon klar; bekreft sted under samtalen.' : 'Telefon klar og ikke kontaktet.', rank: 1250 }
  if (quality.needsVerifyBeforeCall) return { key: 'verify_first', label: 'Verifiser først', note: 'Verifiser identitet/sted før du ringer.', rank: 500 }
  return { key: 'later', label: 'Senere', note: 'Vurder når køen er tom.', rank: 50 }
}

function callReadinessFromQueueQuality(queueQuality = {}) {
  const note = queueQuality.blockers?.length
    ? queueQuality.blockers.slice(0, 2).map(humanize).join(', ')
    : queueQuality.reasons?.slice(0, 2).map(humanize).join(', ') || 'Kø-kvalitetsfakta er lagt ved.'
  if (queueQuality.recommendedQueue === 'call_now') return { key: 'ready_to_call', label: 'Klar til å ringe', note, rank: 1250 }
  if (queueQuality.recommendedQueue === 'follow_up_today') return { key: 'follow_up_due', label: 'Oppfølging forfalt', note, rank: 1800 }
  if (queueQuality.recommendedQueue === 'interested') return { key: 'follow_up_due', label: 'Oppfølging', note, rank: 1500 }
  if (queueQuality.recommendedQueue === 'verify_first') return { key: 'verify_first', label: 'Verifiser først', note, rank: 500 }
  if (queueQuality.recommendedQueue === 'no_answer') return { key: 'no_answer', label: 'Ring igjen', note, rank: 200 }
  if (queueQuality.recommendedQueue === 'not_relevant' || queueQuality.recommendedQueue === 'archived') return { key: 'skip', label: 'Hopp over', note, rank: -1200 }
  return { key: 'later', label: 'Senere', note, rank: 50 }
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
  const requestedLocation = Boolean(sourceQuality.requestedLocation)
  const candidateLocation = Boolean(sourceQuality.candidateLocation || sourceQuality.marketSweepCity || lead.contact?.city || lead.contact?.address || lead.address || company.registeredAddress)
  const exactLocation = locationStatus === 'exact_location' || locationConfidence === 'exact'
  const locationFallback = locationStatus === 'regional_fallback' || locationConfidence === 'fallback'
  const locationUnknown = locationStatus === 'unknown' || locationConfidence === 'unknown'
  const locationMissing = !exactLocation && !candidateLocation
  const locationNeedsReview = locationFallback || requestedLocation && (locationUnknown || locationMissing)
  const usableLocation = exactLocation || candidateLocation && !locationNeedsReview
  const identityUnknown = identityConfidence === 'unknown' && !candidateOrg && !confirmedOrg
  const severeIdentityRisk = ['no_match', 'error'].includes(matchStatus) || identityUnknown
  const severeLocationRisk = ['out_of_area', 'conflict', 'location_conflict'].includes(locationStatus) || locationConfidence === 'conflict'
  const foreignPhone = Boolean(phone) && !isLikelyNorwegianPhone(phone)
  const trustedToCall = hasPhone && !foreignPhone && !severeLocationRisk && (exactLocation || trustAction === 'call' || confirmedOrg && usableLocation || candidateOrg && ['strong', 'good'].includes(fit) && usableLocation || sellerAction === 'contact' && !identityUnknown && usableLocation)
  const needsVerifyBeforeCall = !hasPhone || foreignPhone || severeLocationRisk || locationNeedsReview || locationMissing || severeIdentityRisk && !confirmedOrg || trustAction === 'verify_first' && !trustedToCall || contactConfidence === 'weak'
  return { hasPhone, confirmedOrg, candidateOrg, requestedLocation, candidateLocation, exactLocation, locationFallback, locationUnknown, locationMissing, locationNeedsReview, usableLocation, identityUnknown, severeIdentityRisk, severeLocationRisk, foreignPhone, trustedToCall, needsVerifyBeforeCall }
}

function isLikelyNorwegianPhone(value) {
  const raw = String(value || '').trim()
  const digits = raw.replace(/\D/g, '')
  if (!digits) return false
  if (/^\+?47[\s\d]+$/.test(raw) && digits.length === 10 && digits.startsWith('47')) return true
  if (digits.length === 8) return /^[2-9]/.test(digits)
  return false
}

function sellerRecommendedActionScore(lead) {
  return { contact: 90, verify: 35, review: 10, skip: -200 }[sellerRecommendedAction(lead)] || 0
}

function verticalMatchBadge(lead) {
  const status = lead?.sourceQuality?.verticalMatchStatus
  if (!status || status === 'unknown') return ''
  return badge('vertical_' + status)
}

function sellerFitBadge(lead) {
  const fit = String(lead.sellerFit?.sellerFit || '').toLowerCase()
  if (!fit) return ''
  return badge(`${fit}_fit`)
}

function leadNoteLines(lead) {
  return cleanWorkflowNote(lead?.workflow?.notes || '').split('\n').map((line) => line.trim()).filter(Boolean)
}

function latestLeadNote(lead) {
  const lines = leadNoteLines(lead)
  return lines[lines.length - 1] || ''
}

function mobileLeadDraftId(lead, index = state.selectedIndex) {
  return leadId(lead, index)
}

function mobileNoteDraftFor(lead, index = state.selectedIndex) {
  return state.mobileNoteDrafts[mobileLeadDraftId(lead, index)] || ''
}

function appendSellerNote(workflow = {}, text = '') {
  const note = String(text || '').trim()
  if (!note) return { ...workflow }
  const owner = currentOwner()
  const line = owner ? owner + ': ' + note : note
  return { ...workflow, notes: [cleanWorkflowNote(workflow.notes), line].filter(Boolean).join('\n'), owner: owner || workflow.owner || '' }
}

function clearMobileNoteDraftFor(lead, index = state.selectedIndex) {
  const id = mobileLeadDraftId(lead, index)
  delete state.mobileNoteDrafts[id]
  if (state.mobileNoteOpenLeadId === id) state.mobileNoteOpenLeadId = ''
}

async function saveMobileNote(button) {
  const index = Number(button.dataset.index ?? state.selectedIndex)
  const lead = state.result?.leadPacks?.[index]
  if (!lead) return setStatus('feilet: ingen valgt lead for notat', 'failed')
  const id = mobileLeadDraftId(lead, index)
  const input = button.closest('.mobile-call-bar')?.querySelector('[data-mobile-note-input]')
  const text = String(input?.value || state.mobileNoteDrafts[id] || '').trim()
  if (!text) { input?.focus(); return }
  const workflow = appendSellerNote(lead.workflow || {}, text)
  state.selectedIndex = index
  state.selectedLeadId = id
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Lagrer...'
  setStatus('lagrer notat...', 'running')
  try {
    const response = await apiFetch('/api/workflow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.workflow?.leadId || id,
        runId: state.result?.runId,
        leadName: lead.company?.displayName || lead.companyName || '',
        workflow,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Lagring av notat feilet')
    lead.workflow = payload.workflow
    syncLeadQueueQuality(lead)
    clearMobileNoteDraftFor(lead, index)
    setStatus('notat lagret', '')
    renderAll()
  } catch (error) {
    setStatus('feilet: ' + (error.message || 'lagring av notat'), 'failed')
  } finally {
    button.disabled = false
    button.textContent = originalText || 'Lagre notat'
  }
}

function leadNotePanel(lead) {
  const lines = leadNoteLines(lead)
  const latest = lines[lines.length - 1] || ''
  return '<section class="lead-note-panel">' +
    '<div class="lead-note-head"><p class="eyebrow">Notat på kortet</p>' + (lines.length > 1 ? '<small>' + escapeHtml(String(lines.length)) + ' notater - se alle under Tekst og oppfølging</small>' : '') + '</div>' +
    (latest ? '<p class="lead-note-latest">' + escapeHtml(latest) + '</p>' : '<p class="lead-note-latest lead-note-empty">Ingen notater ennå. Skriv f.eks. hvem som har vurdert nettsiden.</p>') +
    '<div class="lead-note-add"><input id="cardNoteInput" type="text" placeholder="F.eks. nettsiden er vurdert - gammel meny, ingen kontaktskjema" autocomplete="off"><button type="button" data-save-card-note>Lagre notat</button></div>' +
  '</section>'
}

async function saveCardNote(button) {
  const input = document.getElementById('cardNoteInput')
  const text = String(input?.value || '').trim()
  const lead = state.result?.leadPacks?.[state.selectedIndex]
  if (!lead) return setStatus('feilet: ingen valgt lead for notat', 'failed')
  if (!text) { input?.focus(); return }
  const owner = currentOwner()
  const line = owner ? owner + ': ' + text : text
  const current = { ...(lead.workflow || {}) }
  current.notes = [cleanWorkflowNote(current.notes), line].filter(Boolean).join('\n')
  current.owner = owner || current.owner || ''
  button.disabled = true
  setStatus('lagrer notat...', 'running')
  try {
    const response = await apiFetch('/api/workflow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.workflow?.leadId || leadId(lead, state.selectedIndex),
        runId: state.result?.runId,
        leadName: lead.company?.displayName || lead.companyName || '',
        workflow: current,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Lagring av notat feilet')
    lead.workflow = payload.workflow
    syncLeadQueueQuality(lead)
    setStatus('notat lagret', '')
    renderAll()
  } catch (error) {
    setStatus('feilet: ' + (error.message || 'lagring av notat'), 'failed')
  } finally {
    button.disabled = false
  }
}

const OPENING_DAY_LABELS = ['søn.', 'man.', 'tir.', 'ons.', 'tor.', 'fre.', 'lør.']

function openingStatusFor(lead) {
  const hours = lead.places?.openingHours
  const periods = Array.isArray(hours?.periods) ? hours.periods : []
  if (!periods.length) return { state: 'unknown', label: '' }
  const WEEK = 7 * 24 * 60
  const DAY = 24 * 60
  const now = new Date()
  const nowMin = now.getDay() * DAY + now.getHours() * 60 + now.getMinutes()
  const intervals = []
  for (const period of periods) {
    const open = period.open
    if (!open || !Number.isFinite(Number(open.day))) continue
    if (!period.close) return { state: 'open', label: 'Døgnåpent' }
    const start = Number(open.day) * DAY + Number(open.hour || 0) * 60 + Number(open.minute || 0)
    let end = Number(period.close.day) * DAY + Number(period.close.hour || 0) * 60 + Number(period.close.minute || 0)
    if (end <= start) end += WEEK
    intervals.push([start, end])
  }
  if (!intervals.length) return { state: 'unknown', label: '' }
  for (const [start, end] of intervals) {
    if ((nowMin >= start && nowMin < end) || (nowMin + WEEK >= start && nowMin + WEEK < end)) {
      return { state: 'open', label: 'Åpent nå · stenger ' + clockLabel(end % WEEK % DAY) }
    }
  }
  let next = null
  for (const [start] of intervals) {
    const delta = (start - nowMin + WEEK) % WEEK
    if (!next || delta < next.delta) next = { delta, start }
  }
  const openDay = Math.floor((next.start % WEEK) / DAY)
  const clock = clockLabel(next.start % DAY)
  const today = openDay === now.getDay() && next.delta < DAY
  return { state: 'closed', label: 'Stengt · åpner ' + (today ? clock : OPENING_DAY_LABELS[openDay] + ' ' + clock) }
}

function clockLabel(minutesOfDay) {
  const safe = ((minutesOfDay % 1440) + 1440) % 1440
  return String(Math.floor(safe / 60)).padStart(2, '0') + ':' + String(safe % 60).padStart(2, '0')
}

function openingStatusHtml(lead) {
  const status = openingStatusFor(lead)
  if (!status.label) return ''
  return '<small class="opening-status opening-' + escapeAttr(status.state) + '">' + escapeHtml(status.label) + '</small>'
}

function websiteSalesFitLabel(verdict = {}) {
  const fit = String(verdict.websiteSalesFit || '').toLowerCase()
  if (fit === 'strong') return 'Sterk nettside-lead'
  if (fit === 'weak') return 'Svak nettside-lead'
  if (verdict.websiteLeadType === 'site_unverified') return 'Sjekk nettsiden'
  return 'Vurder nettside-lead'
}

function websiteSalesActionLabel(action) {
  return { call: 'Ring nå', verify: 'Sjekk nettsiden først', review: 'Vurder først', skip: 'Hopp over' }[String(action || '').toLowerCase()] || ''
}

function websiteSalesBadge(lead) {
  const verdict = lead.websiteSalesFit
  if (!verdict || !verdict.websiteSalesFit) return ''
  const fit = String(verdict.websiteSalesFit).toLowerCase()
  return `<span class="badge website-sales-${escapeAttr(fit)}">${escapeHtml(websiteSalesFitLabel(verdict))}</span>`
}

function websiteSalesSortScore(lead) {
  const verdict = lead.websiteSalesFit
  if (!verdict) return 0
  const fit = String(verdict.websiteSalesFit || '').toLowerCase()
  if (fit === 'strong') return 220
  if (fit === 'weak') return -400
  return 40
}

function websiteSalesPanel(lead) {
  const verdict = lead.websiteSalesFit
  if (!verdict || !verdict.websiteSalesFit) return ''
  const fit = String(verdict.websiteSalesFit).toLowerCase()
  const why = normalizeList(verdict.whyWebsiteLead)
  const caution = normalizeList(verdict.caution)
  const action = websiteSalesActionLabel(verdict.recommendedAction)
  const deepHint = verdict.websiteLeadType === 'site_unverified'
    ? '<p class="website-sales-note">Nettside finnes, men er ikke vurdert. Åpne den og se selv før du dømmer leaden.</p>'
    : ''
  return `<section class="website-sales-panel website-sales-${escapeAttr(fit)}">
    <div class="website-sales-head"><div><p class="eyebrow">Nettside-salg</p><h3>${escapeHtml(websiteSalesFitLabel(verdict))}</h3></div>${action ? `<span class="badge website-sales-${escapeAttr(fit)}">${escapeHtml(action)}</span>` : ''}</div>
    ${why.length ? `<ul class="website-sales-why">${why.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
    ${caution.length ? `<ul class="website-sales-caution">${caution.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
    ${deepHint}
    ${salesAnglesBlock(lead)}
  </section>`
}

function salesAnglesBlock(lead) {
  const analysis = lead.salesAngles
  if (!analysis) {
    return '<div class="sales-angles-row"><button type="button" data-run-sales-angles>Finn salgsvinkler</button><small>Søker offentlig nettinfo for valgt lead og foreslår korte, kildebaserte vinkler. Kjøres manuelt.</small></div>'
  }
  const angles = Array.isArray(analysis.angles) ? analysis.angles : []
  const risks = Array.isArray(analysis.risks) ? analysis.risks : []
  return '<div class="sales-angles-result">' +
    '<p class="sales-angles-head"><strong>Salgsvinkler:</strong> ' + escapeHtml(analysis.summary || '') + '</p>' +
    (angles.length ? '<ul class="sales-angles-list">' + angles.map((angle) => '<li><strong>' + escapeHtml(angle.title || 'Vinkel') + ':</strong> ' + escapeHtml(angle.offer || angle.why || '') + (angle.why ? '<br><span>' + escapeHtml(angle.why) + '</span>' : '') + evidenceList(angle.evidence) + '</li>').join('') + '</ul>' : '') +
    (risks.length ? '<p class="sales-angles-risk"><strong>Sjekk først:</strong> ' + escapeHtml(risks.join(' · ')) + '</p>' : '') +
    (analysis.nextStep ? '<p class="sales-angles-next"><strong>Neste:</strong> ' + escapeHtml(analysis.nextStep) + '</p>' : '') +
    '<button type="button" class="sales-angles-rerun" data-run-sales-angles>Kjør på nytt</button>' +
  '</div>'
}

function evidenceList(items) {
  const list = Array.isArray(items) ? items.filter(Boolean).slice(0, 3) : []
  return list.length ? '<br><small>Bevis: ' + escapeHtml(list.join(' · ')) + '</small>' : ''
}

async function persistLeadNote(lead, index, line) {
  const current = { ...(lead.workflow || {}) }
  current.notes = [cleanWorkflowNote(current.notes), line].filter(Boolean).join('\n')
  current.owner = currentOwner() || current.owner || ''
  const response = await apiFetch('/api/workflow', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      leadId: lead.workflow?.leadId || leadId(lead, index),
      runId: state.result?.runId,
      leadName: lead.company?.displayName || lead.companyName || '',
      workflow: current,
    }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Lagring av notat feilet')
  lead.workflow = payload.workflow
  syncLeadQueueQuality(lead)
}

async function runSalesAngles(button) {
  const index = state.selectedIndex
  const lead = state.result?.leadPacks?.[index]
  if (!lead) return setStatus('feilet: ingen valgt lead for salgsvinkler', 'failed')
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Søker vinkler...'
  setStatus('starter søk etter salgsvinkler...', 'running')
  try {
    const response = await apiFetch('/api/sales-angles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lead }),
    })
    const payload = await readApiJson(response, 'Salgsvinkel-søket feilet')
    if (!response.ok) throw new Error(payload.error || 'Salgsvinkel-søket feilet')
    if (payload.pending && payload.responseId) {
      await pollSalesAngles(lead, payload.responseId)
      return
    }
    if (!payload.salesAngles) throw new Error(payload.error || 'Salgsvinkel-søket feilet')
    lead.salesAngles = payload.salesAngles
    setStatus('salgsvinkler funnet', '')
    renderAll()
  } catch (error) {
    setStatus('feilet: ' + (error.message || 'salgsvinkel-søket feilet'), 'failed')
    button.disabled = false
    button.textContent = originalText
  }
}

async function pollSalesAngles(lead, responseId) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    await wait(attempt < 3 ? 1500 : 2500)
    const response = await apiFetch('/api/sales-angles?id=' + encodeURIComponent(responseId))
    const payload = await readApiJson(response, 'Salgsvinkel-status feilet')
    if (!response.ok) throw new Error(payload.error || 'Salgsvinkel-status feilet')
    if (payload.pending) {
      setStatus('søker etter salgsvinkler... ' + (payload.status || 'venter'), 'running')
      continue
    }
    if (!payload.salesAngles) throw new Error(payload.error || 'Salgsvinkel-søket feilet')
    lead.salesAngles = payload.salesAngles
    setStatus('salgsvinkler funnet', '')
    renderAll()
    return
  }
  throw new Error('Salgsvinkel-søket tar for lang tid - prøv igjen om litt')
}

async function readApiJson(response, fallbackMessage) {
  const text = await response.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch (_) {
    const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    return { error: cleaned ? fallbackMessage + ': ' + cleaned : fallbackMessage }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
function noWebsiteSignal() {
  return '<span class="no-website-signal">Ingen nettside funnet – salgsåpning</span>'
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
  return 'Trenger oppfølging'
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

// Server-built queueQuality carries a snapshot of workflowQueue from payload build
// time; without this sync a saved outcome never moves the lead out of its queue.
function syncLeadQueueQuality(lead) {
  if (lead?.queueQuality && typeof lead.queueQuality === 'object') {
    lead.queueQuality = { ...lead.queueQuality, workflowQueue: lead.workflow?.queue || '' }
  }
}

// MUST stay byte-identical to server.js leadWorkflowId() and netlify/functions/api.js
// hostedLeadId(). Field order: org, candidateOrg, placeId, displayName, (city).
// The trailing index is dropped whenever any stable id exists, so a business keeps
// its workflow state (no-answer, follow-up) when it reappears at a different position
// in a later search. Only fully id-less rows fall back to a per-position key.
function leadId(lead, index) {
  const org = lead.company?.organizationNumber
  const candidateOrg = lead.company?.candidateOrganizationNumber
  const placeId = lead.places?.placeId
  const name = lead.company?.displayName
  if (org || candidateOrg || placeId) return [org, candidateOrg, placeId, name].filter(Boolean).join('::')
  if (name) return [name, lead.contact?.city || lead.city].filter(Boolean).join('::')
  return `lead::${index}`
}

function leadQueueActionLabel(lead) {
  return salesEdgeAction(lead).label
}

function salesEdgeAction(lead = {}) {
  const workflow = lead.workflow || {}
  const rejected = workflow.status === 'rejected' || workflow.queue === 'not_relevant' || (/not relevant|nei/.test(String(workflow.outcome || '').toLowerCase()))
  if (rejected) return { key: 'skip', label: 'Hopp over', note: 'Marked not relevant; keep out of seller focus.' }
  const backendQuality = queueQualityForLead(lead)
  if (backendQuality) return salesEdgeActionFromQueueQuality(backendQuality)
  const fusion = sourceFusionForLead(lead)
  const trustAction = String(fusion.recommendedTrustAction || '').toLowerCase()
  const sellerAction = sellerRecommendedAction(lead)
  const hasPhone = Boolean(lead.contact?.phone || lead.phone)
  const readiness = callReadiness(lead)
  const followUpDate = workflow.nextFollowUpAt || workflow.followUpDate || ''
  if (isFollowUpDue(lead)) return { key: 'follow_up_today', label: 'Følg opp i dag', note: followUpDate ? 'Due ' + followUpDate + '.' : 'Oppfølging har forfalt.' }
  if (workflow.status === 'interested' || workflow.response === 'interested' || workflow.response === 'meeting_booked') return { key: 'follow_up_today', label: 'Følg opp i dag', note: 'Interessert lead trenger et konkret neste steg.' }
  if (trustAction === 'skip' || sellerAction === 'skip' || readiness.key === 'skip') return { key: 'skip', label: 'Hopp over', note: 'Svak match eller kildetrygghet; vurder bare hvis du har en grunn.' }
  if (!hasPhone && trustAction === 'skip') return { key: 'skip', label: 'Hopp over', note: 'Ingen brukbar kontaktvei funnet.' }
  if (!hasPhone) return { key: 'verify_first', label: 'Verifiser først', note: 'Finn eller verifiser en direkte kontaktvei før du ringer.' }
  if (readiness.key === 'verify_first' || readiness.key === 'needs_contact' || trustAction === 'verify_first') return { key: 'verify_first', label: 'Verifiser først', note: readiness.note || 'Verifiser identitet, kontakt eller sted før du ringer.' }
  if ((trustAction === 'call' || readiness.key === 'ready_to_call') && hasPhone) return { key: 'call', label: 'Ring nå', note: readiness.note || 'Telefon, identitet og sted er sterke nok til å jobbe med.' }
  if (isFastLead(lead)) return { key: 'verify_enrich', label: 'Verifiser firma', note: 'Kjør en målrettet sjekk hvis denne leaden er verdt mer kontekst.' }
  if (String(fusion.leadConfidence || '').toLowerCase() === 'review') return { key: 'verify_enrich', label: 'Verifiser firma', note: 'Kildetryggheten trenger en sjekk før du prioriterer.' }
  if (hasPhone) return { key: 'call', label: 'Ring nå', note: readiness.note || 'Telefon finnes og ingen harde stoppere er synlige.' }
  return { key: 'verify_first', label: 'Verifiser først', note: 'Verifiser kontaktbarhet før salgsarbeid.' }
}

function salesEdgeActionFromQueueQuality(queueQuality = {}) {
  const note = queueQuality.blockers?.length
    ? queueQuality.blockers.slice(0, 2).map(humanize).join(', ')
    : queueQuality.reasons?.slice(0, 2).map(humanize).join(', ') || 'Anbefaling fra kø-kvalitetssjekken.'
  if (queueQuality.recommendedAction === 'call') return { key: 'call', label: 'Ring nå', note }
  if (queueQuality.recommendedAction === 'follow_up_today' || queueQuality.recommendedQueue === 'follow_up_today') return { key: 'follow_up_today', label: 'Følg opp i dag', note }
  if (queueQuality.recommendedAction === 'verify_first') return { key: 'verify_first', label: 'Verifiser først', note }
  if (queueQuality.recommendedAction === 'skip') return { key: 'skip', label: 'Hopp over', note }
  if (queueQuality.recommendedAction === 'call_again') return { key: 'follow_up_today', label: 'Følg opp', note }
  if (queueQuality.recommendedAction === 'follow_up') return { key: 'follow_up_today', label: 'Følg opp', note }
  return { key: 'verify_enrich', label: 'Verifiser firma', note }
}

function updateFilterSummary(visible, total) {
  if (!els.leadFilterSummary) return
  const active = els.leadFilters.filter((filter) => filter.checked).map((filter) => filter.parentElement.textContent.trim())
  if (state.cityFilter) active.unshift('By: ' + state.cityFilter)
  const prefix = total ? `${visible}/${total} leads shown` : 'Ingen leads ennå'
  els.leadFilterSummary.textContent = active.length ? `${prefix} · ${active.join(', ')}` : `${prefix} · no filters applied`
}

function mobileQueueFinishedPanel() {
  const queue = workQueueLabel(state.selectedQueue)
  const query = activeSearchLabel(state.result)
  const counts = workQueueCounts(state.result?.leadPacks || [])
  const nextQueue = WORK_QUEUES.find((item) => item.id !== state.selectedQueue && counts[item.id] > 0)
  return '<section class="mobile-queue-finished empty-state">' +
    '<p class="eyebrow">Kø ferdig</p>' +
    '<h2>Ingen flere leads i ' + escapeHtml(queue) + '</h2>' +
    '<p>' + escapeHtml(query) + ' er ferdig for denne køen. Velg en annen kø eller åpne søkefeltet for å finne flere.</p>' +
    '<div class="mobile-queue-finished-actions">' +
      (nextQueue ? '<button type="button" data-work-queue="' + escapeAttr(nextQueue.id) + '">Åpne ' + escapeHtml(nextQueue.label) + '</button>' : '') +
      '<button type="button" data-mobile-edit-search>Søk</button>' +
    '</div>' +
  '</section>'
}

function renderDetail(lead) {
  if (!lead) {
    if (state.mobileQueueDone && state.mobileQueueDone.queue === state.selectedQueue) {
      els.leadDetail.innerHTML = mobileQueueFinishedPanel()
    } else if (state.result?.leadPacks?.length) {
      els.leadDetail.innerHTML = '<div class="empty-state">Ingen leads i ' + escapeHtml(workQueueLabel(state.selectedQueue)) + '. Velg en annen kø eller juster filter.</div>'
    } else {
      els.leadDetail.innerHTML = '<div class="empty-state">Kjør et søk for å se firmaprofil, kontaktdata, bevis og obs-punkter.</div>'
    }
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
      ${mobileDecisionCard(lead, command, salesEdge)}
      ${sellerFlowPanel(lead, command, salesEdge)}
    </section>

    ${websiteSalesPanel(lead)}

    ${leadNotePanel(lead)}

    ${mobileCallBar(lead)}

    ${workflowPanel(lead)}

    ${leadInfoDetails(lead, command)}

    <section class="detail-tools">
      <details class="detail-tool">
        <summary>Hvorfor vurdere?</summary>
        <section class="leverage-panel compact">
          <div>
            <p class="eyebrow">Selgerkontekst</p>
            <h3>Grunner til å vurdere</h3>
          </div>
          ${bullets(leverage)}
        </section>
      </details>
      ${enrichmentTool(lead)}
      <details class="detail-tool">
        <summary>Sources</summary>
        <div class="source-grid">
        ${sourceCard('Google Places', places.provider || 'available', [
          ['Vurdering', formatRating(places)],
          ['Sted-ID', places.placeId || 'unknown'],
          ['Omtaler', places.reviewCount ?? 'unknown'],
        ])}
        ${sourceCard('Nettsidesjekk', website.auditStatus || 'available', [
          ['Kontaktbarhet', website.contactability || 'unknown'],
          ['Toppsignal', (website.topEvidence || [])[0] || 'none'],
          ['CTA-profil', website.ctaProfile ? 'available' : 'unknown'],
        ])}
        ${brregSourceCard(company)}
        ${sourceCard('Kildestrategi', sourceStrategyStatus(company, sourceQuality, places), [
          ['Identitetskilde', isBrregUnavailable(company) ? 'brreg not confirmed' : (sourceQuality.identitySource || company.source || 'unknown')],
          ['Synlighetskilde', sourceQuality.presenceSource || places.provider || 'unknown'],
          ['Strategi', sourceStrategyLabel(company, sourceQuality)],
        ])}
        ${sourceCard('Økonomi / Proff', economy.status || 'not_enabled', [
          ['Omsetning', economy.revenue ?? 'not enabled'],
          ['Resultat', economy.profit ?? 'not enabled'],
          ['Ansatte', economy.employees ?? 'not enabled'],
          ['Kilde', economy.source || 'not enabled'],
          ['Varsler', normalizeList(economy.warnings).map(humanize).join(', ') || 'none'],
        ])}
        ${sourceCard('Treffkvalitet', discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown', [
          ['Score', discoveryQuality.score == null ? 'unknown' : `${discoveryQuality.score}/100`],
          ['Bransjetreff', readable(sourceQuality.verticalMatchStatus || 'unknown')],
          ['Matchet ord', sourceQuality.verticalMatchedTerm || 'unknown'],
          ['Grunner', (discoveryQuality.reasons || []).slice(0, 3).map(humanize).join(', ') || 'unknown'],
          ['Varsler', (discoveryQuality.warnings || []).slice(0, 3).map(humanize).join(', ') || 'none'],
        ])}
        </div>
      </details>
      ${deepEnrichmentModules(lead, command)}
      <details class="detail-tool">
        <summary>Rådata</summary>
    ${section('Firma og kontakt', kv([
      ['Bekreftet org.nr', company.organizationNumber || 'none'],
      ['Kandidat org.nr', company.candidateOrganizationNumber || 'none'],
      ['Juridisk navn', company.legalName || 'unknown'],
      ['Kandidat juridisk navn', company.candidateLegalName || 'none'],
      ['Organisasjonsform', company.organizationForm || 'unknown'],
      ['Registrert adresse', company.registeredAddress || 'unknown'],
      ['Kommune', company.municipality || 'unknown'],
      ['NACE', [company.naceCode, company.naceDescription].filter(Boolean).join(' - ') || 'unknown'],
      ['Ansatte', company.employees ?? 'unknown'],
      ['Registrert', company.registrationDate || 'unknown'],
      ['Status', company.activeStatus || 'unknown'],
      ['Treffstatus', readable(company.matchStatus || 'not_run')],
      ['Treffsikkerhet', company.matchConfidence ?? 'unknown'],
      ['Varsler', normalizeList(company.warnings).map(humanize).join(', ') || 'none'],
      ['Brreg-kilde', link(company.sourceUrl)],
      ['Nettside', link(websiteValue(contact.website || lead.website))],
      ['Telefon', phoneLink(contact.phone || lead.phone || 'unknown')],
      ['E-post', contact.email || lead.email || 'unknown'],
      ['Adresse', contact.address || lead.address || 'unknown'],
      ['City', contact.city || lead.city || 'unknown'],
    ]))}
    ${candidateSection(company)}
    ${section('Lead-innsikt', kv([
      ['Selgermodus', humanize(lead.sellerFit?.sellerIntent || state.result?.summary?.sellerIntent || 'general_b2b')],
      ['Selgermatch', humanize(lead.sellerFit?.sellerFit || 'unknown')],
      ['Anbefalt handling', humanize(lead.sellerFit?.recommendedAction || 'unknown')],
      ['Lead-klasse', humanize(lead.leadClass || 'unknown')],
      ['Mulighet', humanize(lead.opportunityType || 'unknown')],
      ['Salgsletthet', readable(ranking.salesEase || 'unknown')],
      ['Smertescore', ranking.painScore ?? 'unknown'],
      ['Sted', readable(sourceQuality.locationMatchStatus || 'unknown')],
      ['Bransjetreff', readable(sourceQuality.verticalMatchStatus || 'unknown')],
      ['Matchet ord', sourceQuality.verticalMatchedTerm || 'unknown'],
      ['Økonomi', readable(economy.status || 'not_enabled')],
      ['Treffsikkerhet', readable(discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown')],
      ['Identitetskilde', sourceQuality.identitySource || company.source || 'unknown'],
      ['Synlighetskilde', sourceQuality.presenceSource || places.provider || 'unknown'],
    ]))}
    ${section('Bevis', bullets((website.topEvidence || lead.topEvidence || lead.evidence || []).map(humanizeEvidence)))}
    ${section('Obs', bullets((ranking.caution || lead.caution || []).map(humanizeEvidence)))}
      </details>
    </section>
  `
  const nextButton = document.getElementById('nextLeadButton')
  if (nextButton) nextButton.addEventListener('click', selectNextVisibleLead)
  const cardNoteInput = document.getElementById('cardNoteInput')
  if (cardNoteInput) cardNoteInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const saveButton = document.querySelector('[data-save-card-note]')
    if (saveButton) saveCardNote(saveButton)
  })
}

function mobileDecisionCard(lead, command, salesEdge) {
  const company = lead.company || {}
  const phone = lead.contact?.phone || lead.phone || ''
  const city = leadCity(lead)
  const queue = leadWorkQueue(lead)
  const readiness = callReadiness(lead)
  const websiteFact = mobileWebsiteFact(lead)
  const brregFact = mobileBrregFact(lead)
  const fitFact = mobileSellerFitFact(lead, command)
  const note = latestLeadNote(lead)
  const proof = verificationShortLabel(lead)
  return '<section class="mobile-decision-card queue-row" aria-label="Mobil beslutningskort">' +
    '<div class="mobile-decision-head"><div><p class="eyebrow">Valgt lead</p><h2>' + googleNameLink(lead, company.displayName || lead.companyName || 'Ukjent firma') + '</h2><small>' + escapeHtml([city, phone].filter(Boolean).join(' · ') || 'Kontakt mangler') + '</small></div><div class="badge-row">' + websiteSalesBadge(lead) + badge(queue) + badge(readiness.key) + sellerFitBadge(lead) + badge(brregStatusLabel(company)) + '</div></div>' +
    '<div class="mobile-decision-facts">' +
      mobileDecisionFact('Nettside', websiteFact.value, websiteFact.note, websiteFact.href) +
      mobileDecisionFact('Kilde', brregFact.value, brregFact.note) +
      mobileDecisionFact('Selgermatch', fitFact.value, fitFact.note) +
      mobileDecisionFact('Siste notat', note || 'Ingen notat', note ? 'Lagret på leaden' : 'Bruk Notat i bunnlinjen') +
    '</div>' +
    '<details class="mobile-decision-more"><summary>Detaljer</summary><div class="mobile-decision-detail-grid">' +
      commandMetric('Neste handling', salesEdge.label || command.nextAction, salesEdge.note || command.nextActionNote) +
      commandMetric('Ringeklar', readiness.label, readiness.note) +
      commandMetric('Bevis', proof.title, proof.note) +
    '</div></details>' +
  '</section>'
}

function mobileDecisionFact(label, value, note, href = '') {
  const content = href
    ? '<a href="' + escapeAttr(href) + '" target="_blank" rel="noreferrer">' + escapeHtml(value) + '</a>'
    : escapeHtml(String(value || 'Ukjent'))
  return '<div class="mobile-decision-fact"><span>' + escapeHtml(label) + '</span><strong>' + content + '</strong><small>' + escapeHtml(String(note || '')) + '</small></div>'
}

function mobileWebsiteFact(lead) {
  const url = websiteValue(lead.contact?.website || lead.website)
  const verdict = lead.websiteSalesFit || {}
  if (!url) return { value: 'Ingen funnet', note: 'Salgsåpning for nettsidesalg', href: '' }
  if (verdict.websiteSalesFit) return { value: websiteSalesFitLabel(verdict), note: websiteSalesActionLabel(verdict.recommendedAction) || 'Åpne og vurder selv', href: url }
  return { value: displayUrl(url), note: 'Åpne og vurder selv', href: url }
}

function mobileBrregFact(lead) {
  const company = lead.company || {}
  const fusion = sourceFusionForLead(lead)
  const value = company.organizationNumber ? 'Bekreftet org.nr' : company.candidateOrganizationNumber ? 'Kandidat org.nr' : humanize(brregStatusLabel(company))
  const note = company.organizationNumber || company.candidateOrganizationNumber || sourceFusionFooter(fusion)
  return { value, note }
}

function mobileSellerFitFact(lead, command) {
  const fit = lead.sellerFit || {}
  return {
    value: humanize(fit.sellerFit || command.sellerReadinessKey || 'review'),
    note: humanize(fit.recommendedAction || command.nextAction || 'review'),
  }
}

function sellerFlowPanel(lead, command, salesEdge) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const sourceQuality = lead.sourceQuality || {}
  const phone = contact.phone || lead.phone || ''
  const callHref = phoneHref(phone)
  const queue = leadWorkQueue(lead)
  const verifyFirst = queue === 'verify_first'
  const query = state.result?.parsedQuery?.normalizedQuery || state.result?.summary?.query || 'Søk'
  const city = leadCity(lead)
  const category = sourceQuality.verticalMatchedTerm || businessActivityLabel(company) || company.naceDescription || 'Kategori ukjent'
  const primaryAction = verifyFirst
    ? '<button type="button" class="seller-flow-primary" data-run-verify-enrich data-index="' + escapeAttr(String(state.selectedIndex)) + '">Verifiser firma</button>'
    : (callHref ? '<a class="seller-flow-primary" href="' + escapeAttr(callHref) + '">Ring nå</a>' : '<span class="seller-flow-primary disabled">Ingen telefon</span>')
  const secondaryCall = verifyFirst && callHref ? '<a class="seller-flow-secondary" href="' + escapeAttr(callHref) + '">Ring hvis sjekket</a>' : ''
  const proof = verificationShortLabel(lead)
  return '<div class="seller-flow-hero queue-row">' +
    '<div class="seller-flow-top"><div class="seller-flow-title"><p class="eyebrow">Valgt lead</p><h2>' + googleNameLink(lead, company.displayName || lead.companyName || 'Ukjent firma') + '</h2><small>' + escapeHtml(company.legalName || city || 'Juridisk navn ukjent') + '</small><div class="badge-row instant-badges">' + websiteSalesBadge(lead) + badge(queue) + sourceFusionBadge(lead) + badge(brregStatusLabel(company)) + fastBadge(lead) + '</div></div>' +
    '<div class="seller-flow-contact"><span>Telefon</span>' + titlePhone(phone) + '<small>' + escapeHtml(command.bestContactNote) + '</small>' + openingStatusHtml(lead) + '<button type="button" id="nextLeadButton" class="next-lead-button" ' + nextLeadDisabledAttr() + '>Neste lead</button></div></div>' +
    '<div class="seller-flow-steps" aria-label="Seller flow">' +
      '<section class="seller-flow-step"><span>1. Søk</span><strong>' + escapeHtml(city) + '</strong><small>' + escapeHtml(query + ' · ' + category) + '</small></section>' +
      '<section class="seller-flow-step seller-flow-step-main"><span>2. Ring</span><strong>' + escapeHtml(workQueueLabel(queue)) + '</strong><small>' + escapeHtml(salesEdge.note || callReadiness(lead).note) + '</small><div class="seller-flow-actions">' + primaryAction + secondaryCall + '</div></section>' +
      '<section class="seller-flow-step"><span>3. Noter</span><strong>Logg utfall</strong><small>Velg Salg, Interessert, Ingen svar eller Nei. Skriv kort notat og sett oppfølging under.</small></section>' +
    '</div>' +
    '<div class="seller-flow-outcomes">' + quickActionsHtml(state.selectedIndex, 'queue') + '</div>' +
    (verifyFirst ? verificationGuidancePanel(lead) : '') +
    '<div class="seller-flow-info-strip">' +
      sellerFlowInfoItem('Kontakt', phone || 'Mangler', phone ? 'Direkte telefon tilgjengelig' : 'Finn kontaktvei') +
      websiteInfoItem(lead) +
      sellerFlowInfoItem('Firma', companyIdValue(company), companyIdNote(company)) +
      sellerFlowInfoItem('Sted', city, readable(sourceQuality.locationMatchStatus || 'unknown')) +
      sellerFlowInfoItem('Bevis', proof.title, proof.note) +
    '</div>' +
  '</div>'
}

function sellerFlowInfoItem(label, value, note) {
  return '<div class="seller-flow-info-item"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(String(value || 'Ukjent')) + '</strong><small>' + escapeHtml(String(note || '')) + '</small></div>'
}

function websiteInfoItem(lead) {
  const url = websiteValue(lead.contact?.website || lead.website)
  const verdict = lead.websiteSalesFit || {}
  if (!url) {
    return '<div class="seller-flow-info-item website-info-positive"><span>Nettside</span><strong>Ingen funnet</strong><small>Salgsåpning for nettsidesalg</small></div>'
  }
  const note = verdict.websiteLeadType === 'weak_site' ? 'Svak nettside - se dommen under' : 'Funnet - åpne og vurder selv'
  return '<div class="seller-flow-info-item website-info"><span>Nettside</span><strong><a href="' + escapeAttr(url) + '" target="_blank" rel="noreferrer" title="' + escapeAttr(url) + '">' + escapeHtml(displayUrl(url)) + '</a></strong><small>' + escapeHtml(note) + '</small></div>'
}

function verificationShortLabel(lead = {}) {
  const guidance = verificationGuidance(lead)
  const fusion = sourceFusionForLead(lead)
  if (leadWorkQueue(lead) === 'verify_first') return { title: guidance.primary.title, note: guidance.primary.note }
  return { title: trustActionLabel(fusion.recommendedTrustAction || fusion.leadConfidence || 'review'), note: sourceFusionFooter(fusion) }
}

function leadInfoDetails(lead, command) {
  return '<details class="detail-tool lead-info-collapse"><summary>Info om lead</summary>' +
    '<div class="lead-info-body">' + sellerDeskCards(lead, command, { includeDetails: false }) + sellerDeskCards(lead, command, { includeTop: false }) + sellerCommandCard(command) + osintPanel(lead) + '</div>' +
  '</details>'
}

function mobileCallBar(lead) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const phone = contact.phone || lead.phone || ''
  const callHref = phoneHref(phone)
  const name = company.displayName || lead.companyName || 'Valgt lead'
  const id = mobileLeadDraftId(lead, state.selectedIndex)
  const draft = mobileNoteDraftFor(lead, state.selectedIndex)
  const noteOpen = state.mobileNoteOpenLeadId === id
  return '<aside class="mobile-call-bar queue-row" aria-label="Mobile ringehandlinger" data-mobile-lead-id="' + escapeAttr(id) + '">' +
    '<div class="mobile-call-main"><strong>' + escapeHtml(name) + '</strong><span>' + escapeHtml(phone || workQueueLabel(leadWorkQueue(lead))) + '</span></div>' +
    '<div class="mobile-call-actions">' +
    (callHref ? '<a class="mobile-call-button primary" href="' + escapeAttr(callHref) + '">Ring</a>' : '<span class="mobile-call-button disabled">Ingen tlf</span>') +
    '<button type="button" class="mobile-call-button positive" data-workflow-action="sale" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Salg</button>' +
    '<button type="button" class="mobile-call-button positive" data-workflow-action="interested" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Interessert</button>' +
    '<button type="button" class="mobile-call-button warning" data-workflow-action="no_answer" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Ingen svar</button>' +
    '<button type="button" class="mobile-call-button" data-next-visible-lead ' + nextLeadDisabledAttr() + '>Neste</button>' +
    '<button type="button" class="mobile-call-button more-toggle ' + (state.mobileMoreOpen ? 'active' : '') + '" data-mobile-more aria-expanded="' + escapeAttr(String(Boolean(state.mobileMoreOpen))) + '">&#8943;</button>' +
    '</div>' +
    '<div class="mobile-more-menu" data-mobile-more-menu ' + (state.mobileMoreOpen ? '' : 'hidden') + '>' +
      '<button type="button" data-start-call-focus ' + callFocusStartDisabledAttr() + '>Start ringeøkt</button>' +
      '<button type="button" data-mobile-note-toggle data-lead-id="' + escapeAttr(id) + '">Notat</button>' +
      '<button type="button" data-workflow-action="not_relevant" data-index="' + escapeAttr(String(state.selectedIndex)) + '">Nei</button>' +
    '</div>' +
    '<section class="mobile-note-drawer" ' + (noteOpen ? '' : 'hidden') + '><label><span>Notat lagres med neste utfall</span><textarea data-mobile-note-input data-lead-id="' + escapeAttr(id) + '" rows="3" placeholder="Kort notat etter samtalen">' + escapeHtml(draft) + '</textarea></label><div class="mobile-note-actions"><button type="button" data-mobile-save-note data-index="' + escapeAttr(String(state.selectedIndex)) + '" data-lead-id="' + escapeAttr(id) + '">Lagre notat</button><small>Legges til, erstatter ikke tidligere notater.</small></div></section>' +
  '</aside>'
}

function queueGuidanceNote(lead = {}) {
  const quality = queueQualityForLead(lead)
  if (!quality || !quality.queueMismatch) return ''
  const actualQueue = workQueueLabel(leadWorkQueue(lead))
  const recommendedQueue = workQueueLabel(quality.recommendedQueue)
  return '<p class="queue-guidance-note">System suggests ' + escapeHtml(recommendedQueue) + '; current workflow stays ' + escapeHtml(actualQueue) + ' until you change it.</p>'
}

function verificationGuidancePanel(lead) {
  if (leadWorkQueue(lead) !== 'verify_first') return ''
  const guidance = verificationGuidance(lead)
  return '<section class="verification-guidance-panel">' +
    '<div class="verification-guidance-head"><div><p class="eyebrow">Må verifiseres</p><h3>Sjekk dette før ringing</h3><small>' + escapeHtml(guidance.summary) + '</small></div>' +
    '<button type="button" data-run-verify-enrich data-index="' + escapeAttr(String(state.selectedIndex)) + '">Verifiser firma</button></div>' +
    '<div class="verification-task-grid">' + guidance.tasks.map((task) => (
      '<div class="verification-task"><strong>' + escapeHtml(task.title) + '</strong><span>' + escapeHtml(task.note) + '</span></div>'
    )).join('') + '</div>' +
    '<p class="verification-guidance-note">Etter sjekk: flytt leaden til Ring nå hvis den stemmer, eller logg Nei hvis matchen er feil.</p>' +
  '</section>'
}

function verificationGuidance(lead = {}) {
  const quality = queueQualityForLead(lead) || {}
  const blockers = normalizeList(quality.blockers)
  const warnings = normalizeList(quality.warnings)
  const company = lead.company || {}
  const contact = lead.contact || {}
  const sourceQuality = lead.sourceQuality || {}
  const tasks = []
  const add = (key, title, note) => {
    if (tasks.some((task) => task.key === key)) return
    tasks.push({ key, title, note })
  }

  if (blockers.includes('contact_missing')) add('contact', 'Finn kontaktvei', 'Telefon mangler eller er ikke trygg nok til å prioritere.')
  if (blockers.includes('phone_format_not_norwegian')) add('phone', 'Sjekk telefonnummer', 'Nummeret ser ikke ut som et norsk bedriftsnummer.')
  if (blockers.includes('location_conflict')) add('location', 'Avklar lokasjon', 'Stedet konflikter med søket eller kilden.')
  if (blockers.includes('location_needs_review')) add('location', 'Bekreft riktig by/sted', 'Ikke behandle dette som et eksakt lokalt treff før sted er sjekket.')
  if (blockers.includes('location_missing')) add('location', 'Finn brukbar lokasjon', 'Systemet mangler trygg adresse eller by.')
  if (blockers.includes('candidate_org_number') || company.candidateOrganizationNumber && !company.organizationNumber || String(company.matchStatus || '').toLowerCase() === 'manual_verify') {
    add('identity', 'Bekreft org.nr/navn', company.candidateOrganizationNumber ? 'Brreg har kandidat, men selger bør sjekke at firmaet er riktig.' : 'Identiteten er ikke sikker nok til å prioritere blindt.')
  }
  if (blockers.includes('identity_not_confirmed') || String(company.matchStatus || '').toLowerCase() === 'no_match') {
    add('identity', 'Bekreft firmaidentitet', 'Google fant leaden, men Brreg er ikke bekreftet.')
  }
  if (blockers.includes('source_fusion_verify_first')) add('proof', 'Sjekk bevis/obs', 'Source Fusion anbefaler verifisering før leaden prioriteres.')
  if (String(sourceQuality.verticalMatchStatus || '').toLowerCase() === 'weak') add('category', 'Sjekk kategori', 'Kategorimatchen er svak; kontroller at dette faktisk er riktig bransje.')
  if (String(sourceQuality.verticalMatchStatus || '').toLowerCase() === 'broad') add('category', 'Bekreft bransjematch', 'Lead er funnet via bredt søkeord; sjekk at den passer markedet.')
  if (!tasks.length && warnings.includes('org_not_confirmed_but_callable')) add('identity', 'Ringbar, men org.nr mangler', 'Telefon og sted ser brukbart ut, men org.nr er ikke bekreftet.')
  if (!tasks.length && contact.phone) add('proof', 'Rask bevissjekk', 'Telefon finnes; sjekk identitet/sted før du bruker tid på samtalen.')
  if (!tasks.length) add('proof', 'Rask bevissjekk', 'Se over identitet, kontakt og lokasjon før du prioriterer leaden.')

  const topTasks = tasks.slice(0, 3)
  return {
    primary: topTasks[0],
    tasks: topTasks,
    summary: topTasks.map((task) => task.title).join(' · '),
  }
}

function nextLeadDisabledAttr() {
  return getVisibleLeads(state.result?.leadPacks || []).length > 1 ? '' : 'disabled'
}

function selectNextVisibleLead() {
  clearMobileQueueDone()
  state.mobileNoteOpenLeadId = ''
  const visibleLeads = getVisibleLeads(state.result?.leadPacks || [])
  if (visibleLeads.length <= 1) return
  const currentPosition = Math.max(0, visibleLeads.findIndex(({ id }) => id === state.selectedLeadId))
  const next = visibleLeads[(currentPosition + 1) % visibleLeads.length]
  state.selectedIndex = next.index
  state.selectedLeadId = next.id
  renderAll()
  focusLeadDetail({ block: 'start' })
}

function startCallFocus(mode = 'new') {
  const selectedId = state.selectedLeadId || (state.result?.leadPacks?.[state.selectedIndex] ? leadId(state.result.leadPacks[state.selectedIndex], state.selectedIndex) : '')
  const startLeadId = callFocusCandidates(mode).some(({ id }) => id === selectedId) ? selectedId : ''
  state.mobileNoteOpenLeadId = ''
  state.mobileQueueDone = null
  state.callFocus = { mode, skippedIds: [], logged: { sale: 0, interested: 0, no_answer: 0, not_relevant: 0 }, lastActiveId: '', lastActiveIndex: 0, startLeadId }
  renderAll()
}

function exitCallFocus() {
  const returnEntry = callFocusReturnEntry()
  state.callFocus = null
  if (returnEntry) {
    state.selectedQueue = leadWorkQueue(returnEntry.lead)
    state.selectedIndex = returnEntry.index
    state.selectedLeadId = returnEntry.id
  }
  renderAll()
  if (returnEntry) focusLeadDetail({ block: 'start' })
}

const CALL_FOCUS_QUEUE_RANK = { call_now: 0, verify_first: 1 }

// How the ringeøkt blends website-sales signal: take this many no-website leads
// (the strongest opening), then this many with a website, and repeat. Keeps
// variety in the session instead of grinding one type in a row.
const CALL_FOCUS_NO_WEBSITE_CHUNK = 3
const CALL_FOCUS_HAS_WEBSITE_CHUNK = 2

function interleaveByWebsite(entries) {
  const noWeb = entries.filter(({ lead }) => !websiteValue(lead.contact?.website || lead.website))
  const hasWeb = entries.filter(({ lead }) => websiteValue(lead.contact?.website || lead.website))
  const blended = []
  let i = 0
  let j = 0
  while (i < noWeb.length || j < hasWeb.length) {
    for (let n = 0; n < CALL_FOCUS_NO_WEBSITE_CHUNK && i < noWeb.length; n++) blended.push(noWeb[i++])
    for (let h = 0; h < CALL_FOCUS_HAS_WEBSITE_CHUNK && j < hasWeb.length; h++) blended.push(hasWeb[j++])
  }
  return blended
}

function pinStartLead(entries, startLeadId) {
  if (!startLeadId) return entries
  const pinnedIndex = entries.findIndex(({ id }) => id === startLeadId)
  if (pinnedIndex > 0) entries.unshift(entries.splice(pinnedIndex, 1)[0])
  return entries
}

function followUpDueValue(lead) {
  return String(lead.workflow?.nextFollowUpAt || lead.workflow?.followUpDate || '')
}

// 'new' mode = fresh leads (Ring nå / Verifiser, blended 3:2 by website).
// 'callback' mode = the ring-tilbake-økt: only due follow-ups (the follow_up_today
// queue — yesterday's no-answers + due interested), oldest due first, no blend.
function callFocusCandidates(mode = state.callFocus?.mode || 'new') {
  const leads = state.result?.leadPacks || []
  const startLeadId = state.callFocus?.startLeadId || ''
  const entries = leads.map((lead, index) => ({ lead, index, id: leadId(lead, index) }))

  if (mode === 'callback') {
    const callbacks = entries
      .filter(({ lead }) => leadWorkQueue(lead) === 'follow_up_today')
      .filter(({ lead }) => Boolean(lead.contact?.phone || lead.phone))
      .filter(({ lead }) => matchesCityFilter(lead))
      .sort((a, b) =>
        followUpDueValue(a.lead).localeCompare(followUpDueValue(b.lead))
        || (callQueueSortScore(b.lead) - callQueueSortScore(a.lead)))
    return pinStartLead(callbacks, startLeadId)
  }

  const openRank = { open: 0, unknown: 1, closed: 2 }
  const sorted = entries
    .filter(({ lead }) => CALL_FOCUS_QUEUE_RANK[leadWorkQueue(lead)] !== undefined)
    .filter(({ lead }) => Boolean(lead.contact?.phone || lead.phone))
    .filter(({ lead }) => matchesCityFilter(lead))
    .sort((a, b) =>
      (CALL_FOCUS_QUEUE_RANK[leadWorkQueue(a.lead)] - CALL_FOCUS_QUEUE_RANK[leadWorkQueue(b.lead)])
      || (openRank[openingStatusFor(a.lead).state] - openRank[openingStatusFor(b.lead).state])
      || (callQueueSortScore(b.lead) - callQueueSortScore(a.lead)))
  // Blend by website presence within each queue bucket so call_now still leads,
  // and best-first order survives inside each website stream (filter keeps order).
  const blended = []
  for (const rank of [0, 1]) {
    blended.push(...interleaveByWebsite(sorted.filter(({ lead }) => CALL_FOCUS_QUEUE_RANK[leadWorkQueue(lead)] === rank)))
  }
  // Keep the lead you started the session on pinned to the front.
  return pinStartLead(blended, startLeadId)
}

function callFocusAvailableCount() {
  return callFocusCandidates('new').length
}

function callFocusStartDisabledAttr() {
  return callFocusAvailableCount() ? '' : 'disabled'
}

function callbackFocusAvailableCount() {
  return callFocusCandidates('callback').length
}

function callbackFocusStartDisabledAttr() {
  return callbackFocusAvailableCount() ? '' : 'disabled'
}

function callFocusLeads() {
  if (!state.callFocus) return []
  return callFocusCandidates().filter(({ id }) => !state.callFocus.skippedIds.includes(id))
}

function syncSelectedLeadToActiveCallFocus(visibleLeads) {
  const entry = callFocusLeads(visibleLeads)[0]
  if (!entry) return null
  rememberCallFocusEntry(entry)
  return entry
}

function rememberCallFocusEntry(entry) {
  if (!state.callFocus || !entry) return
  state.callFocus.lastActiveId = entry.id
  state.callFocus.lastActiveIndex = entry.index
  state.selectedIndex = entry.index
  state.selectedLeadId = entry.id
}

function callFocusReturnEntry() {
  if (!state.callFocus) return null
  const active = callFocusLeads()[0]
  if (active) {
    rememberCallFocusEntry(active)
    return active
  }
  const leads = state.result?.leadPacks || []
  const lastId = state.callFocus.lastActiveId
  if (lastId) {
    const foundIndex = leads.findIndex((lead, index) => leadId(lead, index) === lastId)
    if (foundIndex >= 0) return { lead: leads[foundIndex], index: foundIndex, id: lastId }
  }
  const lastIndex = Number(state.callFocus.lastActiveIndex)
  if (Number.isInteger(lastIndex) && leads[lastIndex]) {
    return { lead: leads[lastIndex], index: lastIndex, id: leadId(leads[lastIndex], lastIndex) }
  }
  return null
}

function callFocusLoggedCount() {
  return Object.values(state.callFocus?.logged || {}).reduce((sum, count) => sum + Number(count || 0), 0)
}

function callFocusModeLabel() {
  return state.callFocus?.mode === 'callback' ? 'Ring-tilbake-økt' : 'Ringeøkt'
}

function callFocusWebsiteAction(lead) {
  const url = websiteValue(lead.contact?.website || lead.website)
  if (!url) {
    return '<div class="call-focus-website missing"><span>Nettside</span><strong>Ingen nettside funnet</strong><small>Salgsåpning for nettsidesalg</small></div>'
  }
  const verdict = lead.websiteSalesFit || {}
  const note = verdict.websiteLeadType === 'site_unverified' ? 'Sjekk nettsiden før du vurderer leaden' : 'Åpne og vurder nettsiden'
  return '<a class="call-focus-website" href="' + escapeAttr(url) + '" target="_blank" rel="noreferrer" title="' + escapeAttr(url) + '">' +
    '<span>Nettside</span><strong>' + escapeHtml(displayUrl(url)) + '</strong><small>' + escapeHtml(note) + '</small>' +
  '</a>'
}


function leadDisplayName(lead = {}) {
  const company = lead.company || {}
  return company.displayName || lead.companyName || company.legalName || company.candidateLegalName || 'Ukjent firma'
}

function isSalesLead(lead = {}) {
  const workflow = lead.workflow || {}
  const status = String(workflow.status || '').toLowerCase()
  const response = String(workflow.response || '').toLowerCase()
  return leadWorkQueue(lead) === 'interested' || status === 'interested' || response === 'interested' || response === 'meeting_booked'
}

function positiveOutcomeLabel(lead = {}) {
  const workflow = lead.workflow || {}
  const response = String(workflow.response || '').toLowerCase()
  const outcome = String(workflow.outcome || '').toLowerCase()
  if (response === 'meeting_booked' || outcome.includes('sale') || outcome.includes('salg')) return 'Salg'
  if (response === 'interested' || outcome.includes('interessert')) return 'Interessert'
  return 'SALG'
}

function workflowSortTime(workflow = {}) {
  const activities = Array.isArray(workflow.activities) ? workflow.activities : []
  const latestActivity = activities.reduce((latest, activity) => String(activity.at || '') > latest ? String(activity.at || '') : latest, '')
  return workflow.updatedAt || latestActivity || workflow.lastContactedAt || workflow.nextFollowUpAt || workflow.followUpDate || ''
}

function callFocusSalesEntries() {
  return (state.result?.leadPacks || [])
    .map((lead, index) => ({ lead, index, id: leadId(lead, index), time: workflowSortTime(lead.workflow || {}) }))
    .filter(({ lead }) => isSalesLead(lead))
    .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')) || leadDisplayName(a.lead).localeCompare(leadDisplayName(b.lead), 'nb'))
}

function callFocusSalesSidebar(activeLead) {
  const salesEntries = callFocusSalesEntries()
  return '<aside class="call-focus-sidebar" aria-label="Salg og historikk">' +
    callFocusSessionPanel() +
    '<section class="call-focus-side-panel call-focus-sales-panel"><div class="call-focus-side-head"><span>SALG</span><strong>' + escapeHtml(String(salesEntries.length)) + '</strong></div>' +
      (salesEntries.length ? '<ol class="call-focus-sales-list">' + salesEntries.slice(0, 7).map(salesLeadRow).join('') + '</ol>' : '<p class="call-focus-side-empty">Ingen leads lagret som SALG ennå.</p>') +
    '</section>' +
    (activeLead ? callFocusHistoryPanel(activeLead) : '') +
  '</aside>'
}

function salesLeadRow({ lead }) {
  const workflow = lead.workflow || {}
  const city = lead.contact?.city || lead.city || ''
  const phone = lead.contact?.phone || lead.phone || ''
  const followUp = workflow.nextFollowUpAt || workflow.followUpDate || ''
  const note = latestLeadNote(lead) || workflow.nextAction || (followUp ? 'Oppfølging ' + followUp : '')
  return '<li>' +
    '<div><span class="call-focus-sales-tag">' + escapeHtml(positiveOutcomeLabel(lead)) + '</span><strong>' + escapeHtml(leadDisplayName(lead)) + '</strong></div>' +
    '<small>' + escapeHtml([city, phone].filter(Boolean).join(' · ') || 'Kontaktinfo mangler') + '</small>' +
    (note ? '<p>' + escapeHtml(note) + '</p>' : '') +
  '</li>'
}

function callFocusSessionPanel() {
  const logged = state.callFocus?.logged || {}
  const skipped = state.callFocus?.skippedIds?.length || 0
  return '<section class="call-focus-side-panel call-focus-session-panel"><div class="call-focus-side-head"><span>Logg</span><strong>Denne økten</strong></div>' +
    '<div class="call-focus-session-grid">' +
      '<div><strong>' + escapeHtml(String(logged.sale || 0)) + '</strong><span>Salg</span></div>' +
      '<div><strong>' + escapeHtml(String(logged.interested || 0)) + '</strong><span>Interessert</span></div>' +
      '<div><strong>' + escapeHtml(String(logged.no_answer || 0)) + '</strong><span>Ingen svar</span></div>' +
      '<div><strong>' + escapeHtml(String(logged.not_relevant || 0)) + '</strong><span>Nei</span></div>' +
      '<div><strong>' + escapeHtml(String(skipped)) + '</strong><span>Hoppet over</span></div>' +
    '</div></section>'
}

function callFocusHistoryPanel(lead = {}) {
  const workflow = lead.workflow || {}
  const activities = (Array.isArray(workflow.activities) ? workflow.activities : []).slice(-6).reverse()
  const notes = leadNoteLines(lead).slice(-3).reverse()
  const status = isSalesLead(lead) ? '<span class="call-focus-sales-tag">' + escapeHtml(positiveOutcomeLabel(lead)) + '</span>' : badge(leadWorkQueue(lead))
  return '<section class="call-focus-side-panel call-focus-history-panel"><div class="call-focus-side-head"><span>Historikk</span><strong>' + escapeHtml(leadDisplayName(lead)) + '</strong></div>' +
    '<div class="call-focus-history-status">' + status + '<small>' + escapeHtml(workflow.response ? readable(workflow.response) : 'Ingen respons lagret') + '</small></div>' +
    (activities.length ? '<ol class="call-focus-history-list">' + activities.map((activity) => '<li><div><strong>' + escapeHtml(readable(activity.type || activity.status || 'note')) + '</strong><span>' + escapeHtml(formatActivityTime(activity.at)) + '</span></div><p>' + escapeHtml(activitySummary(activity)) + '</p></li>').join('') + '</ol>' : '<p class="call-focus-side-empty">Ingen historikk på denne leaden ennå.</p>') +
    (notes.length ? '<div class="call-focus-history-notes"><span>Notater</span>' + notes.map((note) => '<p>' + escapeHtml(note) + '</p>').join('') + '</div>' : '') +
  '</section>'
}

function renderCallFocus() {
  const overlay = els.callFocusOverlay
  if (!overlay) return
  if (!state.callFocus) {
    overlay.hidden = true
    overlay.innerHTML = ''
    document.body.classList.remove('call-focus-open')
    return
  }
  overlay.hidden = false
  document.body.classList.add('call-focus-open')
  const entries = callFocusLeads()
  const entry = entries[0]
  if (!entry) {
    const logged = state.callFocus.logged
    const skipped = state.callFocus.skippedIds.length
    overlay.innerHTML = '<div class="call-focus-layout"><div class="call-focus-card call-focus-done">' +
      '<header class="call-focus-head"><div><p class="eyebrow">' + callFocusModeLabel() + '</p><strong>Økt ferdig</strong></div><button type="button" class="call-focus-exit" data-call-focus-exit>Lukk</button></header>' +
      '<h2>Ingen flere ringbare leads</h2>' +
      '<ul class="call-focus-summary">' +
        '<li><strong>' + escapeHtml(String(logged.sale || 0)) + '</strong> salg</li>' +
        '<li><strong>' + escapeHtml(String(logged.interested || 0)) + '</strong> interessert</li>' +
        '<li><strong>' + escapeHtml(String(logged.no_answer || 0)) + '</strong> ingen svar</li>' +
        '<li><strong>' + escapeHtml(String(logged.not_relevant || 0)) + '</strong> nei</li>' +
        (skipped ? '<li><strong>' + escapeHtml(String(skipped)) + '</strong> hoppet over uten logg</li>' : '') +
      '</ul>' +
      '<p class="call-focus-meta">Ingen svar-leads har fått oppfølging i morgen automatisk. Leads lagret positivt ligger under SALG.</p>' +
    '</div>' +
    callFocusSalesSidebar(null) +
  '</div>'
    return
  }
  const lead = entry.lead
  const company = lead.company || {}
  const phone = lead.contact?.phone || lead.phone || ''
  const callHref = phoneHref(phone)
  overlay.innerHTML = '<div class="call-focus-layout"><div class="call-focus-card">' +
    '<header class="call-focus-head"><div><p class="eyebrow">' + callFocusModeLabel() + '</p><strong>' + escapeHtml(String(entries.length)) + ' igjen · ' + escapeHtml(String(callFocusLoggedCount())) + ' logget</strong></div><button type="button" class="call-focus-exit" data-call-focus-exit>Avslutt</button></header>' +
    '<div class="badge-row">' + websiteSalesBadge(lead) + badge(leadWorkQueue(lead)) + badge(brregStatusLabel(company)) + badge(lead.sourceQuality?.locationMatchStatus) + fastBadge(lead) + '</div>' +
    '<h2>' + googleNameLink(lead, company.displayName || lead.companyName || 'Ukjent firma') + '</h2>' +
    '<p class="call-focus-meta">' + escapeHtml([lead.contact?.city || lead.city, company.legalName || company.candidateLegalName].filter(Boolean).join(' · ') || 'Sted ukjent') + '</p>' +
    (callHref
      ? '<a class="call-focus-phone" href="' + escapeAttr(callHref) + '">' + escapeHtml(phone) + '</a>' + openingStatusHtml(lead) + '<a class="call-focus-call" href="' + escapeAttr(callHref) + '">Ring nå</a>'
      : '<p class="call-focus-phone disabled">Ingen telefon</p>') +
    callFocusWebsiteAction(lead) +
    websiteSalesPanel(lead) +
    (latestLeadNote(lead) ? '<p class="call-focus-last-note">Siste notat: ' + escapeHtml(latestLeadNote(lead)) + '</p>' : '') +
    '<label class="call-focus-note"><span>Kort notat (valgfritt, lagres med utfallet)</span><textarea id="callFocusNote" rows="2" placeholder="Hva skjedde i samtalen?"></textarea></label>' +
    '<div class="call-focus-action-dock">' +
      '<div class="call-focus-outcomes">' +
        '<button type="button" class="call-focus-outcome positive" data-call-focus-outcome="sale">Salg</button>' +
        '<button type="button" class="call-focus-outcome positive" data-call-focus-outcome="interested">Interessert</button>' +
        '<button type="button" class="call-focus-outcome warning" data-call-focus-outcome="no_answer">Ingen svar</button>' +
        '<button type="button" class="call-focus-outcome negative" data-call-focus-outcome="not_relevant">Nei</button>' +
      '</div>' +
      '<div class="call-focus-secondary"><button type="button" class="call-focus-skip" data-call-focus-skip>Hopp over uten logg</button><span class="call-focus-keys">Taster: 1 Salg · 2 Interessert · 3 Ingen svar · 4 Nei · Esc avslutt</span></div>' +
    '</div>' +
  '</div>' +
  callFocusSalesSidebar(lead) +
'</div>'
}

async function runCallFocusOutcome(action, button) {
  const entry = callFocusLeads()[0]
  if (!entry || !state.callFocus) return
  rememberCallFocusEntry(entry)
  const lead = entry.lead
  const note = String(document.getElementById('callFocusNote')?.value || '').trim()
  const current = { ...(lead.workflow || {}) }
  if (note) current.notes = [cleanWorkflowNote(current.notes), note].filter(Boolean).join('\n')
  const workflow = buildQuickWorkflow(action, current)
  if (!workflow) return setStatus('feilet: ukjent hurtighandling', 'failed')
  workflow.owner = currentOwner() || workflow.owner || ''
  if (button) { button.disabled = true; button.textContent = 'Lagrer...' }
  try {
    const response = await apiFetch('/api/workflow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.workflow?.leadId || entry.id,
        runId: state.result?.runId,
        leadName: lead.company?.displayName || lead.companyName || '',
        workflow,
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Workflow quick action failed')
    lead.workflow = payload.workflow
    syncLeadQueueQuality(lead)
    state.callFocus.logged[action] = (state.callFocus.logged[action] || 0) + 1
    await refreshCommandCenter()
    clearStatus()
    renderAll()
  } catch (error) {
    setStatus(`failed: ${error.message || 'Workflow quick action failed'}`, 'failed')
    renderCallFocus()
  }
}

function skipCallFocusLead() {
  const entry = callFocusLeads()[0]
  if (!entry || !state.callFocus) return
  rememberCallFocusEntry(entry)
  state.callFocus.skippedIds.push(entry.id)
  renderAll()
}

document.addEventListener('keydown', (event) => {
  if (!state.callFocus) return
  if (event.key === 'Escape') { exitCallFocus(); return }
  const target = event.target
  if (target && ['TEXTAREA', 'INPUT', 'SELECT'].includes(target.tagName)) return
  const action = { 1: 'sale', 2: 'interested', 3: 'no_answer', 4: 'not_relevant' }[event.key]
  if (action) runCallFocusOutcome(action)
})

function workflowPanel(lead) {
  const workflow = { status: 'new', queue: leadWorkQueue(lead), owner: currentOwner(), contacted: false, channel: '', response: '', personReached: '', notes: '', followUpDate: '', nextFollowUpAt: '', lastContactedAt: '', nextAction: 'review', outcome: '', archivedAt: '', activities: [], ...(lead.workflow || {}) }
  const currentQueue = leadWorkQueue({ ...lead, workflow })
  workflow.queue = currentQueue
  workflow.nextFollowUpAt = workflow.nextFollowUpAt || workflow.followUpDate || ''
  const queueGuidance = queueGuidanceNote({ ...lead, workflow })
  const phone = lead.contact?.phone || lead.phone || ''
  const callHref = phoneHref(phone)
  const savedText = workflow.updatedAt ? `Lagret ${escapeHtml(workflow.updatedAt)}` : 'Ikke lagret ennå'
  const lastContacted = workflow.lastContactedAt ? formatActivityTime(workflow.lastContactedAt) : 'Ikke kontaktet ennå'
  const nextFollowUp = workflow.nextFollowUpAt || workflow.followUpDate || 'Ikke satt'
  return `<section class="workflow-panel compact-workflow-panel seller-next-panel">
    <div class="workflow-head compact-workflow-head">
      <div>
        <p class="eyebrow">Steg 3</p>
        <h3>Tekst og oppfølging</h3>
        <p class="note-procedure">Skriv kort hva som skjedde, velg utfall og sett neste dato.</p>
      </div>
      <div class="workflow-head-actions">
        ${badge(currentQueue)}
        ${badge(workflow.status || 'new')}
        ${callHref ? '<a class="call-now compact-call" href="' + escapeAttr(callHref) + '">Ring nå</a>' : ''}
      </div>
    </div>
    <div class="workflow-state-strip seller-next-state">
      ${commandMetric('Nåværende kø', workQueueLabel(currentQueue), workQueueReason({ ...lead, workflow }, currentQueue))}
      ${commandMetric('Sist kontaktet', lastContacted, workflow.response ? readable(workflow.response) : 'Ingen utfall logget ennå')}
      ${commandMetric('Neste oppfølging', nextFollowUp, followUpTiming(workflow.nextFollowUpAt || workflow.followUpDate) === 'overdue' ? 'Forfalt oppfølging' : 'Datoen styrer oppfølgingskøen')}
    </div>
    ${queueGuidance}
    <form id="workflowForm" class="workflow-form compact-workflow-form seller-next-form">
      <input type="hidden" name="queue" value="${escapeAttr(currentQueue)}">
      <input type="hidden" name="status" value="${escapeAttr(workflow.status || 'new')}">
      <label><span>Utfall</span><select name="response">${workflowOptions(['', 'no_answer', 'no_response', 'negative', 'neutral', 'interested', 'meeting_booked'], workflow.response)}</select></label>
      <label><span>Oppfølging</span><input type="date" name="followUpDate" value="${escapeAttr(workflow.followUpDate || workflow.nextFollowUpAt || '')}"></label>
      <label class="workflow-next-action"><span>Neste handling</span><input name="nextAction" value="${escapeAttr(workflow.nextAction || '')}" placeholder="ring igjen / send info / book møte"></label>
      <label class="workflow-notes compact-notes"><span>Kort notat</span><textarea name="notes" rows="3" placeholder="Kort notat etter samtalen">${escapeHtml(formatWorkflowNotes(workflow.notes || ''))}</textarea></label>
      <input type="hidden" name="contacted" value="${escapeAttr(String(Boolean(workflow.contacted)))}">
      <input type="hidden" name="channel" value="${escapeAttr(workflow.channel || '')}">
      <input type="hidden" name="personReached" value="${escapeAttr(workflow.personReached || '')}">
      <input type="hidden" name="outcome" value="${escapeAttr(workflow.outcome || '')}">
      <input type="hidden" name="owner" value="${escapeAttr(workflow.owner || '')}">
      <input type="hidden" name="lastContactedAt" value="${escapeAttr(workflow.lastContactedAt || '')}">
      <input type="hidden" name="archivedAt" value="${escapeAttr(workflow.archivedAt || '')}">
      <div class="workflow-actions compact-save"><small>${savedText}</small><button type="submit" data-save-note>Lagre</button><button type="button" class="secondary-action" data-archive-lead>Arkiv</button></div>
      <details class="workflow-more">
        <summary>Flere felt</summary>
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
  return `<section class="activity-timeline"><div class="activity-timeline-head"><h4>Aktivitetslogg</h4><span>${activities.length ? (activities.length + ' siste') : 'Ingen lagret logg ennå'}</span></div>${activities.length ? `<ol>${activities.map((activity) => `
    <li><div><strong>${escapeHtml(readable(activity.status || 'new'))}</strong><span>${escapeHtml(formatActivityTime(activity.at))}</span></div><p>${escapeHtml(activitySummary(activity))}</p></li>`).join('')}</ol>` : '<p class="muted">Lagre et notat eller bruk en hurtigknapp for å logge første aktivitet.</p>'}</section>`
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
    activity.toQueue ? `Kø: ${workQueueLabel(activity.toQueue)}` : activity.queue ? `Kø: ${workQueueLabel(activity.queue)}` : '',
    activity.channel ? `Kanal: ${readable(activity.channel)}` : '',
    activity.response ? `Respons: ${readable(activity.response)}` : '',
    activity.personReached ? `Person: ${activity.personReached}` : '',
    activity.followUpDate ? `Oppfølging: ${activity.followUpDate}` : '',
    activity.nextAction ? `Neste: ${activity.nextAction}` : '',
    cleanWorkflowNote(activity.notes) ? `Notat: ${cleanWorkflowNote(activity.notes)}` : '',
  ].filter(Boolean).join(' · ') || 'Notat lagret.'
}

function workflowOptions(values, selected) {
  return values.map((value) => `<option value="${escapeAttr(value)}" ${String(value) === String(selected || '') ? 'selected' : ''}>${escapeHtml(value ? readable(value) : 'Ikke satt')}</option>`).join('')
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
  return lead.contact?.website ? 'website found' : 'nettside ukjent'
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
    saveButton.textContent = 'Lagrer...'
  }
  if (saveText) saveText.textContent = 'Lagrer notat...'
  formElement.querySelectorAll('[data-workflow-sync]').forEach((field) => {
    const target = formElement.elements[field.dataset.workflowSync]
    if (target) target.value = field.value
  })
  try {
    const lead = state.result?.leadPacks?.[state.selectedIndex]
    if (!lead) throw new Error('Ingen valgt lead å lagre')
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
    setStatus('lagrer notat...', 'running')
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
    if (!response.ok) throw new Error(payload.error || 'Lagring av notat feilet')
    lead.workflow = payload.workflow
    syncLeadQueueQuality(lead)
    await refreshCommandCenter()
    if (saveText) saveText.textContent = 'Lagret nå'
    setStatus('notat lagret', '')
    renderAll()
  } catch (error) {
    const message = noteSaveErrorMessage(error)
    if (saveText) saveText.textContent = message
    setStatus('failed: ' + message, 'failed')
  } finally {
    formElement.dataset.saving = ''
    if (saveButton) {
      saveButton.disabled = false
      saveButton.textContent = originalButtonText || 'Lagre'
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
  if (needsNoAnswerFollowUp && (!workflow.nextAction || workflow.nextAction === 'review')) workflow.nextAction = 'ring igjen'
  if (needsInterestedFollowUp && (!workflow.nextAction || workflow.nextAction === 'review')) workflow.nextAction = 'følg opp interessert lead'
  return workflow
}

function noteSaveErrorMessage(error) {
  const detail = error && error.message ? String(error.message) : 'Lagring av notat feilet'
  if (/fetch|network|load failed/i.test(detail)) return 'Kunne ikke lagre - lokal server kjører ikke. Start den på nytt og prøv igjen.'
  return 'Could not save - ' + detail
}

function fastBadge(lead) {
  return isFastLead(lead) ? '<span class="badge audit-skipped">Raskt søk</span>' : ''
}

function isFastLead(lead) {
  return lead?.meta?.mode === 'fast' || lead?.website?.auditStatus === 'skipped_fast_mode' || lead?.leadClass === 'fast_discovery'
}

function enrichmentTool(lead) {
  if (isHostedContextRefresh(lead)) return `<section class="detail-tool detail-tool-status"><strong>Verifiser firma (hosted)</strong><span>Lett firma-/kontakt-/kildeoppfrisking. Full lokal sjekk er ikke kjørt.</span></section>`
  if (!isFastLead(lead)) return `<section class="detail-tool detail-tool-status"><strong>Verified & enriched</strong><span>Selected-lead verification has run. Digital synlighet is one secondary module.</span></section>`
  return `<section class="detail-tool enrichment-tool">
    <div><strong>Trenger du sterkere bevis?</strong><span>Hold tempoet - kjør sjekken bare når leaden er verdt en grundig identitets-, kontakt- og kildesjekk.</span></div>
    <button type="button" id="runDeepQualification">Verifiser firma</button>
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
    { name: 'Nettsidesjekk', status: isFastLead(lead) ? 'not_run' : (website.auditStatus || 'completed'), summary: isFastLead(lead) ? 'Run enrichment to check digital presence.' : 'Digitale signaler er lagt ved.' },
    { name: 'Brreg verification', status: company.organizationNumber ? 'completed' : company.candidateOrganizationNumber ? 'manual_verify' : brregStatusLabel(company), summary: company.organizationNumber ? 'Offisiell identitet er bekreftet.' : company.candidateOrganizationNumber ? 'Kandidat-identitet må verifiseres manuelt.' : 'Ikke bekreftet i raskt søk; Verifiser firma prøver Brreg på nytt.' },
    { name: 'Økonomi / Proff', status: economy.status || 'not_enabled', summary: economyModuleSummary(economy) },
    { name: 'Sosiale/kildesignaler', status: 'not_enabled', summary: 'Senere modul: Facebook, LinkedIn, nyheter og offentlige kildelenker.' },
    { name: 'Beslutningstakere', status: 'not_enabled', summary: 'Senere modul: offentlige rolle-/kontakthint når tilgjengelig.' },
    { name: 'Nylig aktivitet', status: 'not_enabled', summary: 'Senere modul: ansettelser, nyheter, nettsideendringer og offentlig aktivitet.' },
    { name: 'Selgermatch-sammendrag', status: command.sellerReadinessKey === 'weak' ? 'manual_verify' : 'completed', summary: 'Bruker kontakt-, firma-, sted- og kildesignaler.' },
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
    ['Firmaidentitet', osint.companyIdentity],
    ['Kontaktbarhet', osint.contactability],
    ['Digital synlighet', osint.digitalPresence],
    ['Markedsbevis', osint.marketProof],
    ['Nylig aktivitet', osint.recentActivity],
    ['Risiko / verifiser', osint.riskVerify],
  ]
  return '<details class="detail-collapse osint-panel" open>' +
    '<summary>OSINT public evidence</summary>' +
    '<section class="osint-summary">' +
      commandMetric('Bevis', String(summary.evidenceCount || 0), 'Offentlige firmasignaler funnet') +
      commandMetric('Risks', String(summary.riskCount || 0), 'Checks before seller use') +
      commandMetric('Kilder', String(summary.sourceCount || 0), 'Offentlige kildereferanser') +
    '</section>' +
    '<div class="source-grid osint-grid">' +
      groups.map(([title, items]) => osintGroupCard(title, items)).join('') +
      sourceCard('OSINT sources', osint.status || 'completed', [
        ['Modus', readable(osint.mode || 'selected_lead')],
        ['Observed', osint.observedAt || 'unknown'],
        ['Toppsignal', (summary.topSignals || [])[0] || 'none'],
        ['Top risk', (summary.topRisks || [])[0] || 'none'],
      ]) +
    '</div>' +
  '</details>'
}

function osintGroupCard(title, items) {
  const list = Array.isArray(items) ? items.slice(0, 4) : []
  const rows = list.length
    ? list.map((item) => [item.label || 'Signal', osintSignalText(item)])
    : [['Status', 'Ingen offentlige bevis registrert ennå']]
  const status = title.toLowerCase().includes('risk') && list.length ? 'verify' : list.length ? 'completed' : 'not_run'
  return sourceCard(title, status, rows)
}

function osintSignalText(item = {}) {
  const value = item.value || 'unknown'
  const source = item.source && item.source.name ? item.source.name : 'offentlig kilde'
  return value + ' (' + (item.confidence || 'medium') + ' confidence, ' + source + ')'
}

function osintSummaryText(osint = {}) {
  const summary = osint.summary || {}
  return String(summary.evidenceCount || 0) + ' bevissignaler, ' + String(summary.riskCount || 0) + ' checks, ' + String(summary.sourceCount || 0) + ' sources.'
}

function economyModuleSummary(economy = {}) {
  if (economy.status === 'success') return 'Proff-økonomifelt legges ved for bekreftet org.nr.'
  if (economy.status === 'disabled') return 'Set PROFF_API_KEY to enable Proff enrichment.'
  if (economy.status === 'not_eligible') return 'Hoppet over fordi org.nr ikke er bekreftet.'
  if (economy.status === 'error') return 'Proff lookup failed; retry later.'
  return 'Krever bekreftet org.nr og Proff-integrasjon.'
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
      ${commandMetric('Beste første kontakt', command.bestContact, command.bestContactNote)}
      ${commandMetric('Bedriftstype', command.businessType, command.businessTypeNote)}
      ${commandMetric('Firmaidentitet', command.verification, command.verificationNote)}
      ${commandMetric('Sjekk før bruk', command.mainRisk, command.mainRiskNote)}
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
    ['Juridisk navn', company.legalName || company.candidateLegalName || 'unknown'],
    ['Org.nr', company.organizationNumber || company.candidateOrganizationNumber || 'unknown'],
    ['Ansatte', company.employees ?? 'unknown'],
    ['NACE', [company.naceCode, company.naceDescription].filter(Boolean).join(' - ') || 'unknown'],
  ]
  const contactRows = [
    ['Telefon', phoneLink(contact.phone || lead.phone || 'unknown')],
    ['E-post', contact.email || lead.email || 'unknown'],
    ['Nettside', websiteUrl ? link(websiteUrl) : noWebsiteSignal()],
    ['Adresse', locationText],
  ]
  const marketRows = [
    ['Google', formatRating(places)],
    ['Sted', readable(sourceQuality.locationMatchStatus || 'unknown')],
    ['Treff', discoveryQuality.score == null ? readable(discoveryQuality.level || sourceQuality.discoveryConfidence || 'unknown') : `${discoveryQuality.score}/100`],
    ['Presence', sourceQuality.presenceSource || places.provider || 'unknown'],
  ]
  const fitRows = [
    ['Selgermatch', command.sellerReadiness],
    ['Modus', sellerIntentLabel(fit.sellerIntent || state.result?.summary?.sellerIntent)],
    ['Anbefalt handling', command.nextAction],
    ['Why', fitReasonText],
  ]
  const actionRows = [
    ['Viktige signaler', normalizeList(fit.importantSignals).slice(0, 2).map(humanize).join(', ') || command.nextActionNote],
    ['Digital synlighet', command.websiteOpportunity],
    ['Kildetrygghet', command.sourceConfidence],
    ['Neste handling', command.nextAction],
  ]
  const qualificationRows = [
    ['Modus', isFastLead(lead) ? 'Rask kandidat' : 'Verifisert/beriket'],
    ['Fit', command.sellerReadiness],
    ['Digital synlighet', command.websiteOpportunity],
    ['Hovedrisiko', command.mainRisk],
    ['Kildetrygghet', command.sourceConfidence],
  ]
  const riskRows = [
    ['Verifisering', command.verification],
    ['Risikogrunner', riskReasonText],
    ['Varsler', normalizeList(company.warnings).map(humanize).join(', ') || 'none'],
    ['Økonomi', readable(economy.status || 'not_enabled')],
    ['Eksportstatus', company.organizationNumber ? 'identitet klar' : company.candidateOrganizationNumber ? 'verifiser kandidat-org.nr' : 'identitet ikke bekreftet'],
  ]
  const proofRiskRows = [
    ['Google', formatRating(places)],
    ['Sted', readable(sourceQuality.locationMatchStatus || 'unknown')],
    ['Verifisering', command.verification],
    ['Hovedsjekk', command.mainRisk],
  ]
  const confidenceRows = [
    ['Lead-trygghet', leadConfidenceLabel(fusion.leadConfidence)],
    ['Tillitshandling', trustActionLabel(fusion.recommendedTrustAction)],
    ['Identitet', identityConfidenceLabel(fusion.identityConfidence)],
    ['Contact', contactConfidenceLabel(fusion.contactConfidence)],
    ['Sted', locationConfidenceLabel(fusion.locationConfidence)],
  ]
  const sourceCoverageRows = [
    ['Kildedekning', fusionSummary.coverage || 'none'],
    ['Verifiserte felt', fusionSummary.verified || 'none'],
    ['Bevis', fusionSummary.proof || 'none'],
    ['Risiko', fusionSummary.risk || 'none'],
    ['Varsler', fusionSummary.warnings || 'none'],
  ]

  const topCards = `<section class="seller-desk-v2 lead-brief-grid">
    ${sellerDeskCard('Contact', contact.phone ? 'phone_available' : 'contact_missing', contactRows, command.bestContactNote)}
    ${sellerDeskCard('Firma', orgStatus, identityRows, brregPublicLink(company))}
    ${sellerDeskCard('Bevis og sjekker', command.verification === 'Bekreftet org.nr' ? 'confirmed_org' : sourceQuality.locationMatchStatus || command.sellerReadinessKey, proofRiskRows, command.mainRiskNote)}
    ${sellerDeskCard('Bevis og trygghet', fusion.recommendedTrustAction || fusion.leadConfidence, confidenceRows, sourceFusionFooter(fusion))}
  </section>`
  const details = `<details class="detail-collapse lead-brief-details">
    <summary>Kvalifisering og verifiseringsdetaljer</summary>
    <div class="seller-desk-v2 secondary-brief-grid">
      ${sellerDeskCard('Firmamatch', command.sellerReadinessKey, fitRows, 'Selgermatch tolker eksisterende data; den endrer ikke kildene.')}
      ${sellerDeskCard('Kildedekning', fusion.leadConfidence || 'unknown', sourceCoverageRows, 'Brreg er juridisk identitet; nettside/kontakt er ett kildesignal.')}
      ${sellerDeskCard('Markedsbevis', sourceQuality.locationMatchStatus || 'unknown', marketRows, places.placeId ? `Sted-ID: ${places.placeId}` : '')}
      ${sellerDeskCard('Salgssignaler', command.sellerReadinessKey, actionRows, 'Ingen manus genereres; selgeren eier vinkel og ordlyd.')}
      ${sellerDeskCard('Risiko / verifiser', command.verification === 'Bekreftet org.nr' ? 'confirmed_org' : command.sellerReadinessKey, riskRows, command.mainRiskNote)}
      ${sellerDeskCard('Kvalifisering', isFastLead(lead) ? 'audit_skipped' : 'completed', qualificationRows, isFastLead(lead) ? 'Verifiser firma har ikke kjørt ennå.' : 'Verifiseringsmoduler er inkludert.')}
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
  const companyFit = fitScore >= 7 ? 'Strong fit' : fitScore >= 5 ? 'Good fit' : fitScore >= 3 ? 'Vurder match' : 'Weak fit'
  const companyFitNote = [
    exactLocation ? 'right location' : 'sted må sjekkes',
    confirmedOrg ? 'bekreftet identitet' : candidateOrg ? 'kandidat-identitet' : 'identitet ikke verifisert',
    hasPhone ? 'telefon finnes' : 'telefon mangler',
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
    strong: 'Klar nå',
    good: 'Brukbar kontakt',
    verify: 'Verifiser først',
    weak: 'Trenger kontakt',
  }[sellerReadinessKey]

  const websiteOpportunity = {
    high: 'Strong digital signal',
    medium: 'Medium digital signal',
    low: 'Low digital signal',
    verify: fast ? 'Ikke sjekket ennå' : 'Må vurderes',
  }[priority] || 'Må vurderes'
  const websiteOpportunityNote = fast
    ? 'Nettsiden er ikke vurdert ennå.'
    : priority === 'low'
      ? 'Digital synlighet did not show strong pain; this can still be a usable B2B lead.'
      : 'Digitale signaler kan støtte selgeren der det er relevant.'

  const bestContact = hasPhone ? (contact.phone || lead.phone) : (contact.email || lead.email || 'unknown')
  const bestContactNote = hasPhone ? 'Direkte telefon er tilgjengelig.' : contact.email ? 'E-post finnes, telefon mangler.' : 'Finn en direkte kontakt før salgsarbeid.'
  const businessType = businessActivityLabel(company) || 'Ukjent aktivitet'
  const businessTypeNote = businessType === 'Ukjent aktivitet'
    ? 'Ingen NACE/bransjeaktivitet funnet ennå.'
    : 'Registrert bransjeaktivitet fra Brreg/NACE.'

  const verification = confirmedOrg ? 'Bekreftet org.nr' : candidateOrg ? 'Kandidat org.nr' : brregUnavailable ? 'Identitet uavklart' : 'Ikke verifisert'
  const verificationNote = confirmedOrg ? `${company.organizationNumber} · ${company.matchConfidence ?? 'ukjent'} treffsikkerhet` : candidateOrg ? 'Verifiser manuelt før eksport.' : brregUnavailable ? 'Brreg ikke bekreftet i raskt søk; bruk Verifiser firma for nytt forsøk.' : 'Brreg fant ingen bekreftet identitet.'

  let mainRisk = 'Lav datarisiko'
  let mainRiskNote = 'Kontakt- og identitetsfeltene ser brukbare ut.'
  if (!hasPhone) {
    mainRisk = 'Ingen direkte telefon'
    mainRiskNote = 'Vanskelig å bruke til ringing før kontaktdata er bedre.'
  } else if (!confirmedOrg && candidateOrg) {
    mainRisk = 'Identitet usikker'
    mainRiskNote = 'Kandidat-org.nr må verifiseres.'
  } else if (!exactLocation) {
    mainRisk = 'Sted via fallback'
    mainRiskNote = 'Do not treat this as an exact local lead.'
  } else if (fast) {
    mainRisk = contact.website ? 'Nettside uvurdert' : 'Fast mode only'
    mainRiskNote = contact.website ? 'Google ga en URL; åpne den og sjekk at den er ekte og relevant.' : 'Nettsidesjekk og dypere berikelse er hoppet over.'
  } else if ((ranking.caution || []).length) {
    mainRisk = 'Obs-punkter'
    mainRiskNote = humanizeEvidence((ranking.caution || [])[0])
  }

  let nextAction = 'Use as B2B lead'
  let nextActionNote = 'Kontaktbarhet og firmakontekst avgjør salgsverdien; nettsidesmerte er separat.'
  if (!hasPhone) {
    nextAction = 'Finn kontakt først'
    nextActionNote = 'Ikke prioriter ringing før en direkte kontakt er funnet.'
  } else if (fast) {
    nextAction = confirmedOrg ? 'Verifiser firma hvis du trenger mer kontekst' : candidateOrg ? 'Verifiser org.nr, bruk Verifiser firma ved behov' : brregUnavailable ? 'Verifiser firma for nytt Brreg-forsøk' : 'Verifiser firma ved behov'
    nextActionNote = 'Raskt søk fant en brukbar kandidat; Verifiser firma legger til valgfri kontekst.'
  } else if (priority === 'low' && sellerReadinessKey !== 'weak') {
    nextAction = 'Usable lead; weak digital angle'
    nextActionNote = 'Do not treat LOW digital signal as a bad business lead.'
  } else if (priority === 'high') {
    nextAction = 'Vurder først'
    nextActionNote = 'Enrichment evidence supports website/opportunity urgency.'
  }

  const sourceConfidence = discoveryLevel === 'unknown' ? 'Ukjent' : readable(discoveryLevel)
  const sourceConfidenceNote = discoveryQuality.score == null ? 'Ingen treffscore tilgjengelig.' : `Discovery score ${discoveryQuality.score}/100.`

  const fit = lead.sellerFit || null
  if (fit) {
    if (fit.sellerFit === 'strong') sellerReadiness = 'Strong fit'
    else if (fit.sellerFit === 'good') sellerReadiness = 'Good fit'
    else if (fit.sellerFit === 'review') sellerReadiness = 'Vurder match'
    else sellerReadiness = 'Weak fit'
    sellerReadinessKey = fit.sellerFit === 'review' ? 'verify' : fit.sellerFit
    if (fit.recommendedAction === 'contact') nextAction = 'Contact now'
    else if (fit.recommendedAction === 'verify') nextAction = 'Verifiser først'
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
    other: 'Annet',
  }[String(value || 'general_b2b')] || 'General B2B'
}

function buildCommandSummary({ company, contact, places, confirmedOrg, candidateOrg, exactLocation, fast, employees, priority, websiteOpportunity }) {
  const activity = businessActivityLabel(company)
  const parts = []
  if (activity) parts.push(`Registrert som ${activity}`)
  if (contact.phone) parts.push(`direkte telefon ${contact.phone} er tilgjengelig`)
  if (employees != null && employees !== '' && !Number.isNaN(Number(employees))) parts.push(`${employees} employees registered`)
  if (places.rating) parts.push(`Google ${places.rating}/5${places.reviewCount != null ? ` from ${places.reviewCount} reviews` : ''}`)
  if (exactLocation) parts.push('stedet matcher søket')
  if (confirmedOrg) parts.push(`org.nr er bekreftet${company.organizationNumber ? ` (${company.organizationNumber})` : ''}`)
  else if (candidateOrg) parts.push('org.nr har kandidat-treff og må verifiseres')
  else parts.push('firmaidentiteten er ikke verifisert ennå')
  if (fast) parts.push(contact.website ? 'nettsiden er bare et synlighetssignal til den er sjekket' : 'enrichment has not run yet')
  else parts.push(`digitalt signal er ${websiteOpportunity || String(priority || 'unknown').toUpperCase()}`)
  return `${parts.join('; ')}.`
}

function businessActivityLabel(company = {}) {
  const nace = [company.naceCode, company.naceDescription].filter(Boolean).join(' - ')
  if (nace) return nace
  if (company.organizationForm) return readable(company.organizationForm)
  return ''
}

function sourceCard(title, status, rows) {
  return `<section class="source-card"><div class="source-title"><h3>${escapeHtml(title)}</h3>${badge(status)}</div>${kv(rows)}</section>`
}

function companyIdValue(company = {}) {
  if (company.organizationNumber) return company.organizationNumber
  if (company.candidateOrganizationNumber) return company.candidateOrganizationNumber
  if (isBrregUnavailable(company)) return 'Brreg ikke bekreftet'
  return 'ikke verifisert'
}

function companyIdNote(company = {}) {
  if (company.organizationNumber) return 'Bekreftet offisiell identitet'
  if (company.candidateOrganizationNumber) return 'Kandidat-org.nr; verifiser før eksport'
  if (isBrregUnavailable(company)) return 'Raskt søk fikk ikke bekreftet Brreg; bruk Verifiser firma for nytt forsøk'
  return brregStatusLabel(company)
}

function sourceStrategyStatus(company = {}, sourceQuality = {}, places = {}) {
  if (isBrregUnavailable(company)) return 'brreg_unavailable'
  return sourceQuality.identitySource || sourceQuality.presenceSource || places.provider || 'unknown'
}

function sourceStrategyLabel(company = {}, sourceQuality = {}) {
  if (isBrregUnavailable(company)) return 'Synlighet-først fallback; Verifiser firma prøver Brreg på nytt'
  if (sourceQuality.identitySource === 'brreg') return 'Brreg-først identitet med synlighetsberikelse'
  return 'Synlighet-først søk'
}

function brregSourceCard(company) {
  const rows = [
    ['Bekreftet org.nr', company.organizationNumber || 'none'],
    ['Kandidat org.nr', company.candidateOrganizationNumber || 'none'],
    ['Juridisk navn', company.legalName || 'unknown'],
    ['Kandidat juridisk navn', company.candidateLegalName || 'none'],
    ['Org form', company.organizationForm || 'unknown'],
    ['Kommune', company.municipality || 'unknown'],
    ['NACE', [company.naceCode, company.naceDescription].filter(Boolean).join(' - ') || 'unknown'],
    ['Ansatte', company.employees ?? 'unknown'],
    ['Status', company.activeStatus || 'unknown'],
    ['Confidence', company.matchConfidence ?? 'unknown'],
    ['Varsler', normalizeList(company.warnings).length ? normalizeList(company.warnings).map(humanize).join(', ') : 'none'],
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
      <strong>${escapeHtml(candidate.candidateLegalName || 'Ukjent juridisk navn')}</strong>
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

  if (contact.phone) signals.push(`Telefon finnes: ${contact.phone}. Denne er kontaktbar, ikke bare en nettside-lead.`)
  else if (contact.email) signals.push(`E-post finnes: ${contact.email}. Direkte kvalifisering er mulig.`)

  if (places.rating) signals.push(`Google-bevis: ${formatRating(places)}. Bruk dette til å vurdere markedsnærvær før du prioriterer.`)

  if (isFastLead(lead) && contact.website) signals.push('Nettsiden er fra søket og er ikke vurdert; åpne og sjekk før du bruker den som salgsvinkel.')

  if (company.organizationNumber) signals.push(`Brreg bekreftet: org.nr ${company.organizationNumber}. Juridisk identitet er klar for eksport.`)
  else if (company.candidateOrganizationNumber || company.matchStatus === 'manual_verify') signals.push('Brreg-kandidat finnes, men juridisk identitet bør verifiseres før eksport.')
  else if (isBrregUnavailable(company)) signals.push('Brreg er ikke bekreftet fra raskt søk; bruk Verifiser firma for nytt forsøk.')
  else signals.push('Juridisk identitet er ikke verifisert; Brreg fant ingen bekreftet firmaprofil.')

  if (isLawLead(lead)) signals.push('Advokat-kontekst: troverdighet, tillit og kvalitet på henvendelser betyr mer enn generisk booking-språk.')

  for (const item of raw) {
    const mapped = leverageLabel(item)
    if (mapped && !signals.includes(mapped)) signals.push(mapped)
  }

  if (!signals.length) signals.push('Leaden har nok kontakt- og kildekontekst til manuell vurdering.')
  return signals.filter(Boolean).slice(0, 7)
}

function leverageLabel(value) {
  const text = String(value || '').toLowerCase()
  if (isInternalLabel(text)) return null
  if (text.includes('brand_identity_confusion') || text.includes('merkevare/identitet-forvirring')) return 'Brand/domain alignment may be unclear. Verify that the company name, website and legal entity point to the same business.'
  if (text === 'brand_identity' || text.includes('leadclass:brand_identity')) return 'Identitetssignal: sjekk om offentlig merkevare og juridisk firmanavn stemmer overens.'
  if (text.includes('technical_trust_risk') || text.includes('technical trust')) return 'Digitale tillitssignaler kan være svakere enn bedriften selv.'
  if (text.includes('many_failed_requests') || text.includes('failed network')) return 'Digitale pålitelighetsbevis finnes; sjekk før du bruker det som salgspoeng.'
  if (text.includes('accessibility') || text.includes('usability')) return 'Usability/accessibility friction may affect customer confidence.'
  if (text.includes('high_value_service') || text.includes('service_line')) return 'Høyverdi-tjenester finnes og kan fortjene tydeligere lead-veier.'
  if (text.includes('local_visibility')) return 'Lokal synlighets-lead: kontakt og sted er klare, men hastverket kan være lavere uten sterkere smerte.'
  if (text.includes('strong_existing_conversion_flow')) return 'Kontaktflyten ser allerede sterk ut, så ikke overdriv hastverket.'
  if (text.includes('contact_maturity_requires_stronger_technical_pain')) return 'Kontaktmodenheten er høy; behandle som kortliste med mindre teknisk smerte er tydelig.'
  if (text.includes('visible_technical_trust_pain')) return 'Synlige tekniske tillitsfunn støtter en grundigere vurdering.'
  if (text.includes('no social links')) return 'Sosiale bevis-lenker ble ikke funnet i nettsidesjekken.'
  if (text.includes('no recognized technology stack')) return 'Teknologistakken ble ikke gjenkjent; kan være et signal om gammel eller spesialbygd side.'
  if (text.includes('fetch failed') || text.includes('network error')) return 'Registeroppslag var utilgjengelig; prøv Brreg på nytt før eksport.'
  if (text.includes('contactable')) return 'Bedriften ser kontaktbar ut fra tilgjengelige data.'
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

function formatRating(places) {
  if (!places || places.rating === null || places.rating === undefined) return 'vurdering ukjent'
  const reviews = places.reviewCount === null || places.reviewCount === undefined ? 'antall omtaler ukjent' : `${places.reviewCount} reviews`
  return `${places.rating} / 5 · ${reviews}`
}

function humanizeEvidence(value) {
  const mapped = leverageLabel(value)
  return mapped || humanize(value)
}

const HUMANIZE_NB = {
  website_available: 'Nettside finnes',
  phone_available: 'Telefon finnes',
  address_available: 'Adresse finnes',
  place_id_available: 'Google-oppføring finnes',
  rating_available: 'Google-vurdering finnes',
  reviews_available: 'Google-omtaler finnes',
  operational: 'I drift',
  direct_business_target: 'Direkte bedriftstreff',
  vertical_exact: 'Eksakt bransjetreff',
  vertical_synonym: 'Relatert bransjetreff',
  vertical_broad: 'Bredt bransjetreff',
  vertical_weak: 'Svakt bransjetreff',
  missing_website: 'Nettside mangler',
  missing_phone: 'Telefon mangler',
  missing_email: 'E-post mangler',
  candidate_org_number: 'Kandidat-org.nr',
  identity_not_confirmed: 'Identitet ikke bekreftet',
  no_match: 'Ingen Brreg-treff',
  org_not_confirmed_but_callable: 'Org.nr ikke bekreftet, men ringbar',
  phone_format_not_norwegian: 'Telefonnummeret ser utenlandsk ut',
  location_conflict: 'Stedskonflikt',
  location_needs_review: 'Sted må sjekkes',
  location_missing: 'Sted mangler',
  contact_missing: 'Kontakt mangler',
  source_fusion_verify_first: 'Kildesjekk: verifiser først',
  requested_location_missing: 'Ønsket sted mangler i kilden',
  candidate_location_unknown: 'Kandidatens sted er ukjent',
  candidate_appears_outside_requested_location: 'Ser ut til å ligge utenfor ønsket sted',
  name_mismatch: 'Navn matcher ikke',
  no_plausible_candidate: 'Ingen plausibel kandidat',
  brreg_unavailable: 'Brreg utilgjengelig',
  not_audit_eligible: 'Ikke kvalifisert for nettsidesjekk',
  missing_website_for_audit: 'Nettside mangler for sjekk',
  included_as_explicit_location_fallback: 'Inkludert som steds-fallback',
  skipped_no_website: 'Hoppet over - ingen nettside',
  skipped_fast_mode: 'Hoppet over i raskt søk',
  exact_match: 'Eksakt treff',
  strong_match: 'Sterkt treff',
  weak_match: 'Svakt treff',
  basic_contact_available: 'Grunnleggende kontakt finnes',
  proff_api_key_missing: 'Proff-nøkkel mangler',
}

function humanize(value) {
  const key = String(value || '').toLowerCase().trim()
  if (HUMANIZE_NB[key]) return HUMANIZE_NB[key]
  return String(value || 'ukjent')
    .replace(/[_:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function renderExport(result) {
  if (!result) {
    els.exportPanel.innerHTML = '<p class="eyebrow">Eksport</p><div class="empty-state">CSV- og JSON-lenker vises etter en fullført kjøring.</div><p class="export-tools"><button type="button" class="quiet-export" data-workspace-export>Last ned testdata</button></p>'
    return
  }
  const leads = result.summary?.marketSweep ? (result.leadPacks || []).slice().sort(compareLeadsByCity) : (result.leadPacks || [])
  els.exportPanel.innerHTML = `
    <p class="eyebrow">Eksport</p>
    <p class="muted">Kjøringssti: <code>${escapeHtml(result.outputDir)}</code></p>
    <p><a href="${escapeAttr(withBetaToken(result.downloads.csv))}">Last ned CSV</a> · <a href="${escapeAttr(withBetaToken(result.downloads.json))}">Last ned JSON</a> · <button type="button" id="copyPath">Kopier kjøringssti</button> <button type="button" class="quiet-export" data-workspace-export>Last ned testdata</button></p>
    ${callListLinks(result.downloads || {})}
    <table>
      <thead><tr><th>nr</th><th>firma</th><th>telefon</th><th>by</th><th>kø</th><th>prioritet</th><th>trygghet</th><th>osint</th><th>arbeidsflyt</th><th>respons</th><th>oppfølging</th><th>sist kontaktet</th><th>neste handling</th></tr></thead>
      <tbody>${leads.map((lead, index) => { const workflow = lead.workflow || {}; return `<tr><td>${index + 1}</td><td>${escapeHtml(lead.company?.displayName || lead.companyName || '')}</td><td>${phoneLink(lead.contact?.phone || lead.phone || '')}</td><td>${escapeHtml(lead.contact?.city || lead.city || '')}</td><td>${escapeHtml(workQueueLabel(leadWorkQueue(lead)))}</td><td>${escapeHtml(lead.callPriority || lead.priority || '')}</td><td>${escapeHtml(sourceFusionExportCell(lead))}</td><td>${escapeHtml(osintExportCell(lead))}</td><td>${escapeHtml(readable(workflow.status || 'new'))}</td><td>${escapeHtml(readable(workflow.response || ''))}</td><td>${escapeHtml(workflow.nextFollowUpAt || workflow.followUpDate || '')}</td><td>${escapeHtml(workflow.lastContactedAt || '')}</td><td>${escapeHtml(workflow.nextAction || '')}</td></tr>` }).join('')}</tbody>
    </table>
  `
  const copy = document.getElementById('copyPath')
  copy?.addEventListener('click', () => navigator.clipboard?.writeText(result.outputDir))
}

document.addEventListener('input', (event) => {
  const mobileNoteInput = event.target.closest('[data-mobile-note-input]')
  if (!mobileNoteInput) return
  const id = mobileNoteInput.dataset.leadId || state.selectedLeadId || ''
  if (id) state.mobileNoteDrafts[id] = mobileNoteInput.value
})

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
  const mobileNoteToggle = event.target.closest('[data-mobile-note-toggle]')
  if (mobileNoteToggle) {
    const id = mobileNoteToggle.dataset.leadId || state.selectedLeadId || ''
    state.mobileNoteOpenLeadId = state.mobileNoteOpenLeadId === id ? '' : id
    renderAll()
    if (state.mobileNoteOpenLeadId) setTimeout(() => document.querySelector('[data-mobile-note-input]')?.focus(), 0)
    return
  }
  const mobileSaveNoteButton = event.target.closest('[data-mobile-save-note]')
  if (mobileSaveNoteButton) { saveMobileNote(mobileSaveNoteButton); return }
  const startCallFocusButton = event.target.closest('[data-start-call-focus]')
  if (startCallFocusButton) { startCallFocus('new'); return }
  const startCallbackFocusButton = event.target.closest('[data-start-callback-focus]')
  if (startCallbackFocusButton) { startCallFocus('callback'); return }
  const callFocusOutcomeButton = event.target.closest('[data-call-focus-outcome]')
  if (callFocusOutcomeButton) { runCallFocusOutcome(callFocusOutcomeButton.dataset.callFocusOutcome, callFocusOutcomeButton); return }
  const callFocusSkipButton = event.target.closest('[data-call-focus-skip]')
  if (callFocusSkipButton) { skipCallFocusLead(); return }
  const callFocusExitButton = event.target.closest('[data-call-focus-exit]')
  if (callFocusExitButton) { exitCallFocus(); return }
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
  const verifyEnrichButton = event.target.closest('[data-run-verify-enrich]')
  if (verifyEnrichButton) {
    const index = Number(verifyEnrichButton.dataset.index ?? state.selectedIndex)
    if (Number.isFinite(index) && state.result?.leadPacks?.[index]) {
      state.selectedIndex = index
      state.selectedLeadId = leadId(state.result.leadPacks[index], index)
    }
    runSelectedDeepQualification(verifyEnrichButton)
    return
  }
  if (event.target && event.target.id === 'runDeepQualification') {
    runSelectedDeepQualification(event.target)
  }
})

async function runWorkflowQuickAction(button) {
  const index = Number(button.dataset.index ?? state.selectedIndex)
  const lead = state.result?.leadPacks?.[index]
  if (!lead) return setStatus('feilet: ingen valgt lead for hurtighandling', 'failed')
  const action = button.dataset.workflowAction
  const mobileBar = button.closest('.mobile-call-bar')
  const draft = mobileBar ? String(mobileBar.querySelector('[data-mobile-note-input]')?.value || state.mobileNoteDrafts[mobileLeadDraftId(lead, index)] || '').trim() : ''
  const current = draft ? appendSellerNote(lead.workflow || {}, draft) : (lead.workflow || {})
  const workflow = buildQuickWorkflow(action, current)
  if (!workflow) return setStatus('feilet: ukjent hurtighandling', 'failed')
  workflow.owner = currentOwner() || workflow.owner || ''
  const advanceQueue = Boolean(button.closest('.queue-row'))
  const fromMobileBar = Boolean(mobileBar)
  state.selectedIndex = index
  state.selectedLeadId = leadId(lead, index)
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Lagrer...'
  setStatus(`lagrer: ${originalText}`, 'running')
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
    syncLeadQueueQuality(lead)
    if (fromMobileBar) clearMobileNoteDraftFor(lead, index)
    await refreshCommandCenter()
    clearStatus()
    const advanced = advanceQueue ? selectNextQueueLead(lead) : false
    if (fromMobileBar && advanceQueue && !advanced) state.mobileQueueDone = { queue: state.selectedQueue, action }
    renderAll()
    if (advanceQueue && advanced) focusLeadDetail({ block: 'nearest' })
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
  if (!form || !lead) return setStatus('feilet: ingen valgt lead for notatutkast', 'failed')
  const workflow = buildQuickWorkflow(button.dataset.workflowAction, readWorkflowDraft(form, lead.workflow || {}))
  if (!workflow) return setStatus('feilet: ukjent hurtighandling', 'failed')
  setWorkflowFormValues(form, workflow)
  const saveText = form.querySelector('.workflow-actions small')
  if (saveText) saveText.textContent = 'Utkast - klikk Lagre for å logge'
  setStatus('notatutkast oppdatert - klikk Lagre for å logge', 'running')
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
  if (!next) return false
  clearMobileQueueDone()
  state.mobileNoteOpenLeadId = ''
  state.selectedIndex = next.index
  state.selectedLeadId = leadId(next.lead, next.index)
  return true
}

function buildQuickWorkflow(action, current = {}) {
  const base = { status: 'new', queue: '', owner: currentOwner(), contacted: false, channel: '', response: '', personReached: '', notes: '', followUpDate: '', nextFollowUpAt: '', lastContactedAt: '', nextAction: 'review', outcome: '', archivedAt: '', ...current }
  base.owner = currentOwner() || base.owner || ''
  const now = new Date().toISOString()
  const tomorrow = isoDateOffset(1)
  const nextWeek = isoDateOffset(7)
  if (action === 'sale') return { ...base, status: 'interested', queue: 'interested', contacted: true, lastContactedAt: base.lastContactedAt || now, channel: base.channel || 'phone', response: 'meeting_booked', followUpDate: tomorrow, nextFollowUpAt: tomorrow, nextAction: base.nextAction && base.nextAction !== 'review' ? base.nextAction : 'følg opp salg', outcome: 'sale' }
  if (action === 'no_answer') return { ...base, status: 'follow_up', queue: 'no_answer', contacted: true, lastContactedAt: base.lastContactedAt || now, channel: base.channel || 'phone', response: 'no_answer', followUpDate: tomorrow, nextFollowUpAt: tomorrow, nextAction: 'ring igjen' }
  if (action === 'interested') return { ...base, status: 'interested', queue: 'interested', contacted: true, lastContactedAt: base.lastContactedAt || now, channel: base.channel || 'phone', response: 'interested', followUpDate: tomorrow, nextFollowUpAt: tomorrow, nextAction: base.nextAction && base.nextAction !== 'review' ? base.nextAction : 'følg opp interessert lead', outcome: base.outcome || 'interested' }
  if (action === 'not_relevant') return { ...base, status: 'rejected', queue: 'not_relevant', contacted: true, lastContactedAt: base.lastContactedAt || now, channel: base.channel || 'phone', response: 'negative', followUpDate: '', nextFollowUpAt: '', nextAction: 'ikke kontakt igjen', outcome: 'nei' }
  if (action === 'follow_up_tomorrow') return { ...base, status: 'follow_up', queue: base.queue === 'interested' ? 'interested' : 'no_answer', followUpDate: tomorrow, nextFollowUpAt: tomorrow, nextAction: 'følg opp i morgen' }
  if (action === 'follow_up_next_week') return { ...base, status: 'follow_up', queue: base.queue === 'interested' ? 'interested' : 'no_answer', followUpDate: nextWeek, nextFollowUpAt: nextWeek, nextAction: 'følg opp neste uke' }
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
  setStatus(`running: Verifiser firma for ${lead.company?.displayName || 'valgt lead'}`, 'running')
  try {
    const response = await apiFetch('/api/deep-qualify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: state.result?.parsedQuery?.normalizedQuery || els.query.value.trim(),
        lead,
        sellerIntent: 'web_it',
        sellerProfile: currentSellerProfile(),
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
    setStatus('fullført: valgt lead verifisert og beriket', '')
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
    nextRecommendedAction: callPriorityCounts.high ? 'Vurder HØY-leads først.' : callPriorityCounts.medium ? 'Vurder de beste MEDIUM-leadene som kortliste.' : 'Vurder verifiserte leads og resten av kandidatene.',
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
  const requestedLocation = Boolean(sourceQuality.requestedLocation)
  const locationConfidence = sourceQuality.locationMatchStatus === 'exact_location' ? 'exact' : sourceQuality.locationMatchStatus === 'regional_fallback' ? 'fallback' : sourceQuality.locationMatchStatus === 'out_of_area' ? 'conflict' : requestedLocation ? 'fallback' : 'unknown'
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
  return summary.warnings || summary.risk || summary.proof || 'Bruker eksisterende Google-, Brreg- og kontaktsignaler.'
}

function sourceCoverageLabels(values = []) {
  const labels = { google_places: 'Google Places', brreg: 'Brreg', contact_data: 'Kontaktdata', contact_provider: 'Kontaktleverandør', website_contact_profile: 'Nettside-/kontaktprofil', workflow: 'Arbeidsflyt' }
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
  return { confirmed: 'Bekreftet firma', candidate: 'Kandidat org.nr', manual_verify: 'Verifiser manuelt', unknown: 'Ukjent identitet' }[String(value || '').toLowerCase()] || humanize(value)
}

function contactConfidenceLabel(value) {
  return { strong: 'Kontakt finnes', good: 'Telefon finnes', review: 'Telefon mangler', weak: 'Ingen kontaktvei', unknown: 'Ukjent kontakt' }[String(value || '').toLowerCase()] || humanize(value)
}

function locationConfidenceLabel(value) {
  return { exact: 'Eksakt sted', nearby: 'Nærområde-treff', fallback: 'Regionalt treff', conflict: 'Stedskonflikt', unknown: 'Ukjent sted' }[String(value || '').toLowerCase()] || humanize(value)
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
  return `<p class="export-actions">call-list.csv inkluderer workflowQueue og lastActivityAt. <a href="${escapeAttr(withBetaToken(downloads.callList))}">Alle</a> · ${queueLinks}</p>`
}

function phoneHref(value) {
  const raw = String(value || '').trim()
  const digits = raw.replace(/[^+\d]/g, '')
  return digits ? `tel:${digits}` : ''
}

// One-click research: Google the business (name + city) in a new tab, so the
// seller doesn't have to retype it mid-call. The knowledge panel gives reviews,
// website, and opening hours at a glance.
function googleSearchUrl(lead = {}) {
  const name = lead.company?.displayName || lead.companyName || ''
  if (!name) return ''
  const city = lead.contact?.city || lead.city || ''
  return 'https://www.google.com/search?q=' + encodeURIComponent([name, city].filter(Boolean).join(' '))
}

function googleNameLink(lead, label) {
  const url = googleSearchUrl(lead)
  const safeLabel = escapeHtml(label)
  if (!url) return safeLabel
  return '<a class="google-name-link" href="' + escapeAttr(url) + '" target="_blank" rel="noopener" title="Søk opp bedriften på Google">' + safeLabel + '<span class="google-hint" aria-hidden="true"> ↗</span></a>'
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
function section(title, content) { return `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${content}</section>` }
function kv(items) { return items.map(([k,v]) => `<div class="kv"><span>${escapeHtml(k)}</span><span>${isHtml(v) ? v : escapeHtml(v)}</span></div>`).join('') }
function bullets(items) { return items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="muted">None.</p>' }
function badge(value) { if (!value) return ''; const text = readable(value); return `<span class="badge ${escapeAttr(String(value).toLowerCase())}">${escapeHtml(text)}</span>` }
function readable(value) { return { new: 'Ny lead', reviewed: 'Vurdert', contacted: 'Kontaktet', follow_up: 'Oppfølging', interested: 'Interessert', rejected: 'Avvist', no_answer: 'Ingen svar', no_response: 'Ingen respons', negative: 'Nei', neutral: 'Nøytral', meeting_booked: 'Salg', phone: 'Telefon', email: 'E-post', contact_form: 'Kontaktskjema', linkedin: 'LinkedIn', other: 'Annet', exact_location: 'Eksakt sted', regional_fallback: 'Regionalt treff', not_enabled: 'Ikke aktivert', disabled: 'Avslått', success: 'Vellykket', not_eligible: 'Ikke kvalifisert', manual_verify: 'Verifiser manuelt', confirmed_org: 'Bekreftet org.nr', candidate_org: 'Kandidat org.nr', no_match: 'Ingen treff', not_run: 'Ikke kjørt', brreg_unavailable: 'Brreg ikke bekreftet', phone_available: 'Telefon finnes', contact_missing: 'Kontakt mangler', audit_skipped: 'Raskt søk', completed: 'Fullført', good: 'God', strong: 'Sterk', weak: 'Svak', high: 'Høy', medium: 'Middels', low: 'Lav', verify: 'Verifiser', strong_fit: 'Sterk match', good_fit: 'God match', review_fit: 'Vurder match', weak_fit: 'Svak match', fast: 'Rask', deep: 'Dyp', mixed: 'Blandet', ready_to_call: 'Klar til å ringe', call_now: 'Ring nå', no_answer: 'Ingen svar', verify_first: 'Må verifiseres', follow_up_today: 'Oppfølging i dag', not_relevant: 'Nei', archived: 'Arkiv', needs_contact: 'Trenger kontakt', follow_up_due: 'Oppfølging forfalt', later: 'Senere', skip: 'Hopp over', queue_change: 'Køendring', follow_up_set: 'Oppfølging satt', contact_attempt: 'Kontaktforsøk', status_change: 'Statusendring', note: 'Notat', call: 'Trygg å ringe', review: 'Bør vurderes', exact: 'Eksakt sted', nearby: 'Nærområde-treff', fallback: 'Regionalt treff', conflict: 'Konflikt', confirmed: 'Bekreftet firma', candidate: 'Kandidat org.nr', unknown: 'Ukjent', google_places: 'Google Places', brreg: 'Brreg', contact_data: 'Kontaktdata', contact_provider: 'Kontaktleverandør', website_contact_profile: 'Nettside-/kontaktprofil', workflow: 'Arbeidsflyt', vertical_exact: 'Eksakt kategori', vertical_synonym: 'Relatert kategori', vertical_broad: 'Bred kategori', vertical_weak: 'Svak kategori', synonym: 'Relatert', broad: 'Bred' }[value] || String(value).toUpperCase() }
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
