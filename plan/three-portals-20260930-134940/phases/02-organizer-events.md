# Phase 2 — organizer events

Status: **done**

Pages: `/organizer`, `/organizer/events/new`, `/organizer/events/[id]`,
`/organizer/events/[id]/edit`.

`app/organizer/actions.js` covers create, update, submit, resubmit, clone,
open/close registration and cancel.

Verified against the running backend — the buttons offered match
`EVENT_TRANSITIONS` for each status:

| Event | Status | Actions offered |
| --- | --- | --- |
| e7 | draft | Edit draft, Submit for review, Duplicate, Cancel |
| e14 | under_review | Duplicate only |
| e1 | registration_open | Close registration, Duplicate, Cancel |
| e2 | completed | Duplicate only |

`/organizer/events/e1/edit` → 307 back to the detail page, since
`updateEvent` is DRAFT-only for non-admins.
