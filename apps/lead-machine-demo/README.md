# Lead Machine Live Demo

Local interactive demo app for the Webconsult Lead Machine.

## Purpose

This app lets a user type a query like:

```text
Kristiansand rørlegger
```

and run the existing Lead Machine flow from a browser.

It is not a full SaaS app. It has no auth, database, Proff integration, saved searches, CRM integration, or outreach automation.

## Run Locally

```bash
cd apps/lead-machine-demo
npm run dev
```

Open:

```text
http://127.0.0.1:8787
```

## Example Queries

- `Kristiansand rørlegger`
- `rørlegger Kristiansand`
- `rørleggere i Kristiansand`
- `advokater i Gol`
- `Gol advokat`

## What It Does

The browser sends the query to a local Node server. The server calls the existing `core/lead-machine` module directly and returns:

- run summary
- lead packs
- CSV download path
- JSON download path
- output folder path

The frontend displays:

- query/run status
- summary counts
- lead cards
- selected lead detail
- evidence and caution
- export links

## Product Boundary

Machine provides:

- discovery
- enrichment
- ranking
- evidence
- caution
- export

Seller owns:

- angle
- wording
- outreach
- timing
- relationship
- close

No prepared pitch text, email templates, or automated outreach are included.

## Limitations

- Uses local server only.
- Requires whatever provider credentials the existing Lead Machine needs for live Google Places runs.
- Company profile enrichment defaults off.
- Economy/Proff status remains `not_enabled`.
- Run folders are local and ignored by git.
