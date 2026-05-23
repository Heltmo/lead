# Next Milestone

The platform now has deterministic audit intelligence, report surfaces, and a static lead review workspace. The next phase should improve continuity and practical lead operations without introducing heavy infrastructure too early.

## Priority 1: Historical Comparisons

Add lightweight run-to-run comparison before building full monitoring.

Targets:

- previous score
- current score
- score delta
- previous issue count
- new/resolved/persisting issues
- last seen HTTP status
- last audit timestamp
- stable site identity for comparison

Reason: change over time creates stronger lead timing signals than one-off snapshots.

## Priority 2: Review Workflow Hardening

Improve the static review workspace while keeping it file-based.

Targets:

- preserve review-status.json cleanly across regenerations
- add selected/rejected/reviewed counts to generated metadata
- improve shortlisted CSV columns for CRM import
- add clearer operator instructions in the generated workspace
- support optional seeded review-status input

Reason: review operations are now the bridge between raw intelligence and sales action.

## Priority 3: Richer Deterministic SEO Signals

Expand SEO extraction without introducing Lighthouse or AI summaries yet.

Targets:

- title length
- meta description length
- canonical URL
- robots directives
- sitemap discovery
- Open Graph tags
- Twitter card tags
- heading structure quality
- internal/external link counts

Reason: these are fast, deterministic, explainable, and commercially useful.

## Priority 4: CRM And Export Integration

Add exports that match practical lead workflows.

Targets:

- enriched CSV export from shortlisted leads
- normalized lead schema
- source spreadsheet row mapping
- stable lead IDs
- import-ready columns for spreadsheet/CRM tools

Reason: Webconsult ultimately needs lead-processing output, not only audit artifacts.

## Priority 5: Multi-Run Analytics

Aggregate audit results across runs.

Targets:

- run index
- average lead score
- score distribution
- top issue categories
- top technologies detected
- failure rate
- highest-opportunity leads

Reason: this turns many audits into operational intelligence.

## Later Layers

- parallel worker execution
- dashboard UI
- outreach intelligence
- LLM-assisted summaries
- proposal generation
- autonomous outreach drafts
- distributed execution

These should remain later-stage work. The current advantage is deterministic browser-observed intelligence with file-based operational surfaces.

## Operating Principles

- keep outputs structured and machine-operable
- prefer deterministic signals over AI guesses
- preserve verification scripts for every capability layer
- commit capability milestones cleanly
- keep project repos isolated from infrastructure history
