const fs = require('fs')
const path = require('path')
const os = require('os')
const companyProfile = require('../../company-profile/companyProfile')

let enrichCalls = 0
companyProfile.enrichCompanyProfile = async () => {
  enrichCalls += 1
  if (enrichCalls === 1) {
    return {
      organizationNumber: null,
      candidateOrganizationNumber: '999111222',
      legalName: 'TEST TANNKLINIKK AS',
      candidateLegalName: 'TEST TANNKLINIKK AS',
      organizationForm: 'Aksjeselskap',
      registeredAddress: 'Testgata 1, 1600 Testby',
      municipality: 'Testby',
      unitType: 'enhet',
      naceCode: '86.230',
      naceDescription: 'Tannhelsetjenester',
      employees: 5,
      registrationDate: '2010-01-01',
      activeStatus: 'active',
      source: 'brreg',
      sourceUrl: 'https://data.brreg.no/enhetsregisteret/api/enheter/999111222',
      matchStatus: 'manual_verify',
      matchConfidence: 0.92,
      matchReasons: ['name_match', 'municipality_match'],
      warnings: ['multiple_plausible_candidates'],
      candidates: [
        {
          candidateOrganizationNumber: '999111222',
          candidateLegalName: 'TEST TANNKLINIKK AS',
          organizationForm: 'Aksjeselskap',
          municipality: 'Testby',
          address: 'Testgata 1, 1600 Testby',
          unitType: 'enhet',
          score: 0.92,
          matchReasons: ['name_match', 'municipality_match'],
          warnings: [],
        },
      ],
    }
  }
  return {
    organizationNumber: null,
    candidateOrganizationNumber: null,
    legalName: null,
    organizationForm: null,
    matchStatus: 'error',
    matchConfidence: 0,
    warnings: ['network_error'],
  }
}

const { runLeadPack } = require('../leadPackRunner')

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-pack-runner-'))
  const runDir = path.join(tmp, 'run')
  const reportDir = path.join(runDir, 'items', 'url-0001')
  const surfacesDir = path.join(runDir, 'report-surfaces')
  fs.mkdirSync(reportDir, { recursive: true })
  fs.mkdirSync(surfacesDir, { recursive: true })
  const reportPath = path.join(reportDir, 'report.json')
  fs.writeFileSync(reportPath, JSON.stringify(reportFixture(), null, 2))
  fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(summaryFixture(reportPath), null, 2))
  fs.writeFileSync(path.join(surfacesDir, 'leads.csv'), leadsCsv(reportPath))

  const outputDir = path.join(tmp, 'lead-pack')
  const result = await runLeadPack({ runDir, outputDir, query: 'tannleger i Testby', enrichCompanyProfile: false })
  assert(fs.existsSync(result.leadPacksPath), 'lead-packs.json should be written')
  assert(fs.existsSync(result.csvPath), 'lead-packs.csv should be written')
  assert(fs.existsSync(result.summaryPath), 'summary.json should be written')
  const packs = JSON.parse(fs.readFileSync(result.leadPacksPath, 'utf8'))
  assert(packs.length === 1, 'one lead pack should be generated')
  assert(packs[0].company.displayName === 'Test Tannklinikk', 'displayName should come from run output')
  assert(packs[0].economy.status === 'not_enabled', 'economy should remain not_enabled')
  assert(packs[0].sourceQuality.searchScope === 'strict', 'lead pack should include search scope')
  assert(packs[0].sourceQuality.lowSupply === true, 'lead pack should include low supply')
  assert(packs[0].sourceQuality.fallbackAvailable === true, 'lead pack should include fallback available')
  assert(packs[0].sourceQuality.requestedLocation === 'Testby', 'lead pack should include requested location')
  assert(packs[0].sourceQuality.locationMatchStatus === 'exact_location', 'lead pack should include location match status')
  assert(packs[0].sourceQuality.discoveryConfidence === 'high', 'lead pack should include discovery confidence')
  assert(packs[0].sourceQuality.discoveryQuality.score === 92, 'lead pack should include discovery quality score')
  assert(packs[0].company.organizationNumber === null, 'company profile disabled should not set organizationNumber')
  assert(packs[0].ranking.caution.some((note) => note.includes('Seller owns angle')), 'seller-owned angle rule should be present')
  assert(!JSON.stringify(packs[0]).toLowerCase().includes('call opener'), 'lead pack should not generate sales scripts')
  const csv = fs.readFileSync(result.csvPath, 'utf8')
  assert(csv.includes('economyStatus'), 'CSV should include economy status')
  assert(csv.includes('not_enabled'), 'CSV should write economy not_enabled')
  assert(csv.includes('searchScope'), 'CSV should include search scope')
  assert(csv.includes('locationMatchStatus'), 'CSV should include location match status')
  assert(csv.includes('exact_location'), 'CSV should write location match status')

  const manualOutput = path.join(tmp, 'lead-pack-manual')
  const manual = await runLeadPack({ runDir, outputDir: manualOutput, enrichCompanyProfile: true })
  const manualPack = JSON.parse(fs.readFileSync(manual.leadPacksPath, 'utf8'))[0]
  assert(manualPack.company.organizationNumber === null, 'manual_verify should not set confirmed organizationNumber')
  assert(manualPack.company.candidateOrganizationNumber === '999111222', 'manual_verify should preserve candidateOrganizationNumber')
  assert(manualPack.company.candidateLegalName === 'TEST TANNKLINIKK AS', 'manual_verify should preserve candidate legal name')
  assert(manualPack.company.registeredAddress === 'Testgata 1, 1600 Testby', 'company profile should preserve registered address')
  assert(manualPack.company.municipality === 'Testby', 'company profile should preserve municipality')
  assert(manualPack.company.unitType === 'enhet', 'company profile should preserve unit type')
  assert(manualPack.company.naceCode === '86.230', 'company profile should preserve NACE code')
  assert(manualPack.company.naceDescription === 'Tannhelsetjenester', 'company profile should preserve NACE description')
  assert(manualPack.company.employees === 5, 'company profile should preserve employee count')
  assert(manualPack.company.registrationDate === '2010-01-01', 'company profile should preserve registration date')
  assert(manualPack.company.activeStatus === 'active', 'company profile should preserve active status')
  assert(manualPack.company.sourceUrl && manualPack.company.sourceUrl.includes('999111222'), 'company profile should preserve source URL')
  assert(Array.isArray(manualPack.company.matchReasons) && manualPack.company.matchReasons.includes('municipality_match'), 'company profile should preserve match reasons')
  assert(Array.isArray(manualPack.company.candidates) && manualPack.company.candidates.length === 1, 'manual_verify should expose candidate list')
  assert(manualPack.company.matchStatus === 'manual_verify', 'manual_verify should be attached')
  const manualCsv = fs.readFileSync(manual.csvPath, 'utf8')
  assert(manualCsv.includes('registeredAddress'), 'CSV should include registered address')
  assert(manualCsv.includes('naceCode'), 'CSV should include NACE code')
  assert(manualCsv.includes('Testgata 1'), 'CSV should write registered address')

  const errorOutput = path.join(tmp, 'lead-pack-error')
  const error = await runLeadPack({ runDir, outputDir: errorOutput, enrichCompanyProfile: true })
  const errorPack = JSON.parse(fs.readFileSync(error.leadPacksPath, 'utf8'))[0]
  assert(errorPack.company.matchStatus === 'error', 'company-profile error should not crash run and should be attached')
  assert(errorPack.company.organizationNumber === null, 'company-profile error should not set org number')

  fs.rmSync(tmp, { recursive: true, force: true })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

function summaryFixture(reportPath) {
  return {
    runId: 'fixture-run',
    status: 'completed',
    results: [
      {
        id: 'url-0001',
        url: 'https://test-tannklinikk.no',
        businessName: 'Test Tannklinikk',
        sourceMetadata: {
          businessName: 'Test Tannklinikk',
          source: 'google-places:tannleger i Testby',
          industry: 'dentist',
          phone: '69 00 00 00',
          address: 'Testgata 1, 1600 Testby',
          placeId: 'place-123',
          rating: '4.8',
          reviewCount: '44',
          businessStatus: 'OPERATIONAL',
          searchScope: 'strict',
          requestedMaxResults: 5,
          includedLeadCount: 1,
          lowSupply: true,
          fallbackAvailable: true,
          recommendedExpansion: 'nearby',
          searchScope: 'strict',
      requestedMaxResults: 5,
      includedLeadCount: 1,
      lowSupply: true,
      fallbackAvailable: true,
      recommendedExpansion: 'nearby',
      requestedLocation: 'Testby',
          candidateLocation: 'Testgata 1, 1600 Testby',
          candidateCity: 'Testby',
          locationMatchStatus: 'exact_location',
          locationConfidence: 0.95,
          locationWarnings: [],
          fallbackUsed: false,
          locationQuality: { requestedLocation: 'Testby', candidateLocation: 'Testgata 1, 1600 Testby', candidateCity: 'Testby', locationMatchStatus: 'exact_location', locationConfidence: 0.95, distanceKm: null, locationWarnings: [], fallbackUsed: false },
          discoveryQuality: { score: 92, level: 'high', reasons: ['exact_location', 'phone_available'], warnings: [] },
          discoveryConfidence: 'high',
          sourceType: 'directBusiness',
          provenance: { provider: 'google-places', searchQuery: 'tannleger i Testby' },
        },
        status: 'completed',
        reportPath,
      },
    ],
  }
}

function reportFixture() {
  return {
    url: 'https://test-tannklinikk.no',
    status: 'completed',
    signals: {
      title: 'Test Tannklinikk',
      metaDescription: '',
      headings: ['Test Tannklinikk'],
      emails: ['post@test-tannklinikk.no'],
      phones: ['69 00 00 00'],
      ctas: ['Bestill time'],
      contactCtaProfile: {
        hasVisibleContactPath: true,
        hasStrongPrimaryCta: true,
        contactMethods: ['phone', 'email', 'booking_link'],
        ctaTerms: ['bestill time'],
        verticalCtaType: 'booking',
        confidence: 0.88,
      },
      links: [],
      socialLinks: [],
      technologySignals: ['WordPress'],
    },
    performance: {
      responseStatus: 200,
      failedRequests: [{ url: 'https://asset.test/missing.js' }, { url: 'https://asset.test/missing.css' }],
      consoleErrors: [{ text: 'error' }],
    },
    issueClassification: {
      counts: { technical: 2, accessibility: 1, seo: 1 },
      issues: [
        { label: 'Failed network requests detected' },
        { label: 'Serious accessibility issues detected' },
        { label: 'Expected exactly one h1, found 2' },
      ],
    },
    leadQuality: {
      score: 12,
      issues: ['Failed network requests detected', 'Serious accessibility issues detected', 'Expected exactly one h1, found 2'],
    },
    sourceMetadata: {
      businessName: 'Test Tannklinikk',
      phone: '69 00 00 00',
      address: 'Testgata 1, 1600 Testby',
      industry: 'dentist',
      sourceType: 'directBusiness',
      businessStatus: 'OPERATIONAL',
      requestedLocation: 'Testby',
      candidateLocation: 'Testgata 1, 1600 Testby',
      candidateCity: 'Testby',
      locationMatchStatus: 'exact_location',
      locationConfidence: 0.95,
      locationWarnings: [],
      fallbackUsed: false,
      locationQuality: { requestedLocation: 'Testby', candidateLocation: 'Testgata 1, 1600 Testby', candidateCity: 'Testby', locationMatchStatus: 'exact_location', locationConfidence: 0.95, distanceKm: null, locationWarnings: [], fallbackUsed: false },
      discoveryQuality: { score: 92, level: 'high', reasons: ['exact_location', 'phone_available'], warnings: [] },
      discoveryConfidence: 'high',
      rating: '4.8',
      reviewCount: '44',
      placeId: 'place-123',
      provenance: { provider: 'google-places', searchQuery: 'tannleger i Testby' },
    },
  }
}

function leadsCsv(reportPath) {
  return [
    'rank,name,url,status,leadScore,title,pageTitle,sourcePhone,address,placeId,rating,reviewCount,businessStatus,technologies,issueCategories,jsonArtifact,issues',
    `1,Test Tannklinikk,https://test-tannklinikk.no,completed,12,Test Tannklinikk,Test Tannklinikk,69 00 00 00,"Testgata 1, 1600 Testby",place-123,4.8,44,OPERATIONAL,WordPress,technical:2|accessibility:1|seo:1,${reportPath},Failed network requests detected|Serious accessibility issues detected|Expected exactly one h1 found 2`,
  ].join('\n')
}

function assert(condition, message) { if (!condition) throw new Error(message) }
