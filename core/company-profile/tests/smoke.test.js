const { enrichCompanyProfile, matchCompanyProfile, normalizeName } = require('../companyProfile')

async function main() {
  const glomma = entity({
    organisasjonsnummer: '912345678',
    navn: 'GLOMMA TANNKLINIKK AS',
    poststed: 'FREDRIKSTAD',
    kommune: 'Fredrikstad',
    telefon: '69169090',
    hjemmeside: 'glommatannklinikk.no',
  })

  const exact = matchCompanyProfile({ companyName: 'Glomma Tannklinikk AS', city: 'Fredrikstad', phone: '69 16 90 90', website: 'http://glommatannklinikk.no' }, [glomma])
  assert(['exact_match', 'strong_match'].includes(exact.matchStatus), 'exact legal name should be exact/strong')
  assert(exact.organizationNumber === '912345678', 'strong match should include organization number')
  assert(exact.legalName === 'GLOMMA TANNKLINIKK AS', 'profile should map legal name')
  assert(exact.municipality === 'Fredrikstad', 'profile should map municipality')
  assert(exact.unitType === 'enhet', 'entity matches should expose unitType enhet')

  const placesStyle = matchCompanyProfile({ companyName: 'Glomma Tannklinikk', city: 'Fredrikstad' }, [glomma])
  assert(placesStyle.matchStatus === 'strong_match' || placesStyle.matchStatus === 'exact_match', 'Google Places style name plus city should be strong if unambiguous')
  assert(placesStyle.organizationNumber === '912345678', 'unambiguous strong match should include org number')

  const odontia = entity({ organisasjonsnummer: '999888777', navn: 'ODONTIA 3 AS', poststed: 'OSLO', kommune: 'Oslo', hjemmeside: 'odontia.no' })
  const odontiaClinic = entity({ organisasjonsnummer: '999888776', navn: 'VARNA TANNLEGESENTER', poststed: 'MOSS', kommune: 'Moss', hjemmeside: 'odontia.no' })
  const chain = matchCompanyProfile({ companyName: 'Odontia Varna Tannlegesenter', city: 'Moss', website: 'https://odontia.no/tannlege/varna/' }, [odontia, odontiaClinic])
  assert(chain.matchStatus === 'manual_verify', 'chain/clinic group ambiguity should require manual verify')
  assert(chain.organizationNumber === null, 'manual verify should not attach organization number')
  assert(chain.candidates.length >= 1, 'manual verify chain matches should expose candidates')
  assert(chain.warnings.some((warning) => warning.includes('chain') || warning.includes('alternative')), 'chain ambiguity should expose warnings')

  const multi = matchCompanyProfile({ companyName: 'Sentrum Rør', city: 'Moss' }, [
    entity({ organisasjonsnummer: '111111111', navn: 'SENTRUM RØR AS', poststed: 'MOSS', kommune: 'Moss' }),
    entity({ organisasjonsnummer: '222222222', navn: 'SENTRUM RØR AS', poststed: 'MOSS', kommune: 'Moss' }),
  ])
  assert(multi.matchStatus === 'manual_verify', 'multiple plausible matches should require manual verify')
  assert(multi.organizationNumber === null, 'manual verify multiple matches should not attach org number')
  assert(multi.candidateOrganizationNumber === '111111111', 'manual verify should preserve candidate org number separately')
  assert(multi.candidates.length === 2, 'manual verify multiple matches should expose candidate list')
  assert(multi.candidates.every((candidate) => candidate.unitType === 'enhet'), 'candidate summaries should expose unitType')
  assert(multi.warnings.includes('multiple_plausible_candidates'), 'multiple plausible matches should warn')

  const unitAmbiguous = matchCompanyProfile({ companyName: 'Gol Advokat AS', city: 'Gol' }, [
    entity({ organisasjonsnummer: '333333333', navn: 'GOL ADVOKAT AS', poststed: 'GOL', kommune: 'Gol', type: 'entity' }),
    entity({ organisasjonsnummer: '444444444', navn: 'GOL ADVOKAT AS', poststed: 'GOL', kommune: 'Gol', type: 'subunit' }),
  ])
  assert(unitAmbiguous.matchStatus === 'manual_verify', 'enhet + underenhet ambiguity should require manual verify')
  assert(unitAmbiguous.organizationNumber === null, 'unit ambiguity should not confirm org number')
  assert(unitAmbiguous.warnings.includes('unit_subunit_ambiguity'), 'unit ambiguity should warn')
  assert(unitAmbiguous.candidates.some((candidate) => candidate.unitType === 'underenhet'), 'candidate list should include underenhet')

  const clearSubunit = matchCompanyProfile({ companyName: 'Oris Dental Fredrikstad', city: 'Fredrikstad', address: 'Storgata 1, Fredrikstad', phone: '69 00 00 00', website: 'https://oris.no/fredrikstad' }, [
    entity({ organisasjonsnummer: '555555555', navn: 'ORIS DENTAL AS', poststed: 'OSLO', kommune: 'Oslo', hjemmeside: 'oris.no', type: 'entity' }),
    entity({ organisasjonsnummer: '666666666', navn: 'ORIS DENTAL FREDRIKSTAD', poststed: 'FREDRIKSTAD', kommune: 'Fredrikstad', telefon: '69000000', hjemmeside: 'oris.no', type: 'subunit', adresse: ['Storgata 1'] }),
  ])
  assert(['strong_match', 'exact_match'].includes(clearSubunit.matchStatus), 'clear subunit branch evidence can select underenhet')
  assert(clearSubunit.organizationNumber === '666666666', 'clear subunit match should confirm subunit org number')
  assert(clearSubunit.unitType === 'underenhet', 'clear subunit match should expose unitType underenhet')

  const mismatch = matchCompanyProfile({ companyName: 'Flow Tannhelse', city: 'Fredrikstad', address: 'Dampskipsbrygga 10, 1607 Fredrikstad' }, [
    entity({ organisasjonsnummer: '926112104', navn: 'FLOW TANNHELSE AS', poststed: 'SARPSBORG', kommune: 'Sarpsborg' }),
  ])
  assert(mismatch.matchStatus === 'manual_verify', 'exact name with municipality/address mismatch should require manual verify')
  assert(mismatch.organizationNumber === null, 'municipality mismatch should not confirm org number')
  assert(mismatch.candidateOrganizationNumber === '926112104', 'municipality mismatch should keep candidate org number')
  assert(mismatch.warnings.includes('municipality_mismatch'), 'municipality mismatch should be warned')

  const nameOnly = matchCompanyProfile({ companyName: 'FLOW TANNHELSE AS' }, [
    entity({ organisasjonsnummer: '926112104', navn: 'FLOW TANNHELSE AS', poststed: 'SARPSBORG', kommune: 'Sarpsborg' }),
  ])
  assert(nameOnly.matchStatus === 'manual_verify', 'name-only exact match should require manual verify')
  assert(nameOnly.organizationNumber === null, 'name-only exact match should not confirm org number')
  assert(nameOnly.candidateOrganizationNumber === '926112104', 'name-only exact match should keep candidate org number')
  assert(nameOnly.matchReasons.includes('name_match_without_supporting_evidence'), 'name-only match should explain missing supporting evidence')

  const none = matchCompanyProfile({ companyName: 'No Such Local Business', city: 'Bergen' }, [])
  assert(none.matchStatus === 'no_match', 'empty candidates should return no_match')
  assert(none.organizationNumber === null, 'no_match should not include org number')

  const network = await enrichCompanyProfile({ companyName: 'Glomma Tannklinikk' }, { fetchImpl: async () => { throw new Error('network down') }, retries: 0 })
  assert(network.matchStatus === 'error', 'network failure should return error')
  assert(network.errorType === 'network_error', 'network failure should include network_error')
  assert(network.organizationNumber === null, 'error should not include org number')

  const timeout = await enrichCompanyProfile({ companyName: 'Glomma Tannklinikk' }, { fetchImpl: async () => new Promise(() => {}), timeoutMs: 5, retries: 0 })
  assert(timeout.matchStatus === 'error', 'timeout should return error')
  assert(timeout.errorType === 'timeout', 'timeout should include errorType timeout')
  assert(timeout.organizationNumber === null, 'timeout should not include org number')

  const api = await enrichCompanyProfile({ companyName: 'Glomma Tannklinikk' }, { fetchImpl: async () => ({ ok: false, status: 500 }), retries: 0 })
  assert(api.matchStatus === 'error', 'API failure should return error')
  assert(api.errorType === 'api_error', 'API failure should include api_error')

  const parse = await enrichCompanyProfile({ companyName: 'Glomma Tannklinikk' }, { fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('invalid json') } }), retries: 0 })
  assert(parse.matchStatus === 'error', 'parse failure should return error')
  assert(parse.errorType === 'parse_error', 'parse failure should include parse_error')

  const cache = new Map()
  let fetchCount = 0
  const cachedFetch = mockFetch({ enheter: [glomma], underenheter: [] }, () => { fetchCount += 1 })
  await enrichCompanyProfile({ companyName: 'Glomma Tannklinikk', city: 'Fredrikstad' }, { fetchImpl: cachedFetch, cache })
  await enrichCompanyProfile({ companyName: 'Glomma Tannklinikk', city: 'Fredrikstad' }, { fetchImpl: cachedFetch, cache })
  assert(fetchCount === 2, 'cache should avoid duplicate endpoint fetches for identical lookup calls')

  const profile = await enrichCompanyProfile({ companyName: 'Glomma Tannklinikk', city: 'Fredrikstad' }, { fetchImpl: mockFetch({ enheter: [glomma], underenheter: [] }), cache: new Map() })
  assert(profile.matchStatus === 'strong_match' || profile.matchStatus === 'exact_match', 'mocked API search should return strong/exact match')
  assert(profile.organizationNumber === '912345678', 'mocked API match should include org number')
  assert(normalizeName('Glomma Tannklinikk AS') === 'glomma tannklinikk', 'normalization should strip company suffix')
}

function entity({ organisasjonsnummer, navn, poststed = 'OSLO', kommune = 'Oslo', telefon, mobil, hjemmeside, type = 'entity', adresse = ['Testveien 1'] }) {
  return {
    type,
    organisasjonsnummer,
    navn,
    organisasjonsform: { kode: 'AS', beskrivelse: 'Aksjeselskap' },
    forretningsadresse: { adresse, postnummer: '1600', poststed, kommune, kommunenummer: '3107', landkode: 'NO', land: 'Norge' },
    naeringskode1: { kode: '86.230', beskrivelse: 'Tannhelsetjenester' },
    antallAnsatte: 5,
    registreringsdatoEnhetsregisteret: '2010-01-01',
    telefon,
    mobil,
    hjemmeside,
    _links: { self: { href: `https://data.brreg.no/enhetsregisteret/api/${type === 'subunit' ? 'underenheter' : 'enheter'}/${organisasjonsnummer}` } },
  }
}

function mockFetch({ enheter = [], underenheter = [] }, onFetch = () => {}) {
  return async (url) => {
    onFetch(url)
    return {
      ok: true,
      status: 200,
      async json() {
        const key = String(url).includes('/underenheter') ? 'underenheter' : 'enheter'
        return { _embedded: { [key]: key === 'enheter' ? enheter : underenheter } }
      },
    }
  }
}

function assert(condition, message) { if (!condition) throw new Error(message) }

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
