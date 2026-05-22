const fs = require('fs')
const path = require('path')
const readXlsxFile = require('read-excel-file/node')
const { normalizeUrl } = require('../audits/auditWebsite')

const urlHeaders = ['url', 'website', 'webside', 'nettside', 'hjemmeside', 'site']
const nameHeaders = ['name', 'company', 'firmanavn', 'business', 'virksomhet']

async function extractLeadsFromSpreadsheet(filePath, options = {}) {
  const absolutePath = path.resolve(filePath)
  const sheets = await readSheets(absolutePath, options)
  const leads = []
  for (const { sheetName, rows } of sheets) {
    const headerIndex = findHeaderRow(rows)
    if (headerIndex === -1) continue
    const headers = rows[headerIndex].map(normalizeHeader)
    const urlIndex = findHeaderIndex(headers, urlHeaders)
    const nameIndex = findHeaderIndex(headers, nameHeaders)
    if (urlIndex === -1) continue
    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex]
      const rawUrl = cleanCell(row[urlIndex])
      if (!rawUrl || !looksLikeUrl(rawUrl)) continue
      leads.push({
        sourceFile: absolutePath,
        sheetName,
        sourceRow: rowIndex + 1,
        name: nameIndex >= 0 ? cleanCell(row[nameIndex]) : '',
        url: normalizeUrl(rawUrl),
        raw: Object.fromEntries(headers.map((header, index) => [header || `column_${index + 1}`, cleanCell(row[index])])),
      })
    }
  }
  return dedupeLeads(leads)
}

async function readSheets(filePath, options) {
  if (/\.csv$/i.test(filePath)) {
    return [{ sheetName: path.basename(filePath), rows: parseCsv(fs.readFileSync(filePath, 'utf8')) }]
  }
  if (options.sheet) {
    return [{ sheetName: options.sheet, rows: await readXlsxFile(filePath, { sheet: options.sheet }) }]
  }
  const output = await readXlsxFile(filePath)
  if (output[0] && !Array.isArray(output[0]) && output[0].data) {
    return output.map((sheet) => ({ sheetName: sheet.sheet, rows: sheet.data }))
  }
  return [{ sheetName: 'first sheet', rows: output }]
}

function parseCsv(input) {
  return input.trim().split(/\r?\n/).map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')))
}

function findHeaderRow(rows) { return rows.findIndex((row) => row.map(normalizeHeader).some((header) => urlHeaders.includes(header))) }
function findHeaderIndex(headers, candidates) { return headers.findIndex((header) => candidates.includes(header)) }
function normalizeHeader(value) { return cleanCell(value).toLowerCase() }
function cleanCell(value) { return String(value ?? '').replace(/\s+/g, ' ').trim() }
function looksLikeUrl(value) { return /^(https?:\/\/)?(([a-z0-9-]+\.)+[a-z]{2,}|localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?/i.test(value) }
function dedupeLeads(leads) {
  const seen = new Set()
  return leads.filter((lead) => { if (seen.has(lead.url)) return false; seen.add(lead.url); return true })
}

module.exports = { extractLeadsFromSpreadsheet }
