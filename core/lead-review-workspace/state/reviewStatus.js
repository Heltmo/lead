const fs = require('fs')

const REVIEW_STATUSES = ['unreviewed', 'reviewed', 'shortlisted', 'rejected']
const REVIEW_PRIORITIES = ['unset', 'low', 'medium', 'high']
const REVIEW_NEXT_ACTIONS = ['unset', 'review', 'contact', 'monitor', 'reject']

function createDefaultReviewStatus(items) {
  return {
    updatedAt: new Date().toISOString(),
    items: Object.fromEntries(items.map((item) => [item.id, createDefaultReviewRecord()])),
  }
}

function createDefaultReviewRecord() {
  return {
    status: 'unreviewed',
    priority: 'unset',
    notes: '',
    nextAction: 'unset',
    owner: '',
    lastReviewedAt: '',
    tags: [],
  }
}

function loadOrCreateReviewStatus(statusPath, items) {
  if (fs.existsSync(statusPath)) {
    const status = mergeReviewStatus(JSON.parse(fs.readFileSync(statusPath, 'utf8')), items)
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n')
    return status
  }
  const status = createDefaultReviewStatus(items)
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n')
  return status
}

function mergeReviewStatus(status, items) {
  const merged = { updatedAt: status.updatedAt || new Date().toISOString(), items: {} }
  for (const item of items) merged.items[item.id] = normalizeReviewRecord((status.items || {})[item.id])
  return merged
}

function normalizeReviewRecord(record = {}) {
  const normalized = createDefaultReviewRecord()
  normalized.status = REVIEW_STATUSES.includes(record.status) ? record.status : normalized.status
  normalized.priority = REVIEW_PRIORITIES.includes(record.priority) ? record.priority : normalized.priority
  normalized.notes = typeof record.notes === 'string' ? record.notes : normalized.notes
  normalized.nextAction = REVIEW_NEXT_ACTIONS.includes(record.nextAction) ? record.nextAction : normalized.nextAction
  normalized.owner = typeof record.owner === 'string' ? record.owner : normalized.owner
  normalized.lastReviewedAt = typeof record.lastReviewedAt === 'string' ? record.lastReviewedAt : normalized.lastReviewedAt
  normalized.tags = normalizeTags(record.tags)
  return normalized
}

function normalizeTags(value) {
  if (Array.isArray(value)) return [...new Set(value.map((tag) => String(tag).trim()).filter(Boolean))].sort()
  if (typeof value === 'string') return [...new Set(value.split(/[|,]/).map((tag) => tag.trim()).filter(Boolean))].sort()
  return []
}

module.exports = { REVIEW_STATUSES, REVIEW_PRIORITIES, REVIEW_NEXT_ACTIONS, createDefaultReviewStatus, createDefaultReviewRecord, loadOrCreateReviewStatus, mergeReviewStatus, normalizeReviewRecord }
