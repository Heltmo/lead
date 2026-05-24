const fs = require('fs')
const path = require('path')
const { parseCsv } = require('../lead-review-workspace/readers/csv')

const DEFAULT_OUTPUT_ROOT = path.resolve(__dirname, '..', '..', 'generated', 'demos')

function generateLeadDemo(options) {
  const shortlistPath = path.resolve(required(options.shortlistPath, 'shortlistPath'))
  const rows = parseCsv(fs.readFileSync(shortlistPath, 'utf8'))
  const selection = selectLead(rows, options)
  const lead = normalizeLead(selection.row)
  const runId = sanitizePathPart(options.runId || deriveRunId(shortlistPath))
  const businessSlug = slugify(lead.businessName)
  const outRoot = path.resolve(options.outRoot || DEFAULT_OUTPUT_ROOT)
  const outDir = path.join(outRoot, runId, businessSlug)
  const indexPath = path.join(outDir, 'index.html')
  const manifestPath = path.join(outDir, 'manifest.json')

  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(indexPath, renderDemoHtml(lead))
  fs.writeFileSync(manifestPath, JSON.stringify(buildManifest({ lead, shortlistPath, runId, selectedRow: selection.index + 1, indexPath, manifestPath }), null, 2) + '\n')

  return { outDir, indexPath, manifestPath, runId, businessSlug, lead }
}

function selectLead(rows, options) {
  if (!rows.length) throw new Error('No shortlisted leads found in CSV export')
  if (options.index !== undefined) {
    const index = Number(options.index) - 1
    if (!Number.isInteger(index) || index < 0 || index >= rows.length) throw new Error('Lead index is out of range')
    return { row: rows[index], index }
  }
  if (options.lead) {
    const needle = normalizeText(options.lead)
    const index = rows.findIndex((row) => [row.businessName, row.company, row.name, row.website, row.url].some((value) => normalizeText(value) === needle))
    if (index !== -1) return { row: rows[index], index }
    const partialIndex = rows.findIndex((row) => [row.businessName, row.company, row.name].some((value) => normalizeText(value).includes(needle)))
    if (partialIndex !== -1) return { row: rows[partialIndex], index: partialIndex }
    throw new Error('No shortlisted lead matched "' + options.lead + '"')
  }
  return { row: rows[0], index: 0 }
}

function normalizeLead(row) {
  const businessName = first(row.businessName, row.company, row.name, row.title, 'Shortlisted Lead')
  const website = first(row.website, row.url, '')
  const topIssues = splitList(first(row.topIssues, row.issues, '')).slice(0, 5)
  const contactFindings = buildContactFindings(row, topIssues)
  return {
    businessName,
    industry: first(row.industry, 'local services'),
    location: first(row.location, ''),
    website,
    pageTitle: first(row.pageTitle, row.title, ''),
    score: first(row.score, row.leadScore, ''),
    suggestedAngle: first(row.suggestedAngle, 'General improvement opportunity'),
    suggestedAngleDetail: first(row.suggestedAngleDetail, 'The audit found measurable website improvement signals.'),
    topIssues,
    email: first(row.email, ''),
    phone: first(row.phone, ''),
    contactFindings,
  }
}

function buildContactFindings(row, topIssues) {
  const email = first(row.email, '')
  const phone = first(row.phone, '')
  const issueText = normalizeText(topIssues.join(' ') + ' ' + first(row.issueCategories, '') + ' ' + first(row.suggestedAngle, ''))
  const ctaIssue = issueText.includes('cta') || issueText.includes('contact') || issueText.includes('booking')
  return {
    email: email ? 'Visible email: ' + email : 'No visible email in the audit export',
    phone: phone ? 'Visible phone: ' + phone : 'No visible phone in the audit export',
    cta: ctaIssue ? 'CTA/contact path flagged by the audit' : 'CTA/contact path can be made more prominent',
  }
}

function buildManifest({ lead, shortlistPath, runId, selectedRow, indexPath, manifestPath }) {
  return {
    version: 1,
    generator: 'core/demo-generator',
    deterministic: true,
    source: {
      type: 'crm-shortlisted-leads.csv',
      path: shortlistPath,
      selectedRow,
      runId,
    },
    lead,
    output: {
      indexPath,
      manifestPath,
    },
  }
}

function renderDemoHtml(lead) {
  const issues = lead.topIssues.length ? lead.topIssues : ['Clarify the primary visitor action', 'Strengthen trust signals above the fold']
  const locationContext = [lead.industry, lead.location].filter(Boolean).join(' in ')
  return '<!doctype html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '  <title>' + escapeHtml(lead.businessName) + ' demo</title>\n' +
    '  <style>\n' +
    '    :root { color-scheme: light; --ink: #172026; --muted: #5d6972; --line: #d9e0e6; --paper: #f6f8f5; --accent: #0f766e; --gold: #b7791f; }\n' +
    '    * { box-sizing: border-box; }\n' +
    '    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--paper); line-height: 1.5; }\n' +
    '    main { min-height: 100vh; }\n' +
    '    .hero { background: linear-gradient(135deg, #ffffff 0%, #eef5f2 52%, #f8f0df 100%); border-bottom: 1px solid var(--line); }\n' +
    '    .wrap { width: min(1120px, calc(100% - 40px)); margin: 0 auto; }\n' +
    '    .hero-inner { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(280px, .65fr); gap: 36px; align-items: center; padding: 56px 0; }\n' +
    '    .eyebrow { margin: 0 0 14px; color: var(--accent); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }\n' +
    '    h1 { margin: 0; max-width: 780px; font-size: clamp(38px, 7vw, 76px); line-height: .94; letter-spacing: 0; }\n' +
    '    .lead { max-width: 680px; margin: 24px 0 0; color: var(--muted); font-size: 20px; }\n' +
    '    .panel { background: #ffffff; border: 1px solid var(--line); border-radius: 8px; padding: 24px; box-shadow: 0 16px 44px rgba(23, 32, 38, .08); }\n' +
    '    .metric { display: flex; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--line); }\n' +
    '    .metric:last-child { border-bottom: 0; }\n' +
    '    .metric span { color: var(--muted); }\n' +
    '    .metric strong { text-align: right; }\n' +
    '    .band { padding: 44px 0; }\n' +
    '    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }\n' +
    '    .card { background: #ffffff; border: 1px solid var(--line); border-radius: 8px; padding: 22px; min-height: 150px; }\n' +
    '    .card h2, .card h3 { margin: 0 0 10px; font-size: 18px; }\n' +
    '    .card p { margin: 0 0 8px; color: var(--muted); }\n' +
    '    .wide { grid-column: span 2; }\n' +
    '    .cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }\n' +
    '    .button { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 6px; background: var(--accent); color: #ffffff; font-weight: 700; text-decoration: none; }\n' +
    '    .button.secondary { background: transparent; color: var(--ink); border: 1px solid var(--line); }\n' +
    '    ul { margin: 0; padding-left: 20px; color: var(--muted); }\n' +
    '    li + li { margin-top: 8px; }\n' +
    '    footer { padding: 26px 0 40px; color: var(--muted); font-size: 13px; }\n' +
    '    @media (max-width: 820px) { .hero-inner, .grid { grid-template-columns: 1fr; } .wide { grid-column: auto; } .wrap { width: min(100% - 28px, 1120px); } .hero-inner { padding: 42px 0; } }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <main>\n' +
    '    <section class="hero">\n' +
    '      <div class="wrap hero-inner">\n' +
    '        <div>\n' +
    '          <p class="eyebrow">' + escapeHtml(locationContext || 'Local business') + '</p>\n' +
    '          <h1>' + escapeHtml(lead.businessName) + '</h1>\n' +
    '          <p class="lead">' + escapeHtml(lead.suggestedAngleDetail) + '</p>\n' +
    '          <div class="cta">\n' +
    '            <a class="button" href="' + escapeAttribute(lead.website || '#') + '">Visit current site</a>\n' +
    '            <a class="button secondary" href="#contact-path">Review contact path</a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <aside class="panel" aria-label="Audit summary">\n' +
    '          ' + renderMetric('Suggested angle', lead.suggestedAngle) + '\n' +
    '          ' + renderMetric('Audit score', lead.score || 'Not scored') + '\n' +
    '          ' + renderMetric('Page title', lead.pageTitle || 'Not captured') + '\n' +
    '        </aside>\n' +
    '      </div>\n' +
    '    </section>\n' +
    '    <section class="band">\n' +
    '      <div class="wrap grid">\n' +
    '        <article class="card wide">\n' +
    '          <h2>Top issues to address</h2>\n' +
    '          <ul>' + issues.map((issue) => '<li>' + escapeHtml(issue) + '</li>').join('') + '</ul>\n' +
    '        </article>\n' +
    '        <article class="card" id="contact-path">\n' +
    '          <h2>Contact and CTA signals</h2>\n' +
    '          <p>' + escapeHtml(lead.contactFindings.email) + '</p>\n' +
    '          <p>' + escapeHtml(lead.contactFindings.phone) + '</p>\n' +
    '          <p>' + escapeHtml(lead.contactFindings.cta) + '</p>\n' +
    '        </article>\n' +
    '        <article class="card">\n' +
    '          <h3>Hero improvement</h3>\n' +
    '          <p>Make the service, location, and next action visible before visitors need to scroll.</p>\n' +
    '        </article>\n' +
    '        <article class="card">\n' +
    '          <h3>Trust improvement</h3>\n' +
    '          <p>Use concise proof points and readable layout to reduce uncertainty for first-time visitors.</p>\n' +
    '        </article>\n' +
    '        <article class="card">\n' +
    '          <h3>Conversion improvement</h3>\n' +
    '          <p>Keep phone, email, and booking actions consistently available on desktop and mobile.</p>\n' +
    '        </article>\n' +
    '      </div>\n' +
    '    </section>\n' +
    '  </main>\n' +
    '  <footer><div class="wrap">Generated locally from a shortlisted Webconsult lead export. No hosting or outreach automation included.</div></footer>\n' +
    '</body>\n' +
    '</html>\n'
}

function renderMetric(label, value) {
  return '<div class="metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>'
}

function deriveRunId(shortlistPath) {
  const parts = path.resolve(shortlistPath).split(path.sep)
  const runsIndex = parts.lastIndexOf('runs')
  if (runsIndex !== -1 && parts[runsIndex + 1]) return parts[runsIndex + 1]
  const parent = path.basename(path.dirname(shortlistPath))
  if (parent === 'review-workspace') return path.basename(path.dirname(path.dirname(shortlistPath)))
  return 'manual-run'
}

function slugify(value) {
  const slug = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
  return slug || 'shortlisted-lead'
}

function sanitizePathPart(value) {
  return slugify(value)
}

function splitList(value) {
  return String(value || '').split('|').map((item) => item.trim()).filter(Boolean)
}

function first(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

function required(value, name) {
  if (!value) throw new Error(name + ' is required')
  return value
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

function escapeAttribute(value) {
  const text = String(value || '')
  if (!/^https?:\/\//.test(text) && text !== '#') return '#'
  return escapeHtml(text)
}

module.exports = { generateLeadDemo, normalizeLead, renderDemoHtml, deriveRunId, slugify }
