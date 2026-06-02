# Seller Work Queues V1

Lead Machine now treats workflow state as seller work queues, not just saved searches or loose call notes.

## Purpose

The goal is to make the product behave like a daily seller desk:

```text
find leads
-> choose the right work queue
-> call or verify
-> log outcome
-> set follow-up
-> return to the correct queue later
```

Saved markets remain search history. Work queues are the operational list a seller works from.

## Queues

| Queue id | Visible label | Meaning |
| --- | --- | --- |
| `call_now` | Ring nå | Contact-ready lead that should be called. |
| `no_answer` | Ingen svar | Contact attempt happened, but nobody answered or no response was reached. |
| `follow_up_today` | Oppfølging i dag | Follow-up date is today or overdue. |
| `interested` | Interessert | Lead showed interest or a meeting was booked and needs next action. |
| `verify_first` | Må verifiseres | Identity, location, contact path, or seller-fit risk should be checked before calling. |
| `not_relevant` | Ikke relevant | Seller rejected the lead or marked it not relevant. |
| `archived` | Arkiv | Hidden from active work queues by default. |

## Workflow Rules

- Strong/good contact-ready leads with `recommendedAction: contact` enter `call_now`.
- Leads with `recommendedAction: verify`, missing/uncertain identity, risky location, or weak contact data enter `verify_first`.
- `no_answer` or `no_response` moves the lead to `no_answer` and creates/suggests a later follow-up when no date exists.
- If `followUpDate` / `nextFollowUpAt` is today or overdue, the effective queue is `follow_up_today`.
- `interested` or `meeting_booked` moves the lead to `interested`, unless the follow-up is due today.
- `rejected` or outcome text containing not relevant/rejected moves the lead to `not_relevant`.
- Manual queue override is allowed when no stronger outcome rule overrides it.
- Archive moves the lead to `archived` and hides it from active queue views.

## Data Model

Existing workflow state is extended, not replaced:

```js
workflow: {
  status,
  queue,
  owner,
  contacted,
  channel,
  personReached,
  response,
  notes,
  followUpDate,
  nextFollowUpAt,
  lastContactedAt,
  nextAction,
  outcome,
  archivedAt,
  updatedAt,
  activities,
  activityLog,
}
```

Activity entries include queue movement and contact context:

```js
{
  id,
  createdAt,
  at,
  type,
  status,
  queue,
  fromQueue,
  toQueue,
  channel,
  response,
  personReached,
  followUpDate,
  nextFollowUpAt,
  lastContactedAt,
  nextAction,
  outcome,
  notes,
}
```

## UI V1

The seller desk now shows explicit queue tabs with counts:

- Ring nå
- Ingen svar
- Oppfølging i dag
- Interessert
- Må verifiseres
- Ikke relevant
- Arkiv

The selected lead note panel shows current queue, last contacted, next follow-up, manual queue move, and Archive. Saving a note or quick action updates the queue through the same workflow API used by local and Netlify beta storage.

## Persistence

V1 uses the existing local workspace store:

- SQLite local workspace when `node:sqlite` is available.
- JSON fallback when SQLite is unavailable.
- Netlify hosted beta uses Netlify Blobs when available, otherwise temporary JSON.

No auth, billing, CRM, email sync, telephony backend, or new database migration is added in V1.

## Export

CSV/workspace export now includes queue-oriented fields:

- `workflowQueue`
- `workflowStatus`
- `owner`
- `followUpDate`
- `nextFollowUpAt`
- `lastContactedAt`
- `nextAction`
- `latestOutcome`
- `workflowNotes`

## Not Included Yet

- Per-user login/workspaces.
- Team ownership rules beyond the `owner` field.
- Email/calendar/CRM sync.
- Automatic calling or outreach.
- Generated call scripts or sales copy.
- Proff/SSB/Hermes expansion.

## Future Path

After V1 is stable with testers, the next product step is durable SaaS workspace storage: users, teams, Postgres/Supabase or similar, and queue history per seller. Email/calendar integrations should come after manual queue behavior is proven.
