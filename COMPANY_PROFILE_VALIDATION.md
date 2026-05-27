# COMPANY_PROFILE_VALIDATION

## Purpose

Validate whether `core/company-profile` safely matches discovered leads to official Brreg/Enhetsregisteret records before it is integrated into lead pack exports, review workspace, or CRM output.

This validation is intentionally conservative. The success target is not maximum match rate. The success target is:

```text
0 confident wrong org.nr matches
```

If a match is uncertain, `manual_verify`, `no_match`, or `error` is better than attaching the wrong organization number.

## Method

Ran the existing CLI against 10 known leads using name, city, website, phone, and address where available from generated run data.

Example command shape:

```bash
cd core/company-profile
npm run company-profile -- --name "Glomma Tannklinikk" --city "Fredrikstad"
```

Live source: Brønnøysundregistrene / Enhetsregisteret through `core/company-profile`.

## Summary

- total tested: 10
- exact/strong matches: 1
- weak matches: 0
- manual_verify: 4
- no_match: 3
- errors: 2
- suspected wrong or risky confident matches: 1

## Results

### Glomma Tannklinikk

- inputName: Glomma Tannklinikk
- inputCity: Fredrikstad
- inputWebsite: http://glommatannklinikk.no
- inputPhone: 69 16 90 90
- inputAddress: Glemmengata 8, 1608 Fredrikstad
- matchedLegalName: GLOMMA TANNKLINIKK AS
- organizationNumber: unknown
- organizationForm: Aksjeselskap
- municipality: FREDRIKSTAD
- naceCode: 86.230
- naceDescription: Tannlegetjenester
- employees: 9
- matchStatus: manual_verify
- matchConfidence: 1
- matchReasons: normalized_name_exact | city_match | address_overlap | domain_match | phone_match | multiple_plausible_matches
- warnings: alternative:GLOMMA TANNKLINIKK AS
- humanVerdict: needs_manual_verify
- notes: Candidate appears highly plausible and has exact name/address/domain/phone evidence, but module returned manual_verify because multiple plausible matches were detected. Safe behavior, but duplicate entity/subunit handling should be improved before integration.

### Advokatfirmaet Bjørnebekk og Martinsen AS

- inputName: Advokatfirmaet Bjørnebekk og Martinsen AS
- inputCity: Fredrikstad
- inputWebsite: http://www.advokat-bm.no
- inputPhone: 69 36 74 40
- inputAddress: Traraveien 7, 1605 Fredrikstad
- matchedLegalName: unknown
- organizationNumber: unknown
- organizationForm: unknown
- municipality: unknown
- naceCode: unknown
- naceDescription: unknown
- employees: unknown
- matchStatus: error
- matchConfidence: 0
- matchReasons: brreg_error
- warnings: fetch failed
- humanVerdict: uncertain
- notes: CLI returned error/fetch failed. No organization number attached. Re-run later before judging match quality.

### Arne Nilsen AS

- inputName: Arne Nilsen AS
- inputCity: Fredrikstad
- inputWebsite: https://www.vvseksperten.no/rorlegger/fredrikstad/arne-nilsen-as
- inputPhone: 69 31 02 03
- inputAddress: Gelertsens gate 7, 1608 Fredrikstad
- matchedLegalName: ARNE NILSEN AS
- organizationNumber: unknown
- organizationForm: Aksjeselskap
- municipality: FREDRIKSTAD
- naceCode: 43.221
- naceDescription: Rørleggerarbeid
- employees: 16
- matchStatus: manual_verify
- matchConfidence: 1
- matchReasons: normalized_name_exact | city_match | address_overlap | phone_match | multiple_plausible_matches
- warnings: chain_or_group_ambiguity | alternative:ARNE NILSEN AS
- humanVerdict: needs_manual_verify
- notes: Candidate appears plausible with exact name/address/phone evidence, but VVS Eksperten/chain context triggered ambiguity. Safe behavior; seller can verify manually.

### Drammen Sportsklinikk

- inputName: Drammen Sportsklinikk
- inputCity: Drammen
- inputWebsite: http://www.drammensportsklinikk.no
- inputPhone: 91 19 53 00
- inputAddress: Schwartz gate 6, 3043 Drammen
- matchedLegalName: DRAMMEN SPORTSKLINIKK AS
- organizationNumber: unknown
- organizationForm: Aksjeselskap
- municipality: DRAMMEN
- naceCode: 86.950
- naceDescription: Fysioterapi- og ergoterapitjenester
- employees: unknown
- matchStatus: manual_verify
- matchConfidence: 1
- matchReasons: normalized_name_exact | city_match | address_overlap | phone_match | multiple_plausible_matches
- warnings: alternative:DRAMMEN SPORTSKLINIKK AS
- humanVerdict: needs_manual_verify
- notes: Candidate appears plausible with exact name/address/phone evidence, but module returned manual_verify due multiple plausible matches. Safe behavior; duplicate handling should be improved.

### VB Engelsviken Rør

- inputName: VB Engelsviken Rør
- inputCity: Rolvsøy
- inputWebsite: https://www.engelsvikenror.no
- inputPhone: 69 36 77 77
- inputAddress: Seljeveien 3, 1661 Rolvsøy
- matchedLegalName: unknown
- organizationNumber: unknown
- organizationForm: unknown
- municipality: unknown
- naceCode: unknown
- naceDescription: unknown
- employees: unknown
- matchStatus: no_match
- matchConfidence: 0
- matchReasons: no_plausible_candidate
- warnings: none
- humanVerdict: needs_manual_verify
- notes: No match returned. Likely because public brand includes VB while legal name may differ. Needs better brand-prefix stripping and/or website/domain support.

### Odontia Varna Tannlegesenter

- inputName: Odontia Varna Tannlegesenter
- inputCity: Moss
- inputWebsite: https://odontia.no/tannlege/varna/?od=pb16
- inputPhone: 69 26 49 00
- inputAddress: Lilleeng Helsepark, Rosenvingesvei 8, 1523 Moss
- matchedLegalName: unknown
- organizationNumber: unknown
- organizationForm: unknown
- municipality: unknown
- naceCode: unknown
- naceDescription: unknown
- employees: unknown
- matchStatus: error
- matchConfidence: 0
- matchReasons: brreg_error
- warnings: fetch failed
- humanVerdict: uncertain
- notes: CLI returned error/fetch failed. This is a chain/clinic case and should remain manual verification even after a successful lookup unless match is very clear.

### Oris Dental Fredrikstad

- inputName: Oris Dental Fredrikstad
- inputCity: Fredrikstad
- inputWebsite: https://orisdental.no/klinikker/fredrikstad/
- inputPhone: 69 33 43 40
- inputAddress: Jens Wilhelmsens gate 1, 1671 Kråkerøy
- matchedLegalName: unknown
- organizationNumber: unknown
- organizationForm: unknown
- municipality: unknown
- naceCode: unknown
- naceDescription: unknown
- employees: unknown
- matchStatus: no_match
- matchConfidence: 0
- matchReasons: no_plausible_candidate
- warnings: none
- humanVerdict: needs_manual_verify
- notes: No match returned. Acceptable for chain/location case; should not attach org.nr without clearer parent/location matching.

### Advokatfirmaet Ytterbøl & Co

- inputName: Advokatfirmaet Ytterbøl & Co
- inputCity: Fredrikstad
- inputWebsite: https://ytterbol.com
- inputPhone: 69 36 60 00
- inputAddress: Nygaardsgata 55, 1607 Fredrikstad
- matchedLegalName: unknown
- organizationNumber: unknown
- organizationForm: unknown
- municipality: unknown
- naceCode: unknown
- naceDescription: unknown
- employees: unknown
- matchStatus: no_match
- matchConfidence: 0
- matchReasons: no_plausible_candidate
- warnings: none
- humanVerdict: needs_manual_verify
- notes: No match returned. Name contains special characters/company style and may require better normalization or alternate query terms.

### Flow Tannhelse

- inputName: Flow Tannhelse
- inputCity: Fredrikstad
- inputWebsite: https://www.flowtannhelse.no/tannlege-Fredrikstad
- inputPhone: 69 16 75 00
- inputAddress: Dampskipsbrygga 10, 1607 Fredrikstad
- matchedLegalName: FLOW TANNHELSE AS
- organizationNumber: 926112104
- organizationForm: Aksjeselskap
- municipality: SARPSBORG
- naceCode: 86.230
- naceDescription: Tannlegetjenester
- employees: 6
- matchStatus: strong_match
- matchConfidence: 0.82
- matchReasons: normalized_name_exact
- warnings: none
- humanVerdict: needs_manual_verify
- notes: Module returned strong_match and attached org.nr, but registered address is Sarpsborg while input lead is Fredrikstad and matchReasons only show normalized_name_exact. This is risky and should be treated as suspected overconfident until matching requires city/address/domain/phone support for strong matches.

### Oasen Tannklinikk

- inputName: Oasen Tannklinikk
- inputCity: Fredrikstad
- inputWebsite: https://www.oasentannklinikk.no
- inputPhone: 69 31 64 40
- inputAddress: St Croix Helsehus, Hans Jacob Nilsens gate 7, 1606 Fredrikstad
- matchedLegalName: OASEN TANNKLINIKK AS
- organizationNumber: unknown
- organizationForm: Aksjeselskap
- municipality: FREDRIKSTAD
- naceCode: 86.230
- naceDescription: Tannlegetjenester
- employees: 6
- matchStatus: manual_verify
- matchConfidence: 1
- matchReasons: normalized_name_exact | city_match | address_overlap | multiple_plausible_matches
- warnings: alternative:OASEN TANNKLINIKK AS
- humanVerdict: needs_manual_verify
- notes: Candidate appears highly plausible with exact name/address evidence, but module returned manual_verify due multiple plausible matches. Safe behavior; duplicate handling should be improved.

## Findings

- The module is conservative enough to avoid attaching org.nr in most ambiguous cases.
- Several highly plausible candidates returned `manual_verify` because the API produced multiple plausible matches, often with the same legal name as an alternative. This is safe, but too conservative for clean exact cases.
- `Flow Tannhelse` is the main risk: it returned `strong_match` and attached org.nr with only `normalized_name_exact` as the match reason, while the registered address is Sarpsborg and the discovered lead is Fredrikstad. This may still be the correct legal entity, but it should not be auto-attached without supporting city/address/domain/phone evidence.
- Chain/location brands such as Odontia, Oris Dental, VB, and possibly branch-style law firm names remain hard cases. This is expected and should stay manual until matching logic is stronger.
- Transient `fetch failed` errors occurred in live CLI use. The module returns `error` without crashing, which is correct for V1.

## Success Criteria Check

- 0 confident wrong org.nr matches: not fully proven. No confirmed wrong org.nr was found, but Flow Tannhelse is a risky confident match and should be treated as a blocker for automatic integration.
- Chain/group/branch cases prefer manual_verify unless clearly matched: mostly yes. Oris/VB returned no_match, Odontia errored, and no org.nr was attached.
- Strong matches explainable with matchReasons: partially. Flow's `normalized_name_exact` reason alone is not enough for safe auto-attachment.
- no_match acceptable when uncertain: yes.

## Recommendations

- Keep `core/company-profile` standalone for now. Do not integrate organization numbers into lead pack exports automatically yet.
- Before integration, require a strong match to include at least one supporting signal beyond normalized name: city, address, phone, or domain.
- Improve duplicate handling so exact entity/subunit duplicates with the same legal name do not force `manual_verify` unnecessarily when org/address/phone/domain all agree.
- Add brand-prefix and network handling for cases like `VB Engelsviken Rør`, while still preserving manual verification for chain/network ambiguity.
- Add retry/backoff or partial endpoint tolerance for transient Brreg `fetch failed` errors.
- Re-run validation after matching changes before wiring company-profile into review workspace, CRM export, or lead packs.

## Integration Decision

Current status: not ready for automatic lead pack export integration.

Safe current use:

- standalone lookup
- manual enrichment support
- validation worksheet input
- seller-side manual verification context

Unsafe current use:

- automatically writing org.nr into seller-ready exports
- treating `strong_match` as final without reviewing matchReasons/warnings
- auto-attaching chain, branch, or location entities
