const fallbackData = {
  "meta": {
    "title": "Lead Machine",
    "version": "v1",
    "generatedFrom": "deterministic showcase fixtures",
    "productBoundary": {
      "machineProvides": [
        "discovery",
        "enrichment",
        "ranking",
        "evidence",
        "caution",
        "export"
      ],
      "sellerOwns": [
        "angle",
        "wording",
        "outreach",
        "timing",
        "relationship",
        "close"
      ]
    },
    "defaultScenario": "pilot-leads"
  },
  "scenarios": [
    {
      "id": "pilot-leads",
      "name": "Pilot lead packs",
      "purpose": "Seller-ready lead cards",
      "message": "Ranked lead packs show context, evidence, caution, contactability, and export fields.",
      "query": "calibrated pilot leads",
      "provider": "Generated lead packs",
      "searchScope": "mixed",
      "includedLeadCount": 5,
      "totalDiscovered": 5,
      "totalExcludedByLocation": 0,
      "lowSupply": false,
      "fallbackAvailable": false,
      "fallbackUsed": false,
      "recommendedExpansion": null,
      "locationQualityCounts": {
        "exact_location": 5
      },
      "nextRecommendedAction": "Review HIGH leads first, then compare strongest MEDIUM shortlist leads.",
      "leads": [
        {
          "rank": 1,
          "companyName": "Glomma Tannklinikk",
          "priority": "HIGH",
          "vertical": "dentist",
          "website": "http://glommatannklinikk.no",
          "phone": "69 16 90 90",
          "email": "post@glommatannklinikk.no",
          "address": "Glemmengata 8",
          "city": "Fredrikstad",
          "rating": 4.8,
          "reviewCount": 55,
          "leadClass": "technical_redesign",
          "opportunityType": "technical_trust_risk",
          "whyRanked": [
            "Clear technical trust/reliability evidence",
            "Contactable local clinic",
            "Direct Webconsult fit",
            "Retained as HIGH after human calibration"
          ],
          "evidence": [
            "Failed request and technical reliability signals",
            "Visible contact path",
            "Trust-sensitive clinic vertical"
          ],
          "caution": [
            "Verify technical findings before presenting them",
            "Do not frame as generic redesign"
          ],
          "sourceQuality": {
            "requestedLocation": "Fredrikstad",
            "candidateLocation": "Fredrikstad",
            "locationMatchStatus": "exact_location",
            "locationConfidence": 0.95,
            "distanceKm": 0,
            "fallbackUsed": false,
            "locationWarnings": []
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": "candidate available; manual verify",
            "matchStatus": "manual_verify",
            "matchConfidence": 1,
            "warnings": [
              "duplicate_candidate_review"
            ],
            "legalName": "GLOMMA TANNKLINIKK AS",
            "organizationForm": "Aksjeselskap",
            "employees": 9,
            "registrationDate": "2010-01-01",
            "activeStatus": "active",
            "registeredAddress": "Glemmengata 8, 1608 Fredrikstad"
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Review technical evidence",
            "notes": ""
          },
          "contactability": "phone and email found; visible contact path"
        },
        {
          "rank": 2,
          "companyName": "Advokatfirmaet Bjørnebekk og Martinsen AS",
          "priority": "HIGH",
          "vertical": "lawyer",
          "website": "http://www.advokat-bm.no",
          "phone": "69 36 74 40",
          "email": "unknown",
          "address": "Traraveien 7",
          "city": "Fredrikstad",
          "rating": null,
          "reviewCount": null,
          "leadClass": "technical_redesign",
          "opportunityType": "technical_trust_risk",
          "whyRanked": [
            "Technical trust risk in a credibility-sensitive lawyer vertical",
            "Local and contactable",
            "Retained as HIGH after calibration"
          ],
          "evidence": [
            "Website credibility matters for legal client enquiries",
            "Technical/reliability evidence stronger than polished law-firm cases"
          ],
          "caution": [
            "Use legal client-intake language",
            "Do not use booking or patient terminology"
          ],
          "sourceQuality": {
            "requestedLocation": "Fredrikstad",
            "candidateLocation": "Fredrikstad",
            "locationMatchStatus": "exact_location",
            "locationConfidence": 0.94,
            "distanceKm": 0,
            "fallbackUsed": false,
            "locationWarnings": []
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": null,
            "matchStatus": "not_run",
            "matchConfidence": null,
            "warnings": [],
            "legalName": "unknown",
            "organizationForm": "unknown",
            "employees": null,
            "registrationDate": null,
            "activeStatus": "unknown",
            "registeredAddress": "Traraveien 7, 1605 Fredrikstad"
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Review legal trust evidence",
            "notes": ""
          },
          "contactability": "phone and website found"
        },
        {
          "rank": 3,
          "companyName": "Arne Nilsen AS",
          "priority": "MEDIUM",
          "vertical": "plumber / VVS",
          "website": "https://www.vvseksperten.no/rorlegger/fredrikstad/arne-nilsen-as",
          "phone": "69 31 02 03",
          "email": "unknown",
          "address": "Gelertsens gate 7",
          "city": "Fredrikstad",
          "rating": null,
          "reviewCount": null,
          "leadClass": "service_line_optimization",
          "opportunityType": "high_value_service_conversion",
          "whyRanked": [
            "Strong VVS vertical",
            "High-value services such as bad, varme and rehabilitering",
            "Interesting MEDIUM/borderline shortlist lead"
          ],
          "evidence": [
            "Clear service demand categories",
            "Contact paths and trust markers already present",
            "MEDIUM because pain is not severe enough for HIGH"
          ],
          "caution": [
            "Do not promote to HIGH unless technical trust pain is severe",
            "Network affiliation and trust markers reduce urgency"
          ],
          "sourceQuality": {
            "requestedLocation": "Fredrikstad",
            "candidateLocation": "Fredrikstad",
            "locationMatchStatus": "exact_location",
            "locationConfidence": 0.93,
            "distanceKm": 0,
            "fallbackUsed": false,
            "locationWarnings": []
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": "candidate available; manual verify",
            "matchStatus": "manual_verify",
            "matchConfidence": 1,
            "warnings": [
              "chain_ambiguity"
            ],
            "legalName": "ARNE NILSEN AS",
            "organizationForm": "Aksjeselskap",
            "employees": 16,
            "registrationDate": "unknown",
            "activeStatus": "active",
            "registeredAddress": "Gelertsens gate 7, 1608 Fredrikstad"
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Review service-line opportunity",
            "notes": ""
          },
          "contactability": "phone and website found; clear service pages"
        },
        {
          "rank": 4,
          "companyName": "Drammen Sportsklinikk",
          "priority": "MEDIUM",
          "vertical": "clinic",
          "website": "https://www.drammensportsklinikk.no",
          "phone": "91 19 53 00",
          "email": "unknown",
          "address": "Schwartz gate 6",
          "city": "Drammen",
          "rating": null,
          "reviewCount": null,
          "leadClass": "campaign_optimization",
          "opportunityType": "service_line_conversion",
          "whyRanked": [
            "Strong clinic vertical",
            "Multiple treatment/service lines",
            "Booking path exists, so MEDIUM is appropriate"
          ],
          "evidence": [
            "Treatment pages and booking journey can be reviewed",
            "High-value patient services",
            "No obvious call-first pain"
          ],
          "caution": [
            "Booking/contact already exists",
            "Do not overstate basic conversion pain"
          ],
          "sourceQuality": {
            "requestedLocation": "Drammen",
            "candidateLocation": "Drammen",
            "locationMatchStatus": "exact_location",
            "locationConfidence": 0.96,
            "distanceKm": 0,
            "fallbackUsed": false,
            "locationWarnings": []
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": "candidate available; manual verify",
            "matchStatus": "manual_verify",
            "matchConfidence": 1,
            "warnings": [
              "multiple_plausible_candidates"
            ],
            "legalName": "DRAMMEN SPORTSKLINIKK AS",
            "organizationForm": "Aksjeselskap",
            "employees": null,
            "registrationDate": "unknown",
            "activeStatus": "active",
            "registeredAddress": "Schwartz gate 6, 3043 Drammen"
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Review treatment journey",
            "notes": ""
          },
          "contactability": "booking and website found"
        },
        {
          "rank": 5,
          "companyName": "VB Engelsviken Rør",
          "priority": "MEDIUM",
          "vertical": "plumber / VVS",
          "website": "https://www.engelsvikenror.no",
          "phone": "69 36 77 77",
          "email": "post@engelsvikenror.no",
          "address": "Seljeveien 3",
          "city": "Rolvsøy",
          "rating": null,
          "reviewCount": null,
          "leadClass": "service_line_optimization",
          "opportunityType": "high_value_service_conversion",
          "whyRanked": [
            "Relevant trade vertical",
            "Mature but useful shortlist lead",
            "Good service-line/campaign test case"
          ],
          "evidence": [
            "Bad, varme, varmepumpe and local VVS services",
            "Clear contact path",
            "VB/network maturity reduces urgency"
          ],
          "caution": [
            "Network affiliation should prevent easy HIGH",
            "Verify legal entity before attaching org.nr"
          ],
          "sourceQuality": {
            "requestedLocation": "Fredrikstad",
            "candidateLocation": "Rolvsøy",
            "locationMatchStatus": "exact_location",
            "locationConfidence": 0.88,
            "distanceKm": null,
            "fallbackUsed": false,
            "locationWarnings": []
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": null,
            "matchStatus": "no_match",
            "matchConfidence": 0,
            "warnings": [
              "brand_legal_name_mismatch_possible"
            ],
            "legalName": "unknown",
            "organizationForm": "unknown",
            "employees": null,
            "registrationDate": null,
            "activeStatus": "unknown",
            "registeredAddress": "Seljeveien 3, 1661 Rolvsøy"
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Verify company identity",
            "notes": ""
          },
          "contactability": "phone, email and website found"
        }
      ]
    },
    {
      "id": "gol-strict",
      "name": "Advokater i Gol - strict",
      "purpose": "Location trust",
      "message": "Strict mode does not silently include wrong-location leads.",
      "query": "advokater i Gol",
      "provider": "Google Places",
      "searchScope": "strict",
      "includedLeadCount": 0,
      "totalDiscovered": 4,
      "totalExcludedByLocation": 4,
      "lowSupply": true,
      "fallbackAvailable": true,
      "fallbackUsed": false,
      "recommendedExpansion": "nearby",
      "locationQualityCounts": {
        "out_of_area": 4
      },
      "nextRecommendedAction": "Run again with --search-scope nearby or regional.",
      "leads": []
    },
    {
      "id": "gol-regional",
      "name": "Advokater i Gol - regional",
      "purpose": "Controlled fallback",
      "message": "Expansion is possible, but non-local leads are visibly marked.",
      "query": "advokater i Gol",
      "provider": "Google Places",
      "searchScope": "regional",
      "includedLeadCount": 4,
      "totalDiscovered": 4,
      "totalExcludedByLocation": 0,
      "lowSupply": false,
      "fallbackAvailable": false,
      "fallbackUsed": true,
      "recommendedExpansion": null,
      "locationQualityCounts": {
        "regional_fallback": 4
      },
      "nextRecommendedAction": "Review fallback location warnings before treating these as local leads.",
      "leads": [
        {
          "rank": 1,
          "companyName": "Advokatfirmaet SGB Storløkken",
          "priority": "MEDIUM",
          "vertical": "lawyer",
          "website": "https://sgb.no",
          "phone": "unknown",
          "email": "unknown",
          "address": "Oslo area",
          "city": "Oslo",
          "rating": null,
          "reviewCount": null,
          "leadClass": "trust_modernization",
          "opportunityType": "service_enquiry_clarity",
          "whyRanked": [
            "Relevant legal-service result from expanded scope",
            "Contact path and website can be reviewed",
            "Useful only as explicit regional fallback"
          ],
          "evidence": [
            "Returned by provider for regional expansion",
            "Not exact Gol location",
            "Should not be treated as local without review"
          ],
          "caution": [
            "Regional fallback, not exact location",
            "Verify local relevance before using"
          ],
          "sourceQuality": {
            "requestedLocation": "Gol",
            "candidateLocation": "Oslo",
            "locationMatchStatus": "regional_fallback",
            "locationConfidence": 0.35,
            "distanceKm": null,
            "fallbackUsed": true,
            "locationWarnings": [
              "candidate_appears_outside_requested_location",
              "included_as_explicit_location_fallback"
            ]
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": null,
            "matchStatus": "not_run",
            "matchConfidence": null,
            "warnings": [],
            "legalName": null,
            "organizationForm": null,
            "employees": null,
            "registrationDate": null,
            "activeStatus": "unknown",
            "registeredAddress": null
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Review",
            "notes": ""
          },
          "contactability": "available"
        },
        {
          "rank": 2,
          "companyName": "Elden Advokatfirma AS",
          "priority": "LOW",
          "vertical": "lawyer",
          "website": "https://www.elden.no",
          "phone": "unknown",
          "email": "unknown",
          "address": "Oslo area",
          "city": "Oslo",
          "rating": null,
          "reviewCount": null,
          "leadClass": "mature_firm_review",
          "opportunityType": "regional_fallback_only",
          "whyRanked": [
            "Recognizable legal-service result",
            "Included only to demonstrate controlled fallback"
          ],
          "evidence": [
            "Regional fallback marker applied",
            "Likely mature firm",
            "Not exact requested location"
          ],
          "caution": [
            "Large/mature firm",
            "Fallback result requires manual relevance check"
          ],
          "sourceQuality": {
            "requestedLocation": "Gol",
            "candidateLocation": "Oslo",
            "locationMatchStatus": "regional_fallback",
            "locationConfidence": 0.3,
            "distanceKm": null,
            "fallbackUsed": true,
            "locationWarnings": [
              "candidate_appears_outside_requested_location",
              "included_as_explicit_location_fallback"
            ]
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": null,
            "matchStatus": "not_run",
            "matchConfidence": null,
            "warnings": [],
            "legalName": null,
            "organizationForm": null,
            "employees": null,
            "registrationDate": null,
            "activeStatus": "unknown",
            "registeredAddress": null
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Review",
            "notes": ""
          },
          "contactability": "available"
        },
        {
          "rank": 3,
          "companyName": "Advokatguiden.no",
          "priority": "LOW",
          "vertical": "directory",
          "website": "https://www.advokatguiden.no",
          "phone": "unknown",
          "email": "unknown",
          "address": "Norway",
          "city": "unknown",
          "rating": null,
          "reviewCount": null,
          "leadClass": "source_quality_review",
          "opportunityType": "directory_result",
          "whyRanked": [
            "Shows source classification risk",
            "Not a direct local business lead"
          ],
          "evidence": [
            "Directory-like source",
            "Fallback result",
            "Requires filtering before seller use"
          ],
          "caution": [
            "Not a direct target",
            "Use as discovery clue only"
          ],
          "sourceQuality": {
            "requestedLocation": "Gol",
            "candidateLocation": "unknown",
            "locationMatchStatus": "regional_fallback",
            "locationConfidence": 0.2,
            "distanceKm": null,
            "fallbackUsed": true,
            "locationWarnings": [
              "included_as_explicit_location_fallback",
              "directory_like_result"
            ]
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": null,
            "matchStatus": "not_run",
            "matchConfidence": null,
            "warnings": [],
            "legalName": null,
            "organizationForm": null,
            "employees": null,
            "registrationDate": null,
            "activeStatus": "unknown",
            "registeredAddress": null
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Review",
            "notes": ""
          },
          "contactability": "available"
        },
        {
          "rank": 4,
          "companyName": "Advokat Asle Hesla",
          "priority": "LOW",
          "vertical": "lawyer",
          "website": "unknown",
          "phone": "unknown",
          "email": "unknown",
          "address": "regional result",
          "city": "unknown",
          "rating": null,
          "reviewCount": null,
          "leadClass": "manual_verify",
          "opportunityType": "regional_fallback_only",
          "whyRanked": [
            "Possible legal-service result",
            "Insufficient local/contact evidence"
          ],
          "evidence": [
            "Provider returned candidate",
            "Fallback marker applied"
          ],
          "caution": [
            "Verify website and locality",
            "Not ready as local Gol lead"
          ],
          "sourceQuality": {
            "requestedLocation": "Gol",
            "candidateLocation": "unknown",
            "locationMatchStatus": "regional_fallback",
            "locationConfidence": 0.25,
            "distanceKm": null,
            "fallbackUsed": true,
            "locationWarnings": [
              "included_as_explicit_location_fallback",
              "location_uncertain"
            ]
          },
          "companyProfile": {
            "organizationNumber": null,
            "candidateOrganizationNumber": null,
            "matchStatus": "not_run",
            "matchConfidence": null,
            "warnings": [],
            "legalName": null,
            "organizationForm": null,
            "employees": null,
            "registrationDate": null,
            "activeStatus": "unknown",
            "registeredAddress": null
          },
          "economy": {
            "status": "not_enabled"
          },
          "mobile": null,
          "sourceBadges": [
            "Google Places",
            "Website audit",
            "Brreg/company-profile",
            "Proff later"
          ],
          "workflow": {
            "status": "New lead",
            "owner": "unassigned",
            "nextAction": "Review",
            "notes": ""
          },
          "contactability": "available"
        }
      ]
    }
  ]
}

const state = {
  data: fallbackData,
  scenarioId: fallbackData.meta.defaultScenario || 'pilot-leads',
  selectedLeadIndex: 0,
}

const els = {
  scenarioSelect: document.getElementById('scenarioSelect'),
  queryInput: document.getElementById('queryInput'),
  runButton: document.getElementById('runButton'),
  summary: document.getElementById('summaryPanel'),
  leadCards: document.getElementById('leadCards'),
  leadCountText: document.getElementById('leadCountText'),
  companyProfile: document.getElementById('companyProfile'),
  intelligence: document.getElementById('intelligencePanel'),
  exportPreview: document.getElementById('exportPreview'),
}

init()

async function init() {
  state.data = await loadData()
  state.scenarioId = state.data.meta.defaultScenario || state.data.scenarios[0]?.id || 'pilot-leads'
  renderScenarioOptions()
  els.scenarioSelect.addEventListener('change', () => {
    state.scenarioId = els.scenarioSelect.value
    state.selectedLeadIndex = 0
    render()
  })
  els.runButton.addEventListener('click', () => render())
  render()
}

async function loadData() {
  try {
    const response = await fetch('demo-data/showcase.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (_) {
    return fallbackData
  }
}

function renderScenarioOptions() {
  els.scenarioSelect.innerHTML = state.data.scenarios.map((scenario) => `
    <option value="${escapeAttr(scenario.id)}">${escapeHtml(scenario.name)}</option>
  `).join('')
  els.scenarioSelect.value = state.scenarioId
}

function currentScenario() {
  return state.data.scenarios.find((scenario) => scenario.id === state.scenarioId) || state.data.scenarios[0]
}

function selectedLead(scenario) {
  return (scenario.leads || [])[state.selectedLeadIndex] || null
}

function render() {
  const scenario = currentScenario()
  if (!scenario) return
  els.queryInput.value = scenario.query
  els.scenarioSelect.value = scenario.id
  renderSummary(scenario)
  renderLeadList(scenario)
  renderCompanyProfile(selectedLead(scenario), scenario)
  renderIntelligence(selectedLead(scenario), scenario)
  renderExport(scenario)
}

function renderSummary(scenario) {
  els.summary.innerHTML = `
    ${metric('Provider', scenario.provider)}
    ${metric('Scope', readableStatus(scenario.searchScope))}
    ${metric('Discovered', scenario.totalDiscovered)}
    ${metric('Included', scenario.includedLeadCount)}
    ${metric('Low supply', scenario.lowSupply ? 'Yes' : 'No')}
    ${metric('Next', scenario.recommendedExpansion ? `Expand: ${scenario.recommendedExpansion}` : 'Review leads')}
  `
}

function renderLeadList(scenario) {
  const leads = scenario.leads || []
  els.leadCountText.textContent = `${leads.length} lead pack${leads.length === 1 ? '' : 's'}`
  if (!leads.length) {
    els.leadCards.innerHTML = `<div class="empty-state">Få lokale treff. Strict mode inkluderte ingen feil-lokasjon leads. Prøv nearby eller regional for mer volum.</div>`
    return
  }

  els.leadCards.innerHTML = leads.map((lead, index) => `
    <button class="lead-row ${index === state.selectedLeadIndex ? 'active' : ''}" type="button" data-index="${index}">
      <div class="lead-row-top">
        <div class="badge-row">${badge(lead.priority)}${badge(readableStatus(lead.sourceQuality?.locationMatchStatus))}</div>
        <strong>#${escapeHtml(lead.rank)}</strong>
      </div>
      <h3>${escapeHtml(lead.companyName)}</h3>
      <p>${escapeHtml(lead.city || 'unknown')} · ${escapeHtml(lead.phone || 'unknown')} · ${readableStatus(lead.companyProfile?.matchStatus || 'not_run')}</p>
      <p>${escapeHtml((lead.whyRanked || [])[0] || 'Ranked lead pack')}</p>
    </button>
  `).join('')

  els.leadCards.querySelectorAll('.lead-row').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedLeadIndex = Number(button.dataset.index)
      render()
    })
  })
}

function renderCompanyProfile(lead, scenario) {
  if (!lead) {
    els.companyProfile.innerHTML = `
      <div class="company-hero">
        <div class="company-name">
          <p class="eyebrow">Company profile</p>
          <h2>No selected lead</h2>
          <p>Strict mode found no local lead packs. The useful product signal is low supply plus controlled expansion.</p>
        </div>
      </div>
      ${section('Run context', kvList([
        ['Query', scenario.query],
        ['Search scope', readableStatus(scenario.searchScope)],
        ['Fallback available', scenario.fallbackAvailable ? 'Yes' : 'No'],
        ['Next action', scenario.nextRecommendedAction],
      ]))}
    `
    return
  }

  const profile = lead.companyProfile || {}
  const primaryId = lead.mobile || lead.phone || profile.organizationNumber || profile.candidateOrganizationNumber || 'unknown'
  els.companyProfile.innerHTML = `
    <div class="company-hero">
      <div class="company-mainline">
        <div class="company-name">
          <p class="eyebrow">Company profile</p>
          <h2>${escapeHtml(lead.companyName)}</h2>
          <p>${escapeHtml(profile.legalName || 'Legal name unknown')}</p>
        </div>
        <div class="big-identifier">
          <span>Primary identifier</span>
          <strong>${escapeHtml(primaryId)}</strong>
        </div>
      </div>
      <div class="badge-row">
        ${badge(lead.priority)}
        ${badge(readableStatus(profile.matchStatus || 'not_run'))}
        ${badge(readableStatus(lead.sourceQuality?.locationMatchStatus || 'unknown'))}
        ${badge(readableStatus(lead.economy?.status || 'not_enabled'))}
      </div>
    </div>

    <div class="fact-grid section-block">
      ${fact('Confirmed org.nr', profile.organizationNumber || 'none')}
      ${fact('Candidate org.nr', profile.candidateOrganizationNumber || 'none')}
      ${fact('Employees', profile.employees ?? 'unknown')}
      ${fact('Status', readableStatus(profile.activeStatus || 'unknown'))}
      ${fact('Organization form', profile.organizationForm || 'unknown')}
      ${fact('Founded', profile.registrationDate || 'unknown')}
      ${fact('Match confidence', profile.matchConfidence ?? 'unknown')}
      ${fact('City', lead.city || 'unknown')}
    </div>

    ${section('Contact', kvList([
      ['Phone', lead.phone || 'unknown'],
      ['Mobile', lead.mobile || 'unknown'],
      ['Email', lead.email || 'unknown'],
      ['Website', linkValue(lead.website)],
      ['Address', profile.registeredAddress || [lead.address, lead.city].filter(Boolean).join(', ') || 'unknown'],
    ]))}

    ${section('Sources', `<div class="sources-grid">${(lead.sourceBadges || []).map((source) => `<div class="source-pill">${escapeHtml(source)}</div>`).join('')}</div>`)}
  `
}

function renderIntelligence(lead, scenario) {
  if (!lead) {
    els.intelligence.innerHTML = `
      <h2>Run intelligence</h2>
      <div class="workflow-strip">
        ${kvList([
          ['Status', 'Low local supply'],
          ['Next action', scenario.nextRecommendedAction],
          ['Fallback', scenario.fallbackAvailable ? 'Available' : 'Not available'],
        ])}
      </div>
      ${section('Location quality', badgeList(Object.entries(scenario.locationQualityCounts || {}).map(([key, value]) => `${readableStatus(key)}: ${value}`)))}
    `
    return
  }

  els.intelligence.innerHTML = `
    <h2>Lead intelligence</h2>
    <div class="workflow-strip">
      ${kvList([
        ['Status', lead.workflow?.status || 'New lead'],
        ['Owner', lead.workflow?.owner || 'unassigned'],
        ['Next action', lead.workflow?.nextAction || 'Review'],
      ])}
      <div class="notes-box">Notes: ${escapeHtml(lead.workflow?.notes || 'Add seller notes after review.')}</div>
    </div>
    ${section('Priority', kvList([
      ['Call priority', lead.priority],
      ['Lead class', lead.leadClass],
      ['Opportunity', lead.opportunityType],
      ['Contactability', lead.contactability || 'unknown'],
      ['Location', readableStatus(lead.sourceQuality?.locationMatchStatus || 'unknown')],
    ]))}
    ${section('Why ranked', bulletList(lead.whyRanked))}
    ${section('Evidence', bulletList(lead.evidence))}
    ${section('Caution', bulletList(lead.caution))}
    ${section('Warnings', bulletList([...(lead.sourceQuality?.locationWarnings || []), ...(lead.companyProfile?.warnings || [])]))}
  `
}

function renderExport(scenario) {
  const leads = scenario.leads || []
  const headers = ['rank', 'company', 'orgNumber', 'candidateOrgNumber', 'phone', 'email', 'website', 'city', 'priority', 'leadClass', 'matchStatus', 'evidenceSummary', 'cautionSummary']
  if (!leads.length) {
    els.exportPreview.innerHTML = `
      <p class="eyebrow">Sales export preview</p>
      <div class="empty-state">No export rows in strict low-supply mode. Expand scope to produce rows.</div>
    `
    return
  }
  els.exportPreview.innerHTML = `
    <p class="eyebrow">Sales export preview</p>
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>${leads.map((lead) => exportRow(lead)).join('')}</tbody>
    </table>
  `
}

function exportRow(lead) {
  const profile = lead.companyProfile || {}
  return `<tr>
    ${cell(lead.rank)}
    ${cell(lead.companyName)}
    ${cell(profile.organizationNumber || '')}
    ${cell(profile.candidateOrganizationNumber || '')}
    ${cell(lead.phone || '')}
    ${cell(lead.email || '')}
    ${cell(lead.website || '')}
    ${cell(lead.city || '')}
    ${cell(lead.priority || '')}
    ${cell(lead.leadClass || '')}
    ${cell(profile.matchStatus || '')}
    ${cell((lead.evidence || []).join(' | '))}
    ${cell((lead.caution || []).join(' | '))}
  </tr>`
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? 'unknown')}</strong></div>`
}

function fact(label, value) {
  return `<div class="fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? 'unknown')}</strong></div>`
}

function section(title, content) {
  return `<section class="section-block"><h3>${escapeHtml(title)}</h3>${content}</section>`
}

function kvList(items) {
  return `<div class="kv-grid">${items.map(([key, value]) => `<div class="kv"><span>${escapeHtml(key)}</span><span>${isHtml(value) ? value : escapeHtml(value ?? 'unknown')}</span></div>`).join('')}</div>`
}

function bulletList(items = []) {
  if (!items.length) return '<p class="muted">None.</p>'
  return `<ul class="bullet-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function badgeList(items = []) {
  return `<div class="badge-row">${items.map((item) => badge(item)).join('')}</div>`
}

function badge(value) {
  if (!value) return ''
  const text = String(value)
  const cls = text.toLowerCase().replace(/[^a-z0-9_]+/g, '_')
  return `<span class="badge ${escapeAttr(cls)}">${escapeHtml(text)}</span>`
}

function readableStatus(value) {
  const map = {
    exact_location: 'Exact location / riktig sted',
    regional_fallback: 'Regional fallback',
    manual_verify: 'Manual verify',
    low_supply: 'Low local supply / få lokale treff',
    not_enabled: 'Not enabled',
    no_match: 'No match',
    not_run: 'Not run',
    strict: 'Strict',
    regional: 'Regional',
    mixed: 'Mixed',
    active: 'Active',
  }
  return map[value] || value || 'unknown'
}

function linkValue(value) {
  if (!value || value === 'unknown') return 'unknown'
  return `<a href="${escapeAttr(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`
}

function cell(value) {
  return `<td>${escapeHtml(value ?? '')}</td>`
}

function isHtml(value) {
  return typeof value === 'string' && value.trim().startsWith('<')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;')
}
