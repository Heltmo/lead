const fs = require('fs')
const http = require('http')
const path = require('path')
const { spawnSync } = require('child_process')
const { discoverLocalBusinesses, writeDiscoveryOutputs, shouldIncludeInFastLeadPack } = require('../discoverLocalBusinesses')
const { parseDiscoveryQuery } = require('../normalizers/leadCandidate')
const { parseLocationIntent } = require('../normalizers/locationQuality')
const { classifyDiscoveryTarget } = require('../normalizers/sourceType')

async function main() {
  assertQuery('dentists in Halden', 'dentist', 'Halden', 'tannlege Halden')
  assertQuery('tannlege Halden', 'dentist', 'Halden', 'dentists Halden')
  assertQuery('advokater i Oslo', 'lawyer', 'Oslo', 'advokatfirma Oslo')
  const golIntent = parseLocationIntent('advokater i Gol')
  assert(golIntent.vertical === 'advokater', 'location intent should preserve vertical term')
  assert(golIntent.requestedLocation === 'Gol', 'location intent should parse Norwegian i location')
  assertQuery('regnskapsfører Sarpsborg', 'accountant', 'Sarpsborg', 'accounting firm Sarpsborg')
  assertQuery('escapreroom', 'escape room', '', 'escape room')
  assertQuery('paintball', 'paintball', '', 'paintball')
  assertTarget('https://haldentannlegene.no', 'directBusiness', true)
  assertTarget('https://www.legelisten.no/tannleger/Viken/Halden', 'directory', false)
  assertTarget('https://www.1881.no/tannlege/tannlege-oestfold/tannlege-halden', 'directory', false)
  assertTarget('https://www.facebook.com/dyrendaltannhelsesenter', 'social', false)
  assertTarget('https://www.gulesider.no/tannlege/bedrifter', 'directory', false)
  assertTarget('https://ofk.no/tjenester/tannhelse/tannklinikker/halden-tannklinikk', 'publicSector', false)
  assertTarget('https://halden.kommune.no/tjenester/helse', 'publicSector', false)
  assertTarget('https://www.nav.no/no/lokalt/halden', 'publicSector', false)
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' })
    response.end('<title>Halden Tannklinikk</title>')
  })
  await listen(server)
  const port = server.address().port
  const root = path.join(__dirname, 'tmp')
  const jsonFixture = path.join(root, 'dentists-halden.sample.json')
  const csvFixture = path.join(root, 'dentists-halden.directory.csv')
  const txtFixture = path.join(root, 'dentists-halden.extra-urls.txt')
  const htmlFixture = path.join(root, 'dentists-halden.search-results.html')
  const taxonomyFixture = path.join(root, 'taxonomy.sample.json')
  const out = path.join(root, 'lead-candidates.json')
  const summary = path.join(root, 'discovery-summary.json')
  const handoff = path.join(root, 'orchestrator-urls.txt')
  fs.rmSync(root, { recursive: true, force: true })
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(jsonFixture, JSON.stringify({
    results: [
      { businessName: 'Halden Tannklinikk', website: 'http://127.0.0.1:' + port, source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'high' },
      { businessName: 'Halden Tannklinikk Duplicate', website: 'http://127.0.0.1:' + port + '/about', source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'high' },
      { businessName: 'Unreachable Dental', website: 'http://localhost:1', source: 'sample-directory', location: 'Halden', industry: 'dentists', confidence: 'medium' },
      { businessName: 'Oslo Dental', website: 'https://oslo.example', source: 'sample-directory', location: 'Oslo', industry: 'dentists', confidence: 'low' },
    ],
  }, null, 2))
  fs.writeFileSync(csvFixture, [
    'businessName,website,source,location,industry,confidence',
    'CSV Halden Dental,http://127.0.0.1:' + port + '/csv,csv-directory,Halden,dentists,medium',
    'CSV Extra Dental,https://csv-extra.example,csv-directory,Halden,dentists,low',
  ].join('\n') + '\n')
  fs.writeFileSync(txtFixture, [
    'Txt Dental | https://txt-dental.example',
    'Bad Dental | not a url',
  ].join('\n') + '\n')
  fs.writeFileSync(htmlFixture, '<html><body><a href="https://html-dental.example">HTML Dental</a><a href="https://www.legelisten.no/tannleger/Viken/Halden">Legelisten Halden</a><a href="/relative">Ignored relative</a></body></html>')
  fs.writeFileSync(taxonomyFixture, JSON.stringify({
    results: [
      { businessName: 'Oslo Advokatfirma', website: 'https://advokat.example', source: 'taxonomy', location: 'Oslo', industry: 'advokatfirma', confidence: 'high' },
      { businessName: 'Oslo Tannlege', website: 'https://tannlege.example', source: 'taxonomy', location: 'Oslo', industry: 'tannlege', confidence: 'high' },
    ],
  }, null, 2))

  const multiSourceReport = await discoverLocalBusinesses({
    query: 'dentists in Halden',
    sourceFiles: [jsonFixture, csvFixture, txtFixture, htmlFixture],
    validate: false,
  })
  assert(multiSourceReport.query === 'dentists in Halden', 'query should be preserved')
  assert(multiSourceReport.industry === 'dentist', 'industry should be canonicalized')
  assert(multiSourceReport.canonicalIndustry === 'dentist', 'canonicalIndustry should be present')
  assert(multiSourceReport.expandedQueries.includes('tannlege Halden'), 'expanded queries should include Norwegian dentist search')
  assert(multiSourceReport.totalRawCandidates === 9, 'multi-source report should count raw filtered candidates')
  assert(multiSourceReport.invalidCandidates === 1, 'invalid txt URL should be counted')
  assert(multiSourceReport.duplicatesRemoved === 2, 'duplicates across JSON and CSV sources should be removed')
  assert(multiSourceReport.candidates.length === 6, 'multi-source candidates should merge and dedupe')
  assert(multiSourceReport.candidatesBySourceType.directory === 1, 'summary should count directory candidates')
  assert(multiSourceReport.excludedCandidates === 1, 'summary should count non-audit targets')
  assert(multiSourceReport.auditEligibleCandidates === 5, 'summary should count audit-eligible targets')
  assert(multiSourceReport.candidatesBySource['csv-directory'] === 2, 'summary should count CSV provenance')
  assert(multiSourceReport.candidatesBySource['dentists-halden.extra-urls.txt'] === 1, 'summary should count TXT provenance')
  assert(multiSourceReport.candidatesBySource['dentists-halden.search-results.html'] === 2, 'summary should count HTML provenance')
  const merged = multiSourceReport.candidates.find((candidate) => candidate.normalizedDomain === '127.0.0.1')
  assert(merged.sources.length === 2, 'duplicate local domain should preserve JSON and CSV provenance')

  const lawyerReport = await discoverLocalBusinesses({ query: 'advokater i Oslo', sourceFile: taxonomyFixture, validate: false })
  assert(lawyerReport.canonicalIndustry === 'lawyer', 'Norwegian lawyer query should map to canonical industry')
  assert(lawyerReport.candidates.length === 1, 'taxonomy filtering should match advokatfirma and exclude tannlege')
  assert(lawyerReport.candidates[0].businessName === 'Oslo Advokatfirma', 'taxonomy filtering should keep matching lawyer candidate')

  const mockProviderFixture = path.join(root, 'brave.mock-results.json')
  const googlePlacesFixture = path.join(root, 'google-places.mock-results.json')
  fs.writeFileSync(mockProviderFixture, JSON.stringify({
    web: {
      results: [
        { title: 'Forside - Provider Halden Tannklinikk', url: 'https://provider-halden.example', description: 'Dental clinic in Halden', profile: { name: 'Provider Halden Tannklinikk' }, location: { city: 'Halden', country: 'Norway' } },
        { title: 'Provider Duplicate', url: 'https://provider-halden.example/about', description: 'Duplicate domain' },
        { title: 'Provider Oslo Tannlege', url: 'https://provider-oslo.example', description: 'Different location in search text' },
      ],
    },
  }, null, 2))

  fs.writeFileSync(googlePlacesFixture, JSON.stringify({
    places: [
      {
        id: 'places/norfloss',
        displayName: { text: 'Norfloss Tannklinikk' },
        websiteUri: 'https://norfloss.no',
        nationalPhoneNumber: '+47 69 18 00 00',
        formattedAddress: 'Storgata 1, 1767 Halden, Norway',
        businessStatus: 'OPERATIONAL',
        rating: 4.7,
        userRatingCount: 23,
        types: ['dentist', 'health'],
      },
      {
        id: 'places/norfloss-duplicate',
        displayName: { text: 'Norfloss Duplicate' },
        websiteUri: 'https://www.norfloss.no/kontakt',
        nationalPhoneNumber: '+47 69 18 00 00',
        formattedAddress: 'Storgata 1, 1767 Halden, Norway',
      },
      {
        id: 'places/out-of-area',
        displayName: { text: 'Oslo Advokatfirma' },
        websiteUri: 'https://oslo-advokat.example',
        nationalPhoneNumber: '+47 69 00 00 00',
        formattedAddress: 'Stortingsgata 1, 0161 Oslo, Norway',
        businessStatus: 'OPERATIONAL',
        rating: 4.2,
        userRatingCount: 5,
        types: ['lawyer'],
      },
      {
        id: 'places/no-website',
        displayName: { text: 'No Website Dental' },
        nationalPhoneNumber: '+47 00 00 00 00',
        formattedAddress: 'Halden, Norway',
      },
    ],
  }, null, 2))

  const providerDryRunReport = await discoverLocalBusinesses({
    query: 'tannlege Halden',
    provider: 'brave',
    dryRun: true,
    maxResults: 10,
    validate: false,
  })
  assert(providerDryRunReport.provider.provider === 'brave', 'dry-run should keep selected provider')
  assert(providerDryRunReport.provider.dryRun === true, 'dry-run should be marked in provider plan')
  assert(providerDryRunReport.provider.queries.includes('tannlege Halden'), 'dry-run should show expanded/provider queries')
  assert(providerDryRunReport.candidates.length === 0, 'dry-run should not create live candidates')

  const providerReport = await discoverLocalBusinesses({
    query: 'tannlege Halden',
    provider: 'mock',
    mockResultsPath: mockProviderFixture,
    maxResults: 3,
    validate: false,
  })
  assert(providerReport.provider.provider === 'mock', 'mock provider should be recorded in report')
  assert(providerReport.totalRawCandidates === 3, 'mock provider should load raw provider results')
  assert(providerReport.candidates.length === 2, 'mock provider should dedupe duplicate domains')
  const providerCandidate = providerReport.candidates.find((candidate) => candidate.normalizedDomain === 'provider-halden.example')
  assert(providerCandidate.businessName === 'Provider Halden Tannklinikk', 'provider businessName should prefer discovered provider name over weak page title')
  assert(providerCandidate.location === 'Halden, Norway', 'provider object location should normalize to readable text')
  assert(providerCandidate.sourceType === 'directBusiness', 'provider candidate should still be source-classified')
  assert(providerCandidate.auditEligible === true, 'provider candidate should still be audit eligible')
  assert(providerCandidate.confidence === 'medium', 'provider candidate should keep normalized confidence')
  assert(providerCandidate.provenance.provider === 'mock', 'provider provenance should include provider')
  assert(providerCandidate.provenance.searchQuery === 'tannlege Halden', 'provider provenance should include search query')
  assert(providerCandidate.sources[0].sourceFormat === 'provider', 'provider provenance should be preserved')
  assert(providerReport.candidatesBySource['mock:tannlege Halden'] === 2, 'provider source should be counted in summary')

  const googleReport = await discoverLocalBusinesses({
    query: 'tannleger i Halden',
    provider: 'google-places',
    mockResultsPath: googlePlacesFixture,
    maxResults: 4,
    validate: false,
  })
  assert(googleReport.provider.provider === 'google-places', 'Google Places provider should be recorded in report')
  assert(googleReport.searchScope === 'strict', 'default search scope should be strict')
  assert(googleReport.totalRawCandidates === 4, 'Google Places fixture should count raw place results')
  assert(googleReport.searchSupply.lowSupply === true, 'strict mode should mark lowSupply when included leads are below maxResults')
  assert(googleReport.searchSupply.fallbackAvailable === true, 'strict mode should expose fallbackAvailable when out-of-area candidates exist')
  assert(googleReport.searchSupply.fallbackUsed === false, 'strict mode should not use fallback')
  assert(googleReport.searchSupply.recommendedExpansion === 'nearby', 'strict low supply should recommend nearby expansion')
  assert(googleReport.invalidCandidates === 0, 'Google Places fixture without website should be preserved when business identity exists')
  assert(googleReport.candidates.length === 3, 'Google Places candidates should include exact, no-website, and out-of-area candidates')
  assert(googleReport.discoveryCoverage.withoutWebsite === 1, 'coverage should count no-website Google Places candidates')
  assert(googleReport.discoveryCoverage.withPhone === 3, 'coverage should count phone availability')
  const googleCandidate = googleReport.candidates.find((candidate) => candidate.normalizedDomain === 'norfloss.no')
  assert(googleCandidate.businessName === 'Norfloss Tannklinikk', 'Google Places displayName should become businessName')
  assert(googleCandidate.phone === '+47 69 18 00 00', 'Google Places phone should be preserved')
  assert(googleCandidate.address.includes('Halden'), 'Google Places address should be preserved')
  assert(googleCandidate.placeId === 'places/norfloss', 'Google Places place id should be preserved')
  assert(googleCandidate.rating === 4.7, 'Google Places rating should be preserved')
  assert(googleCandidate.reviewCount === 23, 'Google Places review count should be preserved')
  assert(googleCandidate.businessStatus === 'OPERATIONAL', 'Google Places business status should be preserved')
  assert(googleCandidate.providerTypes.includes('dentist'), 'Google Places types should be preserved')
  assert(googleCandidate.locationMatchStatus === 'exact_location', 'Google Places exact city should be marked exact_location')
  assert(googleCandidate.discoveryQuality.level === 'high', 'strong Google Places candidate should have high discovery confidence')
  const noWebsite = googleReport.candidates.find((candidate) => candidate.businessName === 'No Website Dental')
  assert(noWebsite, 'Google Places candidate without website should be preserved')
  assert(noWebsite.auditEligible === false, 'no-website candidate should not be audit eligible')
  assert(noWebsite.auditExclusionReason === 'missing_website_for_audit', 'no-website candidate should explain audit exclusion')
  assert(shouldIncludeInFastLeadPack(noWebsite) === true, 'no-website local business should be eligible for Fast lead packs')
  assert(noWebsite.discoveryQuality.warnings.includes('missing_website'), 'no-website candidate should carry discovery warning')
  const outOfArea = googleReport.candidates.find((candidate) => candidate.normalizedDomain === 'oslo-advokat.example')
  assert(outOfArea.locationMatchStatus === 'out_of_area', 'Oslo candidate for Halden request should be out_of_area')
  assert(outOfArea.auditEligible === false, 'out_of_area candidate should not be audit eligible by default')
  const googleHandoff = path.join(root, 'google-handoff.jsonl')
  writeDiscoveryOutputs(googleReport, { outPath: path.join(root, 'google-candidates.json'), summaryPath: path.join(root, 'google-summary.json'), handoffPath: googleHandoff })
  const googleRows = fs.readFileSync(googleHandoff, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  assert(googleRows.length === 1, 'Google Places handoff should exclude out-of-area candidate by default')
  assert(googleRows[0].phone === '+47 69 18 00 00', 'Google Places handoff should preserve phone')
  assert(googleRows[0].address.includes('Halden'), 'Google Places handoff should preserve address')
  assert(googleRows[0].placeId === 'places/norfloss', 'Google Places handoff should preserve place id')
  assert(googleRows[0].locationMatchStatus === 'exact_location', 'Google Places handoff should preserve location match status')


  const lawyerPlacesFixture = path.join(root, 'lawyer-google-places.mock-results.json')
  fs.writeFileSync(lawyerPlacesFixture, JSON.stringify({
    places: [
      {
        id: 'places/nav-halden',
        displayName: { text: 'NAV Halden' },
        websiteUri: 'https://www.nav.no/no/lokalt/halden',
        nationalPhoneNumber: '+47 55 55 33 33',
        formattedAddress: 'Storgata 8, 1771 Halden, Norway',
        rating: 2.1,
        userRatingCount: 27,
        types: ['local_government_office'],
      },
      {
        id: 'places/halden-lawyer',
        displayName: { text: 'Advokat Test Halden AS' },
        websiteUri: 'https://advokat-test-halden.example',
        nationalPhoneNumber: '+47 69 00 00 00',
        formattedAddress: 'Advokatgata 1, 1771 Halden, Norway',
        rating: 4.8,
        userRatingCount: 8,
        types: ['lawyer'],
      },
      {
        id: 'places/revisor-wrong-vertical',
        displayName: { text: 'Revisorteam DA' },
        websiteUri: 'https://revisorteam.example',
        nationalPhoneNumber: '+47 69 17 67 05',
        formattedAddress: 'Storgata 9, 1771 Halden, Norway',
        rating: 5,
        userRatingCount: 1,
        types: ['accounting'],
      },
    ],
  }, null, 2))
  const lawyerGoogleReport = await discoverLocalBusinesses({
    query: 'advokat',
    provider: 'google-places',
    mockResultsPath: lawyerPlacesFixture,
    maxResults: 3,
    validate: false,
  })
  const navCandidate = lawyerGoogleReport.candidates.find((candidate) => candidate.businessName === 'NAV Halden')
  const wrongVerticalCandidate = lawyerGoogleReport.candidates.find((candidate) => candidate.businessName === 'Revisorteam DA')
  const matchingLawyerCandidate = lawyerGoogleReport.candidates.find((candidate) => candidate.businessName === 'Advokat Test Halden AS')
  assert(navCandidate.sourceType === 'publicSector', 'NAV should be classified as public sector')
  assert(shouldIncludeInFastLeadPack(navCandidate) === false, 'NAV should not become a Fast seller lead for advokat search')
  assert(wrongVerticalCandidate.industryMatchStatus === 'mismatch', 'wrong vertical Google result should be marked industry mismatch')
  assert(shouldIncludeInFastLeadPack(wrongVerticalCandidate) === false, 'wrong vertical Google result should not become a Fast seller lead')
  assert(matchingLawyerCandidate.industryMatchStatus === 'relevant', 'matching lawyer Google result should keep industry relevance')
  assert(shouldIncludeInFastLeadPack(matchingLawyerCandidate) === true, 'matching lawyer Google result should remain Fast eligible')


  const brregFixture = {
    _embedded: {
      enheter: [
        {
          organisasjonsnummer: '999111222',
          navn: 'SARPSBORG RØR AS',
          organisasjonsform: { kode: 'AS', beskrivelse: 'Aksjeselskap' },
          forretningsadresse: { adresse: ['Testgata 1'], postnummer: '1700', poststed: 'SARPSBORG', kommune: 'SARPSBORG' },
          naeringskode1: { kode: '43.220', beskrivelse: 'VVS-arbeid' },
          antallAnsatte: 7,
          hjemmeside: 'https://sarpsborgror.no',
          registreringsdatoEnhetsregisteret: '2020-01-01',
          _links: { self: { href: 'https://data.brreg.no/enhetsregisteret/api/enheter/999111222' } },
        },
        {
          organisasjonsnummer: '999333444',
          navn: 'SARPSBORG VVS UTEN NETTSIDE AS',
          organisasjonsform: { kode: 'AS', beskrivelse: 'Aksjeselskap' },
          forretningsadresse: { adresse: ['Rørgata 2'], postnummer: '1700', poststed: 'SARPSBORG', kommune: 'SARPSBORG' },
          naeringskode1: { kode: '43.220', beskrivelse: 'VVS-arbeid' },
          antallAnsatte: 3,
          registreringsdatoEnhetsregisteret: '2021-02-02',
          _links: { self: { href: 'https://data.brreg.no/enhetsregisteret/api/enheter/999333444' } },
        },
      ],
    },
  }

  const brregReport = await discoverLocalBusinesses({
    query: 'rørlegger i Sarpsborg',
    provider: 'brreg',
    mockResults: brregFixture,
    maxResults: 5,
    validate: false,
  })
  assert(brregReport.provider.provider === 'brreg', 'Brreg provider should be recorded in report')
  assert(brregReport.provider.brreg.naceCodes.includes('43.220'), 'Brreg provider should map plumber query to VVS NACE')
  assert(brregReport.totalRawCandidates === 2, 'Brreg fixture should count official registry rows')
  const official = brregReport.candidates.find((candidate) => candidate.organizationNumber === '999111222')
  assert(official, 'Brreg candidate should preserve organization number')
  assert(official.legalName === 'SARPSBORG RØR AS', 'Brreg candidate should preserve legal name')
  assert(official.naceCode === '43.220', 'Brreg candidate should preserve NACE code')
  assert(official.employees === 7, 'Brreg candidate should preserve employees')
  assert(official.identitySource === 'brreg', 'Brreg candidate should expose identity source')
  assert(official.sourceType === 'officialRegistry', 'Brreg candidate should expose official registry source type')
  assert(official.locationMatchStatus === 'exact_location', 'Brreg candidate should respect requested location')
  assert(official.discoveryQuality.reasons.includes('confirmed_org'), 'Brreg candidate should improve discovery confidence with confirmed org')
  const officialNoWebsite = brregReport.candidates.find((candidate) => candidate.organizationNumber === '999333444')
  assert(officialNoWebsite.auditEligible === false, 'Brreg official row without website should not be audit eligible')
  assert(shouldIncludeInFastLeadPack(officialNoWebsite) === true, 'Brreg official row without website should still be usable in Fast lead packs')

  const balancedFixture = {
    places: [
      {
        id: 'places/sarpsborg-ror',
        displayName: { text: 'Sarpsborg Rør AS' },
        websiteUri: 'https://sarpsborgror.no/kontakt',
        nationalPhoneNumber: '+47 47 00 00 00',
        formattedAddress: 'Testgata 1, 1700 Sarpsborg, Norway',
        businessStatus: 'OPERATIONAL',
        rating: 4.8,
        userRatingCount: 12,
        types: ['plumber'],
      },
    ],
    _embedded: brregFixture._embedded,
  }
  const balancedReport = await discoverLocalBusinesses({
    query: 'rørlegger i Sarpsborg',
    provider: 'balanced',
    mockResults: balancedFixture,
    maxResults: 5,
    validate: false,
  })
  assert(balancedReport.provider.provider === 'balanced', 'Balanced provider should be recorded in report')
  const balancedCandidate = balancedReport.candidates.find((candidate) => candidate.organizationNumber === '999111222')
  assert(balancedCandidate, 'Balanced provider should include Brreg identity')
  assert(balancedCandidate.placeId === 'places/sarpsborg-ror', 'Balanced provider should merge Google place identity onto Brreg candidate')
  assert(balancedCandidate.rating === 4.8, 'Balanced provider should preserve Google rating')
  assert(balancedCandidate.identitySource === 'brreg', 'Balanced provider should keep Brreg as identity source')
  assert(balancedCandidate.presenceSource === 'google-places', 'Balanced provider should expose Google as presence source when merged')
  assert(balancedCandidate.sources.some((item) => item.provider === 'brreg'), 'Balanced candidate should preserve Brreg provenance')
  assert(balancedCandidate.sources.some((item) => item.provider === 'google-places'), 'Balanced candidate should preserve Google provenance')

  const fallbackReport = await discoverLocalBusinesses({
    query: 'tannleger i Halden',
    provider: 'google-places',
    mockResultsPath: googlePlacesFixture,
    maxResults: 4,
    validate: false,
    searchScope: 'regional',
  })
  const fallbackCandidate = fallbackReport.candidates.find((candidate) => candidate.normalizedDomain === 'oslo-advokat.example')
  assert(fallbackReport.searchScope === 'regional', 'regional fallback report should record search scope')
  assert(fallbackReport.searchSupply.fallbackUsed === true, 'regional fallback report should mark fallbackUsed')
  assert(fallbackCandidate.locationMatchStatus === 'regional_fallback', 'explicit fallback should mark out-of-area candidate as regional_fallback')
  assert(fallbackCandidate.fallbackUsed === true, 'explicit fallback should set fallbackUsed')
  assert(fallbackCandidate.locationWarnings.includes('included_as_explicit_location_fallback'), 'explicit fallback should warn on fallback inclusion')

  const reportPayload = await discoverLocalBusinesses({ query: 'dentists in Halden', sourceFile: jsonFixture, timeoutMs: 3000 })
  writeDiscoveryOutputs(reportPayload, { outPath: out, summaryPath: summary, handoffPath: handoff })
  server.close()
  const report = JSON.parse(fs.readFileSync(out, 'utf8'))
  const summaryReport = JSON.parse(fs.readFileSync(summary, 'utf8'))
  const handoffRows = fs.readFileSync(handoff, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  assert(report.industry === 'dentist', 'industry should be canonicalized')
  assert(report.canonicalIndustry === 'dentist', 'canonicalIndustry should be written to candidate report')
  assert(summaryReport.canonicalIndustry === 'dentist', 'canonicalIndustry should be written to summary')
  assert(summaryReport.expandedQueries.includes('tannlege Halden'), 'summary should include expanded queries')
  assert(report.location === 'Halden', 'location should be parsed')
  assert(report.candidates.length === 2, 'duplicates should be removed and location should filter')
  assert(report.reachableCandidates === 1, 'one local candidate should be reachable')
  assert(report.unreachableCandidates === 1, 'one candidate should be unreachable')
  assert(handoffRows.length === 1, 'handoff should exclude unreachable candidates by default')
  assert(handoffRows[0].url.startsWith('http://127.0.0.1:' + port), 'handoff should contain reachable URL')
  assert(handoffRows[0].businessName === 'Halden Tannklinikk', 'handoff should preserve business name')
  assert(handoffRows[0].industry === 'dentists', 'handoff should preserve industry')
  assert(handoffRows[0].location === 'Halden', 'handoff should preserve location')
  assert(summaryReport.handoffReadyCandidates === 1, 'summary should include audit-eligible handoff count')
  assert(typeof summaryReport.fastEligibleCandidates === 'number', 'summary should include fast-eligible candidate count')
  assert(summaryReport.discoveryCoverage.withWebsite >= 1, 'summary should include discovery coverage')
  assert(summaryReport.excludedCandidates === 0, 'source-only report should not exclude audit targets in this fixture')
  assert(summaryReport.duplicatesRemoved === 1, 'summary should include duplicate count')
  assert(summaryReport.candidatesBySource['sample-directory'] === 2, 'summary should include source counts')

  const handoffResult = spawnSync(process.execPath, ['cli/handoff-candidates.js', out, '--out', path.join(root, 'handoff-all.txt'), '--include-unreachable', 'true'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' })
  if (handoffResult.status !== 0) { console.error(handoffResult.stdout); console.error(handoffResult.stderr); process.exit(handoffResult.status) }
  const allRows = fs.readFileSync(path.join(root, 'handoff-all.txt'), 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  assert(allRows.length === 2, 'explicit handoff can include unreachable audit-eligible candidates')
  assert(allRows[0].businessName, 'explicit handoff should preserve business names')

  const allTargetsResult = spawnSync(process.execPath, ['cli/handoff-candidates.js', out, '--out', path.join(root, 'handoff-all-targets.txt'), '--include-unreachable', 'true', '--include-non-audit-targets', 'true'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' })
  if (allTargetsResult.status !== 0) { console.error(allTargetsResult.stdout); console.error(allTargetsResult.stderr); process.exit(allTargetsResult.status) }
  const allTargetRows = fs.readFileSync(path.join(root, 'handoff-all-targets.txt'), 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  assert(allTargetRows.length === 2, 'explicit handoff include flag should preserve audit-eligible rows when no non-audit targets exist')
  assert(allTargetRows.every((row) => row.auditEligible !== false), 'explicit handoff should preserve audit target metadata')
}

function assertTarget(url, sourceType, auditEligible) {
  const target = classifyDiscoveryTarget(url)
  assert(target.sourceType === sourceType, url + ' should classify as ' + sourceType)
  assert(target.auditEligible === auditEligible, url + ' should have auditEligible=' + auditEligible)
}

function assertQuery(query, canonicalIndustry, location, expandedQuery) {
  const parsed = parseDiscoveryQuery(query)
  assert(parsed.canonicalIndustry === canonicalIndustry, query + ' should map to ' + canonicalIndustry)
  assert(parsed.location === location, query + ' should parse location')
  assert(parsed.expandedQueries.includes(expandedQuery), query + ' should include expanded query ' + expandedQuery)
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

main().catch((error) => { console.error(error); process.exit(1) })
