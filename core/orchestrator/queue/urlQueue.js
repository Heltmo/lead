function createQueue(urls, options = {}) {
  const maxRetries = Number(options.maxRetries ?? 1)
  return urls.map((input, index) => {
    const item = normalizeQueueInput(input)
    return {
      id: `url-${String(index + 1).padStart(4, '0')}`,
      url: item.url,
      businessName: item.businessName,
      source: item.source,
      location: item.location,
      industry: item.industry,
      confidence: item.confidence,
      sources: item.sources,
      sourceMetadata: item.sourceMetadata,
      status: 'pending',
      attempts: 0,
      maxRetries,
      startedAt: '',
      finishedAt: '',
      reportPath: '',
      errors: [],
    }
  })
}

function nextRunnableItem(queue) {
  return queue.find((item) => item.status === 'pending' || (item.status === 'failed' && item.attempts <= item.maxRetries))
}

function parseQueueInputLine(line) {
  const value = String(line || '').trim()
  if (!value || value.startsWith('#')) return null
  if (value.startsWith('{')) return JSON.parse(value)
  const parts = value.split(/\s*\|\s*/)
  if (parts.length >= 2) return { businessName: parts[0], url: parts.slice(1).join('|') }
  return value
}

function normalizeQueueInput(input) {
  const raw = typeof input === 'string' ? { url: input } : { ...(input || {}) }
  const url = String(raw.url || raw.website || raw.link || '').trim()
  if (!url) throw new Error('Queue input is missing url')
  const businessName = clean(raw.businessName || raw.name || raw.company)
  const source = clean(raw.source)
  const location = clean(raw.location)
  const industry = clean(raw.industry)
  const confidence = clean(raw.confidence)
  const sources = Array.isArray(raw.sources) ? raw.sources : []
  const sourceMetadata = {
    businessName,
    source,
    location,
    industry,
    confidence,
    sources,
  }
  return { url, businessName, source, location, industry, confidence, sources, sourceMetadata }
}

function clean(value) {
  return String(value || '').trim()
}

module.exports = { createQueue, nextRunnableItem, parseQueueInputLine, normalizeQueueInput }
