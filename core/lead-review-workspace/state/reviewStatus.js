const fs = require('fs')

const REVIEW_STATUSES = ['unreviewed', 'reviewed', 'shortlisted', 'rejected']

function createDefaultReviewStatus(items) {
  return {
    updatedAt: new Date().toISOString(),
    items: Object.fromEntries(items.map((item) => [item.id, { status: 'unreviewed', notes: '' }])),
  }
}

function loadOrCreateReviewStatus(statusPath, items) {
  if (fs.existsSync(statusPath)) return mergeReviewStatus(JSON.parse(fs.readFileSync(statusPath, 'utf8')), items)
  const status = createDefaultReviewStatus(items)
  fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`)
  return status
}

function mergeReviewStatus(status, items) {
  const merged = { updatedAt: status.updatedAt || new Date().toISOString(), items: { ...(status.items || {}) } }
  for (const item of items) {
    if (!merged.items[item.id]) merged.items[item.id] = { status: 'unreviewed', notes: '' }
    if (!REVIEW_STATUSES.includes(merged.items[item.id].status)) merged.items[item.id].status = 'unreviewed'
    if (typeof merged.items[item.id].notes !== 'string') merged.items[item.id].notes = ''
  }
  return merged
}

module.exports = { REVIEW_STATUSES, createDefaultReviewStatus, loadOrCreateReviewStatus, mergeReviewStatus }
