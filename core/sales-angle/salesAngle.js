const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses'
const PROJECT_API_KEY_ENV = 'LEAD_MACHINE_OPENAI_API_KEY'
const STANDARD_API_KEY_ENV = 'OPENAI_API_KEY'
const DEFAULT_MODEL = 'gpt-5.5'

const SALES_ANGLE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    angles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          why: { type: 'string' },
          offer: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'why', 'offer', 'evidence'],
        additionalProperties: false,
      },
    },
    risks: { type: 'array', items: { type: 'string' } },
    nextStep: { type: 'string' },
    searchedFor: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'angles', 'risks', 'nextStep', 'searchedFor'],
  additionalProperties: false,
}

async function researchSalesAngles({ lead, apiKey, model, fetcher } = {}) {
  const doFetch = fetcher || globalThis.fetch
  const key = apiKey || process.env[PROJECT_API_KEY_ENV] || process.env[STANDARD_API_KEY_ENV] || ''
  if (!lead || typeof lead !== 'object') return { ok: false, error: 'Lead er påkrevd' }
  if (!key) return { ok: false, error: PROJECT_API_KEY_ENV + ' mangler - legg den i .env og restart serveren' }
  if (typeof doFetch !== 'function') return { ok: false, error: 'fetch er ikke tilgjengelig i denne Node-versjonen' }

  const prompt = buildSalesAnglePrompt(lead)
  let response
  try {
    response = await doFetch(OPENAI_RESPONSES_API_URL, {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + key,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || process.env.LEAD_MACHINE_AUDIT_MODEL || DEFAULT_MODEL,
        store: false,
        max_output_tokens: 1200,
        reasoning: { effort: 'low' },
        tools: [webSearchToolForLead(lead)],
        input: [
          { role: 'system', content: 'Du hjelper en norsk selger av nettsider/booking/digital tilstedeværelse med korte, kildebaserte observasjoner for én valgt lokal bedrift. Ikke skriv ferdig salgsmelding, pitchmanus, e-post eller ringeskript. Ikke gjett. Skill tydelig mellom bevis og mulighet.' },
          { role: 'user', content: prompt },
        ],
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: 'lead_machine_sales_angles',
            strict: true,
            schema: SALES_ANGLE_SCHEMA,
          },
        },
      }),
    })
  } catch (error) {
    return { ok: false, error: 'OpenAI-søk feilet: ' + (error.message || 'ukjent nettverksfeil') }
  }

  let payload
  try {
    payload = await response.json()
  } catch (_) {
    return { ok: false, error: 'OpenAI-svaret var ikke gyldig JSON' }
  }
  if (!response.ok) {
    const message = payload?.error?.message || ('HTTP ' + response.status)
    return { ok: false, error: 'OpenAI API: ' + message }
  }

  let parsed
  try {
    parsed = JSON.parse(extractOpenAIText(payload))
  } catch (_) {
    return { ok: false, error: 'klarte ikke å tolke salgsvinklene fra OpenAI' }
  }

  return {
    ok: true,
    salesAngles: normalizeSalesAngles(parsed),
    usage: payload.usage || null,
    model: payload.model || '',
  }
}

function webSearchToolForLead(lead = {}) {
  const city = String(lead.contact?.city || lead.city || '').trim()
  const location = { type: 'approximate', country: 'NO' }
  if (city) {
    location.city = city
    location.region = city
  }
  return { type: 'web_search', search_context_size: 'low', user_location: location }
}

function buildSalesAnglePrompt(lead = {}) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const website = lead.website || {}
  const city = contact.city || lead.city || ''
  const name = company.displayName || lead.companyName || company.legalName || company.candidateLegalName || ''
  const websiteUrl = websiteValue(contact.website || website)
  const searchTerms = [
    [name, city].filter(Boolean).join(' '),
    [name, 'Google anmeldelser'].filter(Boolean).join(' '),
    [name, 'booking priser tjenester'].filter(Boolean).join(' '),
  ].filter(Boolean)
  return [
    'Finn salgbare digitale vinkler for denne bedriften. Bruk web search for å sjekke offentlige spor som Google-profil, Facebook/Instagram, booking, prisliste, tjenester, konkurrenter og eventuell nettside.',
    '',
    'Lead-data fra Lead Machine:',
    '- Navn: ' + (name || 'ukjent'),
    '- By: ' + (city || 'ukjent'),
    '- Telefon: ' + (contact.phone || lead.phone || 'mangler'),
    '- Nettside i lead-data: ' + (websiteUrl || 'ingen nettside funnet'),
    '- Google rating: ' + (places.rating || 'ukjent'),
    '- Google omtaler: ' + (places.reviewCount || 'ukjent'),
    '- Adresse: ' + (contact.address || lead.address || 'ukjent'),
    '- Brreg/org: ' + (company.organizationNumber || company.candidateOrganizationNumber || company.matchStatus || 'ikke bekreftet'),
    '- Nettside-salgsfit: ' + JSON.stringify(lead.websiteSalesFit || {}),
    '',
    'Søk gjerne etter: ' + searchTerms.join(' | '),
    '',
    'Svar på norsk. Lag maks 3 vinkler. Hver vinkel skal være en observasjon selgeren kan bruke til å forstå hva som kan selges, ikke en ferdig melding. Hvis beviset er svakt, si det i risks. Foreslå typiske leveranser som enkel landingsside, bookingforespørsel, Google Business-forbedring, prisliste/tjenester, review-lenke eller SMS/rebooking bare når det passer bevisene.',
  ].join('\n')
}

function normalizeSalesAngles(value = {}) {
  return {
    researchedAt: new Date().toISOString(),
    summary: String(value.summary || '').trim(),
    angles: (Array.isArray(value.angles) ? value.angles : []).slice(0, 3).map((angle) => ({
      title: String(angle.title || '').trim(),
      why: String(angle.why || '').trim(),
      offer: String(angle.offer || '').trim(),
      evidence: normalizeList(angle.evidence).slice(0, 4),
    })).filter((angle) => angle.title || angle.why || angle.offer),
    risks: normalizeList(value.risks).slice(0, 4),
    nextStep: String(value.nextStep || '').trim(),
    searchedFor: normalizeList(value.searchedFor).slice(0, 5),
  }
}

function extractOpenAIText(payload = {}) {
  if (typeof payload.output_text === 'string') return payload.output_text
  const chunks = []
  for (const item of Array.isArray(payload.output) ? payload.output : []) {
    for (const content of Array.isArray(item && item.content) ? item.content : []) {
      if (content && content.type === 'output_text' && typeof content.text === 'string') chunks.push(content.text)
    }
  }
  return chunks.join('')
}

function websiteValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') return String(value.url || value.href || value.website || value.uri || '').trim()
  return ''
}

function normalizeList(value) {
  return (Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean)
}

module.exports = { researchSalesAngles, SALES_ANGLE_SCHEMA }
