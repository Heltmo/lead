# Webconsult Lead Machine

Lead Machine is the seller desk product: sellers search for a market, review ranked leads, call from the browser, save notes, and manage follow-ups.

## Current Product

- `apps/lead-machine-demo`: browser seller desk for search, explicit seller work queues, lead list, notes, follow-ups, saved markets, and exports.
- `core/lead-machine`: product runner that turns discovery into seller-ready lead packs.
- `core/lead-discovery-agent`: Brreg, Google Places, mock, and manual-source discovery.
- `core/company-profile`: conservative Brreg/company identity enrichment.
- `core/seller-fit`: interprets each lead based on what the seller sells.
- `core/source-fusion`: combines Brreg, Google/contact data, seller fit, and workflow context into Proof & Confidence.
- `core/osint`: narrow public-evidence summary for one selected lead.
- `netlify/functions/api.js`: hosted friend-beta API for shared notes/follow-ups.

Removed from the main repo path: browser-audit tooling, old orchestration queues, static demo generation, campaign/demo runners, website-redesign opportunity modules, and landing-page test scaffolding.

## Local Run

```bash
cd /home/xman/webconsult/apps/lead-machine-demo
npm run dev
```

Open `http://127.0.0.1:8787`.

## Friend Beta

Before sharing with testers:

```bash
cd /home/xman/webconsult
npm run netlify:check
./verifications/verify-friend-beta-readiness.sh
./verifications/verify-netlify-hosted-beta.sh
```

Use `FRIEND_BETA_READINESS.md` for the test script, `NETLIFY_BETA.md` for Netlify deployment, `SELLER_WORK_QUEUES_V1.md` for workflow rules, and `SOURCE_FUSION_V1.md` for Proof & Confidence rules.

## Boundary

The product does not send email, place calls, generate pitch scripts, sync CRM, bill users, or scrape private/login-gated sources. Sellers own the conversation and relationship; Lead Machine owns discovery, evidence, workflow state, and exports.
