# Seller Fit V1

Lead Machine is now being reframed as a general B2B seller workflow tool. Digital presence checks remain useful, but they are one signal, not the product core.

## Product Boundary

Machine provides:

- discovery
- company/contact data
- enrichment
- ranking
- evidence
- caution
- workflow structure
- seller-fit interpretation
- export

Seller owns:

- angle
- wording
- outreach
- timing
- relationship
- close

No sales scripts, call openers, email automation, or auto-outreach are generated in V1.

## Seller Intent

The seller can choose what they sell:

- `general_b2b`
- `web_it`
- `ads_marketing`
- `telecom`
- `accounting`
- `insurance`
- `finance`
- `recruiting`
- `other`

Seller intent does not change raw truth data. It changes which signals are considered important for seller fit.

## Seller Fit Output

`core/seller-fit/` returns:

```json
{
  "sellerIntent": "general_b2b",
  "sellerFit": "strong",
  "score": 12,
  "fitReasons": [],
  "riskReasons": [],
  "importantSignals": [],
  "recommendedAction": "contact"
}
```

Allowed `sellerFit` values:

- `strong`
- `good`
- `review`
- `weak`

Allowed `recommendedAction` values:

- `contact`
- `review`
- `verify`
- `skip`

## V1 Rules

General B2B weights:

- direct phone improves fit
- confirmed/candidate org.nr improves fit
- exact location improves fit
- active company improves fit
- Google rating/reviews improve fit
- missing phone, uncertain identity, wrong location, and low source confidence reduce fit

Intent-specific weighting:

- `web_it`: digital presence issues matter more
- `ads_marketing`: Google presence, reviews, website/social presence matter more
- `telecom`: phone, company size, active business, and branch/location context matter more
- `accounting`, `finance`, `insurance`: legal identity, company form, employees, and economy readiness matter more
- `recruiting`: employees, company size, and growth/activity matter more

## UI Language

Prominent UI language should use general seller terms and a clear decision hierarchy. The first visible lead detail should answer: who is this, can I contact them, why might they be worth time, and what must be checked before use.

Primary visible cards:

- Contact
- Company
- Proof & checks

Secondary details can still expose:

- Company fit
- Market proof
- Sales signals
- Risk / verify
- Workflow
- Digital presence

Avoid making website weakness the main reason a lead is good. Digital presence belongs under enrichment/context.

## Call Queue Use

Seller fit is now used by the live demo when ranking the call queue. Follow-ups and interested leads still stay urgent, but new leads are ordered by seller fit, recommended action, contactability, org identity, location quality, and market proof. This makes `Call queue first` answer the practical seller question: who should I work next for the thing I sell?

The separate `Seller fit first` sort lets a seller inspect fit ranking directly without changing raw lead data.

## Next Steps

- Keep seller intent in the local workspace state and later migrate it to user/workspace scope when SaaS auth exists.
- Add market context later for territory intelligence.
- Add Proff/economy only behind confirmed org.nr.
