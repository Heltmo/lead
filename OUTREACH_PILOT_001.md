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
- suggested outreach approach: Lead with a short, specific offer to show the concrete site reliability and trust issues found in the audit. Keep the angle focused on confidence and technical cleanup, not generic redesign.

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
- suggested outreach approach: Use legal trust language. Position the issue as credibility and client enquiry confidence, not booking. Offer to show the concrete trust/readability issues from the audit.

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
- suggested outreach approach: Treat this as a measured VVS service-line test. Focus on better visibility for bad, varme, rehabilitering and enquiry flow, with technical cleanup only if the audit evidence is useful in conversation.

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
- suggested outreach approach: Use clinic language. Frame this as improving treatment-path clarity and patient journey polish around existing booking, not as a broken-site pitch.

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
- suggested outreach approach: Keep urgency moderate. Focus on local service enquiries and service-line/campaign polish for bad, varme and varmepumpe rather than claiming basic contact or booking problems.

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

## Suggested Outreach Angles

Do not write full automated email campaigns. These are short human-use angles only.

### Glomma Tannklinikk

Focus on website trust and reliability cleanup. Do not overfocus on generic CTA cleanup. The angle is that a strong local clinic may lose patient confidence if the site feels technically unreliable or harder to use than expected.

### Advokatfirmaet Bjørnebekk og Martinsen AS

Focus on legal trust and website credibility. Use lawyer language: client enquiry, trust, credibility, case intake. Do not use booking or patient language.

### Arne Nilsen AS

Focus on service-line campaign optimization or technical trust cleanup if the audit evidence supports it. Mention bad, varme, rehabilitering and VVS service demand only as supported by the source data. Do not treat it as urgent redesign unless technical pain is strong.

### Drammen Sportsklinikk

Focus on treatment/service-line patient journey refinement. Use clinic language: patients, treatment path, booking journey. Do not overstate pain because booking/contact already exists.

### VB Engelsviken Rør

Focus on service-line/campaign optimization for bad, varme, varmepumpe or local service enquiries. Do not overstate urgency because VB/network maturity and contact paths reduce pain.

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
