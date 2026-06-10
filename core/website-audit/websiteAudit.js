// AI-nettsidesjekk for én valgt lead: henter forsiden, trekker ut signaler og
// ber Claude om en kort, strukturert vurdering på norsk. Kjøres alltid manuelt
// per lead (aldri i bulk), og produserer observasjoner og mangler - aldri
// pitch-manus; selgeren eier ordlyden.
//
// Repoet er bevisst avhengighetsfritt, så Claude kalles med innebygd fetch
// (Messages API, structured outputs) i stedet for SDK-en.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-opus-4-8'
const MAX_HTML_BYTES = 300000
const MAX_TEXT_CHARS = 7000

const AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    estimatedEra: { type: 'string', description: 'Anslått periode siden er laget/sist fornyet, f.eks. "ca. 2012-2015" eller "ukjent"' },
    outdated: { type: 'string', enum: ['ja', 'nei', 'usikkert'] },
    summary: { type: 'string', description: 'Én til to korte setninger om sidens tilstand, på norsk' },
    topIssues: { type: 'array', items: { type: 'string' }, description: 'Maks 3 konkrete problemer, korte punkter på norsk' },
    missing: { type: 'array', items: { type: 'string' }, description: 'Maks 3 ting siden mangler som ville gjort den bedre, på norsk' },
    candidate: { type: 'string', enum: ['sterk_kandidat', 'mulig_kandidat', 'ikke_kandidat'], description: 'Hvor god kandidat bedriften er for nettsidesalg basert på siden alene' },
  },
  required: ['estimatedEra', 'outdated', 'summary', 'topIssues', 'missing', 'candidate'],
  additionalProperties: false,
}

async function auditWebsite({ url, companyName = '', city = '', apiKey, model, fetcher, timeoutMs = 20000 } = {}) {
  const doFetch = fetcher || globalThis.fetch
  const key = apiKey || process.env.ANTHROPIC_API_KEY || ''
  if (!url) return { ok: false, error: 'mangler nettside-URL' }
  if (!key) return { ok: false, error: 'ANTHROPIC_API_KEY mangler - legg den i .env og restart serveren' }
  if (typeof doFetch !== 'function') return { ok: false, error: 'fetch er ikke tilgjengelig i denne Node-versjonen' }

  const page = await fetchPage(url, doFetch, timeoutMs)
  if (!page.ok) return { ok: false, error: 'fikk ikke hentet nettsiden: ' + page.error }

  const signals = extractSignals(page.html, page.finalUrl || url)
  const prompt = buildPrompt({ url: page.finalUrl || url, companyName, city, signals, pageText: signals.text })

  let response
  try {
    response = await doFetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || process.env.LEAD_MACHINE_AUDIT_MODEL || DEFAULT_MODEL,
        max_tokens: 1000,
        system: 'Du er en nøktern norsk rådgiver som vurderer småbedrifters nettsider for en selger av nye nettsider. Vær kort, konkret og ærlig. Aldri skriv salgsmanus, ringeskript eller ferdige formuleringer selgeren skal si - kun observasjoner om siden.',
        messages: [{ role: 'user', content: prompt }],
        output_config: { format: { type: 'json_schema', schema: AUDIT_SCHEMA } },
      }),
    })
  } catch (error) {
    return { ok: false, error: 'Claude-kallet feilet: ' + (error.message || 'ukjent nettverksfeil') }
  }

  let payload
  try {
    payload = await response.json()
  } catch (_) {
    return { ok: false, error: 'Claude-svaret var ikke gyldig JSON' }
  }
  if (!response.ok) {
    const message = payload?.error?.message || ('HTTP ' + response.status)
    return { ok: false, error: 'Claude API: ' + message }
  }

  const text = (payload.content || []).filter((block) => block.type === 'text').map((block) => block.text).join('')
  let audit
  try {
    audit = JSON.parse(text)
  } catch (_) {
    return { ok: false, error: 'klarte ikke å tolke vurderingen fra Claude' }
  }

  return {
    ok: true,
    audit: normalizeAudit(audit, page.finalUrl || url),
    usage: payload.usage || null,
    model: payload.model || '',
  }
}

function normalizeAudit(audit = {}, url = '') {
  return {
    url,
    auditedAt: new Date().toISOString(),
    estimatedEra: String(audit.estimatedEra || 'ukjent'),
    outdated: ['ja', 'nei', 'usikkert'].includes(audit.outdated) ? audit.outdated : 'usikkert',
    summary: String(audit.summary || '').trim(),
    topIssues: toList(audit.topIssues).slice(0, 3),
    missing: toList(audit.missing).slice(0, 3),
    candidate: ['sterk_kandidat', 'mulig_kandidat', 'ikke_kandidat'].includes(audit.candidate) ? audit.candidate : 'mulig_kandidat',
  }
}

function buildPrompt({ url, companyName, city, signals, pageText }) {
  return [
    'Vurder denne nettsiden for nettsidesalg. Bedrift: ' + (companyName || 'ukjent') + (city ? ' (' + city + ')' : '') + '. URL: ' + url,
    '',
    'Tekniske signaler fra siden:',
    '- Tittel: ' + (signals.title || 'mangler'),
    '- Meta-beskrivelse: ' + (signals.metaDescription ? 'finnes' : 'mangler'),
    '- Generator/verktøy: ' + (signals.generator || 'ukjent'),
    '- Mobil viewport: ' + (signals.hasViewport ? 'ja' : 'NEI - trolig ikke mobiltilpasset'),
    '- Skjema på forsiden: ' + (signals.hasForm ? 'ja' : 'nei'),
    '- HTTPS: ' + (signals.https ? 'ja' : 'NEI'),
    '- Årstall funnet på siden: ' + (signals.years.join(', ') || 'ingen'),
    '',
    'Synlig tekst fra forsiden (avkortet):',
    pageText || '(ingen tekst funnet)',
    '',
    'Svar kort og konsist på norsk. estimatedEra: anslå når siden ble laget/sist fornyet ut fra teknologi, design-signaler og årstall. topIssues og missing: maks 3 hver, konkrete og korte. summary: 1-2 setninger en selger kan lese på 5 sekunder.',
  ].join('\n')
}

async function fetchPage(url, doFetch, timeoutMs) {
  const target = /^https?:\/\//i.test(url) ? url : 'https://' + url
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    const response = await doFetch(target, {
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
      headers: { 'user-agent': 'Mozilla/5.0 (LeadMachine nettsidesjekk)', accept: 'text/html' },
    })
    if (!response.ok) return { ok: false, error: 'HTTP ' + response.status }
    const html = (await response.text()).slice(0, MAX_HTML_BYTES)
    return { ok: true, html, finalUrl: response.url || target }
  } catch (error) {
    return { ok: false, error: error.name === 'AbortError' ? 'tidsavbrudd' : (error.message || 'nettverksfeil') }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function extractSignals(html = '', url = '') {
  const title = matchOne(html, /<title[^>]*>([^<]*)<\/title>/i)
  const metaDescription = matchOne(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || matchOne(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
  const generator = matchOne(html, /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)["']/i)
    || detectStack(html)
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html)
  const hasForm = /<form[\s>]/i.test(html)
  const https = /^https:/i.test(url)
  const years = Array.from(new Set((html.match(/\b(19[89]\d|20[0-2]\d)\b/g) || []))).slice(0, 6)
  const text = htmlToText(html).slice(0, MAX_TEXT_CHARS)
  return { title, metaDescription, generator, hasViewport, hasForm, https, years, text }
}

function detectStack(html = '') {
  if (/wp-content|wp-includes/i.test(html)) return 'WordPress'
  if (/cdn\.shopify|shopify\.com/i.test(html)) return 'Shopify'
  if (/static\.wixstatic|wix\.com/i.test(html)) return 'Wix'
  if (/squarespace\.com|sqsp\.net/i.test(html)) return 'Squarespace'
  if (/_next\/static/i.test(html)) return 'Next.js'
  if (/jquery[.-]1\./i.test(html)) return 'jQuery 1.x (gammel)'
  return ''
}

function htmlToText(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchOne(html, regex) {
  const match = html.match(regex)
  return match ? String(match[1]).replace(/\s+/g, ' ').trim() : ''
}

function toList(value) {
  return (Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean)
}

module.exports = { auditWebsite, extractSignals, AUDIT_SCHEMA }
