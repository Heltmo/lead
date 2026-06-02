# OSINT Enrichment V1

## Objective

Add controlled OSINT enrichment to Lead Machine so a seller can inspect public business evidence for one selected lead before deciding whether it is worth time.

The system should help a seller answer:

- Is this company real, active, and correctly identified?
- Can I contact it through public business channels?
- Does public market proof support prioritizing it?
- Are there recent public activity signals worth considering?
- What risks or source gaps must be verified before export or contact?

## Product Boundary

Machine provides:

- public business source discovery
- normalized evidence
- source URLs and timestamps
- confidence and risk flags
- seller-fit refresh from public signals
- workflow/export context

Seller owns:

- interpretation
- angle
- wording
- outreach
- timing
- relationship
- close

Do not add private-person dossiers, login-gated scraping, CAPTCHA bypassing, paywall bypassing, employee profiling, personal social scraping, generated outreach, auto-email, auto-calling, or surveillance behavior.

## V1 Scope

OSINT V1 is selected-lead enrichment only. It should run after a seller selects one promising lead, not as broad scraping across every search result.

Build a small module:

```text
core/osint/
```

Input:

```json
{
  "lead": {},
  "sellerIntent": "general_b2b"
}
```

Output:

```json
{
  "osint": {
    "companyIdentity": [],
    "contactability": [],
    "digitalPresence": [],
    "marketProof": [],
    "recentActivity": [],
    "riskVerify": [],
    "sources": []
  }
}
```

Every OSINT signal must include enough source context to audit it later:

- source name
- source URL when available
- observed value
- observed at timestamp
- confidence
- risk level when relevant

## Source Goals

Start with sources that are already product-aligned:

- Brreg/company identity already present in the lead.
- Google Places data already present in the lead.
- Public website/contact page signals.
- Public directory/source consistency when available.
- Public news or job/activity signals only if easy and safe.

Avoid adding new third-party paid sources in this slice. Proff and SSB stay out of OSINT V1.

## Signal Goals

Normalize public evidence into these groups:

- Company identity: org.nr, legal name, active status, address, category/NACE, employees.
- Contactability: phone, email, contact form, contact page, opening hours, branch/location hints.
- Digital presence: website exists, contact page exists, social links, broken/parked/wrong-site signals.
- Market proof: Google rating, review count, public listing consistency, local category match.
- Recent activity: public news, job posts, recent page/source activity when available.
- Risk / verify: wrong location, name mismatch, inactive status, no confirmed org.nr, no contact path, suspicious website, weak source confidence.

## UI Goals

Show OSINT as evidence, not magic.

Lead detail should expose:

- OSINT summary
- source-backed sales signals
- source-backed risk / verify signals
- recent activity when found
- source list with timestamps

OSINT should support the existing seller sections:

- Contactability
- Company identity
- Company fit
- Market proof
- Sales signals
- Risk / verify
- Workflow

## Seller Fit Integration

After OSINT enrichment, refresh seller fit without mutating raw source truth.

Intent weighting examples:

- `general_b2b`: contactability, identity, location, public proof.
- `web_it`: digital presence and website risk.
- `ads_marketing`: Google presence, reviews, website/social presence.
- `telecom`: phone, size, locations, active business.
- `accounting`, `finance`, `insurance`: org.nr, company form, employees, verified identity.
- `recruiting`: employees, size, growth/activity.

## Success Criteria

- A seller can run OSINT enrichment on one selected lead.
- OSINT output is attached to that lead only.
- Every displayed OSINT signal has source context or is marked as unavailable.
- The UI separates evidence from risk/verify warnings.
- Seller fit can be refreshed from OSINT signals.
- Exports include OSINT summary fields without dumping noisy raw data.
- No sales scripts, outreach copy, email sending, telephony, private profile scraping, or personal dossiers are introduced.

## Verification

Add:

```bash
./verifications/verify-osint-enrichment.sh
```

The verifier should check:

- `core/osint/` syntax and smoke tests pass.
- OSINT output contains the six normalized groups.
- source entries include name, URL or reason unavailable, timestamp, and confidence.
- selected-lead enrichment attaches OSINT to one lead without rerunning broad discovery.
- seller fit can refresh from OSINT output.
- exports include OSINT summary fields.
- banned behaviors and text are absent: personal dossier, private profile scrape, CAPTCHA bypass, ready-to-send, call opener, auto-email.

## Later Phases

1. Saved OSINT snapshots per workspace.
2. Source freshness and stale-signal warnings.
3. Market context from SSB as territory intelligence.
4. Proff/economy enrichment only after confirmed org.nr.
5. Team review and lead ownership.
6. Compliance review before adding any new external source provider.
