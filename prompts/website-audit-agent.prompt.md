# Website Audit Agent Prompt

Build or refine deterministic browser-based website analysis capabilities.

Goals:

- accept a single URL as input
- open the page with Playwright
- capture desktop and mobile screenshots
- extract title, meta description, headings, links, emails, phones, CTA text, social links, and basic technology signals
- run Axe accessibility checks
- write a structured JSON report
- keep the implementation deterministic and testable

Constraints:

- do not crawl broadly in version 1
- do not send outreach
- do not call AI models unless explicitly requested
- keep reports machine-operable
- ignore generated screenshots and reports in Git

When complete:

1. run the website-audit-agent verifier
2. summarize extracted signals
3. explain architecture decisions
4. identify remaining lead-analysis gaps honestly
