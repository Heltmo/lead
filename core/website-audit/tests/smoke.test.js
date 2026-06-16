const assert = require('assert')
const { auditWebsite, extractSignals } = require('../websiteAudit')

const SAMPLE_HTML = `<!doctype html><html><head>
<title>Rørlegger Hansen AS - Velkommen</title>
<meta name="generator" content="WordPress 4.2">
</head><body>
<h1>Velkommen til oss</h1><p>Vi har levert rør siden 1998. &copy; 2013 Rørlegger Hansen.</p>
<script src="/js/jquery-1.8.min.js"></script>
</body></html>`

function fakeFetch({ pageOk = true, apiBody, apiStatus = 200 } = {}) {
  return async (url) => {
    if (String(url).includes('api.anthropic.com')) {
      return {
        ok: apiStatus === 200,
        status: apiStatus,
        json: async () => apiBody,
      }
    }
    if (!pageOk) throw new Error('getaddrinfo ENOTFOUND')
    return { ok: true, status: 200, url: String(url), text: async () => SAMPLE_HTML }
  }
}

const GOOD_API_BODY = {
  model: 'claude-opus-4-8',
  usage: { input_tokens: 1200, output_tokens: 180 },
  content: [{
    type: 'text',
    text: JSON.stringify({
      estimatedEra: 'ca. 2012-2014',
      outdated: 'ja',
      summary: 'Gammel WordPress-side uten mobiltilpasning og uten kontaktskjema.',
      topIssues: ['Ikke mobiltilpasset', 'Gammel jQuery/WordPress', 'Ingen tydelig kontaktvei'],
      missing: ['Kontaktskjema', 'Mobilvisning'],
      candidate: 'sterk_kandidat',
    }),
  }],
}

async function withoutAuditKeyEnv(fn) {
  const previousProjectKey = process.env.LEAD_MACHINE_ANTHROPIC_API_KEY
  const previousLegacyKey = process.env.ANTHROPIC_API_KEY
  delete process.env.LEAD_MACHINE_ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  try {
    return await fn()
  } finally {
    if (previousProjectKey === undefined) delete process.env.LEAD_MACHINE_ANTHROPIC_API_KEY
    else process.env.LEAD_MACHINE_ANTHROPIC_API_KEY = previousProjectKey
    if (previousLegacyKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = previousLegacyKey
  }
}

async function main() {
  {
    const signals = extractSignals(SAMPLE_HTML, 'https://example.no')
    assert(signals.title.includes('Rørlegger Hansen'), 'title should be extracted')
    assert(signals.generator === 'WordPress 4.2', 'generator meta should be extracted')
    assert(!signals.hasViewport, 'missing viewport should be detected')
    assert(!signals.hasForm, 'missing form should be detected')
    assert(signals.years.includes('2013') && signals.years.includes('1998'), 'years should be collected')
    assert(signals.text.includes('Velkommen til oss') && !signals.text.includes('jquery'), 'text should strip scripts/tags')
  }

  {
    const result = await auditWebsite({ url: 'example.no', companyName: 'Rørlegger Hansen AS', city: 'Skien', apiKey: 'test-key', fetcher: fakeFetch({ apiBody: GOOD_API_BODY }) })
    assert(result.ok, 'audit should succeed: ' + (result.error || ''))
    assert(result.audit.outdated === 'ja', 'outdated verdict should pass through')
    assert(result.audit.topIssues.length <= 3 && result.audit.missing.length <= 3, 'lists must stay capped')
    assert(result.audit.summary.includes('WordPress'), 'summary should pass through')
    assert(result.audit.candidate === 'sterk_kandidat', 'candidate should pass through')
    assert(result.audit.auditedAt, 'audit should be timestamped')
  }

  {
    const result = await withoutAuditKeyEnv(() => auditWebsite({ url: 'example.no', apiKey: '', fetcher: fakeFetch({ apiBody: GOOD_API_BODY }) }))
    assert(!result.ok && result.error.includes('LEAD_MACHINE_ANTHROPIC_API_KEY'), 'missing key should explain itself')
  }

  {
    const result = await auditWebsite({ url: 'finnesikke.no', apiKey: 'test-key', fetcher: fakeFetch({ pageOk: false }) })
    assert(!result.ok && result.error.includes('hentet nettsiden'), 'unreachable site should fail gracefully')
  }

  {
    const result = await auditWebsite({ url: 'example.no', apiKey: 'test-key', fetcher: fakeFetch({ apiBody: { error: { message: 'invalid x-api-key' } }, apiStatus: 401 }) })
    assert(!result.ok && result.error.includes('invalid x-api-key'), 'API errors should surface their message')
  }

  const moduleSource = require('fs').readFileSync(require('path').join(__dirname, '..', 'websiteAudit.js'), 'utf8')
  assert(/[Aa]ldri skriv salgsmanus/.test(moduleSource), 'system prompt must forbid sales scripts')
  const schemaKeys = JSON.stringify(require('../websiteAudit').AUDIT_SCHEMA)
  for (const banned of ['skript', 'manus', 'opener', 'pitch', 'wording']) {
    assert(!schemaKeys.toLowerCase().includes(banned), 'audit schema must not request outreach content: ' + banned)
  }

  console.log('website-audit smoke test passed')
}

main().catch((error) => { console.error(error); process.exit(1) })
