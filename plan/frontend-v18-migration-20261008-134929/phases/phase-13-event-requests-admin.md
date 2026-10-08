# Phase 13 — Event Requests (admin app)

**Status: Complete (2026-10-08).** See "Implementation notes (2026-10-08)" at
the bottom of this file for the files touched, the org-embedding finding,
and the shared-component decision.

**Spec section:** "Event Requests — Admin App".
**Depends on:** Phase 12 (need real requests to review) for manual testing, but not for implementation.
**Risk:** Medium — new eligibility panel shares shape with `requester_snapshot` from Phase 5; reuse rather than duplicate.
**Independently shippable:** Yes.

## Steps

1. `app/admin/actions.js` — add:
   - `eventRequestDecisionAction(requestId, step, feedback)` for `approve` (no body), `reject`/`needs-info` (body `{ feedback }`, same required-feedback validation pattern as `adminEventAction`'s `reject`/`request-changes` branch, line 42-45).
2. New pages:
   - `app/admin/event-requests/page.js` — list via `GET /api/admin/event-requests`, `FilterTabs` with `pending/needs_info/approved/rejected` (same `FilterTabs` component used everywhere else, see `app/admin/organizers/page.js:45` for the exact usage pattern).
   - `app/admin/event-requests/[id]/page.js` — detail via `GET /api/admin/event-requests/:id`, render the `eligibility` object (`user_id, name, health_score, organizer_restricted, events_organized, open_health_flags, open_organizer_flags`) using the same `healthBand()` badge pattern planned for Phase 5's `requester_snapshot` panel — consider extracting a shared `<RequesterHealthPanel snapshot={...} />` component used by both this page and `app/admin/events/[id]/page.js`, since the two shapes (`eligibility` vs `requester_snapshot`) overlap almost completely per the doc.
   - Approve/Reject/Needs-info buttons following the `EventReview.jsx` modal-for-feedback pattern (line 122-162) — reuse that exact `Modal` + feedback-textarea structure for reject/needs-info.
3. `components/navigation/navItems.js` — add `{ href: '/admin/event-requests', label: 'Event Requests', icon: '...' }` to `adminNavItems`.

## Files

- `app/admin/actions.js`
- `app/admin/event-requests/page.js` (new)
- `app/admin/event-requests/[id]/page.js` (new)
- `components/admin/EventRequestReview.jsx` (new, modeled on `components/admin/EventReview.jsx`)
- `components/admin/RequesterHealthPanel.jsx` (new, shared with Phase 5 if timed together)
- `components/navigation/navItems.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual: as admin, list pending event requests, open one, confirm the eligibility panel renders real values.
- Manual: approve one — confirm it creates a draft event (doc: "creates the draft event") and that event shows up in `/admin` events list with `source_request_id` set.
- Manual: reject/needs-info one with feedback — confirm the user sees it in Phase 12's detail page.

## Correction note (2026-10-08)

Added after reviewing backend commit `1411ddd`, which made `org_id`
mandatory on every event request (see Phase 12's corrected file). This
phase's original steps above did not assume an org-optional path, so no
structural rewrite is needed — but add one thing while building the detail
page: **every request now always has an `org_id`** (never `null`, never a
`represented_as` fallback), so the admin detail page (step 2 above) should
render the org name as a first-class field (e.g. "Requesting org:
{request.org?.name ?? request.org_id}") rather than treating it as optional
context. If `GET /api/admin/event-requests/:id` does not already embed the
org object, resolve it via `GET /api/admin/organizations/:id` (Phase 6) or
confirm with the backend whether it's embedded before building this — do not
assume a `represented_as` field will ever be populated on new requests
(pre-existing seed requests `er1`/`er2` with `org_id: null` are the only
legitimate `null` case, per backend test comments, and predate this rule).

## Implementation notes (2026-10-08)

**Org-embedding question resolved:** confirmed by reading
`backend/routes/admin.js` directly (not inferred from the doc). Neither
`GET /api/admin/event-requests` nor `GET /api/admin/event-requests/:id`
embeds an `org` object — same gap as Phase 12 found on the user side. Both
routes *do* embed `requester` (`userService.getById(r.requested_by)`), and
the detail route also embeds `eligibility`
(`eventRequestService.eligibilitySnapshot`), matching the shape in this
file's steps exactly. Unlike the user app (which cross-references its own
`getMyOrganizers()` memberships), the admin app has no "my org" shortcut, so
org names are resolved via `GET /api/admin/organizations` (list page — one
bulk fetch into an `{ id: name }` map) and `GET /api/admin/organizations/:id`
(detail page), both existing Phase 6 routes. Fallback is `request.org_id`
itself when the org can't be resolved (covers the legitimate `er1`/`er2`
null case and any 403/404 edge case).

**Files changed:**
- `app/admin/actions.js` — added `eventRequestDecisionAction(requestId, step, feedback)`.
- `app/admin/event-requests/page.js` (new) — list, `FilterTabs` with
  `pending/needs_info/approved/rejected`, org name resolved via the bulk
  `/api/admin/organizations` map.
- `app/admin/event-requests/[id]/page.js` (new) — detail, renders the
  `eligibility` panel before any decision buttons, org name resolved via
  `/api/admin/organizations/:id`.
- `components/admin/EventRequestReview.jsx` (new) — modeled on
  `EventReview.jsx`'s Modal + feedback-textarea pattern; approve has no
  feedback step, reject/needs-info reuse the same structure. Shows a "View
  event" link once a request is approved (`resulting_event_id`).
- `components/admin/RequesterHealthPanel.jsx` (new) — extracted shared
  component. Used by this phase's detail page (`eligibility` prop) **and**
  retrofitted into `app/admin/events/[id]/page.js` (Phase 5's file, replacing
  its inline `requester_snapshot` block) since the two shapes overlap except
  for one field name (`events_organized` vs `organizer_events_count`), both
  read by the shared component. This touches a file outside this phase's
  original "Files" list — done because the phase steps explicitly proposed
  the shared component "used by both this page and
  `app/admin/events/[id]/page.js`," and leaving the old inline duplicate in
  place would have defeated the extraction.
- `components/navigation/navItems.js` — added `/admin/event-requests` to
  `adminNavItems` (icon `ticket`, not `calendar`, to avoid a duplicate glyph
  with the existing Events entry in the same nav list).

**Verification:** `npm run lint` and `npm run build` both pass (see master
`plan.md` "Verification" section for the shared command). Manual
list/detail/approve/reject/needs-info verification against a running
backend was not performed in this session — do it per this file's
"Verification" section before considering the feature fully proven in a
live environment.
