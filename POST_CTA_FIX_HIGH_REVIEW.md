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

Human decision: KEEP
Human reason: Clear technical trust pain, many failed requests, contactable local clinic, and easy direct-fix Webconsult offer.
Correct angle: Website trust and reliability cleanup.
Rule adjustment needed: none.

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

Human decision: KEEP
Human reason: Clear technical trust pain, contactable local law firm, easy direct-fix offer, and more believable urgency than polished law firms.
Correct angle: Website trust and reliability cleanup.
Rule adjustment needed: none.

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

Human decision: DEMOTE
Human reason: Site has Bestill elektriker, Ring oss, phone/email/contact, service pages, and references. Pain is not strong enough for HIGH.
Correct angle: Possible service-line campaign optimization, not urgent conversion cleanup.
Rule adjustment needed: Electrician CTA/contact maturity should prevent HIGH unless technical_trust_risk or real contact friction is severe.

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

Human decision: DEMOTE
Human reason: Strong service lines exist, but the site has Ta kontakt/contact paths, service pages, references, and concrete offers. Opportunity exists, but pain is not clearly HIGH.
Correct angle: Service-line campaign optimization for elbillading, smarthus, and automasjon.
Rule adjustment needed: High-value electrician services alone should not produce HIGH when visible contact paths and mature service structure exist.

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

Human decision: DEMOTE / borderline
Human reason: Technical issues may exist, but the site has phone, Bestill rørlegger, Be om pristilbud, contact page, email, 40 years experience, and trust markers. Pain may not justify full HIGH.
Correct angle: Technical cleanup / trust polish.
Rule adjustment needed: technical_trust_risk should not auto-HIGH when strong CTA/contact and trust markers are present, unless failed requests or trust degradation are severe.

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

Human decision: DEMOTE
Human reason: Mature business with store, opening hours, phone, email, product/service structure, VB affiliation, long operating history, and trust credentials.
Correct angle: Possible modernization/content cleanup later, not call-first.
Rule adjustment needed: Chain/network affiliation + mature trust markers + visible contact paths should reduce callPriority.

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

Human decision: OK / KEEP MEDIUM or DEMOTE LOW
Human reason: Clear Bestill bord, menus, contact info, phone/email, opening hours, and booking exist. Medium only makes sense if offering event/group booking or restaurant campaign optimization.
Correct angle: Event/group booking or experience campaign optimization, not generic CTA cleanup.
Rule adjustment needed: Strong restaurant booking/contact structure should suppress trust-to-conversion gap unless event/private dining pain exists.

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

Human decision: OK / KEEP LOW
Human reason: Site has Bestill bord, menu, contact, gallery/news, and multi-location brand structure. Low immediate pain.
Correct angle: Not call-first. Possible campaign/brand optimization later.
Rule adjustment needed: none if restaurant CTA suppression works.

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

Human decision: OK / KEEP MEDIUM
Human reason: High-value treatment/service opportunity exists, but booking/contact path is present, so pain is not strong enough for HIGH.
Correct angle: Treatment-to-booking clarity for high-value services.
Rule adjustment needed: none.

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

Human decision: OK / KEEP MEDIUM, possible LOW
Human reason: Established law firm with phone, email, contact paths, practice areas, and low visible pain. Opportunity exists but not call-first.
Correct angle: Service-area-to-client-enquiry clarity, not booking optimization.
Rule adjustment needed: Lawyer contact terms should continue suppressing no-CTA pain.

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

Human decision: DEMOTE
Human reason: Contact paths exist, site appears vendor-built/mature enough, visible pain is low, and lawyer vertical has lower urgency.
Correct angle: Possible positioning refinement, but not call-first.
Rule adjustment needed: Lawyer + vendor-built + visible contact + low pain should usually be LOW unless technical_trust_risk is strong.

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

Human decision: DEMOTE
Human reason: Large/mature/polished law firm with multiple offices, strong contact paths, active content, and higher sales complexity. Good business, not call-first Webconsult lead.
Correct angle: Not a direct outreach lead; possible enterprise/content/SEO opportunity later.
Rule adjustment needed: Large/mature law firm penalty should reduce callPriority unless severe technical_trust_risk exists.

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

Human decision: OK / KEEP MEDIUM, possible LOW
Human reason: Strong high-value services exist, but contact path is visible through Kontakt oss, phone, email, and contact form. Opportunity exists but pain is not severe.
Correct angle: Service-page or campaign optimization for elbillading, solcelle, and smarthus.
Rule adjustment needed: If contact page + phone/email + contact form exist, high_value_service_conversion should not become HIGH without stronger pain.

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

Human decision: OK / KEEP MEDIUM
Human reason: Relevant high-value services exist, but the site has clear Ring oss, Send e-post, gratis befaring, phone, email, and contact form.
Correct angle: Service-page/campaign optimization for badrenovering and varmeanlegg, not basic CTA cleanup.
Rule adjustment needed: none if no-CTA suppression is now working.

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

Human decision: DEMOTE
Human reason: High-value services exist, but CTA/contact paths are strong: 24/7 phone, Bestill rørlegger, emergency help, contact navigation, and service pages.
Correct angle: Service-line optimization, not urgent conversion leak.
Rule adjustment needed: 24/7 phone + Bestill rørlegger + emergency CTA should strongly prevent HIGH unless technical pain is severe.

## LOW / VERIFY Summary

### LOW

- Flow Tannhelse | Dentists Fredrikstad | https://www.flowtannhelse.no/tannlege-Fredrikstad | low | modern_site_campaign_optimization | reasons: modern_site_lower_immediate_pain | many_failed_requests | accessibility_usability_pain | callable_phone_available | email_available | direct_business_site | operational_business | strong_local_proof
  - Human decision: OK / KEEP LOW
  - Human reason: Modern conversion-ready clinic with strong booking/contact paths, high trust, visible services, and low immediate pain. Good business, but weak call-first lead.
  - Correct angle: Campaign-specific optimization only.
  - Rule adjustment needed: none.
- Oasen Tannklinikk | Dentists Fredrikstad | https://www.oasentannklinikk.no | low | modern_site_campaign_optimization | reasons: modern_site_lower_immediate_pain | many_failed_requests | accessibility_usability_pain | conversion_issue_detected | callable_phone_available | email_available | direct_business_site | operational_business
  - Human decision: OK / KEEP LOW
  - Human reason: Site already has visible booking/contact paths, new-patient offer, phone/email/contact, and low obvious pain. Priority is correct, but no-CTA reasoning should stay suppressed.
  - Correct angle: Mature clinic; possible treatment campaign optimization, not conversion cleanup.
  - Rule adjustment needed: none if no-CTA suppression is now working.
- Advokathuset Fredrikstad | Lawyers Fredrikstad | https://advokathusetfredrikstad.no | low | local_seo_consistency_gap | reasons: console_errors | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | direct_business_site | operational_business
  - Human decision: OK / KEEP MEDIUM
  - Human reason: Older and less polished site creates a real improvement opportunity, but not enough acute pain for HIGH in lawyer vertical.
  - Correct angle: Client enquiry clarity / trust modernization.
  - Rule adjustment needed: avoid "booking" language; use legal client-intake language.
- Storm VVS Rørlegger Moss | Plumbers Moss | http://www.stormvvs.no | low | local_seo_consistency_gap | reasons: accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
  - Human decision: OK / KEEP MEDIUM
  - Human reason: Site is simple but has contact link, email, named contacts, phone numbers, and Avtal befaring. Some improvement potential, but not strong HIGH.
  - Correct angle: First-screen enquiry clarity / quote request optimization.
  - Rule adjustment needed: none if Avtal befaring/contact evidence is detected.
- Café Bragernes | Restaurants Drammen | http://www.cafebragernes.no | low | trust_to_conversion_gap | reasons: conversion_path_friction | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
  - Human decision: OK / KEEP LOW
  - Human reason: Restaurant/cafe has Bordbestilling, phone, email, address, and opening hours. Generic CTA friction is low commercial pain.
  - Correct angle: Not call-first. Possible minor local SEO/content polish only.
  - Rule adjustment needed: none if restaurant CTA suppression works.
- Anchas Bodega | Restaurants Drammen | http://www.anchasbodega.no | low | trust_to_conversion_gap | reasons: conversion_path_friction | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site | operational_business
  - Human decision: OK / KEEP LOW
  - Human reason: Bordbestilling, phone for larger groups, email, opening hours, and menu are visible. Generic conversion pain is weak.
  - Correct angle: Possible stale-content/site freshness check if renovation notice is outdated, not CTA cleanup.
  - Rule adjustment needed: Add stale/seasonal notice detection later if needed, but do not over-score generic restaurant CTA issues.
- Vertshuset Oscar & Stallen Drammen | Restaurants Drammen | http://vertshusetdrammen.no | low | high_value_service_conversion_gap | reasons: high_value_service_conversion_leak | failed_requests | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available | direct_business_site
  - Human decision: OK / KEEP LOW or PROMOTE MEDIUM
  - Human reason: Site has Reserver bord, Selskapslokaler, contact, phone, email, opening hours, and social links. Selskapslokaler is a higher-value restaurant signal, but pain is still not HIGH.
  - Correct angle: Selskapslokaler/event booking visibility, not generic booking path optimization.
  - Rule adjustment needed: Restaurant event/private dining signals can raise to MEDIUM, not HIGH, when offer fit exists.

### VERIFY

- Oris Dental Fredrikstad | Dentists Fredrikstad | https://orisdental.no/klinikker/fredrikstad/?utm_source=gulesider&utm_medium=referral&utm_campaign=&utm_term=klinikkside | verify | trust_to_conversion_gap | reasons: audit_failed_verify_manually | conversion_path_friction | callable_phone_available | direct_business_site | operational_business | strong_local_proof | mature_local_brand | chain_or_enterprise_like_business
  - Human decision: VERIFY
  - Human reason: Chain/mature clinic and audit uncertainty. Booking/contact likely exists, so this should not be treated as a confident conversion-cleanup lead.
  - Correct angle: Audit-failed / chain-fit verification.
  - Rule adjustment needed: audit_failed + chain/enterprise + visible booking/contact should remain VERIFY.

## Overall Human Calibration Summary

Manual calibration result:

Clear KEEP HIGH:

- Glomma Tannklinikk
- Advokatfirmaet Bjornebekk og Martinsen AS

Possible / borderline HIGH:

- Sentrum Ror AS only if technical trust pain is severe enough

Likely DEMOTE from HIGH if currently marked HIGH:

- Moss Elektro AS
- Storm Elektro Moss AS
- Rygge Rorleggerservice
- Moss Rorleggerservice
- mature/polished law firms
- generic restaurant conversion leads

Main conclusion:

The CTA/contact fix improved reasoning quality, but HIGH may still be too generous if it includes leads where contact paths are strong and pain is mostly service-line optimization.

Next likely tuning principle:

Contactability should improve salesEase, but it should not create HIGH unless pain is also strong.

Main rules for next tuning if needed:

1. high_value_service_conversion + strong contact maturity = usually MEDIUM, not HIGH.
2. technical_trust_risk remains strongest HIGH pattern, but should require severe enough technical pain if contact/trust markers are otherwise strong.
3. Mature/polished/large businesses should receive stronger resistance penalties.
4. Restaurant opportunities should remain LOW/MEDIUM, not HIGH, unless severe technical pain exists.
5. Lawyers should only become HIGH for technical trust, identity confusion, or very visible trust/friction issues.

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
