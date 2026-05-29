const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function stableCacheKey(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex')
}

async function withFileCache(options = {}) {
  const cacheDir = options.cacheDir
  const namespace = sanitizeSegment(options.namespace || 'default')
  const key = sanitizeSegment(options.key || stableCacheKey(options.keyParts || {}))
  const ttlMs = Number(options.ttlMs || 0)
  const producer = options.producer
  const shouldCache = typeof options.shouldCache === 'function' ? options.shouldCache : () => true
  if (!cacheDir || typeof producer !== 'function') return producer()

  const dir = path.join(cacheDir, namespace)
  const cachePath = path.join(dir, `${key}.json`)
  const now = Date.now()
  const cached = readCacheFile(cachePath, now)
  if (cached.hit) return cached.value

  const value = await producer()
  if (shouldCache(value)) writeCacheFile(cachePath, value, now, ttlMs)
  return value
}

function readCacheFile(cachePath, now = Date.now()) {
  try {
    const payload = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    if (payload && payload.expiresAt && payload.expiresAt < now) return { hit: false, reason: 'expired' }
    if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'value')) return { hit: false, reason: 'invalid' }
    return { hit: true, value: payload.value }
  } catch (error) {
    return { hit: false, reason: 'missing_or_unreadable' }
  }
}

function writeCacheFile(cachePath, value, now = Date.now(), ttlMs = 0) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  const payload = {
    createdAt: new Date(now).toISOString(),
    expiresAt: ttlMs > 0 ? now + ttlMs : null,
    value,
  }
  const tmpPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmpPath, `${JSON.stringify(payload, null, 2)}
`)
  fs.renameSync(tmpPath, cachePath)
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function sanitizeSegment(value) {
  return String(value || 'cache').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 160) || 'cache'
}

module.exports = {
  stableCacheKey,
  withFileCache,
  readCacheFile,
  writeCacheFile,
}
