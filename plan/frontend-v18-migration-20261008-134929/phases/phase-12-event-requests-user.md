# Phase 12 — Event Requests (user app): `org_id` required for every role

**CORRECTED 2026-10-08.** The original version of this phase was written
against a stale premise (students needed an org, faculty/staff could go solo
via `represented_as`). Backend commit `1411ddd` removed the solo
`represented_as` path entirely: `POST /api/user/event-requests` now requires
`org_id` for **every** role (student, faculty, staff) and 403s if it's
missing, the org isn't active, or the user isn't an active member. See
`plan.md`'s "Doc inconsistency" callout — the migration doc's TL;DR line
("no club/department membership required") is stale; its own breaking-change
§2 and "Event Requests — User App" section (which this phase now follows)
are correct.

**Spec section:** "Event Requests — User App" (current version of the doc —
already reflects the `org_id`-required rule; only the stale TL;DR
contradicts it).
**Depends on:** Phase 1/2 conceptually (same org-membership-sourcing pattern
as Phase 2's create-event form — reuse it rather than re-deriving). No hard
code dependency.
**Risk:** Medium — new multi-state form (pending → needs_info ↔ pending →
approved|rejected) with a resubmit flow, **plus** the same org-membership
gating logic as Phase 2, duplicated on a second form.

**Independently shippable:** Yes.

## Steps

1. New server actions (append to `app/actions.js`, following the existing
   `'use server'` + `failure(error)` pattern):
   - `submitEventRequestAction(_prevState, formData)` → `POST
     /api/user/event-requests`, body per doc:
     ```
     { org_id, title, description, agenda, equipment_needs, contact_phone,
       venue_preference, start_time, end_time, capacity, audience_type,
       target_school, target_year, checkin_mode, points_value }
     ```
     `org_id` is **required** — read it from the form the same way
     `createEventAction` (Phase 2) reads its org picker, and reject locally
     with a clear error if absent, mirroring Phase 2's guard clause (belt and
     suspenders — the backend also 403s, but a local check gives a faster,
     clearer error without a round trip). Reuse `fromLocalInput`/validation
     helpers from `lib/events.js` the same way `app/organizer/actions.js`
     does for its event form.
   - `resubmitEventRequestAction(_prevState, formData)` → `POST
     /api/user/event-requests/:id/resubmit`. Per
     `backend/lib/services/eventRequestService.js` (`resubmitRequest`), the
     patch body is applied mostly as-is (only `status`/`resulting_event_id`/
     `requested_by` are stripped server-side) and **membership is not
     re-validated on resubmit**. Keep `org_id` **read-only** in the resubmit
     form (render it as plain text, don't include an editable picker) —
     don't give the user a way to silently swap the org on resubmit; this is
     a backend quirk worth flagging during review, not something to route
     around on the frontend.
2. Org picker — **same data source and shape as Phase 2's `EventForm`
   correction**, duplicated here since this is a separate form:
   - Fetch `memberships` via `getMyOrganizers()` (`lib/session.js`) — this
     does **not** require the organizer-portal guard (`requireOrganizer()`),
     just a signed-in user, so call it directly from the page, not through
     the organizer guard.
   - Filter to `memberships.filter((m) => m.org?.status === 'active')` —
     identical rule to Phase 2, for the identical reason (membership record
     being `active` doesn't guarantee the org itself is).
   - If the filtered list is empty: block the form the same way Phase 2
     does — explanatory copy ("You need to be an active member of an
     organization to submit an event request."), no submit button, no
     silent redirect. Consider extracting a tiny shared helper/component for
     this "no active org memberships" empty state since it's now needed in
     two places (Phase 2's `/organizer/events/new` and this page) — not
     required, but flag it for the implementer as a reasonable dedup.
   - Render the picker using the real membership shape: `membership.org_id` /
     `membership.org?.name` (not `organizer_id`/`organizer` — see Phase 2's
     correction for the same field-name note).
3. New pages under `app/(app)/`:
   - `app/(app)/event-requests/page.js` — list via `GET
     /api/user/me/event-requests`, status badges (reuse `eventStatusMeta`-style
     pattern but for request statuses `pending/needs_info/approved/rejected` —
     add a small status-meta map to `lib/events.js` alongside
     `EVENT_STATUS_META`). Show the org name per request (now always present,
     unlike the old `represented_as`-or-null framing) — e.g. "Requested for:
     {request.org?.name}" if the list endpoint embeds the org, otherwise just
     `org_id` until the detail page resolves it.
   - `app/(app)/event-requests/new/page.js` — fetches `memberships` per step 2,
     renders the org-picker-gated form using `submitEventRequestAction`,
     mirroring `components/organizer/EventForm.jsx` field-for-field where the
     fields overlap (title, description, start/end time, capacity, audience
     type/target) plus the request-only fields (agenda, equipment_needs,
     contact_phone, points_value) and the required org picker.
   - `app/(app)/event-requests/[id]/page.js` — detail view. When `status ===
     'needs_info'`, show `admin_feedback` prominently and render the resubmit
     form pre-filled with the existing values (mirror `EventForm`'s
     create/edit dual-mode pattern), with `org_id` shown read-only per step 1.
4. `components/navigation/navItems.js` — add `{ href: '/event-requests',
   label: 'Event Requests', icon: '...' }` to `userNavItems`.

## Files

- `app/actions.js`
- `app/(app)/event-requests/page.js` (new)
- `app/(app)/event-requests/new/page.js` (new)
- `app/(app)/event-requests/[id]/page.js` (new)
- `components/events/EventRequestForm.jsx` (new)
- `lib/events.js` (add event-request status meta)
- `components/navigation/navItems.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual: user with **zero** active org memberships → `/event-requests/new`
  shows the blocking explanation, no form, no crash. (Same regression class
  as Phase 2 — test it independently here too, since this is a separate
  form/page, not shared code.)
- Manual: user with an active org membership → submit a new event request,
  confirm it appears in the list as `pending` with `org_id` set correctly.
- Manual: submit with `org_id` omitted via a tampered request (or temporarily
  stub the picker) → confirm the backend's 403 surfaces as a readable error,
  not a crash.
- Manual (needs a backend admin action, see Phase 13): after an admin marks a
  request `needs_info`, confirm the resubmit form appears with the feedback
  shown, `org_id` rendered read-only (not editable), and resubmitting moves
  it back to `pending`.

## Outcome

**Complete (2026-10-08).** Implemented as specified. Verified the exact
request/response shapes directly against
`MFU-Events/backend/routes/user.js` and
`MFU-Events/backend/lib/services/eventRequestService.js` before writing any
code:

- Confirmed `createRequest`'s accepted body fields exactly match the doc:
  `org_id, title, description, agenda, equipment_needs, contact_phone,
  venue_preference, start_time, end_time, capacity, audience_type,
  target_school, target_year, checkin_mode, points_value`. `checkin_mode` is
  deliberately **not** exposed as a form field yet — `plan.md`'s Phase 16
  entry explicitly defers adding a `checkin_mode` control to this form
  ("checkin_mode field added to Phase 2/12's forms"), so it's omitted here
  and the backend's `'staff_scan'` default applies. `points_value` **is**
  included as a plain number input, since the phase file's own step 3 lists
  it as one of the "request-only fields" to add now (unlike `checkin_mode`).
- Confirmed `GET /api/user/me/event-requests` and `GET
  /api/user/event-requests/:id` both return the **raw** `EventRequest` row —
  no embedded `org` object (neither route calls `orgService.getById`, unlike
  the event feed's `eventSummary()`). So the org name is resolved client-side
  by cross-referencing `request.org_id` against the signed-in account's own
  `getMyOrganizers()` memberships (not just the active-filtered subset used
  for the picker — a request can reference an org the account is no longer
  an active member of) on both the list and detail pages, falling back to
  the bare `org_id` if no matching membership is found. This is a real shape
  finding beyond the doc, which doesn't mention embedding either way.
- Confirmed `resubmitRequest` strips only `status`/`resulting_event_id`/
  `requested_by` from the patch and does **not** re-validate org membership.
  `resubmitEventRequestAction` never includes `org_id` in its body at all
  (not even as a no-op), so there is no code path that could silently swap
  the org on resubmit — matches the phase file's read-only requirement
  exactly, mirroring how `app/organizer/events/[id]/edit/page.js` already
  omits the `org_id` field/picker entirely on edit rather than disabling it.
  `EventRequestForm` renders the org as plain text (`<p>`) in resubmit mode,
  not a disabled `<select>`.
- `GET /api/user/event-requests/:id` 403s for anyone but the requester or an
  admin (confirmed in `routes/user.js`) — handled with the same
  `notFound()`-on-403/404 pattern as `app/organizer/events/[id]/page.js`.
- No drift found beyond the two items above (both additive findings, not
  doc contradictions) — the `org_id`-required rule, status enum, and
  resubmit behavior all matched the already-corrected phase file exactly.

**Files created:**
- `app/(app)/event-requests/page.js`
- `app/(app)/event-requests/new/page.js`
- `app/(app)/event-requests/[id]/page.js`
- `components/events/EventRequestForm.jsx`

**Files changed:**
- `app/actions.js` — added `submitEventRequestAction`, 
  `resubmitEventRequestAction`, and their shared `eventRequestFieldsFrom`/
  `validateEventRequest` helpers (mirrors `app/organizer/actions.js`'s
  `eventFieldsFrom`/`validate` pattern); imports `fromLocalInput` from
  `lib/events.js`.
- `lib/events.js` — added `EVENT_REQUEST_STATUS` and
  `eventRequestStatusMeta()`, mirroring the existing `EVENT_STATUS`/
  `eventStatusMeta()` pattern.
- `components/navigation/navItems.js` — added `{ href: '/event-requests',
  label: 'Event Requests', icon: 'calendar' }` to `userNavItems` (reused the
  existing `calendar` icon rather than adding a new one — no icon budget was
  called for in the phase file, and the icon set is deliberately a small
  curated list per `components/common/Icon.jsx`'s own comment).

`EventRequestForm` mirrors `components/organizer/EventForm.jsx` field-for-
field where fields overlap (org picker, title, description, start/end time,
capacity, audience type/target, venue preference) plus the request-only
fields (`agenda`, `equipment_needs`, `contact_phone`, `points_value`), per
the phase file's step 3. The zero-eligible-org blocking state in
`app/(app)/event-requests/new/page.js` duplicates Phase 2's copy/markup
verbatim (not extracted into a shared component) — the phase file flagged
this dedup as optional, not required, so it was left as a duplicate to keep
this phase's diff self-contained and independently revertable.

- `npm run lint` — clean, no errors/warnings.
- `npm run build` — compiled successfully; `/event-requests`,
  `/event-requests/new`, `/event-requests/[id]` all listed as dynamic (`ƒ`)
  routes alongside the existing user-portal pages.

## Correction addendum (2026-10-08) — resubmit org-membership re-check resolved server-side

This phase's own "Risks and unknowns" entry (also listed in `plan.md`'s
top-level follow-ups) flagged that `eventRequestService.resubmitRequest`
did **not** re-validate org membership/org-active-status on resubmit,
unlike `createRequest`. `MFU-Events` commit `029684f` fixed this
server-side: `resubmitRequest` now calls the same `_checkOrgEligibility`
guard, confirmed at `backend/lib/services/eventRequestService.js:122-125`.

**No frontend code change is required.** `resubmitEventRequestAction`
(`app/actions.js:374-390`) already routes any non-2xx response through the
existing `failure(error)` helper, which surfaces `ApiError.message`
verbatim — exactly the same 403 messages `createRequest`'s own call site
already handles (`"Organization not found or not active."` / `"You are
not a member of this organization."`). This was already correct before
the backend fix (the frontend never assumed resubmit was safe — it just
kept `org_id` read-only in the resubmit form as a precaution, per this same
section above); the backend fix simply closes the server-side gap the
frontend form's read-only `org_id` was deliberately working around.

**One stale comment remains and should be fixed whenever this file is next
touched** (not urgent enough to warrant its own phase): the doc comment at
`app/actions.js:370-372` says "the backend doesn't re-validate membership
on resubmit (see Phase 12 notes in plan.md)" — this is no longer true.
Update it to note that the backend now re-checks eligibility on resubmit
too, and that `org_id` stays read-only here simply because there's no
legitimate reason to let a resubmit silently swap which org a request is
for, not because of a backend gap. See `research/requirements.md`'s
2026-10-08 addendum for the full verification trail.
