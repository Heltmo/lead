# Next Milestone

The platform now has deterministic audit intelligence, report surfaces, a static lead review workspace, CRM-ready shortlisted lead export, and richer normalized review state. The next phase should add continuity across runs before dashboard or AI outreach layers.

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
- comparison output as deterministic JSON and CSV

Reason: change over time creates stronger lead timing signals than one-off snapshots.

## Priority 2: CRM Export Hardening On Real Data

Improve the shortlisted CRM handoff after testing it on real batches.

Targets:

- source spreadsheet row mapping
- deterministic lead ID column
- configurable output filename
- validate phone/email selection rules against real lead files
- optional owner/priority/nextAction export presets

Reason: selected leads need clean handoff into spreadsheet/CRM/outreach workflows.

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

## Later Layers

- multi-run analytics
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
