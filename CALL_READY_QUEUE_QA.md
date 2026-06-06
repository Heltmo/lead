# Call Ready Queue QA

Generated: 2026-06-06T07:54:00.673Z

Scope: validate current call-ready queue behavior for representative beta searches after `Clarify call-ready queue rules`. This is QA only; no queue rules, seller-fit scoring, providers, or workflow behavior were changed.

## Boundaries

- No 1881 added.
- No Proff added.
- No SSB added.
- No scraping added.
- No seller-fit rule changes.
- No queue rule changes in this QA pass.
- No outreach automation or sales scripts.

## Expected Behavior

- Phone + exact location but no Brreg can be `Ring nå` with a warning.
- Brreg + phone but unclear searched location should be `Må verifiseres`.
- Broad Norway-style search with Brreg + phone + usable candidate city/address can be `Ring nå`.
- Brreg + phone but no usable location should be `Må verifiseres`.
- Wrong location should not be `Ring nå`.
- Weak vertical matches should not become `Ring nå` unless other evidence is strong enough.

## Run Setup

- Server: http://127.0.0.1:8788
- Provider: `google-places`
- Seller intent: `general_b2b`
- Mode: `fast`
- Company profile enrichment: enabled
- Location-specific searches: `strict`
- Broad Norway search: `regional`

## Summary Matrix

| Query | Scope | Candidates | Leads | Ring nå | Må verifiseres | Ikke relevant | Queue counts | Vertical matches | Location matches | Verdict |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| personlig trener i Kristiansand | strict | 3 | 1 | 0 | 1 | 0 | verify_first: 1 | broad: 1 | exact_location: 1 | pass |
| hudpleie i Halden | strict | 11 | 6 | 6 | 0 | 0 | call_now: 6 | broad: 1, synonym: 1, exact: 4 | exact_location: 6 | pass |
| frisør i Halden | strict | 18 | 16 | 14 | 1 | 0 | call_now: 14, verify_first: 1, archived: 1 | exact: 13, broad: 1, synonym: 2 | exact_location: 16 | pass |
| rørlegger i Kristiansand | strict | 9 | 3 | 2 | 1 | 0 | call_now: 2, verify_first: 1 | exact: 1, synonym: 2 | exact_location: 3 | pass |
| advokat i Gol | strict | 2 | 2 | 1 | 1 | 0 | verify_first: 1, call_now: 1 | exact: 2 | exact_location: 2 | pass |
| regnskapsfører | regional / sweep | 56 | 56 | 4 | 33 | 0 | archived: 19, verify_first: 33, call_now: 4 | synonym: 36, broad: 18, exact: 2 | unknown: 56 | pass |

## Findings By Search

### personlig trener i Kristiansand

- Parsed vertical: personlig trener
- Requested location: Kristiansand
- Search scope: strict
- Total candidates: 3
- Included leads: 1
- Ring nå: 0
- Må verifiseres: 1
- Ikke relevant: 0
- Broad/weak category matches: 1
- Exact location matches: 1
- Leads with phone but no Brreg: 0
- Leads with Brreg + phone but uncertain location: 0
- Leads with warnings/blockers: 1
- Expanded query count: 45
- Expansion sample: `personlig trener i Kristiansand`, `personlig trener Kristiansand`, `Kristiansand personlig trener`, `PT Kristiansand`, `PT i Kristiansand`, `Kristiansand PT`
- Correct placement examples: Trener1 (verify_first; exact_location; broad:gym)
- Questionable placement examples: none
- Verdict: pass

### hudpleie i Halden

- Parsed vertical: hudpleie
- Requested location: Halden
- Search scope: strict
- Total candidates: 11
- Included leads: 6
- Ring nå: 6
- Må verifiseres: 0
- Ikke relevant: 0
- Broad/weak category matches: 1
- Exact location matches: 6
- Leads with phone but no Brreg: 5
- Leads with Brreg + phone but uncertain location: 0
- Leads with warnings/blockers: 6
- Expanded query count: 69
- Expansion sample: `hudpleie i Halden`, `hudpleie Halden`, `Halden hudpleie`, `hudklinikk Halden`, `hudklinikk i Halden`, `Halden hudklinikk`
- Correct placement examples: Hud og Laserklinikken (call_now; exact_location; broad:beauty_salon); 7 små rom (call_now; exact_location; synonym:skin care); M.Skin hudpleiesalong (call_now; exact_location; exact:hudpleie); Unnis Hudpleie (call_now; exact_location; exact:hudpleie); Halden terapi og Hudpleiesenter (call_now; exact_location; exact:hudpleie)
- Questionable placement examples: none
- Verdict: pass

### frisør i Halden

- Parsed vertical: frisør
- Requested location: Halden
- Search scope: strict
- Total candidates: 18
- Included leads: 16
- Ring nå: 14
- Må verifiseres: 1
- Ikke relevant: 0
- Broad/weak category matches: 1
- Exact location matches: 16
- Leads with phone but no Brreg: 15
- Leads with Brreg + phone but uncertain location: 0
- Leads with warnings/blockers: 16
- Expanded query count: 24
- Expansion sample: `frisør i Halden`, `frisør Halden`, `Halden frisør`, `frisører Halden`, `frisører i Halden`, `Halden frisører`
- Correct placement examples: Halden Frisør (call_now; exact_location; exact:frisør); Borgergata Frisør (call_now; exact_location; exact:frisør); Golden barbershop (verify_first; exact_location; broad:hair_care); Snø frisør AS (call_now; exact_location; exact:frisør); Starcut Naser Mustafa (call_now; exact_location; synonym:hair salon)
- Questionable placement examples: none
- Verdict: pass

### rørlegger i Kristiansand

- Parsed vertical: rørlegger
- Requested location: Kristiansand
- Search scope: strict
- Total candidates: 9
- Included leads: 3
- Ring nå: 2
- Må verifiseres: 1
- Ikke relevant: 0
- Broad/weak category matches: 0
- Exact location matches: 3
- Leads with phone but no Brreg: 3
- Leads with Brreg + phone but uncertain location: 0
- Leads with warnings/blockers: 3
- Expanded query count: 30
- Expansion sample: `rørlegger i Kristiansand`, `rørlegger Kristiansand`, `Kristiansand rørlegger`, `rørleggere Kristiansand`, `rørleggere i Kristiansand`, `Kristiansand rørleggere`
- Correct placement examples: VB Johannessen VVS AS (call_now; exact_location; exact:vvs); GS agentur Geir Sundstøl (call_now; exact_location; synonym:plumber); Herr Andersen AS (verify_first; exact_location; synonym:plumber)
- Questionable placement examples: none
- Verdict: pass

### advokat i Gol

- Parsed vertical: advokat
- Requested location: Gol
- Search scope: strict
- Total candidates: 2
- Included leads: 2
- Ring nå: 1
- Må verifiseres: 1
- Ikke relevant: 0
- Broad/weak category matches: 0
- Exact location matches: 2
- Leads with phone but no Brreg: 2
- Leads with Brreg + phone but uncertain location: 0
- Leads with warnings/blockers: 2
- Expanded query count: 24
- Expansion sample: `advokat i Gol`, `advokat Gol`, `Gol advokat`, `advokater Gol`, `advokater i Gol`, `Gol advokater`
- Correct placement examples: Advokat Bergesen AS (verify_first; exact_location; exact:advokat); Scheibler Advokatfirma avd. Gol (call_now; exact_location; exact:advokat)
- Questionable placement examples: none
- Verdict: pass

### regnskapsfører

- Parsed vertical: regnskapsfører
- Requested location: none
- Search scope: regional / Norge-sweep
- Total candidates: 56
- Included leads: 56
- Ring nå: 4
- Må verifiseres: 33
- Ikke relevant: 0
- Broad/weak category matches: 18
- Exact location matches: 0
- Leads with phone but no Brreg: 52
- Leads with Brreg + phone but uncertain location: 4
- Leads with warnings/blockers: 56
- Expanded query count: 9
- Expansion sample: `regnskapsfører`, `regnskapsførere`, `regnskapsbyrå`, `regnskap`, `accountant`, `accountants`
- Correct placement examples: Johansson regnskap AS (verify_first; unknown; synonym:regnskap); Headwind Økonomi AS (verify_first; unknown; broad:accounting); Primo Services AS (verify_first; unknown; broad:accounting); Storetvedt Regnskapsbyrå AS (call_now; unknown; synonym:regnskapsbyrå); Birkenes regnskapskontor AS (verify_first; unknown; synonym:regnskap)
- Questionable placement examples: none
- Verdict: pass

## UI QA Notes

- Queue tabs expose `Ring nå`, `Må verifiseres`, `Ikke relevant`, and manual queue movement.
- Selected lead view shows next action, queue guidance, Proof & confidence, Proof & checks, company identity, and location status.
- Callable leads without confirmed org.nr surface `org_not_confirmed_but_callable` in queue-quality warnings and show the Brreg/identity state in the detail view.
- Verify-first leads expose blockers such as `candidate_org_number`, `contact_missing`, `location_needs_review`, and `source_fusion_verify_first`.
- Manual queue override remains supported; this QA did not mutate workflow state manually.

## Overall Verdict

Pass for current queue behavior. The sampled searches show the intended split: exact-location phone-ready leads can enter `Ring nå` even without confirmed Brreg, while candidate identity, missing contact, and location uncertainty hold leads in `Må verifiseres`. Broad Norway search remains stricter because many leads have unknown location confidence, but Brreg + phone + usable candidate address can still enter `Ring nå`.

## Follow-Up Watchlist

- `personlig trener i Kristiansand` returned only one included lead and it lacked phone, so queue behavior passed but supply should be watched in beta.
- Broad `regnskapsfører` produced many verify-first/archived leads due unknown location confidence and identity/contact uncertainty; this is acceptable for current rules but should be reviewed with testers.
- Current QA used live Google Places through the local beta server; exact counts may vary over time.
