# Current State

Webconsult is split into two Git histories:

- infrastructure repo: `~/webconsult`
- project repo: `~/webconsult/projects/landing-page-test`

## Infrastructure Capabilities

- reusable prompts, templates, and verification scripts
- deterministic website audit agent
- single-site browser audits
- CSV/XLSX batch ingestion
- screenshot capture
- Axe accessibility checks
- structured JSON reports
- deterministic lead scoring
- technology-stack detection
- classified lead issues
- browser-observed performance signals

## Application Capabilities

- modular React/Vite/Tailwind landing page
- Playwright desktop/mobile smoke tests
- Axe accessibility verification
- Git-tracked frontend evolution

## Verification Commands

```bash
~/webconsult/verifications/verify-frontend.sh ~/webconsult/projects/landing-page-test
~/webconsult/verifications/verify-website-audit-agent.sh
```
