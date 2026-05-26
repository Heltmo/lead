# Post CTA Fix HIGH Review

## Purpose

This file is for manual review after CTA/contact-path detection was improved in `d781605 Improve vertical CTA contact detection`.

Goal: determine whether `HIGH` now means callable.

Success criteria:

- 6-7 of 8 HIGH = ready for first outreach pilot
- 4-5 of 8 HIGH = usable but needs one more tuning pass
- 0-3 of 8 HIGH = commercial-pressure still too generous

## Distribution

```text
High: 8
Medium: 7
Low: 7
Verify: 1
```

## HIGH Leads For Manual Review

### Glomma Tannklinikk

- Batch / vertical: Dentists Fredrikstad / dentist
- URL: http://glommatannklinikk.no
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 1
- buyingLikelihood: 1
- salesEase: high
- commercialPressureReasons: visible_technical_trust_pain | many_failed_requests | console_errors | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Expected exactly one h1, found 2 | Serious accessibility issues detected | Failed network requests detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link | booking_link | emergency_call
  - ctaTerms: tannlegevakt | bestill time | bestill | konsultasjon
  - verticalCtaType: emergency_call
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.8
- reviews: 55
- phone: 69 16 90 90
- email: post@glommatannklinikk.no

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

### Advokatfirmaet Bjørnebekk og Martinsen AS

- Batch / vertical: Lawyers Fredrikstad / lawyer
- URL: http://www.advokat-bm.no
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.97
- buyingLikelihood: 0.86
- salesEase: high
- commercialPressureReasons: visible_technical_trust_pain | failed_requests | console_errors | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Expected exactly one h1, found 2 | Serious accessibility issues detected | No social links detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link
  - ctaTerms: kontakt oss | kontakt | mail | 69 36 74 40
  - verticalCtaType: general_contact
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.2
- reviews: 20
- phone: 69 36 74 40
- email: tore@advokat-bm.no

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

### Moss Elektro AS

- Batch / vertical: Electricians Moss / electrician
- URL: https://www.mosselektro.no
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 1
- buyingLikelihood: 0.94
- salesEase: high
- commercialPressureReasons: visible_technical_trust_pain | failed_requests | console_errors | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Serious accessibility issues detected | No social links detected | Failed network requests detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link | booking_link
  - ctaTerms: bestill | kontakt oss | kontakt | ring oss
  - verticalCtaType: booking
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.8
- reviews: 40
- phone: 69 23 34 00
- email: mosselektro@mosselektro.no

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

### Storm Elektro Moss AS

- Batch / vertical: Electricians Moss / electrician
- URL: http://www.stormelektro.no
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 1
- buyingLikelihood: 0.9
- salesEase: high
- commercialPressureReasons: visible_technical_trust_pain | failed_requests | console_errors | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | Expected exactly one h1, found 4 | Serious accessibility issues detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | contact_link | quote_request
  - ctaTerms: uforpliktende prat | kontakt | ta kontakt | 69 21 09 90
  - verticalCtaType: quote_request
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 5
- reviews: 8
- phone: 69 21 09 90
- email: unknown

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

### Sentrum Rør AS

- Batch / vertical: Plumbers Moss / plumber
- URL: https://www.sentrum-ror.no
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 1
- buyingLikelihood: 0.94
- salesEase: high
- commercialPressureReasons: visible_technical_trust_pain | failed_requests | console_errors | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Serious accessibility issues detected | Failed network requests detected | Console errors detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link | booking_link | quote_request
  - ctaTerms: be om pristilbud | bestill | kontakt oss | kontakt
  - verticalCtaType: quote_request
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.7
- reviews: 12
- phone: 69 20 51 90
- email: sentrumror@nsn.no

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

### Moss Rørleggerservice

- Batch / vertical: Plumbers Moss / plumber
- URL: https://www.mossrorlegger.no
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 1
- buyingLikelihood: 1
- salesEase: high
- commercialPressureReasons: visible_technical_trust_pain | many_failed_requests | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | Serious accessibility issues detected | Failed network requests detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email
  - ctaTerms: 69 25 42 90 | post@mrl.no
  - verticalCtaType: none
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.6
- reviews: 26
- phone: 69 25 42 90
- email: post@mrl.no

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

### Skutebrygga

- Batch / vertical: Restaurants Drammen / restaurant
- URL: https://skutebrygga.no
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.89
- buyingLikelihood: 0.88
- salesEase: high
- commercialPressureReasons: visible_technical_trust_pain | many_failed_requests | console_errors | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Expected exactly one h1, found 0 | Failed network requests detected | Console errors detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link | booking_link
  - ctaTerms: bestill bord | booking | bestill | kontakt oss
  - verticalCtaType: table_booking
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.2
- reviews: 1078
- phone: 32 83 33 30
- email: post@skutebrygga.no

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

### Alpenhaus Drammen

- Batch / vertical: Restaurants Drammen / restaurant
- URL: https://www.alpenhaus.no
- callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.76
- buyingLikelihood: 0.76
- salesEase: high
- commercialPressureReasons: visible_technical_trust_pain | failed_requests | console_errors | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | direct_business_site
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- topEvidence: Missing meta description | Expected exactly one h1, found 0 | No email or phone detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | contact_link | booking_link
  - ctaTerms: bordbestilling | bestill bord | bestill | kontakt oss
  - verticalCtaType: table_booking
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.6
- reviews: 327
- phone: 48 03 33 88
- email: unknown

Human decision: KEEP / DEMOTE / VERIFY
Human reason:
Correct angle:
Rule adjustment needed:

## MEDIUM Leads For False-Negative Review

### Fredrikstad Tannhelse

- Batch / vertical: Dentists Fredrikstad / dentist
- URL: https://fredrikstadtannhelse.no
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- outreachMotion: service_line_growth
- painScore: 0.66
- buyingLikelihood: 0.8
- salesEase: medium
- commercialPressureReasons: high_value_service_conversion_leak | console_errors | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | email_available | direct_business_site | operational_business
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Serious accessibility issues detected | Failed network requests detected | Console errors detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link | booking_link
  - ctaTerms: bestill time | timebestilling | bestill | nye pasienter
  - verticalCtaType: booking
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.6
- reviews: 36
- phone: 40 63 22 13
- email: post@fredrikstadtannhelse.no

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Advokatene i Lykkeberg

- Batch / vertical: Lawyers Fredrikstad / lawyer
- URL: https://www.lykkeberg.no
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- outreachMotion: service_line_growth
- painScore: 0.36
- buyingLikelihood: 0.63
- salesEase: low
- commercialPressureReasons: high_value_service_conversion_leak | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | email_available | direct_business_site | operational_business | clear_contact_path_reduces_cta_pain
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Serious accessibility issues detected | No social links detected | Elevated full page load time
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link
  - ctaTerms: kontakt oss | kontakt | ring oss | mail
  - verticalCtaType: general_contact
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.4
- reviews: 37
- phone: 69 36 73 00
- email: advokatene@lykkeberg.no

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Advokatfirmaet Hohmann AS

- Batch / vertical: Lawyers Fredrikstad / lawyer
- URL: https://hohmann.no
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- outreachMotion: service_line_growth
- painScore: 0.39
- buyingLikelihood: 0.63
- salesEase: low
- commercialPressureReasons: high_value_service_conversion_leak | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Missing meta description | Serious accessibility issues detected | Elevated page transfer size
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link
  - ctaTerms: send e-post | kontakt oss | kontakt | ring oss
  - verticalCtaType: client_intake
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 5
- reviews: 4
- phone: 92 25 62 32
- email: petter@hohmann.no

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Advokatfirmaet Ytterbøl & Co Fredrikstad

- Batch / vertical: Lawyers Fredrikstad / lawyer
- URL: https://ytterbol.com
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- outreachMotion: service_line_growth
- painScore: 0.44
- buyingLikelihood: 0.63
- salesEase: low
- commercialPressureReasons: high_value_service_conversion_leak | console_errors | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | email_available | direct_business_site | operational_business
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Serious accessibility issues detected | No recognized technology stack detected | Failed network requests detected
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link
  - ctaTerms: vi ringer deg | kontakt | e-post | mail
  - verticalCtaType: client_intake
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.2
- reviews: 18
- phone: 69 36 60 00
- email: kontakt@ytterbol.com

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Rasjonell Elektro AS

- Batch / vertical: Electricians Moss / electrician
- URL: http://www.rasjonell-elektro.no
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- outreachMotion: service_line_growth
- painScore: 0.61
- buyingLikelihood: 0.8
- salesEase: medium
- commercialPressureReasons: high_value_service_conversion_leak | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Missing meta description | Serious accessibility issues detected | Images missing explicit dimensions
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link
  - ctaTerms: kontakt oss | kontakt | mail | hva kan vi hjelpe deg med
  - verticalCtaType: general_contact
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.9
- reviews: 7
- phone: 69 23 69 00
- email: post@rasjonell-elektro.no

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Moss Bad og Varme AS

- Batch / vertical: Plumbers Moss / plumber
- URL: http://www.mossbadogvarme.no
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- outreachMotion: service_line_growth
- painScore: 0.58
- buyingLikelihood: 0.8
- salesEase: medium
- commercialPressureReasons: high_value_service_conversion_leak | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | email_available | direct_business_site | operational_business | clear_contact_path_reduces_cta_pain
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Serious accessibility issues detected | No social links detected | Elevated full page load time
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | email | contact_link | emergency_call
  - ctaTerms: rørleggervakt | send e-post | kontakt oss | kontakt
  - verticalCtaType: emergency_call
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 5
- reviews: 40
- phone: 46 78 47 30
- email: post@mossbad.no

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

### Rygge Rørleggerservice

- Batch / vertical: Plumbers Moss / plumber
- URL: https://ryggeror.no
- callPriority: medium
- opportunityType: high_value_service_conversion_gap
- leadClass: high_value_service_conversion
- recommendedOffer: High-value service booking/enquiry path optimization
- outreachMotion: service_line_growth
- painScore: 0.68
- buyingLikelihood: 0.76
- salesEase: medium
- commercialPressureReasons: high_value_service_conversion_leak | failed_requests | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | direct_business_site | operational_business | clear_contact_path_reduces_cta_pain
- primaryOpportunity: High-value services are visible, but visitor intent is not guided clearly enough into booking or enquiry.
- topEvidence: Serious accessibility issues detected | Failed network requests detected | Images missing explicit dimensions
- contactProfile:
  - hasVisibleContactPath: true
  - hasStrongPrimaryCta: true
  - contactMethods: phone | contact_link | booking_link | emergency_call
  - ctaTerms: døgnvakt | dognvakt | bestill | kontakt oss
  - verticalCtaType: emergency_call
  - confidence: 0.88
- noCtaSuppressed: true
- auditStatus: completed
- rating: 4.2
- reviews: 46
- phone: 69 26 80 00
- email: unknown

Human decision: OK / PROMOTE / DEMOTE
Human reason:
Rule adjustment needed:

## LOW / VERIFY Summary

### LOW

- Flow Tannhelse | Dentists Fredrikstad | https://www.flowtannhelse.no/tannlege-Fredrikstad | low | modern_site_campaign_optimization | reasons: modern_site_lower_immediate_pain | many_failed_requests | accessibility_usability_pain | callable_phone_available | email_available | direct_business_site | operational_business | strong_local_proof
- Oasen Tannklinikk | Dentists Fredrikstad | https://www.oasentannklinikk.no | low | modern_site_campaign_optimization | reasons: modern_site_lower_immediate_pain | many_failed_requests | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | email_available | direct_business_site | operational_business
- Advokathuset Fredrikstad | Lawyers Fredrikstad | https://advokathusetfredrikstad.no | low | local_seo_consistency_gap | reasons: console_errors | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | direct_business_site | operational_business
- Storm VVS Rørlegger Moss | Plumbers Moss | http://www.stormvvs.no | low | local_seo_consistency_gap | reasons: accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
- Café Bragernes | Restaurants Drammen | http://www.cafebragernes.no | low | trust_to_conversion_gap | reasons: conversion_path_friction | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
- Anchas Bodega | Restaurants Drammen | http://www.anchasbodega.no | low | trust_to_conversion_gap | reasons: conversion_path_friction | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
- Vertshuset Oscar & Stallen Drammen | Restaurants Drammen | http://vertshusetdrammen.no | low | high_value_service_conversion_gap | reasons: high_value_service_conversion_leak | failed_requests | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site
### VERIFY

- Oris Dental Fredrikstad | Dentists Fredrikstad | https://orisdental.no/klinikker/fredrikstad/?utm_source=gulesider&utm_medium=referral&utm_campaign=&utm_term=klinikkside | verify | trust_to_conversion_gap | reasons: audit_failed_verify_manually | conversion_path_friction | callable_phone_available | direct_business_site | operational_business | strong_local_proof | mature_local_brand | chain_or_enterprise_like_business
## Manual Review Instructions

For each HIGH lead, answer:

```text
Would I actually call this lead before most others?
```

Use:

- KEEP = yes, call-worthy
- DEMOTE = opportunity exists but not call-first
- VERIFY = needs manual check before decision

For MEDIUM leads, check only for false negatives:

- PROMOTE = should have been HIGH
- OK = correctly MEDIUM
- DEMOTE = still too generous

## Notes

Do not make recommendations or tune rules in this file.

This file is only a human calibration worksheet.
