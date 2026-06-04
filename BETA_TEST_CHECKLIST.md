# Beta Test Checklist

Purpose: test Lead Machine as a daily seller desk, not as a finished SaaS.

## Before Testing

- Use the Netlify beta URL.
- API keys are configured in Netlify; testers should not add keys locally.
- Use manual calling only. The app opens `tel:` links and logs outcomes; it does not call, record, email, or sync CRM automatically.

## Test Flow

1. Broad Norway search
   - Search for `frisør`, `rørlegger`, or `escape room` with `Hele Norge`.
   - Confirm that the app shows `Norge-sweep` and groups leads by city.

2. City focus
   - Click a city chip such as Bergen, Oslo, or Bodø.
   - Confirm the lead list only shows leads from that city.
   - Click `Alle byer` to return to the full list.

3. Call and no answer
   - Open a lead with a phone number.
   - Click `Call now` if you want to test the phone link.
   - Log `No answer` and save a short note.
   - Confirm follow-up is set for tomorrow and the lead moves out of the active call-now flow.

4. Interested lead
   - Mark one lead as `Interested`.
   - Save a note with what happened and what should happen next.
   - Confirm it appears in the Interested queue and has a follow-up date.

5. Verification check
   - Pick one lead marked `Bør vurderes` or `Verifiser først`.
   - Use `Enrich lead` if available.
   - Confirm the app makes Brreg/contact confidence easier to understand.

## Feedback Questions

- Did you understand which lead to call first?
- Did city grouping help or slow you down?
- Was the difference between `Ring nå`, `Må verifiseres`, and `Interessert` clear?
- Did notes and follow-up save exactly when expected?
- Which lead looked wrong, irrelevant, duplicated, or outside Norway?
- What information did you need before calling that was missing?

## Known Limits

- One shared beta workspace for now.
- No login/users yet.
- No CRM, email sync, call recording, or automated outreach.
- 1881 and Proff are not connected yet.
- Broad searches are capped to protect Google cost and speed.
