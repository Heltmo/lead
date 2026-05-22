# Website Audit Agent

Deterministic browser-intelligence primitive for Webconsult lead analysis.

## What It Does

Given a URL, the agent uses Playwright to:

- open the page in Chromium
- capture desktop and mobile screenshots
- extract title, meta description, headings, links, emails, phones, CTA text, social links, and basic technology signals
- run Axe accessibility checks
- produce a structured JSON lead-quality report

## Usage

```bash
npm run audit -- http://127.0.0.1:5173 --out reports/local-webconsult.json --screenshots screenshots/local-webconsult
```

## Intelligence Layers

The audit report includes deterministic intelligence fields:

- technology detection from DOM, script, meta, and link signals
- issue classification across SEO, UX, conversion, accessibility, contactability, trust, and technical categories
- lead scoring based on classified issues

Detection is explainable and signal-based. It does not use AI inference in version 1.

## Performance Signals

The agent collects lightweight browser-observed performance and technical signals:

- response status
- DOMContentLoaded timing
- load timing
- resource count
- transfer size estimate
- image count
- missing image dimensions
- oversized image hints
- failed network requests
- console errors

These signals are deterministic and are classified into performance, UX, and technical issues. Lighthouse is intentionally not part of version 1.

## Batch Audits

Audit a CSV or XLSX spreadsheet:

```bash
npm run audit:batch -- /path/to/leads.xlsx --out reports/leads.json --screenshots screenshots/leads --limit 10
```

Dry-run URL extraction without opening external websites:

```bash
npm run audit:batch -- /path/to/leads.xlsx --dry-run true --out reports/dry-run.json --limit 10
```

The importer detects header rows and recognizes URL columns named `url`, `website`, `webside`, `nettside`, `hjemmeside`, or `site`. Company names are detected from headers like `name`, `company`, or `firmanavn`.

## Verification

```bash
npm test
```

The smoke test audits the local Webconsult landing page when it is available at `http://127.0.0.1:5173`.

## Boundary

Version 1 is intentionally deterministic. It does not crawl multiple pages, call AI models, send outreach, or enrich records from third-party services.
