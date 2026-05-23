# Next Milestone

The platform now has deterministic audit intelligence, report surfaces, a static lead review workspace, and CRM-ready shortlisted lead export. The next phase should improve review state quality and continuity before adding dashboard or AI outreach layers.

## Priority 1: Review State Improvements

Make review-status.json more useful as a lightweight operator state file.

Targets:

- priority field: low, medium, high
- nextAction field: review, contact, monitor, reject
- owner field
- lastReviewedAt field
- tags field
- validation/normalization for review status records
- preserve existing status/notes compatibility

Reason: richer review state turns the static workspace into a lightweight lead operations layer before a real CRM exists.

## Priority 2: Historical Comparisons

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

## Priority 3: CRM Export Hardening

Improve the shortlisted CRM handoff after testing it on real batches.

Targets:

- source spreadsheet row mapping
- optional owner/priority/nextAction columns
- normalized phone/email selection rules
- deterministic lead ID column
- configurable output filename

Reason: selected leads need clean handoff into spreadsheet/CRM/outreach workflows.

## Priority 4: Richer Deterministic SEO Signals

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
