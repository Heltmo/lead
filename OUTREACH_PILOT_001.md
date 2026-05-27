# OUTREACH_PILOT_001

## Purpose

This pilot tests whether the calibrated lead machine produces outreach-worthy leads.

We are no longer testing whether the pipeline works. We are testing whether calibrated `HIGH` and strong `MEDIUM` leads, with their commercial angles, create real response in the market.

Success is not closing a deal yet. Success is learning:

- whether the selected leads are reachable
- whether the commercial angle feels credible
- whether `HIGH` leads outperform `MEDIUM` leads
- whether the offer matches real buyer pain
- whether the system's prioritization creates useful human action

## Pilot Rules

- Manual outreach only.
- No automation.
- No mass email.
- No AI-generated bulk sending.
- No prepared scripts or recommended wording.
- Contact only a small number of leads.
- Track outcome honestly.
- Do not tune scoring until results are recorded.

## Selected Leads

| Lead | Vertical | Priority | Opportunity type | Lead class | Recommended offer | Outreach motion | Why selected | Pilot role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Glomma Tannklinikk | dentist | high | technical_trust_risk | technical_redesign | Website trust and reliability cleanup | direct_fix_call | Retained `HIGH` from calibrated 23-lead batch with clear technical trust pain and contactability. | HIGH technical trust test |
| Advokatfirmaet Bjørnebekk og Martinsen AS | lawyer | high | technical_trust_risk | technical_redesign | Website trust and reliability cleanup | direct_fix_call | Retained `HIGH` from calibrated 23-lead batch in a stricter lawyer vertical. | HIGH technical trust test in lawyer vertical |
| Arne Nilsen AS | plumber | medium | technical_trust_risk | technical_redesign | Website trust and reliability cleanup | direct_fix_call | Strong `MEDIUM` from unseen validation; good VVS fit but contact and trust markers reduce urgency. | strong MEDIUM VVS/service-line test |
| Drammen Sportsklinikk | physiotherapist | medium | technical_trust_risk | technical_redesign | Website trust and reliability cleanup | direct_fix_call | Strong clinic `MEDIUM` from unseen validation; service-line opportunity with clear booking/contact already present. | MEDIUM clinic/service-line test |
| VB Engelsviken Rør | plumber | medium | technical_trust_risk | technical_redesign | Website trust and reliability cleanup | direct_fix_call | Strong `MEDIUM` from unseen validation; mature trade/VB network lead with service-line potential. | MEDIUM mature trade/service-line test |

## Lead Worksheets

### Glomma Tannklinikk

- vertical: dentist
- URL: http://glommatannklinikk.no
- current callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 1
- buyingLikelihood: 1
- salesEase: high
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- commercialPressureReasons: visible_technical_trust_pain | many_failed_requests | console_errors | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available
- topEvidence: Expected exactly one h1, found 2 | Serious accessibility issues detected | Failed network requests detected
- contact/CTA profile summary: visible=true; strong=true; methods=phone | email | contact_link | booking_link | emergency_call; terms=tannlegevakt | bestill time | bestill | konsultasjon; type=emergency_call; confidence=0.88
- phone: 69 16 90 90
- email: post@glommatannklinikk.no
- contact form: unknown
- website: http://glommatannklinikk.no
- source run: core/orchestrator/runs/tannleger-fredrikstad-places-5
- why selected: Retained `HIGH`; clear technical trust pain, many failed requests, contactable local clinic, and easy direct-fix Webconsult offer.
- correct angle from calibration: Website trust and reliability cleanup.
- operator context: The useful information is the technical trust/reliability finding. Avoid treating this as a generic redesign lead.

- contacted: yes/no
- date contacted:
- channel: phone / email / contact form / LinkedIn / other
- person reached:
- response: no response / negative / neutral / interested / meeting booked
- objection:
- notes:
- follow-up date:
- outcome:
- learning:

### Advokatfirmaet Bjørnebekk og Martinsen AS

- vertical: lawyer
- URL: http://www.advokat-bm.no
- current callPriority: high
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.97
- buyingLikelihood: 0.86
- salesEase: high
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- commercialPressureReasons: visible_technical_trust_pain | failed_requests | console_errors | accessibility_usability_pain | conversion_issue_detected | search_clarity_issue | callable_phone_available | email_available
- topEvidence: Expected exactly one h1, found 2 | Serious accessibility issues detected | No social links detected
- contact/CTA profile summary: visible=true; strong=true; methods=phone | email | contact_link; terms=kontakt oss | kontakt | mail | 69 36 74 40; type=general_contact; confidence=0.88
- phone: 69 36 74 40
- email: tore@advokat-bm.no; anders@advokat-bm.no
- contact form: unknown
- website: http://www.advokat-bm.no
- source run: core/orchestrator/runs/advokater-fredrikstad-places-5
- why selected: Retained `HIGH`; clear technical trust pain, contactable local law firm, and a believable direct-fix offer in a stricter vertical.
- correct angle from calibration: Website trust and reliability cleanup.
- operator context: The useful information is legal trust and credibility. Avoid booking or patient framing.

- contacted: yes/no
- date contacted:
- channel: phone / email / contact form / LinkedIn / other
- person reached:
- response: no response / negative / neutral / interested / meeting booked
- objection:
- notes:
- follow-up date:
- outcome:
- learning:

### Arne Nilsen AS

- vertical: plumber
- URL: https://www.vvseksperten.no/rorlegger/fredrikstad/arne-nilsen-as
- current callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.65
- buyingLikelihood: 0.84
- salesEase: medium
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- commercialPressureReasons: strong_existing_conversion_flow | contact_maturity_requires_stronger_technical_pain | visible_technical_trust_pain | many_failed_requests | accessibility_usability_pain | callable_phone_available | email_available | direct_business_site
- topEvidence: Serious accessibility issues detected | Failed network requests detected | Elevated full page load time
- contact/CTA profile summary: visible=true; strong=true; methods=phone | email | contact_link | booking_link | quote_request | emergency_call; terms=vakttelefon | avtal befaring | bestill | kontakt | telefon | mail; type=emergency_call; confidence=0.88
- phone: 69 31 02 03
- email: truls@arne-nilsen.no; anders@arne-nilsen.no
- contact form: no
- website: https://www.vvseksperten.no/rorlegger/fredrikstad/arne-nilsen-as
- source run: core/orchestrator/runs/unseen-rorleggere-fredrikstad-5-20260526
- why selected: Strong `MEDIUM`; very good VVS vertical and service-line fit, but strong contact paths and trust markers keep it below `HIGH` unless technical pain proves severe.
- correct angle from calibration: Service-line campaign optimization for bad/varme/rehabilitering, or technical trust cleanup if audit evidence is strong.
- operator context: The useful information is VVS service-line strength plus moderate technical trust evidence. Do not treat this as urgent redesign unless the technical evidence feels strong enough.

- contacted: yes/no
- date contacted:
- channel: phone / email / contact form / LinkedIn / other
- person reached:
- response: no response / negative / neutral / interested / meeting booked
- objection:
- notes:
- follow-up date:
- outcome:
- learning:

### Drammen Sportsklinikk

- vertical: physiotherapist
- URL: http://www.drammensportsklinikk.no
- current callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.76
- buyingLikelihood: 0.88
- salesEase: high
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- commercialPressureReasons: polished_or_vendor_built_site | strong_existing_conversion_flow | visible_technical_trust_pain | many_failed_requests | console_errors | accessibility_usability_pain | search_clarity_issue | callable_phone_available
- topEvidence: Expected exactly one h1, found 2 | Serious accessibility issues detected | Failed network requests detected
- contact/CTA profile summary: visible=true; strong=true; methods=phone | email | contact_link | booking_link; terms=bestill time | bestill | kontakt oss | kontakt | mail; type=booking; confidence=0.88
- phone: 91 19 53 00
- email: post@sportsklinikkene.no
- contact form: no
- website: http://www.drammensportsklinikk.no
- source run: core/orchestrator/runs/unseen-fysioterapeuter-drammen-5-20260526
- why selected: Strong clinic `MEDIUM`; good high-value service vertical, but booking/contact path is already clear and pain is not strong enough for `HIGH`.
- correct angle from calibration: Treatment/service-line campaign optimization or patient journey refinement.
- operator context: The useful information is treatment/service-line journey quality. Booking/contact already exists, so this is not a broken-site lead.

- contacted: yes/no
- date contacted:
- channel: phone / email / contact form / LinkedIn / other
- person reached:
- response: no response / negative / neutral / interested / meeting booked
- objection:
- notes:
- follow-up date:
- outcome:
- learning:

### VB Engelsviken Rør

- vertical: plumber
- URL: https://www.engelsvikenror.no
- current callPriority: medium
- opportunityType: technical_trust_risk
- leadClass: technical_redesign
- recommendedOffer: Website trust and reliability cleanup
- outreachMotion: direct_fix_call
- painScore: 0.68
- buyingLikelihood: 0.84
- salesEase: medium
- primaryOpportunity: Technical issues may weaken trust even if the business itself appears contactable and operational.
- commercialPressureReasons: strong_existing_conversion_flow | contact_maturity_requires_stronger_technical_pain | visible_technical_trust_pain | many_failed_requests | accessibility_usability_pain | search_clarity_issue | callable_phone_available | email_available
- topEvidence: Missing meta description | Serious accessibility issues detected | Failed network requests detected
- contact/CTA profile summary: visible=true; strong=true; methods=phone | email | contact_link | emergency_call; terms=vakttelefon | kontakt oss | kontakt | telefon; type=emergency_call; confidence=0.88
- phone: 69 36 77 77
- email: post.engelsvikenror@vb.no; bengt.persson@engelsvikenror.no; tommper@engelsvikenror.no
- contact form: no
- website: https://www.engelsvikenror.no
- source run: core/orchestrator/runs/unseen-rorleggere-fredrikstad-5-20260526
- why selected: Strong `MEDIUM`; relevant trade/service-line lead with VB/network maturity and clear contact paths, useful for testing mature trade outreach.
- correct angle from calibration: Service-line/campaign optimization for bad, varme, varmepumpe or local service enquiries.
- operator context: The useful information is service-line/campaign potential for bad, varme and varmepumpe. VB/network maturity and contact paths reduce urgency.

- contacted: yes/no
- date contacted:
- channel: phone / email / contact form / LinkedIn / other
- person reached:
- response: no response / negative / neutral / interested / meeting booked
- objection:
- notes:
- follow-up date:
- outcome:
- learning:

## Lead Context Notes

These notes are not scripts. They are the key context the operator should understand before making contact.

### Glomma Tannklinikk

- Context: website trust and reliability cleanup.
- Evidence theme: technical reliability, accessibility/usability and failed request findings.
- Caution: do not overfocus on generic CTA cleanup.

### Advokatfirmaet Bjørnebekk og Martinsen AS

- Context: legal trust and website credibility.
- Evidence theme: technical trust and readability/usability issues.
- Caution: use legal/client language, not booking or patient language.

### Arne Nilsen AS

- Context: VVS service-line visibility and possible technical trust cleanup.
- Evidence theme: bad, varme, rehabilitering/VVS services plus accessibility/performance issues.
- Caution: do not treat it as urgent redesign unless technical pain is strong.

### Drammen Sportsklinikk

- Context: treatment/service-line patient journey refinement.
- Evidence theme: strong booking/contact and broad treatment offer, with technical/usability findings.
- Caution: do not overstate pain because booking/contact already exists.

### VB Engelsviken Rør

- Context: service-line/campaign optimization for bad, varme, varmepumpe or local service enquiries.
- Evidence theme: mature VB/network trade lead with technical/usability findings.
- Caution: do not overstate urgency because VB/network maturity and contact paths reduce pain.

## Pilot Success Criteria

This pilot is successful if we learn something real.

- leads contacted:
- responses:
- interested replies:
- meetings booked:
- strongest angle:
- weakest angle:
- HIGH leads better than MEDIUM leads: yes/no/unclear
- MEDIUM lead outperformed HIGH: yes/no
- easiest vertical to approach:
- hardest vertical to approach:
- what surprised us:

## Result Summary

- total contacted:
- total responses:
- total interested:
- total meetings:
- best-performing lead:
- best-performing angle:
- worst-performing angle:
- should we continue this vertical:
- should this leadClass remain high priority:
- what should be tuned:
- what should not be changed:

## Next Decision

If 1-2 leads respond positively:

- keep scoring stable
- create `OUTREACH_PILOT_002`
- test 5 more leads

If 0 respond:

- do not immediately change scoring
- inspect outreach wording/channel/offer first
- then decide whether lead selection or messaging was the issue

If `MEDIUM` leads outperform `HIGH`:

- review whether `HIGH` is too narrow or `technical_trust_risk` is overvalued

If `HIGH` leads clearly outperform `MEDIUM`:

- keep `HIGH` strict
- use `MEDIUM` as shortlist layer

## Source Files Used

- `POST_CTA_FIX_HIGH_REVIEW.md`
- `UNSEEN_BATCH_VALIDATION.md`
- `core/orchestrator/runs/tannleger-fredrikstad-places-5/summary.json`
- `core/orchestrator/runs/advokater-fredrikstad-places-5/summary.json`
- `core/orchestrator/runs/unseen-rorleggere-fredrikstad-5-20260526/summary.json`
- `core/orchestrator/runs/unseen-fysioterapeuter-drammen-5-20260526/summary.json`
- `core/orchestrator/runs/tannleger-fredrikstad-places-5/items/url-0004/report.json`
- `core/orchestrator/runs/advokater-fredrikstad-places-5/items/url-0005/report.json`
- `core/orchestrator/runs/unseen-rorleggere-fredrikstad-5-20260526/items/url-0001/report.json`
- `core/orchestrator/runs/unseen-rorleggere-fredrikstad-5-20260526/items/url-0003/report.json`
- `core/orchestrator/runs/unseen-fysioterapeuter-drammen-5-20260526/items/url-0001/report.json`
- `core/orchestrator/runs/*/review-workspace/lead-insights/*.json` for the five selected leads

## Missing Fields

- Glomma Tannklinikk contact form: unknown
- Advokatfirmaet Bjørnebekk og Martinsen AS contact form: unknown
