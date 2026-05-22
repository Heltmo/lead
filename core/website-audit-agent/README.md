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

## Verification

```bash
npm test
```

The smoke test audits the local Webconsult landing page when it is available at `http://127.0.0.1:5173`.

## Boundary

Version 1 is intentionally deterministic. It does not crawl multiple pages, call AI models, send outreach, or enrich records from third-party services.
