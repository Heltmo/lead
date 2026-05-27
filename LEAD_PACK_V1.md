# LEAD_PACK_V1

## Purpose

The goal is to produce seller-ready lead packs, not automated outreach.

A lead pack should help a seller answer:

- Who is this business?
- Is it worth my time?
- Why was it ranked?
- How can I contact them?
- What official company data do we know?
- What evidence supports the ranking?
- What should I be careful not to overstate?

The lead pack is an operator decision artifact. It should make the seller faster and better informed without taking over the seller's judgment, wording, timing, or relationship work.

## Product Boundary

The machine owns:

- discovery
- deduplication
- website audit
- business signals
- commercial pressure
- ranking
- company enrichment
- org.nr / firm metadata
- contact info
- evidence
- caution notes
- export

The seller owns:

- angle
- wording
- call/email decision
- relationship
- timing
- qualification
- close

Default product behavior should not generate fixed sales scripts. Scripts, call openers, and ready-to-send outreach copy are not part of the lead pack contract.

## Lead Pack Fields

Target lead object:

- rank
- callPriority
- leadClass
- opportunityType
- recommendedOfferCategory
- companyName
- legalName
- organizationNumber
- organizationForm
- website
- phone
- email
- address
- city
- municipality
- industry
- NACE code
- NACE description
- employees
- registrationDate
- activeStatus
- source provider
- source confidence
- company match confidence
- rating
- review count
- contactability summary
- CTA/contact profile
- why ranked
- evidence bullets
- caution notes
- verify notes
- seller notes
- last checked at

## Example Lead Pack

Example based on Glomma Tannklinikk. Unknown fields are intentionally marked `unknown`; org.nr should not be invented before company enrichment exists.

```yaml
rank: 1
callPriority: HIGH
leadClass: technical_redesign
opportunityType: technical_trust_risk
recommendedOfferCategory: website trust and reliability cleanup
companyName: Glomma Tannklinikk
legalName: unknown
organizationNumber: unknown
organizationForm: unknown
website: http://glommatannklinikk.no
phone: 69 16 90 90
email: post@glommatannklinikk.no
address: Glemmengata 8, 1608 Fredrikstad
city: Fredrikstad
municipality: unknown
industry: dentist
NACE code: unknown
NACE description: unknown
employees: unknown
registrationDate: unknown
activeStatus: OPERATIONAL
source provider: google-places
source confidence: high
company match confidence: unknown
rating: 4.8
review count: 55
contactability summary: phone and email found; visible contact/booking path detected
CTA/contact profile: phone | email | contact_link | booking_link | emergency_call
why ranked: Technical trust and reliability evidence on a contactable local clinic.
evidence bullets:
  - Failed network requests detected
  - Serious accessibility/usability findings detected
  - Local clinic is contactable and operational
caution notes:
  - Seller should verify technical findings before overstating them
  - Do not frame this as generic redesign without confirming buyer pain
verify notes:
  - Official legal entity and organization number not yet enriched
seller notes: empty
last checked at: unknown
```

## Company Enrichment Direction

Planned module:

```text
core/company-profile/
```

Purpose:

Match discovered leads to official Norwegian company records.

First enrichment source:

```text
Brønnøysundregistrene / Enhetsregisteret
```

Fields to enrich:

- organizationNumber
- legalName
- organizationForm
- registeredAddress
- municipality
- NACE code
- NACE description
- employees if available
- registration date if available
- active status
- source URL / source id
- match confidence

## Matching Rules

Company matching must be confidence-based.

Use these match levels:

- exact match
- strong match
- weak match
- manual verify

Never silently attach an organization number if confidence is weak.

Important matching risks:

- Google Places name may differ from legal entity name.
- Chain, branch, and location pages may map to a parent entity.
- Franchises and clinic groups require caution.
- A website brand can represent multiple legal entities.
- A legal entity can operate under a trading name that differs from public discovery data.

The output should expose uncertainty instead of hiding it.

## UI Direction

The review workspace should eventually prioritize:

- ranked lead list
- company facts
- official org data
- contactability
- why ranked
- evidence
- caution
- export

Downplay:

- long AI-generated text
- suggested scripts
- call openers
- generic opportunity paragraphs

The seller should see the facts, ranking reason, evidence, and caution quickly. Supporting audit detail can remain available behind links or expandable sections.

## CSV/CRM Export Direction

Future exports should include:

- rank
- callPriority
- companyName
- legalName
- organizationNumber
- website
- phone
- email
- address
- city
- industry
- leadClass
- opportunityType
- evidenceSummary
- cautionSummary
- contactability
- sourceConfidence
- matchConfidence
- sellerNotes

## Relationship To OUTREACH_PILOT_001

`OUTREACH_PILOT_001.md` is an internal market-test worksheet.

`LEAD_PACK_V1.md` is the target product format.

The pilot tests whether ranked leads produce response. The lead pack defines what the machine should produce for sellers.

The pilot should remain small, manual, and honest. The lead pack should become the repeatable seller-facing artifact once company enrichment, evidence summaries, caution notes, and exports are formalized.
