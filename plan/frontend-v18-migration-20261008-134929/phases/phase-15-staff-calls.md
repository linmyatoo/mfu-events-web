# Phase 15 — Staff Calls (organizer + user apps)

**Status: Complete (2026-10-08).** See "Implementation notes (2026-10-08)" at
the bottom of this file.

**Spec section:** "Staff Calls — Both Apps".
**Depends on:** Phase 4 (organizer event detail) for the organizer-side entry point; independent for the user-side browse page.
**Risk:** Medium-high — largest net-new surface in this plan, two distinct personas (poster vs. applicant), two methods (`open_call` instant-join vs. `application` with review).
**Independently shippable:** Yes, but consider splitting into two sub-PRs (organizer-post-and-manage, user-browse-and-apply) if a reviewer wants smaller diffs — listed as one phase here per the doc's own "Both Apps" grouping, but nothing stops splitting at implementation time.

## Steps — Organizer side

1. `app/organizer/actions.js` — add:
   - `postStaffCallAction(_prevState, formData)` → `POST /api/organizer/events/:id/staff-calls`, body shape per doc's "Staff call shape" (`target_type`, `organizer_role` or `position_title` depending on `target_type`, `method`, `slots_total`, `questions[]` for `application` method).
   - `closeStaffCallAction(callId, eventId)` → `POST /api/organizer/staff-calls/:callId/close`.
   - `reviewApplicationAction(callId, appId, decision, eventId)` → `POST /api/organizer/staff-calls/:callId/applications/:appId/review`, body `{ decision: 'accept'|'reject' }`.
2. `app/organizer/events/[id]/page.js` — add a "Staff Calls" section (new `components/organizer/StaffCallsManager.jsx`) showing calls via `GET /api/organizer/events/:id/staff-calls`, a post-call form, and per-call application review (via `GET /api/organizer/staff-calls/:callId/applications` + accept/reject buttons) for `method === 'application'` calls. For `method === 'open_call'`, show slots_filled/slots_total progress only (no review needed — claims are instant on the user side).

## Steps — User side

3. `app/actions.js` — add:
   - `claimStaffCallAction(callId)` → `POST /api/user/staff-calls/:id/claim`.
   - `applyStaffCallAction(_prevState, formData)` → `POST /api/user/staff-calls/:id/apply`, body `{ answers: [...] }` built from dynamically-rendered question fields (`call.questions`).
4. New pages:
   - `app/(app)/staff-calls/page.js` — browse via `GET /api/user/staff-calls`, card list including the embedded event object (reuse `formatEventWhen`/`eventStatusMeta` from `lib/events.js` for the embedded event preview).
   - `app/(app)/staff-calls/[id]/page.js` — detail via `GET /api/user/staff-calls/:id`; render a "Claim" button for `open_call` or a dynamic application form for `application` method.
5. `components/navigation/navItems.js` — add a Staff Calls entry to both `organizerNavItems` and `userNavItems`.

## Files

- `app/organizer/actions.js`, `app/actions.js`
- `app/organizer/events/[id]/page.js`
- `components/organizer/StaffCallsManager.jsx` (new)
- `app/(app)/staff-calls/page.js` (new), `app/(app)/staff-calls/[id]/page.js` (new)
- `components/events/StaffCallApplyForm.jsx` (new)
- `components/navigation/navItems.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual, organizer side: post an `open_call` for `checkin_staff`, confirm slots_filled increments after a user claims it, and the user lands on the event team (`team` list) per doc's "instant join."
- Manual, organizer side: post an `application` call with 2 questions, submit as a user, review (accept one, reject one) from the organizer side, confirm accepted applicant joins the team/contributors as appropriate.

## Implementation notes (2026-10-08)

Verified field names/shapes directly against
`MFU-Events/backend/routes/organizer.js:256-289`,
`MFU-Events/backend/routes/user.js:128-141`, and
`MFU-Events/backend/lib/services/staffService.js` before implementing — no
drift found this time, unlike most earlier phases. The doc's "Staff call
shape" and endpoint list are exactly correct:

- `target_type`/`organizer_role` (`co_organizer`|`checkin_staff` only —
  `main_organizer` is not a valid staff-call target)/`position_title`/
  `method`/`slots_total`/`slots_filled`/`questions`/`status` all match
  `STAFF_CALL_TARGET`/`STAFF_CALL_METHOD`/`STAFF_CALL_STATUS` in the
  backend's `constants.js` verbatim.
- `questions` (post time) and `answers` (apply time) are plain string
  arrays, not objects — `staffService.applyToCall` stores `answers` as
  given with no per-question schema, so the apply form renders one
  `<textarea>` per `call.questions[i]` and submits them in the same order
  via repeated `name="answers"` fields (`formData.getAll('answers')`
  preserves DOM order).
- `GET /api/organizer/events/:id/staff-calls` and
  `GET /api/organizer/staff-calls/:callId/applications` only require
  `requireEventTeamAccess` (any team role, not just Main Organizer) — posting,
  closing, and reviewing are the only Main-Organizer-gated actions
  (`organizerService.isMainOrganizer`), matching `canManage={isMain}` passed
  into `StaffCallsManager`, mirroring `TeamManager`/`ContributorsManager`.
- `GET /api/organizer/events/:id` does **not** embed staff calls — fetched
  separately via `apiGetAllowed` in the event-detail page, same pattern as
  `attendees`.
- `GET /api/user/staff-calls` and `GET /api/user/staff-calls/:id` embed the
  raw `Event` row (via `eventService.getById`, not the richer organizer/user
  feed shape) — no `venue` object guaranteed, so `venueName()`'s existing
  `event.venue?.name` optional-chain fallback to `venue_preference`/"Venue to
  be announced" handles it without changes.

**Files changed:**
- `app/organizer/actions.js` — added `postStaffCallAction`,
  `closeStaffCallAction`, `getStaffCallApplicationsAction` (client-reachable
  GET wrapper, mirrors `searchUsersAction`), `reviewApplicationAction`.
- `app/actions.js` — added `claimStaffCallAction`, `applyStaffCallAction`.
- `lib/events.js` — added `STAFF_CALL_METHOD_LABELS`, `staffCallStatusMeta`,
  `staffCallTargetLabel` (mirrors the existing `ORGANIZER_ROLE_LABELS`/
  `eventStatusMeta` label-map pattern).
- `components/organizer/StaffCallsManager.jsx` (new) — list + post-call form
  (dynamic question rows, mirrors `PointEventForm.jsx`'s add/remove-row
  pattern) + per-call expandable application review (accept/reject),
  following `TeamManager`/`ContributorsManager`'s dual `useActionState`/
  `useTransition` structure.
- `app/organizer/events/[id]/page.js` — added the `staffCalls` fetch and
  `<StaffCallsManager>` section, between `ContributorsManager` and
  `AttendeeList`. Merged in alongside Phase 14's `ContributorsManager`
  addition without touching its code.
- `components/events/StaffCallApplyForm.jsx` (new) — branches on
  `call.status !== 'open'` (closed notice), then `call.method === 'open_call'`
  (one-click Claim button, `useTransition`, mirrors `BookingPanel`'s
  book/cancel pattern) vs `application` (dynamic per-question `<textarea>`
  form, `useActionState`, mirrors `QuestionsSection`).
- `app/(app)/staff-calls/page.js` (new) — browse list, reuses
  `formatEventWhen`/`EventPoster`-less card styling consistent with
  `event-requests/page.js`.
- `app/(app)/staff-calls/[id]/page.js` (new) — detail page, renders
  `StaffCallApplyForm`.
- `components/navigation/navItems.js` — added a `Staff Calls` entry to both
  `userNavItems` and `organizerNavItems`. Both point at the same `/staff-calls`
  route (there is no separate organizer-only staff-calls page in this phase's
  file list) — an organizer's own browse/claim/apply experience across other
  events' calls is the same user-facing page; landing there from the
  Organizer portal swaps the `AppShell` into the User portal's nav/layout,
  which any signed-in account (including organizers) satisfies, the same way
  the existing portal switcher already works.

`npm run lint` and `npm run build` both pass. Manual end-to-end verification
(open-call claim incrementing `slots_filled` and landing the user on the
event team; application post → apply → accept/reject → team/contributors
join) against a running backend was not performed in this session — do it
per this file's "Verification" section before considering the feature fully
proven in a live environment.
