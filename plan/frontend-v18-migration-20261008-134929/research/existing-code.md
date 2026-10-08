# Existing patterns

## `lib/api.js` — server-side backend client

- `apiGet/apiPost/apiPatch/apiPut/apiDelete(path, body?)` — thin wrappers around `apiRequest`, which forwards the `mfu_token` cookie (`sessionHeader()`, lib/api.js:47-50) and never runs in the browser (Server Components / Server Actions only).
- `apiRequest` throws `ApiError(message, status, details)` on any non-2xx response (lib/api.js:85-92). `details` carries extra fields the backend attaches (e.g. `conflicts` on venue assignment 409s).
- `apiGetAllowed(path)` (lib/api.js:128-135) swallows a 403 and returns `null` — used by every admin page that is gated per-area via `admin_permissions`, so one missing permission blanks a panel (`<PermissionNotice area="..."/>`) instead of crashing the page. Reuse this verbatim for any new admin area page (event requests, settings).
- `scrub()` strips `password_hash` recursively from every response before it reaches a client component — keep this in mind if any new user-shaped response needs the same treatment (e.g. `requester_snapshot.user` objects in admin event-request detail, team/contributor `user` objects in admin event detail).
- New endpoints from the migration doc need no new wrapper — `apiGet`/`apiPost`/etc. are generic. Only add a new file if the response shape needs a dedicated formatter (see `lib/events.js`, `lib/points.js`).

## `lib/session.js` — portal guards

- `getSession()` — cheap check against `GET /api/auth/me`, returns `null` on 401/403 instead of throwing (lib/session.js:28-35).
- `requireUser()` — full profile via `GET /api/user/me`, redirects to `/login` on sign-out (lib/session.js:38-45).
- `getMyOrganizers()` — `GET /api/organizer/my-organizers`, returns `[]` on sign-out (lib/session.js:57-64). **Still correct post-v18** — it is now purely "org affiliations I belong to," used for an optional "Organizing for" sidebar note, not as an access gate.
- `requireOrganizer()` (lib/session.js:67-72) — **THE** critical break. Currently: `redirect('/')` unless `memberships.length > 0`. Per doc §6, must allow **any** authenticated user; `portalRole` from `/api/auth/me` is always `"user"` for non-admins. Fix: drop the `memberships.length === 0` redirect; keep returning `{ user, memberships }` since `memberships` is still useful for the "Organizing for" sidebar note and the optional org-affiliation picker in `EventForm`.
- `requireAdmin()` (lib/session.js:75-79) — unaffected; still gates on `user.role === 'admin'`.
- `portalsFor(user, memberships)` (lib/session.js:82-91) — **also needs to change**. Currently only offers the Organizer portal switcher entry when `memberships?.length`. Per doc, the organizer portal must be offered to any authenticated user. This function is called from `app/(app)/layout.js:39`, `app/organizer/layout.js:25`, and `app/admin/layout.js:29` — all three portal shells. Changing the gate here fixes the switcher everywhere in one place.
- `EVENT_MANAGING_ROLES = ['owner', 'president', 'event_manager']` (lib/session.js:55, duplicated in `lib/events.js:53`) — this concept (only certain org members may manage events) predates v18. Post-v18, event creation/management is per-event-team membership (`myRole` on the event), not org membership, so this constant's *use as a portal gate* (`app/organizer/page.js`, `app/organizer/events/new/page.js`, `app/organizer/check-in/page.js`) goes away. It may still be meaningful for the *optional* "create event under this org" picker if a user happens to belong to an org with event-managing rights — keep the constant, drop its use as a blanket gate.

## `app/*/actions.js` — Server Action structure

Both `app/organizer/actions.js` and `app/admin/actions.js` follow the same shape (also `app/actions.js` for user-role mutations):

```js
'use server';
import { ApiError, apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';

function failure(error) {
  if (error instanceof ApiError) return { error: error.message, details: error.details };
  throw error; // anything that isn't a clean backend error is a real bug — let it throw
}

export async function someAction(_prevState, formData) {
  // 1. pull + validate fields from formData (client-side mirror of backend validation)
  // 2. try { await apiPost(...) } catch (error) { return failure(error); }
  // 3. revalidatePath(...) the affected routes
  // 4. either redirect(...) (creation flows) or return { ok: true, message } (mutations)
}
```

- Actions bound to `useActionState` (create/update forms) take `(_prevState, formData)`.
- Actions invoked directly from client components inside `startTransition` (lifecycle buttons, team role changes, flag resolution) take positional args, e.g. `changeTeamRoleAction(eventId, userId, role)`.
- `refresh(eventId)` / local `revalidatePath` helpers at the top of each actions file are reused by every mutation in that file — follow the same helper pattern for new actions files (e.g. a future `app/organizer/staff-calls-actions.js` or extending the existing one).
- New action files for new features (event requests, contributors, staff calls, recognition, settings) should live either inside the existing `app/organizer/actions.js` / `app/admin/actions.js` / `app/actions.js` (grouped by portal, matching current convention) or, if a file would grow unwieldy, a sibling file in the same `app/<portal>/` directory — there is no existing multi-file precedent to copy, so keep it simple and append to the existing three files unless a reviewer prefers a split.

## Portal layouts (chrome)

- `app/(app)/layout.js`, `app/organizer/layout.js`, `app/admin/layout.js` each: call the matching `require*` guard, call `getMyOrganizers()` (user/admin layouts) or get it via `requireOrganizer()` (organizer layout), then render `<AppShell>` with `portals={await portalsFor(user, memberships)}`.
- `components/navigation/navItems.js` defines `userNavItems` / `organizerNavItems` / `adminNavItems` — static arrays, no gating logic. `isActiveRoute()` special-cases portal roots. Any new top-level page (Event Requests, Staff Calls, Recognition, Settings) needs an entry here plus an icon name that exists in `components/common/Icon.jsx`.

## Forms

- Every create/edit form uses `useActionState(action, initialState)` where `initialState = { error: null }` (or `{ error: null, message: null }`), renders `state?.error` as a `<p className="field__error">`, and disables the submit button while `pending`. New forms (register, event request, contributor add, staff call) should copy this exact shape — see `components/organizer/EventForm.jsx`, `components/admin/NewOrganizerForm.jsx`.
- Search-as-you-type pickers (`TeamManager.jsx`, `OrganizerMembers.jsx`) both duplicate the same `searchUsersAction` + local `query/results/picked` state pattern. A shared `<UserPicker>` component would be a reasonable refactor opportunity but is out of scope for this migration — keep duplicating the pattern for new pickers (contributor add, staff-call reviewer) unless explicitly asked to deduplicate.
- Buttons/transitions not bound to a form (`FlagResolver.jsx`, `EventReview.jsx`, `TeamManager.jsx` role selects) use local `useTransition` + a `run(action)` helper that calls the server action and surfaces `result.error`. Copy this for staff-call close/review actions and contributor removal.

## Correction addendum (2026-10-08)

The `EVENT_MANAGING_ROLES` paragraph above was written against the
now-superseded "org-optional" premise (see `research/requirements.md`'s
correction addendum). Updated understanding:

- `EVENT_MANAGING_ROLES = ['owner', 'president', 'event_manager']` in
  `lib/session.js:55` / `lib/events.js:53` is **legacy-entity-model only**.
  Confirmed directly against `backend/lib/services/orgMembershipService.js:27`
  (`isMember()`) — the v18 backend's event-creation and event-request org
  check is membership existence only (`org_manager` or plain `member`, no
  role distinction). The constant's use as a **create-event eligibility
  filter** (`app/organizer/events/new/page.js`'s `managing = memberships.filter(...)`)
  is now actively wrong — it excludes plain `member`s who the backend
  happily allows. This is fixed in the corrected `phases/phase-2-event-creation-endpoint.md`.
- `getMyOrganizers()` / `GET /api/organizer/my-organizers` is still the right
  call, but its response shape is `{ ...membership, org: {...} }` (confirmed
  against `backend/routes/organizer.js:71-74`), **not** `{ ...membership,
  organizer: {...} }`. `components/organizer/EventForm.jsx` currently reads
  `membership.organizer_id` / `membership.organizer?.name`, which was already
  wrong against the old contract and is still wrong under the new field name
  — fixed in the corrected Phase 2 file.
- The "event creation/management is per-event-team membership, not org
  membership" framing in the `requireOrganizer()` paragraph above is only
  true for *portal access* and *managing an event you're already on the team
  of*. It is **not** true for *creating a new event* or *submitting an event
  request* — both of those now require active org membership again. Keep
  these two concerns distinct when implementing: portal-entry gating (Phase
  1, unaffected) vs. creation/request-submission gating (Phase 2 / Phase 12,
  corrected).
