# Source Fusion V1

Source Fusion is the Proof & Confidence layer for Lead Machine. It uses the data already available in the seller desk to explain whether a lead is trustworthy and workable before adding paid providers like 1881 or Proff.

## Purpose

The seller should quickly know:

- is this the right legal company?
- can I contact it?
- is it in the requested area?
- does it fit what I sell?
- what should I verify before spending time?

Source Fusion is not a fake precise percentage score. It uses categorical confidence so the UI can stay decision-oriented.

## Existing Sources Used

- Brreg/company profile for legal identity.
- Google Places/public presence for local discovery and activity signals.
- Contact data for phone, email, website and address availability.
- Website/contact profile as one source signal, not the product core.
- Seller Fit as the sales-context interpretation.
- Workflow as seller state/context, not as legal or contact truth.

No 1881, Proff, Gule Sider/Eniro, SSB, new scraping, outreach automation, sales scripts, auth, billing or database changes are included in V1.

## Output

The module lives in `core/source-fusion/` and returns:

- `leadConfidence`: `strong | good | review | weak | unknown`
- `identityConfidence`: `confirmed | candidate | manual_verify | unknown`
- `contactConfidence`: `strong | good | review | weak | unknown`
- `locationConfidence`: `exact | nearby | fallback | conflict | unknown`
- `sellerFit`: existing seller-fit category
- `recommendedTrustAction`: `call | review | verify_first | skip`
- `sourceCoverage`
- `verifiedFields`
- `proofReasons`
- `riskReasons`
- `conflicts`
- `warnings`

## Rules V1

- Confirmed Brreg org.nr confirms legal identity.
- Candidate org.nr or manual matches require manual verification.
- Phone plus another contact path gives strong contact confidence.
- A single phone gives good contact confidence.
- No direct phone but email/website exists requires review.
- No contact path is weak.
- Exact/nearby location supports call readiness.
- Regional fallback creates a warning and should not be strong.
- Location conflict blocks a call recommendation.
- Weak seller fit prevents strong lead confidence.
- Website weakness is never the main reason a generic B2B lead is weak.

## UI

The selected lead card includes a compact `Proof & confidence` card near Contact, Company and Proof & checks. It shows:

- Lead confidence
- Trust action
- Identity confidence
- Contact confidence
- Location confidence

The collapsed qualification details show source coverage, verified fields, proof reasons, risk reasons and warnings/conflicts.

Human trust labels are used in the app:

- Trygg å ringe
- Bør vurderes
- Verifiser først
- Svak/usikker

## Export

JSON lead packs include `sourceFusion`. CSV exports include:

- `leadConfidence`
- `identityConfidence`
- `contactConfidence`
- `locationConfidence`
- `recommendedTrustAction`
- `sourceCoverage`
- `verifiedFieldsSummary`
- `proofReasonsSummary`
- `riskReasonsSummary`
- `sourceFusionWarnings`

## Future Providers

1881 can later improve `contactConfidence` by verifying directory phone/address/category data.

Proff can later improve commercial/economy confidence after Brreg has confirmed org.nr.

Brreg remains the legal identity source. Google Places remains the local discovery/activity source. Paid providers should plug into Source Fusion instead of becoming raw-data panels.
