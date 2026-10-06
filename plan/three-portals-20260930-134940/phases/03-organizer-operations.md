# Phase 3 — running an event

Status: **done**

- `TeamManager` — event team add / change role / remove, with user search
  through `searchUsersAction` (the browser cannot call the backend directly).
- `AttendeeList` — per-booking check-in and no-show.
- `CheckInScanner` at `/organizer/check-in` — `POST /checkin/scan`; a text
  field, since `qr_token` is the literal string the QR encodes.
- `AnswerForm` — answering event questions.
- `ItemRequestForm` — `PUT .../item-requests` replaces all pending rows, so the
  form always posts the complete list; resolved rows render read-only.
- `/organizer/venues` — availability for a time window, with conflicts named.

Check-in staff see attendance only: the backend blanks `questions` and
`reviews` for that role and the page follows the same rule.
