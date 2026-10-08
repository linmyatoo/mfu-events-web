# Phase 14 — Contributors tier (organizer app)

**Status: Complete (2026-10-08).** See "Implementation notes (2026-10-08)" at
the bottom of this file.

**Spec section:** "Contributors — Organizer App".
**Depends on:** Phase 4 (event detail already reads `event.contributors` read-only by then).
**Risk:** Low-medium — new component closely mirrors an existing one.
**Independently shippable:** Yes.

## Steps

1. `app/organizer/actions.js` — add:
   - `addContributorAction(_prevState, formData)` → `POST /api/organizer/events/:id/contributors`, body `{ userId, positionTitle }`.
   - `removeContributorAction(eventId, userId)` → `DELETE /api/organizer/events/:id/contributors/:userId`.
   - Both follow the exact `addTeamMemberAction`/`removeTeamMemberAction` pattern (line 175-209) including `refresh(eventId)` on success.
2. New component `components/organizer/ContributorsManager.jsx` — copy `TeamManager.jsx` structure (search-as-you-type picker via the existing `searchUsersAction`, same `useActionState` + `useTransition` dual pattern) but:
   - Replace the role `<select>` (`ROLES` constant) with a free-text `position_title` input.
   - No "change role" action — contributors only support add/remove per the doc's API surface (no PATCH route listed).
3. `app/organizer/events/[id]/page.js` — replace the read-only contributors list added in Phase 4 with `<ContributorsManager event={event} contributors={event.contributors ?? []} canManage={isMain} />` (gate management to `main_organizer`, same as `TeamManager`'s `canManage={isMain}` — confirm against backend whether `co_organizer` should also manage contributors; doc doesn't specify, default to main-organizer-only to match the existing team-management gate until told otherwise).

## Files

- `app/organizer/actions.js`
- `components/organizer/ContributorsManager.jsx` (new)
- `app/organizer/events/[id]/page.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual: as main organizer, add a contributor with a custom position title, confirm it appears in the list; remove it, confirm it disappears after `revalidatePath`.
- Manual: as co-organizer/checkin_staff, confirm the manage controls are hidden (read-only list only), matching the `canManage` gate decision above.

## Implementation notes (2026-10-08)

Verified against `/Users/panda/Desktop/MFU-Events/backend/routes/organizer.js`
(lines 229-254) and `backend/lib/services/organizerService.js`
(`canManageTeam`/`addContributor`/`removeContributor`/`contributorsFor`)
directly, not just the doc:

- `canManageTeam(eventId, userId)` is literally `isMainOrganizer(...)` —
  confirms the phase file's default (main-organizer-only gate) is correct,
  not just a fallback. No separate contributor-management permission exists
  on the backend.
- `POST /events/:id/contributors` body fields are `userId`/`positionTitle`
  (camelCase), matching the existing `addTeamMemberAction`'s `userId`/`role`
  convention — no drift here, unlike several earlier phases.
- The event-detail route (`GET /events/:id`, used by
  `app/organizer/events/[id]/page.js`) flattens contributors to
  `{ ...ec, name }` (backend/routes/organizer.js:120-122) — `name` and
  `position_title` are both present directly on each list item, as Phase 4
  already assumed. The standalone `GET /events/:id/contributors` endpoint
  (unused by this phase — not needed since the detail route already embeds
  the list) returns a differently-shaped `{ ...ec, user }` with a nested
  user object instead — flagged here only in case a later phase reaches for
  that endpoint directly and expects the flattened shape.
- `requireEventNotFinished` gates both mutations server-side (409 on
  completed/cancelled events), same as `TeamManager`'s add/remove — no
  additional client-side handling needed beyond the existing `error` state
  surfaced from `failure()`.

**Files changed:**
- `app/organizer/actions.js` — added `addContributorAction` and
  `removeContributorAction`, mirroring `addTeamMemberAction`/
  `removeTeamMemberAction`.
- `components/organizer/ContributorsManager.jsx` (new) — copied
  `TeamManager.jsx`'s search-as-you-type + dual `useActionState`/
  `useTransition` pattern, swapped the role `<select>` for a free-text
  `positionTitle` input, and dropped the change-role control (no PATCH
  route for contributors).
- `app/organizer/events/[id]/page.js` — replaced the Phase-4 read-only
  contributors block with `<ContributorsManager event={event}
  contributors={event.contributors ?? []} canManage={isMain} />`; removed
  the now-unused `initialsOf` import (moved into the new component).

`npm run lint` and `npm run build` both pass. Manual add/remove-contributor
verification against a running backend was not performed in this session —
do it per this file's "Verification" section before considering the
feature fully proven in a live environment.
