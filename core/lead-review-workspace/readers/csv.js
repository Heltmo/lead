function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]
    if (quoted) {
      if (char === '"' && next === '"') { field += '"'; i += 1 }
      else if (char === '"') quoted = false
      else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === ',') { row.push(field); field = '' }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (char !== '\r') field += char
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [headers = [], ...dataRows] = rows.filter((candidate) => candidate.some((value) => value !== ''))
  return dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])))
}

function renderCsv(rows, columns) {
  const lines = [columns.join(',')]
  for (const row of rows) lines.push(columns.map((column) => csvEscape(row[column])).join(','))
  return `${lines.join('\n')}\n`
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

module.exports = { parseCsv, renderCsv, csvEscape }
