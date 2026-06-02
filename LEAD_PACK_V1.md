# Lead Pack V1

## Purpose

A lead pack is a seller-ready decision artifact. It helps answer:

- Who is this business?
- Is it in the right market?
- Can I contact it?
- What official company data do we know?
- Why is it worth reviewing?
- What must be verified before use?
- What notes/follow-ups has the seller logged?

## Product Boundary

Lead Machine owns discovery, identity, contact data, source quality, evidence, caution notes, seller-fit interpretation, workflow state, and exports.

The seller owns wording, timing, relationship, qualification, and close.

No fixed sales scripts, call openers, ready-to-send email copy, or automated sending belong in the lead pack contract.

## Lead States

- Fast scan candidate: enough identity/contact/source context for quick seller review.
- Selected enriched lead: one lead upgraded with additional identity/contactability/seller-fit/digital-status/economy/OSINT-lite modules.

## Key Fields

- rank
- callPriority
- leadClass
- opportunityType
- company display/legal name
- organizationNumber / candidateOrganizationNumber
- organization form, NACE, employees, status
- phone, email, website, address, city
- source provider and confidence
- location quality
- Google rating/review count when available
- whyRanked[]
- caution[]
- sellerFit
- enrichmentStatus / enrichmentModules[]
- workflow status, response, notes, follow-up date, activity history

## Rule

A lead pack should make the seller faster and more accurate. It should not pretend uncertain data is confirmed, and it should not turn into automated outreach.
