# Phase 6 — Admin Organizations (entity → optional affiliation)

**Status: Complete (2026-10-08).** Verified directly against
`backend/routes/admin.js:66-124`, `backend/lib/services/orgService.js`,
and `backend/lib/services/orgMembershipService.js` (not the doc) before
implementing. The backend had drifted further than this phase file and the
migration doc assumed, same pattern as Phases 4-5:

- **`GET /api/admin/organizations` (list) and `GET /api/admin/organizations/:id`
  (detail) return raw `organizations` table rows only** — `name`, `type`,
  `description`, `contact_email`, `status`, `university_id`, timestamps.
  There is no `memberCount`, `verified`, or `members` field on either
  response. The old list page read `organizer.memberCount`/`organizer.verified`
  and the old detail page read `organizer.members` — all three were already
  dead/always-undefined reads before this phase (pre-existing bug, same
  pattern Phase 5 found with `event.organizer`). Fixed: removed the
  member-count/verified UI from the list page; the detail page now does a
  second fetch to `GET /api/admin/organizations/:id/members` (a separate
  endpoint, confirmed in admin.js:92-97) and passes that array into
  `OrganizerMembers` instead of a non-existent `organizer.members`.
- **`POST /api/admin/organizations/:id/members` body field is `user_id`,
  not `userId`.** The migration doc's own route table (line 244,
  "`{ userId, role }`") is wrong — `admin.js:100` destructures
  `const { user_id, role } = req.body`. The pre-existing frontend action
  was already sending `{ userId, role }` and would have 400'd on every add
  attempt. Fixed in `addOrganizerMemberAction` (now posts `user_id`). The
  `PATCH .../members/:userId` role-change body is `{ role }` as documented
  (no `user_id` in the body there, only the URL param) — unaffected.
- **Member roles are `org_manager`/`member` only** — `orgMembershipService`
  and both the add/update-role routes hard-validate `role` against exactly
  `['org_manager', 'member']`. The old `ROLES` constant in
  `OrganizerMembers.jsx` (`owner`/`president`/`event_manager`/`member`) and
  the matching `MEMBER_ROLE_LABELS` in `lib/events.js` were stale leftovers
  from the old entity-membership model and would have posted a rejected
  role value. Fixed both to `org_manager`/`member`. This also silently
  fixes a latent Phase 2 display bug: `components/organizer/EventForm.jsx`
  reads `MEMBER_ROLE_LABELS[membership.role]` against the same new
  `org_id`-membership roles — it was already shipping with the wrong label
  map and is now correct too, with no edit needed to that file.
- **`ORG_TYPE` enum values changed** —
  backend `constants.js:30-36` now defines `student_club`,
  `student_association`, `academic_unit`, `university_office`, `other`.
  The old `ORGANIZER_TYPE_LABELS` in `lib/events.js` (`individual`,
  `student_club`, `university_org`, `faculty`, `department`) only
  half-overlapped — `NewOrganizerForm.jsx`'s type `<select>` would have
  offered four invalid type values that `orgService.create` rejects with a
  400. Fixed the label map to match the real enum.
- **Status flow has no "reject"/"suspend"** — only `activate`/`deactivate`
  (`orgService.activate`/`deactivate`, each idempotency-guarded by a 409 if
  already in that state). Rewrote `organizerDecisionAction` to accept
  `'activate'|'deactivate'` and call `POST /api/admin/organizations/:id/activate`
  or `.../deactivate`; `OrganizerMembers.jsx` now renders one
  status-management section with a single contextual button (Activate
  when not active, Deactivate when active) instead of the old
  pending-only Approve/Reject pair.
- **`POST /api/admin/organizers` create-alias kept as-is** (per this phase
  file's own recommendation) — it creates the org `status: active`
  immediately via `orgService.create(..., { initialStatus: 'active' })`,
  confirmed at `admin.js:72-75`. No code change needed in
  `createOrganizerAction`; only the doc comments in that action and in
  `NewOrganizerForm.jsx` were updated to describe it accurately.

**Scope note (flagged, not fixed in this phase):** the task also asked to
check `app/admin/page.js` (`event.organizer?.name`, ~line 79) and
`app/admin/venues/schedule/page.js` (`event.organizer?.name`, ~line 62) for
the same dead-read pattern Phase 5 found on the event-detail endpoint.
Confirmed both list-shaped endpoints never return an `organizer` field
either (`backend/routes/admin.js:154-165` for `GET /api/admin/events`;
`backend/lib/services/venueService.js:108-115` for `GET
/api/admin/venues/schedule`), but the two endpoints diverge in what *is*
available:
- `GET /api/admin/events` embeds `team` (`{...eventOrganizer, user}`) per
  event, same shape as the detail endpoint. Fixed: `app/admin/page.js` now
  derives the organizer chip from `team.find(m => m.role ===
  'main_organizer')?.user?.name`, falling back to "No organizer" only if
  no team entry resolves (shouldn't happen in practice since every event
  always has exactly one `main_organizer`).
- `GET /api/admin/venues/schedule`'s `venueService.schedule()` returns
  **raw `events` table rows with no `team`/`org` embed at all** — it's a
  plain `db.filter` + `{...venue, events}`, not routed through
  `eventService.allEvents()`'s enrichment. There is no field on this
  response that identifies who's running the event. Per the task's
  explicit fallback instruction, dropped the organizer chip from this page
  entirely rather than improvising a fetch-per-event N+1 or a backend
  change — embedding `team` (or at least the main organizer's name) in
  `venueService.schedule()` would be a small, legitimate backend follow-up
  worth filing, but is out of scope for this frontend-only phase.

`npm run lint` and `npm run build` both pass.

**Breaking change:** #9.
**Depends on:** None.
**Risk:** Medium-high — full CRUD + status-workflow rewrite across two pages, one action file section, and two components.
**Independently shippable:** Yes — this is a self-contained admin area.

## Steps

1. `app/admin/organizers/page.js`:
   - `FILTERS` (line 13-18): drop `suspended`/`rejected`, add `inactive`. New set: `all, pending, active, inactive`.
   - `STATUS_VARIANT` (line 21-26): update to `{ active: 'success', pending: 'warning', inactive: 'neutral' }`.
   - Endpoint: `/api/admin/organizers` → `/api/admin/organizations` (keep `?status=` query param pass-through, line 34-36).
2. `app/admin/organizers/[id]/page.js`: endpoint `/api/admin/organizers/:id` → `/api/admin/organizations/:id` (line 18).
3. `app/admin/actions.js`:
   - `createOrganizerAction` (line 149-165): POST target stays `/api/admin/organizers` per doc (alias that creates with `status: active` immediately) **or** switch to `POST /api/admin/organizations` if the admin should create as `pending` by default — doc offers both; recommend keeping the existing `/api/admin/organizers` alias since it preserves current UX (org usable immediately) with zero other changes needed in this action.
   - `organizerDecisionAction` (line 167-177): replace the `approve|reject` action set and `/api/admin/organizers/:id/:step` path with two dedicated calls matching the new endpoints — `POST /api/admin/organizations/:id/activate` and `POST /api/admin/organizations/:id/deactivate`. Rename the function's accepted steps to `activate`/`deactivate` (or keep the function name but change its internals — check all call sites, currently only `components/admin/OrganizerMembers.jsx:68,76`).
   - `add/update/removeOrganizerMemberAction` (line 179-213): change path prefix `/api/admin/organizers/:orgId/members...` → `/api/admin/organizations/:orgId/members...`. Bodies (`{ userId, role }` / `{ role }`) are unchanged per doc.
4. `components/admin/NewOrganizerForm.jsx`: update the doc comment (line 11) from "created already verified and active" to reflect whichever create path Phase 6 step 3 chose. No prop/field changes needed — `name`/`type`/`description` fields are unchanged.
5. `components/admin/OrganizerMembers.jsx`:
   - Line 56-83: replace the "Approve"/"Reject" buttons (calling `organizerDecisionAction(organizer.id, 'approve'|'reject')`) with "Activate"/"Deactivate" buttons calling the renamed action with `'activate'|'deactivate'`. Update the surrounding copy ("This organizer is awaiting verification...") to match the new pending→active language.
   - Member role select (`ROLES`, line 17-22) and add/update/remove member calls are otherwise unaffected structurally — only the underlying path changed in `actions.js`.

## Files

- `app/admin/organizers/page.js`
- `app/admin/organizers/[id]/page.js`
- `app/admin/actions.js` (organizer section, lines 147-213)
- `components/admin/NewOrganizerForm.jsx`
- `components/admin/OrganizerMembers.jsx`

## Verification

- `npm run lint`
- `npm run build`
- Manual: `/admin/organizers` — confirm filter tabs show `All/Pending/Active/Inactive` only, list renders with correct status badges.
- Manual: create a new organization, confirm it lands in the expected status; activate/deactivate it from the detail page and confirm the status badge updates after `revalidatePath`.
- Manual: add/change-role/remove a member on an organization and confirm no 404s (path prefix fixed).
