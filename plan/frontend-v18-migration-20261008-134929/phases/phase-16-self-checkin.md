# Phase 16 — Self check-in (user app)

**Status: Complete (2026-10-08).** All four steps shipped, including the
`checkin_mode` picker in both forms (see "Implementation notes" below).
`npm run lint` and `npm run build` both pass.

**Spec section:** "Self Check-In — User App".
**Depends on:** None strictly, but only meaningful once at least one event has `checkin_mode: 'self_scan'` (set at creation/request time — Phase 2's `EventForm` and Phase 12's event-request form should expose a `checkin_mode` choice for this to be testable end to end).
**Risk:** Low-medium — needs camera/QR-scan UI on the user side; check whether `components/organizer/CheckInScanner.jsx` already has reusable scanning logic.
**Independently shippable:** Yes.

## Steps

1. `app/actions.js` — add `selfCheckInAction(_prevState, formData)` → `POST /api/user/checkin/self-scan`, body `{ venueToken }`.
2. Inspect `components/organizer/CheckInScanner.jsx` first — if it wraps a reusable scan-input or camera-based QR reader, extract/reuse it for the user-side version rather than building a second implementation from scratch.
3. `app/(app)/bookings/page.js` (or its booking-detail component, confirm which file renders a single booking's expanded view) — when `event.checkin_mode === 'self_scan'`, render a "Scan venue QR" entry point instead of (or in addition to) showing the booking's own QR for staff to scan. For `staff_scan` events, no change (doc: "nothing changes").
4. Expose `checkin_mode` as a field in the event-creation / event-request forms from Phases 2 and 12 (small addition to each, cross-reference back into those phases if they ship first) — otherwise this feature has no way to be exercised.

## Files

- `app/actions.js`
- `components/bookings/BookingsList.jsx` or a new `components/bookings/SelfCheckIn.jsx` (confirm exact file during implementation)
- `components/organizer/CheckInScanner.jsx` (read for reuse, no guaranteed edit)
- `components/organizer/EventForm.jsx`, `components/events/EventRequestForm.jsx` (from Phase 12) — add `checkin_mode` field

## Verification

- `npm run lint`
- `npm run build`
- Manual: create/approve an event with `checkin_mode: 'self_scan'`, book it as a user, scan the venue token (or paste it in a dev fallback input), confirm the booking flips to `attended` and attendance points post.
- Manual: confirm a `staff_scan` event's booking detail view is unchanged.
- Manual steps not yet run against a live backend in this session (no dev
  server was started) — verified by direct source reading instead (see
  "Implementation notes"). Run the manual steps above before shipping to
  confirm end to end.

## Implementation notes (2026-10-08)

Verified directly against `backend/lib/services/checkinService.js`,
`eventService.js`, `eventRequestService.js`, and `routes/user.js` before
writing any code — confirmed `POST /api/user/checkin/self-scan` body is
`{ venueToken }` (matches the doc), the venue token is
`event.checkin_qr_token` (format `EVMFU-EVT_XXXXXX`, generated only when
`checkin_mode === 'self_scan'`), and `GET /api/user/bookings` embeds the raw
event row (so `booking.event.checkin_mode` is present with no extra fetch).

- **`app/actions.js`** — added `selfCheckInAction(_prevState, formData)`
  (`POST /api/user/checkin/self-scan`, revalidates `/events/:id` + `/bookings`
  on success), mirroring the existing `checkInByTokenAction` pattern in
  `app/organizer/actions.js` (plain text field, not a camera — the backend
  resolves the event purely from the literal token string). Also added
  `checkin_mode` to `eventRequestFieldsFrom` (defaulting to `'staff_scan'`)
  and removed the now-stale "deliberately absent" comment Phase 12 left
  behind.
- **`components/organizer/CheckInScanner.jsx`** — inspected per step 2; it is
  a plain `useActionState` + text-input form, no camera/scan-library
  dependency to extract. Reused the same shape for the new component rather
  than introducing one.
- **Booking detail view** — the booking list (`BookingsList.jsx`) only links
  to the event detail page; the actual single-booking expanded view (QR
  token, cancel action) is `components/events/BookingPanel.jsx`, rendered
  from `app/(app)/events/[id]/page.js`. Added a new
  `components/bookings/SelfCheckIn.jsx` (same `useActionState` pattern as
  `CheckInScanner`) and wired it into `BookingPanel`: the existing
  staff-scan QR-token block is now gated on `!isSelfScan` (so `staff_scan`
  events are pixel-for-pixel unchanged, per the doc's "nothing changes"),
  and `SelfCheckIn` renders instead when `event.checkin_mode === 'self_scan'`
  and the booking is still `booked`. No change needed to `BookingsList.jsx`
  or `bookings/page.js` itself.
- **`checkin_mode` picker — in scope, not deferred.** Phase 12's
  `app/actions.js` and `components/events/EventRequestForm.jsx` both carried
  an explicit code comment ("`checkin_mode` is deliberately absent — added
  in a later phase alongside self check-in") pointing at this phase, and this
  phase's own step 4 / Files list name both `EventForm.jsx` and
  `EventRequestForm.jsx` directly. Added a `checkin_mode` select (`staff_scan`
  default / `self_scan`) to both `components/organizer/EventForm.jsx` and
  `components/events/EventRequestForm.jsx`, and added `checkin_mode` to
  `app/organizer/actions.js`'s `eventFieldsFrom` (defaulting to
  `'staff_scan'`) alongside the `app/actions.js` addition above. Backend
  (`eventService.createEvent`/`updateEvent`,
  `eventRequestService.createRequest`) accepts `checkin_mode` directly on
  all three paths — confirmed by reading the service source, no drift found
  here.
- **New shared constants** — added `CHECKIN_MODE` and `CHECKIN_MODE_LABELS`
  to `lib/events.js`, following the existing `MEMBER_ROLE_LABELS` pattern,
  so the picker and the `BookingPanel` gate share one source of truth.
- **Drift found:** none beyond the expected (checkin_mode support already
  existed on the backend across all three write paths; the frontend gap was
  exactly what Phase 12's comment and this phase's steps already flagged).
- **Out of scope, not touched:** admin's `EventRequestReview.jsx`/event
  detail pages don't render `checkin_mode` anywhere; `app/admin/events/new`
  uses a separate `PointEventForm` (not `EventForm`) for admin's own direct
  point-event creation path, so it still defaults to `staff_scan` — neither
  was named in this phase's file list, left untouched.

### Files changed

- `app/actions.js` — `selfCheckInAction`; `checkin_mode` added to
  `eventRequestFieldsFrom`; stale deferred-comment removed.
- `app/organizer/actions.js` — `checkin_mode` added to `eventFieldsFrom`.
- `components/bookings/SelfCheckIn.jsx` — new.
- `components/events/BookingPanel.jsx` — self-scan gating + `SelfCheckIn`
  wire-up.
- `components/organizer/EventForm.jsx` — `checkin_mode` select.
- `components/events/EventRequestForm.jsx` — `checkin_mode` select; stale
  deferred-comment removed.
- `lib/events.js` — `CHECKIN_MODE`, `CHECKIN_MODE_LABELS`.
- `styles/components.css` — minor `.self-checkin` spacing rule.
