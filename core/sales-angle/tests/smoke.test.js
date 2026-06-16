const assert = require('assert')
const { researchSalesAngles, startSalesAngleResearch, retrieveSalesAngleResearch, SALES_ANGLE_SCHEMA } = require('../salesAngle')

const SAMPLE_RESPONSE = {
  model: 'gpt-5.5',
  usage: { input_tokens: 900, output_tokens: 220 },
  output: [{
    type: 'message',
    content: [{
      type: 'output_text',
      text: JSON.stringify({
        summary: 'Sterk Google-tillit, men lav digital friksjonsfrihet.',
        angles: [{
          title: 'Google til booking',
          why: 'Mange finner bedriften via Google, men nettside mangler.',
          offer: 'En enkel landingsside med tjenester, priser og bookingforespørsel.',
          evidence: ['4.9 rating', '87 omtaler', 'ingen nettside funnet'],
        }],
        risks: ['Brreg-identitet må verifiseres før eksport.'],
        nextStep: 'Sjekk Google-profil og spør om bookingflyten tas på telefon i dag.',
        searchedFor: ['Halden Frisør Halden', 'Halden Frisør booking priser'],
      }),
    }],
  }],
}

async function main() {
  const calls = []
  const result = await researchSalesAngles({
    apiKey: 'test-key',
    lead: {
      companyName: 'Halden Frisør',
      contact: { city: 'Halden', phone: '92 50 79 05' },
      places: { rating: 4.9, reviewCount: 87 },
      website: { auditStatus: 'skipped_no_website' },
      websiteSalesFit: { websiteLeadType: 'no_website', websiteSalesFit: 'strong' },
    },
    fetcher: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) })
      return { ok: true, status: 200, json: async () => SAMPLE_RESPONSE }
    },
  })

  assert(result.ok, 'sales angle research should succeed: ' + (result.error || ''))
  assert(result.salesAngles.summary.includes('Google'), 'summary should pass through')
  assert(result.salesAngles.angles[0].offer.includes('landingsside'), 'offer should pass through')
  assert(result.salesAngles.risks.length === 1, 'risks should pass through')
  assert(calls[0].url.includes('/v1/responses'), 'should call OpenAI Responses API')
  assert(calls[0].body.model === 'gpt-5.5', 'should default to GPT-5.5')
  assert(calls[0].body.max_output_tokens >= 2500, 'should allow enough output tokens for web-search JSON')
  assert(calls[0].body.tools.some((tool) => tool.type === 'web_search'), 'should use OpenAI web search')
  assert(calls[0].body.tools[0].user_location.country === 'NO', 'should bias web search to Norway')
  assert(JSON.stringify(calls[0].body).includes('Aldri') || JSON.stringify(calls[0].body).includes('Ikke skriv ferdig'), 'prompt should forbid scripts')
  assert(!JSON.stringify(SALES_ANGLE_SCHEMA).toLowerCase().includes('pitch'), 'schema should not request pitch copy')

  const startCalls = []
  const started = await startSalesAngleResearch({
    apiKey: 'test-key',
    lead: { companyName: 'Halden Frisør', contact: { city: 'Halden' } },
    fetcher: async (url, options) => {
      startCalls.push({ url, body: JSON.parse(options.body) })
      return { ok: true, status: 200, json: async () => ({ id: 'resp_test_123', status: 'queued', model: 'gpt-5.5' }) }
    },
  })
  assert(started.ok && started.pending && started.responseId === 'resp_test_123', 'background research should start and return response id')
  assert(startCalls[0].body.background === true && startCalls[0].body.store === true, 'background research should store the response for polling')

  const pending = await retrieveSalesAngleResearch({
    apiKey: 'test-key',
    responseId: 'resp_test_123',
    fetcher: async (url) => {
      assert(url.endsWith('/resp_test_123'), 'retrieve should call the response id URL')
      return { ok: true, status: 200, json: async () => ({ id: 'resp_test_123', status: 'in_progress', model: 'gpt-5.5' }) }
    },
  })
  assert(pending.ok && pending.pending && pending.status === 'in_progress', 'retrieve should expose pending status')

  const completed = await retrieveSalesAngleResearch({
    apiKey: 'test-key',
    responseId: 'resp_test_123',
    fetcher: async () => ({ ok: true, status: 200, json: async () => ({ ...SAMPLE_RESPONSE, id: 'resp_test_123', status: 'completed' }) }),
  })
  assert(completed.ok && !completed.pending && completed.salesAngles.angles.length === 1, 'retrieve should parse completed background output')

  const missingKey = await researchSalesAngles({ lead: { companyName: 'Halden Frisør' }, fetcher: async () => ({}) })
  assert(!missingKey.ok && missingKey.error.includes('LEAD_MACHINE_OPENAI_API_KEY'), 'missing key should explain itself')

  console.log('sales-angle smoke test passed')
}

main().catch((error) => { console.error(error); process.exit(1) })
