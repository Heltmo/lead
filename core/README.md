# Webconsult Core

Reusable modules that support the Lead Machine seller desk.

## Active Product Core

- `lead-machine`: runs discovery and writes seller-ready lead packs.
- `lead-discovery-agent`: normalizes local business discovery from Brreg, Google Places, mock fixtures, and manual source files.
- `company-profile`: Brreg identity enrichment for legal name, org.nr, NACE, status, employees, and match confidence.
- `seller-fit`: interprets a lead for the selected seller intent.
- `osint`: narrow selected-lead public evidence summary from already collected business data.
- `cache`: local file cache helpers.
- `components`, `sections`, `patterns`: shared UI/product notes.

## Rule

Only keep modules that move the seller workflow forward: search, verify, call, note, follow up, export, and eventually login/team workspace. Legacy non-seller tooling has been removed from the main product path.
