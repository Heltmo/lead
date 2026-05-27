# Unseen Batch Validation

## Purpose

Validate whether post-calibration HIGH/Medium/Low/Verify behavior generalizes to new leads outside the original 23-lead calibration batch. No scoring, compressor, signal, provider, or architecture changes were made for this validation run.

## Distribution Summary

| Batch | Run ID | Candidates | Reachable | Unreachable | Audited | Audit failures | High | Medium | Low | Verify | Workspace |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| tannleger i Moss | unseen-tannleger-moss-5-20260526 | 5 | 5 | 0 | 5 | 0 | 1 | 2 | 2 | 0 | core/orchestrator/runs/unseen-tannleger-moss-5-20260526/review-workspace/index.html |
| elektrikere i Sarpsborg | unseen-elektrikere-sarpsborg-5-20260526 | 5 | 4 | 1 | 4 | 0 | 0 | 3 | 1 | 0 | core/orchestrator/runs/unseen-elektrikere-sarpsborg-5-20260526/review-workspace/index.html |
| rørleggere i Fredrikstad | unseen-rorleggere-fredrikstad-5-20260526 | 5 | 4 | 1 | 4 | 0 | 0 | 4 | 0 | 0 | core/orchestrator/runs/unseen-rorleggere-fredrikstad-5-20260526/review-workspace/index.html |
| fysioterapeuter i Drammen | unseen-fysioterapeuter-drammen-5-20260526 | 5 | 5 | 0 | 5 | 0 | 0 | 2 | 3 | 0 | core/orchestrator/runs/unseen-fysioterapeuter-drammen-5-20260526/review-workspace/index.html |
| regnskapsførere i Moss | unseen-regnskapsforere-moss-5-20260526 | 5 | 4 | 1 | 4 | 0 | 0 | 4 | 0 | 0 | core/orchestrator/runs/unseen-regnskapsforere-moss-5-20260526/review-workspace/index.html |
| **Total** |  | **25** | **22** | **3** | **22** | **0** | **1** | **15** | **6** | **0** |  |

## Human Review Focus

We should manually review the only HIGH lead and the top 5 MEDIUM leads before tuning anything else.

Current unseen distribution:

```text
High: 1
Medium: 15
Low: 6
Verify: 0
```

This suggests HIGH is now very strict. The next question is whether top MEDIUM leads contain false negatives.

For the HIGH lead:

- KEEP means it is truly call-worthy.
- DEMOTE means it should be MEDIUM.
- VERIFY means manual check required.

For MEDIUM leads:

- PROMOTE means it should have been HIGH.
- OK means correctly MEDIUM.
- DEMOTE means too generous.

### Focus Set

### Odontia Varna Tannlegesenter

- Batch / vertical: tannleger i Moss / dentist
- URL: https://odontia.no/tannlege/varna/?od=pb16
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.85
- buyingLikelihood: 0.94
- salesEase: high
- commercialPressureReasons: strong_existing_conversion_flow | visible_technical_trust_pain | many_failed_requests | console_errors | accessibility_usability_pain | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Serious accessibility issues detected | Failed network requests detected | Console errors detected
- contact/CTA profile summary: visible=true, strong=true, methods=phone | email | form | contact_link | booking_link | emergency_call, terms=akutt time | booking | bestill time | timebestilling, type=emergency_call, confidence=0.88

Human decision: DEMOTE / VERIFY
Human reason: Mature/chain-like dental clinic with visible booking/contact paths, specialist/clinic structure, and low obvious Webconsult pain. Not enough evidence from public review to justify clear HIGH unless workspace shows severe technical_trust_risk.
Correct angle: Manual fit verification or campaign/service-line optimization, not direct conversion cleanup.
Rule adjustment needed: Chain/mature dental clinics with visible booking/contact should not become HIGH unless technical_trust_risk is severe.

### Drammen Sportsklinikk

- Batch / vertical: fysioterapeuter i Drammen / physiotherapist
- URL: http://www.drammensportsklinikk.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.76
- buyingLikelihood: 0.88
- salesEase: high
- commercialPressureReasons: polished_or_vendor_built_site | strong_existing_conversion_flow | visible_technical_trust_pain | many_failed_requests | console_errors | accessibility_usability_pain | search_clarity_issue | callable_phone_available
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Expected exactly one h1, found 2 | Serious accessibility issues detected | Failed network requests detected
- contact/CTA profile summary: visible=true, strong=true, methods=phone | email | contact_link | booking_link, terms=bestill time | bestill | kontakt oss | kontakt, type=booking, confidence=0.88

Human decision: OK
Human reason: Strong clinic vertical with high-value services, but booking/contact path is already clear. Opportunity exists, but not enough pain for HIGH.
Correct angle: Treatment/service-line campaign optimization or patient journey refinement.
Rule adjustment needed: None. Keep MEDIUM.

### Regnskapssentralen AS

- Batch / vertical: regnskapsførere i Moss / accountant
- URL: http://rsmoss.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.75
- buyingLikelihood: 0.82
- salesEase: high
- commercialPressureReasons: strong_existing_conversion_flow | visible_technical_trust_pain | many_failed_requests | accessibility_usability_pain | search_clarity_issue | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Expected exactly one h1, found 0 | Serious accessibility issues detected | Failed network requests detected
- contact/CTA profile summary: visible=true, strong=true, methods=phone | email | form | contact_link, terms=kontakt oss | kontakt | epost | mail, type=general_contact, confidence=0.88

Human decision: OK / DEMOTE
Human reason: Established accounting firm with visible service structure and contact path. Opportunity may exist, but pain and buying urgency are not strong.
Correct angle: Service positioning / client enquiry clarity, not urgent conversion cleanup.
Rule adjustment needed: Accounting firms with visible contact and broad service structure should usually stay MEDIUM/LOW unless technical_trust_risk is severe.

### VB Engelsviken Rør

- Batch / vertical: rørleggere i Fredrikstad / plumber
- URL: https://www.engelsvikenror.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.68
- buyingLikelihood: 0.84
- salesEase: medium
- commercialPressureReasons: strong_existing_conversion_flow | contact_maturity_requires_stronger_technical_pain | visible_technical_trust_pain | many_failed_requests | accessibility_usability_pain | search_clarity_issue | callable_phone_available | email_available
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | Serious accessibility issues detected | Failed network requests detected
- contact/CTA profile summary: visible=true, strong=true, methods=phone | email | contact_link | emergency_call, terms=vakttelefon | kontakt oss | kontakt | telefon, type=emergency_call, confidence=0.88

Human decision: OK
Human reason: Strong local service vertical, but mature VB/network structure and clear contact paths reduce urgency. Good shortlist lead, not call-first.
Correct angle: Service-line/campaign optimization for bad, varme, varmepumpe or local service enquiries.
Rule adjustment needed: None if kept MEDIUM. VB/network affiliation should prevent easy HIGH unless severe technical pain exists.

### Arne Nilsen AS

- Batch / vertical: rørleggere i Fredrikstad / plumber
- URL: https://www.vvseksperten.no/rorlegger/fredrikstad/arne-nilsen-as
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.65
- buyingLikelihood: 0.84
- salesEase: medium
- commercialPressureReasons: strong_existing_conversion_flow | contact_maturity_requires_stronger_technical_pain | visible_technical_trust_pain | many_failed_requests | accessibility_usability_pain | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Serious accessibility issues detected | Failed network requests detected | Elevated full page load time
- contact/CTA profile summary: visible=true, strong=true, methods=phone | email | contact_link | booking_link | quote_request | emergency_call, terms=vakttelefon | avtal befaring | bestill | kontakt, type=emergency_call, confidence=0.88

Human decision: OK / possible PROMOTE-borderline
Human reason: Very good vertical and strong high-value services, but contact paths and trust markers are already strong. MEDIUM is right unless technical pain is severe.
Correct angle: Service-line campaign optimization for bad/varme/rehabilitering, or technical trust cleanup if audit evidence is strong.
Rule adjustment needed: If technical pain is severe, allow PROMOTE. Otherwise keep high-value plumber with strong contact maturity as MEDIUM.

### Regnskapsførern AS

- Batch / vertical: regnskapsførere i Moss / accountant
- URL: https://regnskapsforern.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.69
- buyingLikelihood: 0.74
- salesEase: medium
- commercialPressureReasons: strong_existing_conversion_flow | visible_technical_trust_pain | failed_requests | console_errors | search_clarity_issue | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | Expected exactly one h1, found 2 | No social links detected
- contact/CTA profile summary: visible=true, strong=true, methods=phone | email | form | contact_link, terms=kontakt oss | kontakt | mail | 104 1599, type=general_contact, confidence=0.88

Human decision: OK
Human reason: Simpler accounting site with visible contact and services. Possible modernization/client-enquiry opportunity, but not call-first.
Correct angle: Trust modernization and client enquiry clarity.
Rule adjustment needed: None. Keep MEDIUM.

## Human Review Outcome

The unseen validation does not show many obvious false negatives in MEDIUM. The main issue is that the single HIGH lead, Odontia Varna, may not be clearly call-worthy because it appears mature/chain-like with visible booking/contact paths. Before outreach pilot, either verify Odontia manually or add a small rule: mature/chain dental clinics with visible booking/contact should not become HIGH unless technical_trust_risk is severe.

## HIGH Leads

### Odontia Varna Tannlegesenter

- Batch / vertical: tannleger i Moss / dentist
- URL: https://odontia.no/tannlege/varna/?od=pb16
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.85
- buyingLikelihood: 0.94
- salesEase: high
- commercialPressureReasons: strong_existing_conversion_flow | visible_technical_trust_pain | many_failed_requests | console_errors | accessibility_usability_pain | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Serious accessibility issues detected | Failed network requests detected | Console errors detected
- contact/CTA profile summary:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | form | contact_link | booking_link | emergency_call
  - ctaTerms: akutt time | booking | bestill time | timebestilling
  - verticalCtaType: emergency_call
  - confidence: 0.88
- noCtaSuppressed: false
- auditStatus: completed
- rating/reviews: 4.8 / 101
- phone/email: 69 26 49 00 | 00 69 26 49 00 | 004769264900 / varna@odontia.no

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

## Top MEDIUM Leads

### tannleger i Moss

### Kransen Tannlegesenter

- Batch / vertical: tannleger i Moss / dentist
- URL: https://kransentannlegesenter.no/?utm_source=google&utm_medium=organic&utm_campaign=gbp-website&utm_content=kransentannlegesenter
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- painScore: 0.34
- buyingLikelihood: 0.65
- salesEase: low
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Expected exactly one h1, found 0 | Serious accessibility issues detected | Failed network requests detected
- contactProfile summary: visible=true, strong=true, methods=phone | email | contact_link | booking_link, type=booking
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### OC Tannlegene Klette og Race

- Batch / vertical: tannleger i Moss / dentist
- URL: https://www.octannklinikker.no/klinikker/oc-tannlegene-klette-og-race
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- painScore: 0.27
- buyingLikelihood: 0.61
- salesEase: low
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Missing meta description | Serious accessibility issues detected | Images missing explicit dimensions
- contactProfile summary: visible=true, strong=true, methods=phone | email | form | contact_link | booking_link, type=table_booking
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### elektrikere i Sarpsborg

### Storm Elektro AS

- Batch / vertical: elektrikere i Sarpsborg / electrician
- URL: http://www.stormelektro.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- painScore: 0.68
- buyingLikelihood: 0.72
- salesEase: medium
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | Expected exactly one h1, found 4 | Serious accessibility issues detected
- contactProfile summary: visible=true, strong=true, methods=phone | form | contact_link | quote_request, type=quote_request
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### El-tjenesten AS

- Batch / vertical: elektrikere i Sarpsborg / electrician
- URL: http://www.el-tjenesten.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- painScore: 0.47
- buyingLikelihood: 0.72
- salesEase: medium
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Serious accessibility issues detected | No social links detected | No recognized technology stack detected
- contactProfile summary: visible=true, strong=true, methods=phone | contact_link, type=general_contact
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### rørleggere i Fredrikstad

### VB Engelsviken Rør

- Batch / vertical: rørleggere i Fredrikstad / plumber
- URL: https://www.engelsvikenror.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- painScore: 0.68
- buyingLikelihood: 0.84
- salesEase: medium
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | Serious accessibility issues detected | Failed network requests detected
- contactProfile summary: visible=true, strong=true, methods=phone | email | contact_link | emergency_call, type=emergency_call
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Arne Nilsen AS

- Batch / vertical: rørleggere i Fredrikstad / plumber
- URL: https://www.vvseksperten.no/rorlegger/fredrikstad/arne-nilsen-as
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- painScore: 0.65
- buyingLikelihood: 0.84
- salesEase: medium
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Serious accessibility issues detected | Failed network requests detected | Elevated full page load time
- contactProfile summary: visible=true, strong=true, methods=phone | email | contact_link | booking_link | quote_request | emergency_call, type=emergency_call
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### fysioterapeuter i Drammen

### Drammen Sportsklinikk

- Batch / vertical: fysioterapeuter i Drammen / physiotherapist
- URL: http://www.drammensportsklinikk.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- painScore: 0.76
- buyingLikelihood: 0.88
- salesEase: high
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Expected exactly one h1, found 2 | Serious accessibility issues detected | Failed network requests detected
- contactProfile summary: visible=true, strong=true, methods=phone | email | contact_link | booking_link, type=booking
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Tollbugata Fysioterapi DA

- Batch / vertical: fysioterapeuter i Drammen / physiotherapist
- URL: http://www.tollbugatafysioterapi.com
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- painScore: 0.47
- buyingLikelihood: 0.64
- salesEase: medium
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | No social links detected | Failed network requests detected
- contactProfile summary: visible=true, strong=true, methods=phone | contact_link | booking_link, type=booking
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### regnskapsførere i Moss

### Regnskapssentralen AS

- Batch / vertical: regnskapsførere i Moss / accountant
- URL: http://rsmoss.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- painScore: 0.75
- buyingLikelihood: 0.82
- salesEase: high
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Expected exactly one h1, found 0 | Serious accessibility issues detected | Failed network requests detected
- contactProfile summary: visible=true, strong=true, methods=phone | email | form | contact_link, type=general_contact
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Regnskapsførern AS

- Batch / vertical: regnskapsførere i Moss / accountant
- URL: https://regnskapsforern.no
- callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- painScore: 0.69
- buyingLikelihood: 0.74
- salesEase: medium
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | Expected exactly one h1, found 2 | No social links detected
- contactProfile summary: visible=true, strong=true, methods=phone | email | form | contact_link, type=general_contact
- noCtaSuppressed: false

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

## LOW / VERIFY Summary

### tannleger i Moss

- Tannfeen | dentist | https://tannfeen.no/moss | low | modern_site_campaign_optimization | reasons: polished_or_vendor_built_site | strong_existing_conversion_flow | mature_local_brand | modern_site_lower_immediate_pain | many_failed_requests | accessibility_usability_pain | callable_phone_available | email_available
- Kambo Tannklinikk | dentist | http://www.kambotannklinikk.no | low | modern_site_campaign_optimization | reasons: polished_or_vendor_built_site | strong_existing_conversion_flow | modern_site_lower_immediate_pain | failed_requests | accessibility_usability_pain | search_clarity_issue | callable_phone_available | email_available

### elektrikere i Sarpsborg

- Sarpsborg Elinstallasjon AS | electrician | https://www.sarpsborgel.no | low | high_value_service_conversion_gap | reasons: strong_existing_conversion_flow | clear_contact_path_reduces_cta_pain | no_obvious_primary_pain | high_value_service_conversion_leak | accessibility_usability_pain | callable_phone_available | direct_business_site | operational_business

### rørleggere i Fredrikstad

No LOW or VERIFY leads in this batch.

### fysioterapeuter i Drammen

- Trimmen Fysioterapi | physiotherapist | http://trimmen.no | low | local_seo_consistency_gap | reasons: strong_existing_conversion_flow | accessibility_usability_pain | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
- Drammen fysioterapi AS | physiotherapist | https://drammenfysioterapi.no | low | high_value_service_conversion_gap | reasons: strong_existing_conversion_flow | clear_contact_path_reduces_cta_pain | high_value_service_conversion_leak | failed_requests | accessibility_usability_pain | callable_phone_available | email_available | direct_business_site
- Strømsø Fysikalske Institutt DA | physiotherapist | http://stromsofysikalske.no | low | high_value_service_conversion_gap | reasons: strong_existing_conversion_flow | clear_contact_path_reduces_cta_pain | no_obvious_primary_pain | high_value_service_conversion_leak | accessibility_usability_pain | callable_phone_available | direct_business_site | operational_business

### regnskapsførere i Moss

No LOW or VERIFY leads in this batch.


## Mature Chain Clinic Suppression Result

A targeted commercial-pressure fix was applied after human review showed the only unseen HIGH lead, Odontia Varna Tannlegesenter, was mature/chain-like with visible booking/contact paths and not clearly call-worthy.

Before this fix on the unseen batch:

```text
High: 1
Medium: 15
Low: 6
Verify: 0
```

After this fix on the unseen batch:

```text
High: 0
Medium: 14
Low: 8
Verify: 0
```

Key outcome:

- Odontia Varna Tannlegesenter changed from HIGH to MEDIUM.
- No unseen lead is forced into HIGH just to create a call-first candidate.
- Top MEDIUM remains the shortlist layer for human review.

Interpretation:

The unseen batch does not currently contain an obvious call-first lead. That is acceptable: HIGH should mean clearly callable, not merely best available in a batch.

## Validation Questions

1. Does HIGH feel truly callable?
2. Are any obvious A-leads stuck in MEDIUM or LOW?
3. Does the system correctly avoid over-scoring polished/mature businesses?
4. Are CTA/contact paths correctly recognized?
5. Are vertical-specific terms correct?
6. Does top MEDIUM provide useful shortlist volume?

## Notes

- This is a validation worksheet only. Do not tune rules from this file until human review is complete.
- Generated run artifacts are under `core/orchestrator/runs/unseen-*-20260526/`.
- Discovery artifacts are under `core/lead-discovery-agent/reports/validation/`.
