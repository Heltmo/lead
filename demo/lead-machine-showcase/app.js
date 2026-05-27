const fallbackData = {
  "meta": {
    "title": "Lead Machine Demo",
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
    }
  },
  "scenarios": [
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
            "warnings": []
          },
          "economy": {
            "status": "not_enabled"
          }
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
            "warnings": []
          },
          "economy": {
            "status": "not_enabled"
          }
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
            "warnings": []
          },
          "economy": {
            "status": "not_enabled"
          }
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
            "warnings": []
          },
          "economy": {
            "status": "not_enabled"
          }
        }
      ]
    },
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
            "candidateOrganizationNumber": "manual verify",
            "matchStatus": "manual_verify",
            "matchConfidence": 1,
            "warnings": [
              "duplicate_candidate_review"
            ]
          },
          "economy": {
            "status": "not_enabled"
          }
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
            "warnings": []
          },
          "economy": {
            "status": "not_enabled"
          }
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
            "candidateOrganizationNumber": "manual verify",
            "matchStatus": "manual_verify",
            "matchConfidence": 1,
            "warnings": [
              "chain_ambiguity"
            ]
          },
          "economy": {
            "status": "not_enabled"
          }
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
            "candidateOrganizationNumber": "manual verify",
            "matchStatus": "manual_verify",
            "matchConfidence": 1,
            "warnings": [
              "multiple_plausible_candidates"
            ]
          },
          "economy": {
            "status": "not_enabled"
          }
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
            ]
          },
          "economy": {
            "status": "not_enabled"
          }
        }
      ]
    }
  ]
}

const state = {
  data: null,
  scenarioId: null,
  selectedLeadIndex: 0,
  exportVisible: false,
}

const els = {
  tabs: document.getElementById('scenarioTabs'),
  summary: document.getElementById('summaryPanel'),
  leadCards: document.getElementById('leadCards'),
  leadCountText: document.getElementById('leadCountText'),
  detail: document.getElementById('detailPanel'),
  exportPreview: document.getElementById('exportPreview'),
  exportButton: document.getElementById('exportButton'),
}

init()

async function init() {
  state.data = await loadData()
  state.scenarioId = state.data.scenarios[0]?.id || null
  els.exportButton.addEventListener('click', () => {
    state.exportVisible = !state.exportVisible
    render()
  })
  render()
}

async function loadData() {
  try {
    const response = await fetch('demo-data/showcase.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    return fallbackData
  }
}

function currentScenario() {
  return state.data.scenarios.find((scenario) => scenario.id === state.scenarioId) || state.data.scenarios[0]
}

function render() {
  const scenario = currentScenario()
  if (!scenario) {
    els.summary.innerHTML = '<div class="empty-state">No demo data loaded. Serve this folder locally to load demo-data/showcase.json.</div>'
    return
  }
  renderTabs(scenario)
  renderSummary(scenario)
  renderLeads(scenario)
  renderDetail(scenario)
  renderExport(scenario)
}

function renderTabs(activeScenario) {
  els.tabs.innerHTML = state.data.scenarios.map((scenario) => `
    <button class="scenario-tab ${scenario.id === activeScenario.id ? 'active' : ''}" type="button" data-scenario="${escapeHtml(scenario.id)}">
      <strong>${escapeHtml(scenario.name)}</strong>
      <span>${escapeHtml(scenario.purpose)}</span>
    </button>
  `).join('')
  els.tabs.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.scenarioId = button.dataset.scenario
      state.selectedLeadIndex = 0
      state.exportVisible = false
      render()
    })
  })
}

function renderSummary(scenario) {
  const counts = scenario.locationQualityCounts || {}
  els.summary.innerHTML = `
    <div class="summary-header">
      <div>
        <p class="eyebrow">${escapeHtml(scenario.purpose)}</p>
        <h2>${escapeHtml(scenario.query)}</h2>
        <p>${escapeHtml(scenario.message)}</p>
      </div>
      <div class="badge-row">
        ${badge(scenario.searchScope)}
        ${scenario.lowSupply ? badge('low_supply') : ''}
        ${scenario.fallbackUsed ? badge('fallback_used') : ''}
      </div>
    </div>
    <div class="metric-grid">
      ${metric('Provider', scenario.provider)}
      ${metric('Discovered', scenario.totalDiscovered)}
      ${metric('Included', scenario.includedLeadCount)}
      ${metric('Excluded by location', scenario.totalExcludedByLocation)}
      ${metric('Fallback', scenario.fallbackUsed ? 'used' : (scenario.fallbackAvailable ? 'available' : 'no'))}
    </div>
    <div class="next-action"><strong>Next action:</strong> ${escapeHtml(scenario.nextRecommendedAction || 'Review generated lead packs.')}</div>
    <div class="detail-section">
      <h3>Location quality</h3>
      <div class="badge-row">${Object.entries(counts).map(([key, value]) => `${badge(key)} <span class="muted">${value}</span>`).join('')}</div>
    </div>
  `
}

function renderLeads(scenario) {
  const leads = scenario.leads || []
  els.leadCountText.textContent = leads.length ? `${leads.length} lead pack${leads.length === 1 ? '' : 's'} ready for review.` : 'No lead packs included in this scope.'
  if (!leads.length) {
    els.leadCards.innerHTML = `<div class="empty-state">Strict mode found no included leads. This is a trust signal: the system did not fill the result with wrong-location candidates.</div>`
    return
  }
  els.leadCards.innerHTML = leads.map((lead, index) => `
    <article class="lead-card ${index === state.selectedLeadIndex ? 'active' : ''}" data-lead-index="${index}" tabindex="0">
      <div class="card-top">
        <div class="badge-row">
          ${badge(lead.priority)}
          ${badge(lead.sourceQuality?.locationMatchStatus || 'unknown')}
          ${badge(companyBadge(lead.companyProfile))}
        </div>
        <span class="muted">#${lead.rank}</span>
      </div>
      <h3>${escapeHtml(lead.companyName)}</h3>
      <p>${escapeHtml(lead.city || 'unknown')} · ${escapeHtml(lead.vertical || 'unknown')} · ${escapeHtml(lead.leadClass || 'unknown')}</p>
    </article>
  `).join('')
  els.leadCards.querySelectorAll('.lead-card').forEach((card) => {
    const select = () => {
      state.selectedLeadIndex = Number(card.dataset.leadIndex)
      render()
    }
    card.addEventListener('click', select)
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') select()
    })
  })
}

function renderDetail(scenario) {
  const leads = scenario.leads || []
  const lead = leads[state.selectedLeadIndex]
  if (!lead) {
    els.detail.innerHTML = `
      <p class="eyebrow">Lead detail</p>
      <h2>No lead selected</h2>
      <p class="muted">Use regional expansion or another scenario to review lead packs.</p>
    `
    return
  }
  els.detail.innerHTML = `
    <p class="eyebrow">Lead detail</p>
    <h2>${escapeHtml(lead.companyName)}</h2>
    <div class="badge-row" style="margin-top: 10px;">${badge(lead.priority)}${badge(lead.opportunityType)}${badge(lead.companyProfile?.matchStatus || 'not_run')}</div>
    ${detailSection('Contact', kvList([
      ['Website', linkValue(lead.website)],
      ['Phone', lead.phone],
      ['Email', lead.email],
      ['Address', [lead.address, lead.city].filter(Boolean).join(', ')],
      ['Rating', formatRating(lead)],
    ]))}
    ${detailSection('Why ranked', bulletList(lead.whyRanked))}
    ${detailSection('Evidence', bulletList(lead.evidence))}
    ${detailSection('Caution', bulletList(lead.caution))}
    ${detailSection('Source quality', kvList([
      ['Requested', lead.sourceQuality?.requestedLocation],
      ['Candidate', lead.sourceQuality?.candidateLocation],
      ['Location status', lead.sourceQuality?.locationMatchStatus],
      ['Confidence', lead.sourceQuality?.locationConfidence],
      ['Fallback used', String(Boolean(lead.sourceQuality?.fallbackUsed))],
      ['Warnings', (lead.sourceQuality?.locationWarnings || []).join(', ') || 'none'],
    ]))}
    ${detailSection('Company profile', kvList([
      ['Org.nr', lead.companyProfile?.organizationNumber || 'not confirmed'],
      ['Candidate org.nr', lead.companyProfile?.candidateOrganizationNumber || 'none'],
      ['Match status', lead.companyProfile?.matchStatus || 'not_run'],
      ['Confidence', lead.companyProfile?.matchConfidence ?? 'unknown'],
      ['Warnings', (lead.companyProfile?.warnings || []).join(', ') || 'none'],
      ['Economy', lead.economy?.status || 'not_enabled'],
    ]))}
  `
}

function renderExport(scenario) {
  els.exportButton.textContent = state.exportVisible ? 'Hide CSV preview' : 'CSV preview'
  els.exportPreview.hidden = !state.exportVisible
  if (!state.exportVisible) return
  const rows = scenario.leads || []
  if (!rows.length) {
    els.exportPreview.innerHTML = '<div class="empty-state">No rows in this scope. Expand the search to preview export fields.</div>'
    return
  }
  const headers = ['rank', 'priority', 'companyName', 'city', 'website', 'phone', 'leadClass', 'opportunityType', 'locationStatus', 'companyMatch']
  els.exportPreview.innerHTML = `
    <div class="section-title">CSV export preview</div>
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.map((lead) => `<tr>
          ${cell(lead.rank)}
          ${cell(lead.priority)}
          ${cell(lead.companyName)}
          ${cell(lead.city)}
          ${cell(lead.website)}
          ${cell(lead.phone)}
          ${cell(lead.leadClass)}
          ${cell(lead.opportunityType)}
          ${cell(lead.sourceQuality?.locationMatchStatus)}
          ${cell(lead.companyProfile?.matchStatus)}
        </tr>`).join('')}
      </tbody>
    </table>
  `
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? 'unknown')}</strong></div>`
}

function badge(value) {
  if (!value) return ''
  const text = String(value)
  const cls = text.toLowerCase().replace(/[^a-z0-9_]+/g, '_')
  return `<span class="badge ${escapeHtml(cls)}">${escapeHtml(text)}</span>`
}

function companyBadge(profile = {}) {
  if (profile.organizationNumber) return 'confirmed_org'
  if (profile.candidateOrganizationNumber && profile.candidateOrganizationNumber !== 'manual verify') return 'candidate_org'
  return profile.matchStatus || 'not_run'
}

function detailSection(title, content) {
  return `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${content}</section>`
}

function kvList(items) {
  return `<div class="kv-list">${items.map(([key, value]) => `<div class="kv"><span>${escapeHtml(key)}</span><span>${value && String(value).startsWith('<a') ? value : escapeHtml(value ?? 'unknown')}</span></div>`).join('')}</div>`
}

function bulletList(items = []) {
  if (!items.length) return '<p class="muted">No items.</p>'
  return `<ul class="bullet-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function linkValue(value) {
  if (!value || value === 'unknown') return 'unknown'
  return `<a href="${escapeAttr(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`
}

function formatRating(lead) {
  if (lead.rating === null || lead.rating === undefined) return 'unknown'
  return `${lead.rating} (${lead.reviewCount ?? 0} reviews)`
}

function cell(value) {
  return `<td>${escapeHtml(value ?? '')}</td>`
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
