# Lead Queue Quality Shared Rules V1

## Objective

Remove drift risk between frontend and backend call-readiness / queue-quality rules.

## Problem

`leadQueueQuality` now exists in both:

- `apps/lead-machine-demo/workQueues.js`
- `apps/lead-machine-demo/public/app.js`

That keeps the UI responsive, but rule changes can diverge and place the same lead in different queues.

## Preferred Direction

Keep the shared source of truth in server-side CommonJS modules and attach normalized queue/readiness facts to every returned lead.

The frontend should mostly render those facts, with only lightweight fallback logic for old cached runs.

## Scope

- Expose queue-quality facts from `workQueues.js`.
- Attach queue-quality/readiness metadata in API payloads.
- Replace duplicate frontend logic with a renderer/fallback.
- Add tests proving backend and frontend-visible payload agree.

## Boundaries

Do not add automatic queue mutations or hidden AI decisions.

## Success Criteria

- A lead has one authoritative queue-quality result in API output.
- Frontend queue filtering uses that result when present.
- Existing call queues continue to work.
- Phone-ready review leads stay callable when location/contact quality is good.
- Foreign/non-Norwegian phone-like leads stay out of `call_now`.
