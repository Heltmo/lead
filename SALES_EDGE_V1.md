# Sales Edge V1

## Purpose

Sales Edge is the seller-facing decision layer in Lead Machine.

It does not find more leads, write outreach, or mutate queues automatically. It turns existing source trust, seller fit, and workflow state into one clear next action for the seller.

## Source Fusion vs Sales Edge

Source Fusion is source/data trust:

- identityConfidence
- contactConfidence
- locationConfidence
- leadConfidence
- sourceCoverage
- proofReasons
- riskReasons
- warnings

Sales Edge is seller decision support:

- recommendedTrustAction
- one primary next action
- queue guidance
- proof/caution summary
- export-ready confidence fields

## Confidence Dimensions

Identity confidence answers whether the legal company identity is usable:

- confirmed
- manual_verify
- unknown

Contact confidence answers whether the seller has a usable contact path:

- strong
- good
- review
- weak

Location confidence answers whether the lead belongs to the requested market:

- exact
- nearby
- fallback
- conflict
- unknown

Seller fit comes from the seller-fit engine and depends on the selected seller intent.

## Recommended Trust Action

Sales Edge keeps one primary seller action visible:

- call: trusted enough to call.
- verify_first: identity, contact, or location needs checking.
- follow_up_today: workflow follow-up is due and overrides new-call priority.
- skip: weak fit or weak source confidence.
- verify_enrich: run a focused selected-lead check when the fast lead needs more context.

## Queue Behavior

Work queues respect the action boundary:

- call -> call-now queue and primary call action.
- verify_first -> verification queue before calling.
- skip -> not relevant, archived, or review before action.
- due follow-up -> follow-up-today queue before new-call priority.

Manual workflow overrides remain available. V1 does not auto-move leads without the seller saving a workflow/action.

## Export

CSV exports include the confidence/action fields needed for beta review:

- identityConfidence
- contactConfidence
- locationConfidence
- sellerFit
- recommendedTrustAction
- sourceCoverage
- proofReasonsSummary
- riskReasonsSummary
- sourceFusionWarnings
- warningsSummary
- workflowQueue
- queue
- nextAction

## Provider Boundary

Sales Edge V1 uses existing Lead Machine data only: Google Places, Brreg, contact/company fields, seller fit, source fusion, workflow, and selected-lead Verify & Enrich context.

1881 and Proff come later because they are more valuable after the trust/action model is stable:

- 1881 can improve contactConfidence.
- Proff can improve commercial context after org.nr is reliable.

V1 does not add 1881, Proff, SSB, outreach automation, call scripts, or ready-to-send messages.
