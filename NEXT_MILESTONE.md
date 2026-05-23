# Next Milestone

The report-surface layer now exists. The next phase should improve continuity, comparison, and operational use of generated intelligence without jumping straight to agent swarms or heavy AI reasoning.

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

## Priority 2: Richer Deterministic SEO Signals

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

## Priority 3: CRM And Export Integration

Add exports that match practical lead workflows.

Targets:

- enriched CSV export from report surfaces
- normalized lead schema
- source spreadsheet row mapping
- stable lead IDs
- import-ready columns for spreadsheet/CRM tools

Reason: Webconsult ultimately needs lead-processing output, not only audit artifacts.

## Priority 4: Multi-Run Analytics

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

## Priority 5: Parallel Execution

Only add concurrency after sequential orchestration remains stable.

Targets:

- configurable worker count
- per-domain throttling
- retry backoff
- timeout controls
- safe interruption/resume behavior

Reason: parallelism is useful, but reliability and recoverability matter more.

## Priority 6: Dashboard

A dashboard should come after reports, history, and exports exist.

Targets:

- run list
- run status
- top leads
- issue category filters
- screenshots
- per-site detail pages

Reason: dashboards are valuable once the underlying data model is stable.

## Later Layers

- outreach intelligence
- LLM-assisted summaries
- proposal generation
- autonomous outreach drafts
- deeper orchestration routing
- distributed execution

These should remain later-stage work. The current advantage is deterministic browser-observed intelligence.

## Operating Principles

- keep outputs structured and machine-operable
- prefer deterministic signals over AI guesses
- preserve verification scripts for every capability layer
- commit capability milestones cleanly
- keep project repos isolated from infrastructure history
