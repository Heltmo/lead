# Current State

Lead Machine is focused on one product: a seller desk where users choose what they sell, search for leads, call, save notes, and manage follow-ups.

## Active Runtime

- Local app: `apps/lead-machine-demo`
- Product runner: `core/lead-machine`
- Discovery: `core/lead-discovery-agent`
- Company identity: `core/company-profile`
- Seller intent/fit: `core/seller-fit`
- Selected-lead public evidence: `core/osint`
- Hosted beta API: `netlify/functions/api.js`

## What Works

- Seller query/search with Brreg, Google Places, balanced, mock, and bundled hosted-beta data.
- Ranked lead cards with phone, identity, location, source quality, and seller-fit context.
- Website sales fit verdict (strong/review/weak) on every lead when the seller intent is Nettsider / IT — shown at the top of the selected lead, with no-website treated as a positive sales signal. Default seller intent is now web_it; rule calibration waits for real call feedback.
- Selected-lead enrichment without old browser-audit dependencies.
- Notes, outcomes, activity log, follow-up dates, and exports.
- Simplified search header: free-text search first, seller setup collapsed behind a summary toggle. Saved searches persist server-side (command center and export) but the management panel is removed from the seller desk.
- All seller-facing UI text is Norwegian: app surface, verdict bullets, seller-fit/source-fusion/command-center/osint reasons, queue notes and snake_case warning keys (translated via a key dictionary in the frontend). Deep ("Verifiser firma") is honestly labeled as identity/contact verification - it does not audit website quality; unverified websites say "åpne den og se selv".
- One product mode: the seller category picker is removed from the UI and every search runs as website sales (web_it). Core seller-fit keeps multi-intent support so categories can return later if they earn a real advantage per category.
- Ringeøkt (call focus mode): one lead at a time in a full-screen card - big tel: link, website sales verdict, optional note, outcome buttons (Ingen svar / Interessert / Ferdig / Ikke relevant) that save through the normal workflow API and advance to the next call-ready lead automatically. Keyboard 1-4 + Esc.
- Netlify hosted friend beta with token gate and Netlify Blobs/shared workspace support.

## Removed From Main Product

Old browser-audit tooling, orchestration queues, review workspace, lead-pack runner, demo generator, campaign runner, static showcase, website-redesign opportunity modules, and landing-page test scaffolding were removed from the active repo path.

## Next Product Work

- Real login and per-user/team workspaces.
- Safer hosted live discovery, not just bundled beta data.
- Email connection for follow-up logging/sending when workflow is stable.
- Better onboarding around seller intent: what do you sell, where, and what makes a good customer?
- Clear beta data/reset/admin path before broader testing.
