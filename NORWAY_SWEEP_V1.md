# Norway Sweep V1

Lead Machine is Norway-first in the current MVP. When a seller searches without a place and keeps area as "Hele Norge", the app can run a capped Norway sweep instead of one broad global query.

## Purpose

Norway Sweep V1 answers: "Give me many relevant Norwegian companies for this seller category, grouped by city."

Examples:

- `rørlegger`
- `frisør`
- `escape room`
- `paintball`

These are treated as broad Norway searches. Searches with a place, like `rørlegger i Oslo`, remain normal focused searches.

## Current Limits

- Normal focused searches: max 25 leads.
- Norway sweep beta searches: max 60 leads.
- Sweep V1 uses a prioritized city list, not every municipality.
- Per-city Google Places results are capped.
- No background workers, database market build, scraping, Proff, 1881, SSB, email, CRM sync or outreach automation is added here.

## How It Works

1. The app detects broad regional searches without a parsed location.
2. The provider creates city queries such as `frisør i Oslo`, `frisør i Bergen`, and `frisør i Trondheim`.
3. Google Places is restricted to Norway.
4. Non-Norwegian results are filtered out before lead packs are built.
5. Leads are deduped and sorted by city.
6. The UI shows a Norway-sweep panel and city group headings.
7. CSV export includes `marketSweep` and `marketSweepCity`.

## Why Not Unlimited Yet

Running every city live would be slow and expensive in a Netlify request. Full market building should later move to a background job with durable database storage.

Future path:

- `Norge-sweep V2`: selectable city sets and higher caps.
- `Full market build`: background jobs, retry, progress, database persistence.
- `Scandinavia mode`: explicit country selector for Norway, Sweden, Denmark, not global fallback.
