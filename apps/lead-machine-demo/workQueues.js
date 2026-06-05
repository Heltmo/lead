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

function defaultWorkflow() {
  return {
    status: 'new',
    queue: '',
    owner: '',
    contacted: false,
    channel: '',
    personReached: '',
    response: '',
    notes: '',
    followUpDate: '',
    nextFollowUpAt: '',
    lastContactedAt: '',
    nextAction: 'review',
    outcome: '',
    archivedAt: '',
    updatedAt: null,
    activities: [],
    activityLog: [],
  }
}

function normalizeWorkflow(input = {}, options = {}) {
  const statuses = new Set(['new', 'reviewed', 'contacted', 'follow_up', 'interested', 'rejected'])
  const channels = new Set(['', 'phone', 'email', 'contact_form', 'linkedin', 'other'])
  const responses = new Set(['', 'no_answer', 'no_response', 'negative', 'neutral', 'interested', 'meeting_booked'])
  const rawStatus = String(input.status || '').toLowerCase()
  const status = statuses.has(rawStatus) ? rawStatus : 'new'
  const rawChannel = String(input.channel || '').toLowerCase()
  const channel = channels.has(rawChannel) ? rawChannel : ''
  const rawResponse = String(input.response || '').toLowerCase()
  const response = responses.has(rawResponse) ? rawResponse : ''
  const followUpDate = normalizeDate(input.followUpDate || input.nextFollowUpAt)
  const contacted = input.contacted === true || input.contacted === 'true' || ['contacted', 'follow_up', 'interested', 'rejected'].includes(status) || Boolean(response)
  let workflow = {
    status,
    queue: normalizeQueue(input.queue),
    owner: limitText(input.owner || '', 120),
    contacted,
    channel,
    personReached: limitText(input.personReached || '', 120),
    response,
    notes: limitText(input.notes || '', 2000),
    followUpDate,
    nextFollowUpAt: followUpDate,
    lastContactedAt: normalizeDateTime(input.lastContactedAt),
    nextAction: limitText(input.nextAction || 'review', 180),
    outcome: limitText(input.outcome || '', 500),
    archivedAt: normalizeDateTime(input.archivedAt),
    updatedAt: input.updatedAt || null,
    activities: normalizeActivities(input.activities || input.activityLog),
  }

  if (workflow.contacted && !workflow.lastContactedAt && !['new', 'reviewed'].includes(workflow.status)) {
    workflow.lastContactedAt = options.now || new Date().toISOString()
  }
  if ((workflow.response === 'no_answer' || workflow.response === 'no_response') && !workflow.followUpDate) {
    workflow.followUpDate = isoDateOffset(1, options.now)
    workflow.nextFollowUpAt = workflow.followUpDate
    if (!workflow.nextAction || workflow.nextAction === 'review') workflow.nextAction = 'call again'
  }
  if ((workflow.response === 'interested' || workflow.response === 'meeting_booked' || workflow.status === 'interested') && (!workflow.nextAction || workflow.nextAction === 'review')) {
    workflow.nextAction = 'follow up interested lead'
  }

  workflow.queue = workflowQueueFromWorkflow(workflow, { allowExplicit: true, today: options.today })
  workflow.activityLog = workflow.activities
  return workflow
}

function workflowForLead(lead = {}, storedWorkflow = {}, leadId = '', options = {}) {
  const workflow = normalizeWorkflow({ ...defaultWorkflow(), ...(storedWorkflow || {}) }, options)
  workflow.leadId = leadId || workflow.leadId || ''
  workflow.queue = inferLeadQueue(lead, workflow, options)
  workflow.activityLog = workflow.activities
  return workflow
}

function inferLeadQueue(lead = {}, workflow = {}, options = {}) {
  const normalized = normalizeWorkflow(workflow || {}, options)
  const existing = workflowQueueFromWorkflow(normalized, { allowExplicit: true, today: options.today })
  if (existing) return existing

  const sellerFit = lead.sellerFit || {}
  const company = lead.company || {}
  const contact = lead.contact || {}
  const sourceQuality = lead.sourceQuality || {}
  const sourceFusion = lead.sourceFusion || {}
  const action = String(sellerFit.recommendedAction || '').toLowerCase()
  const fit = String(sellerFit.sellerFit || '').toLowerCase()
  const hasPhone = Boolean(contact.phone || lead.phone)
  const matchStatus = String(company.matchStatus || '').toLowerCase()
  const locationStatus = String(sourceQuality.locationMatchStatus || '').toLowerCase()
  const trustAction = String(sourceFusion.recommendedTrustAction || '').toLowerCase()
  const identityConfidence = String(sourceFusion.identityConfidence || '').toLowerCase()
  const contactConfidence = String(sourceFusion.contactConfidence || '').toLowerCase()
  const locationConfidence = String(sourceFusion.locationConfidence || '').toLowerCase()
  const quality = leadQueueQuality(lead, { company, contact, sourceQuality, sourceFusion, action, fit, hasPhone, matchStatus, locationStatus, trustAction, identityConfidence, contactConfidence, locationConfidence })

  if (action === 'skip' || trustAction === 'skip') return 'archived'
  if (trustAction === 'verify_first') return 'verify_first'
  if (!quality.hasPhone) return 'verify_first'
  if (quality.foreignPhone || quality.severeLocationRisk) return 'verify_first'
  if (quality.trustedToCall) return 'call_now'
  if (quality.needsVerifyBeforeCall) return 'verify_first'
  return 'verify_first'
}

function leadQueueQuality(lead = {}, context = {}) {
  const company = context.company || lead.company || {}
  const contact = context.contact || lead.contact || {}
  const sourceQuality = context.sourceQuality || lead.sourceQuality || {}
  const sourceFusion = context.sourceFusion || lead.sourceFusion || {}
  const phone = contact.phone || lead.phone || ''
  const hasPhone = context.hasPhone !== undefined ? context.hasPhone : Boolean(phone)
  const fit = String(context.fit !== undefined ? context.fit : lead.sellerFit && lead.sellerFit.sellerFit || '').toLowerCase()
  const action = String(context.action !== undefined ? context.action : lead.sellerFit && lead.sellerFit.recommendedAction || '').toLowerCase()
  const trustAction = String(context.trustAction !== undefined ? context.trustAction : sourceFusion.recommendedTrustAction || '').toLowerCase()
  const identityConfidence = String(context.identityConfidence !== undefined ? context.identityConfidence : sourceFusion.identityConfidence || '').toLowerCase()
  const contactConfidence = String(context.contactConfidence !== undefined ? context.contactConfidence : sourceFusion.contactConfidence || '').toLowerCase()
  const locationConfidence = String(context.locationConfidence !== undefined ? context.locationConfidence : sourceFusion.locationConfidence || '').toLowerCase()
  const matchStatus = String(context.matchStatus !== undefined ? context.matchStatus : company.matchStatus || '').toLowerCase()
  const locationStatus = String(context.locationStatus !== undefined ? context.locationStatus : sourceQuality.locationMatchStatus || '').toLowerCase()
  const confirmedOrg = Boolean(company.organizationNumber)
  const candidateOrg = Boolean(company.candidateOrganizationNumber)
  const exactLocation = locationStatus === 'exact_location' || locationConfidence === 'exact'
  const locationFallback = locationStatus === 'regional_fallback' || locationConfidence === 'fallback' || locationConfidence === 'unknown'
  const identityUnknown = identityConfidence === 'unknown' && !candidateOrg && !confirmedOrg
  const severeIdentityRisk = ['no_match', 'error'].includes(matchStatus) || identityUnknown
  const severeLocationRisk = ['out_of_area', 'conflict', 'location_conflict'].includes(locationStatus) || locationConfidence === 'conflict'
  const foreignPhone = Boolean(phone) && !isLikelyNorwegianPhone(phone)
  const trustedToCall = hasPhone && !foreignPhone && !severeLocationRisk && (confirmedOrg || exactLocation || trustAction === 'call' || (candidateOrg && ['strong', 'good'].includes(fit) && !locationFallback) || (action === 'contact' && !identityUnknown && !locationFallback))
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

function workflowQueueFromWorkflow(workflow = {}, options = {}) {
  const explicit = normalizeQueue(workflow.queue)
  const status = String(workflow.status || '').toLowerCase()
  const response = String(workflow.response || '').toLowerCase()
  const outcome = String(workflow.outcome || '').toLowerCase()
  const followUpDate = normalizeDate(workflow.nextFollowUpAt || workflow.followUpDate)

  if (explicit === 'archived' || workflow.archivedAt) return 'archived'
  if (status === 'rejected' || explicit === 'not_relevant' || outcome.includes('not relevant') || outcome.includes('rejected')) return 'not_relevant'
  if (followUpDate && isDateDue(followUpDate, options.today)) return 'follow_up_today'
  if (status === 'interested' || response === 'interested' || response === 'meeting_booked' || explicit === 'interested') return 'interested'
  if (response === 'no_answer' || response === 'no_response' || explicit === 'no_answer' || status === 'follow_up') return 'no_answer'
  if (explicit === 'call_now' || explicit === 'verify_first') return explicit
  return ''
}

function leadMatchesQueue(lead = {}, queueId, options = {}) {
  const queue = normalizeQueue(queueId)
  if (!queue) return true
  return inferLeadQueue(lead, lead.workflow || {}, options) === queue
}

function normalizeQueue(value) {
  const queue = String(value || '').toLowerCase().trim()
  return WORK_QUEUE_IDS.has(queue) ? queue : ''
}

function normalizeActivities(activities) {
  if (!Array.isArray(activities)) return []
  return activities.slice(0, 25).map((activity) => ({
    id: limitText(activity && activity.id || '', 80),
    at: limitText(activity && (activity.at || activity.createdAt) || '', 40),
    createdAt: limitText(activity && (activity.createdAt || activity.at) || '', 40),
    type: limitText(activity && activity.type || '', 40),
    status: limitText(activity && activity.status || '', 40),
    queue: normalizeQueue(activity && activity.queue),
    fromQueue: normalizeQueue(activity && activity.fromQueue),
    toQueue: normalizeQueue(activity && activity.toQueue),
    channel: limitText(activity && activity.channel || '', 40),
    response: limitText(activity && activity.response || '', 40),
    personReached: limitText(activity && activity.personReached || '', 120),
    followUpDate: normalizeDate(activity && (activity.nextFollowUpAt || activity.followUpDate)),
    nextFollowUpAt: normalizeDate(activity && (activity.nextFollowUpAt || activity.followUpDate)),
    lastContactedAt: normalizeDateTime(activity && activity.lastContactedAt),
    nextAction: limitText(activity && activity.nextAction || '', 180),
    outcome: limitText(activity && activity.outcome || '', 500),
    notes: limitText(activity && activity.notes || '', 600),
  })).filter((activity) => activity.at || activity.status || activity.response || activity.notes || activity.queue || activity.toQueue)
}

function createWorkflowActivity(previous = {}, workflow = {}) {
  const notesChanged = String(previous.notes || '') !== String(workflow.notes || '')
  const fromQueue = normalizeQueue(previous.queue)
  const toQueue = normalizeQueue(workflow.queue)
  const changed = ['status', 'queue', 'contacted', 'channel', 'response', 'personReached', 'followUpDate', 'nextFollowUpAt', 'lastContactedAt', 'nextAction', 'outcome', 'notes', 'archivedAt']
    .some((field) => String(previous[field] || '') !== String(workflow[field] || ''))
  if (!changed) return null
  const createdAt = workflow.updatedAt || new Date().toISOString()
  return {
    id: 'act_' + createdAt.replace(/[^0-9]/g, '').slice(0, 17) + '_' + Math.random().toString(36).slice(2, 7),
    createdAt,
    at: createdAt,
    type: activityType(previous, workflow),
    status: workflow.status || 'new',
    queue: toQueue,
    fromQueue,
    toQueue,
    channel: workflow.channel || '',
    response: workflow.response || '',
    personReached: workflow.personReached || '',
    followUpDate: workflow.followUpDate || workflow.nextFollowUpAt || '',
    nextFollowUpAt: workflow.nextFollowUpAt || workflow.followUpDate || '',
    lastContactedAt: workflow.lastContactedAt || '',
    nextAction: workflow.nextAction || '',
    outcome: workflow.outcome || '',
    notes: notesChanged ? (workflow.notes || '') : '',
  }
}

function activityType(previous = {}, workflow = {}) {
  if (normalizeQueue(previous.queue) !== normalizeQueue(workflow.queue)) return 'queue_change'
  if (String(previous.followUpDate || previous.nextFollowUpAt || '') !== String(workflow.followUpDate || workflow.nextFollowUpAt || '')) return 'follow_up_set'
  if (String(previous.notes || '') !== String(workflow.notes || '') && String(previous.status || '') === String(workflow.status || '')) return 'note'
  if (workflow.contacted || workflow.response || workflow.channel) return 'contact_attempt'
  return 'status_change'
}

function isDateDue(value, todayValue) {
  const date = normalizeDate(value)
  if (!date) return false
  return date <= (todayValue || today())
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function isoDateOffset(days, from) {
  const date = from ? new Date(from) : new Date()
  if (Number.isNaN(date.getTime())) return today()
  date.setDate(date.getDate() + Number(days || 0))
  return date.toISOString().slice(0, 10)
}

function normalizeDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : ''
}

function normalizeDateTime(value) {
  const raw = String(value || '')
  if (!raw) return ''
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function limitText(value, max) {
  return String(value || '').slice(0, max)
}

module.exports = {
  WORK_QUEUES,
  defaultWorkflow,
  normalizeWorkflow,
  normalizeActivities,
  createWorkflowActivity,
  workflowForLead,
  inferLeadQueue,
  leadMatchesQueue,
  leadQueueQuality,
  isLikelyNorwegianPhone,
  normalizeQueue,
  isDateDue,
  isoDateOffset,
}
