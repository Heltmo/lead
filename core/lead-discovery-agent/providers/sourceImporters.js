const fs = require('fs')
const path = require('path')
const { extractSearchResults } = require('../extractors/searchResults')
const { industryMatches } = require('../taxonomy/industryTaxonomy')

function loadDiscoverySources(sourceFiles, defaults = {}) {
  const files = Array.isArray(sourceFiles) ? sourceFiles : [sourceFiles].filter(Boolean)
  return files.flatMap((sourceFile) => loadDiscoverySource(sourceFile, defaults))
}

function loadDiscoverySource(sourceFile, defaults = {}) {
  const resolved = path.resolve(sourceFile)
  const format = detectFormat(resolved)
  const rows = parseSourceFile(resolved, format)
  const fallbackSource = path.basename(resolved)
  return rows
    .filter((row) => matchesFilter(row, defaults))
    .map((row) => ({
      ...row,
      source: row.source || fallbackSource,
      sourceFile: resolved,
      sourceFormat: format,
    }))
}

function parseSourceFile(sourceFile, format = detectFormat(sourceFile)) {
  const text = fs.readFileSync(sourceFile, 'utf8')
  if (format === 'json') return extractSearchResults(JSON.parse(text))
  if (format === 'csv') return parseCsv(text)
  if (format === 'txt') return parseTxtUrls(text, sourceFile)
  if (format === 'html') return parseHtmlLinks(text, sourceFile)
  throw new Error('Unsupported discovery source format: ' + sourceFile)
}

function detectFormat(sourceFile) {
  const ext = path.extname(sourceFile).toLowerCase()
  if (ext === '.json') return 'json'
  if (ext === '.csv') return 'csv'
  if (ext === '.txt') return 'txt'
  if (ext === '.html' || ext === '.htm') return 'html'
  return 'json'
}

function parseCsv(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => String(cell || '').trim()))
  if (rows.length === 0) return []
  const headers = rows[0].map((header) => normalizeHeader(header))
  return rows.slice(1).map((row) => {
    const item = {}
    headers.forEach((header, index) => { if (header) item[header] = String(row[index] || '').trim() })
    return item
  })
}

function parseCsvRows(text) {
  const rows = []
  let row = []
  let value = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (quoted) {
      if (char === '"' && next === '"') { value += '"'; index += 1 }
      else if (char === '"') quoted = false
      else value += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(value); value = '' }
    else if (char === '\n') { row.push(value); rows.push(row); row = []; value = '' }
    else if (char !== '\r') value += char
  }
  row.push(value)
  rows.push(row)
  return rows
}

function parseTxtUrls(text, sourceFile) {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split(/\s*\|\s*/)
      return parts.length > 1
        ? { businessName: parts[0], website: parts[1], source: path.basename(sourceFile) }
        : { website: parts[0], source: path.basename(sourceFile) }
    })
}

function parseHtmlLinks(text, sourceFile) {
  const rows = []
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match
  while ((match = anchorPattern.exec(text))) {
    const href = decodeHtml(match[1]).trim()
    if (!/^https?:\/\//i.test(href)) continue
    const title = decodeHtml(stripTags(match[2])).replace(/\s+/g, ' ').trim()
    rows.push({ businessName: title, website: href, source: path.basename(sourceFile) })
  }
  return rows
}

function matchesFilter(row, filters) {
  const industry = String(row.industry || '').toLowerCase()
  const location = String(row.location || '').toLowerCase()
  const requestedIndustry = String(filters.industry || '').toLowerCase()
  const requestedLocation = String(filters.location || '').toLowerCase()
  if (requestedIndustry && industry && !industryMatches(industry, filters)) return false
  if (requestedLocation && location && !location.includes(requestedLocation)) return false
  return true
}

function normalizeHeader(value) {
  const key = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
  const aliases = {
    business: 'businessName',
    businessname: 'businessName',
    company: 'businessName',
    companyname: 'businessName',
    name: 'businessName',
    title: 'businessName',
    url: 'website',
    link: 'website',
    websiteurl: 'website',
  }
  return aliases[key] || key
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]*>/g, '')
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

module.exports = { loadDiscoverySources, loadDiscoverySource, parseSourceFile, detectFormat, parseCsv, parseTxtUrls, parseHtmlLinks }
