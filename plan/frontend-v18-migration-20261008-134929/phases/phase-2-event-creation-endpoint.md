# Phase 2 — Event creation endpoint: URL changed, `org_id` KEPT required

**Status: Complete (2026-10-08).** Implemented exactly as scoped below.
`app/organizer/actions.js`: `createEventAction` now posts to
`/api/organizer/events` with `org_id` in the body (read from
`formData.get('org_id')`), guard clause kept, error copy updated to
"Choose which organization you're creating this event for."; no bespoke
403-message mapping added, `failure(error)` already surfaces
`ApiError.message` as-is. `app/organizer/events/new/page.js`: dropped the
`EVENT_MANAGING_ROLES` import/filter and the `redirect('/organizer')` on
zero managing memberships; now filters `memberships` to
`membership.org?.status === 'active'` and renders an explanatory
"contact your organization's manager or an admin" block in place of the
form when `eligible.length === 0` instead of redirecting away; venues are
only fetched when there's a form to show them in. `components/organizer/EventForm.jsx`:
fixed the membership field-name bug (`organizer`/`organizer_id` →
`org`/`org_id`) and renamed the select's `name`/`id` from `organizerId` to
`org_id` to match the action's read directly (smaller diff than keeping a
remap). The org picker (`required`) is unchanged otherwise. Verified:
`npm run lint` (clean) and `npm run build` (succeeds, all routes compile,
including `/organizer/events/new`). Manual sign-in verification against a
running backend (zero-membership block state, 403 on deactivated org,
plain-`member` regression check, successful create) was not performed in
this session — do that before considering the cross-phase smoke test in
`plan.md` fully satisfied. `app/organizer/page.js` and
`app/organizer/check-in/page.js` were intentionally left untouched per
step 4 below — they remain Phase 3's responsibility.

**CORRECTED 2026-10-08.** The original version of this phase (written before
backend commits `1411ddd` and `2ff2609`) said to drop the `orgId` requirement
entirely. That premise is now wrong — see
`plan/frontend-v18-migration-20261008-134929/plan.md` "Doc inconsistency"
callout and `research/requirements.md` row #2. This file replaces that
version in place; the correction is: **keep an org picker, keep `org_id`
required in the POST body, source it from the user's own active
org memberships, and handle the new 403/zero-membership cases.**

**Breaking change:** #2 — URL changed (`POST /api/organizer/organizers/:orgId/events`
→ `POST /api/organizer/events`), but `org_id` must still be present in the
JSON body. The caller must be an **active member** of that org, and the org
itself must have `status: "active"` — confirmed directly against
`backend/routes/organizer.js` (`POST /events` handler) and
`backend/lib/services/orgMembershipService.js:27` (`isMember()` — note this
checks membership existence only, **not** `role`; `org_manager` and plain
`member` are equally eligible to create events for the org, which is a
**behavior change from the current frontend** — see step 2 below).

**Depends on:** Phase 1 (organizer portal must be reachable first).
**Risk:** Medium — touches the create-event form contract (`EventForm.jsx` is
shared between create and edit) and the gate in `app/organizer/events/new/page.js`.
**Independently shippable:** Yes.

## Steps

1. `app/organizer/actions.js` — `createEventAction` (line 81-98):
   - Change the POST target from `` `/api/organizer/organizers/${orgId}/events` ``
     to `/api/organizer/events`.
   - Keep reading the chosen org from the form (`formData.get('organizerId')`,
     or rename the form field to `org_id` directly for clarity — see step 3)
     and keep the `if (!orgId) return { error: ... }` guard — do **not**
     remove it. Update the copy from "Choose which organizer is hosting this
     event." to something that reflects the real rule, e.g. "Choose which
     organization you're creating this event for." (org_id is mandatory, not
     a hosting-entity nicety).
   - Send it in the body as `org_id`: `apiPost('/api/organizer/events', { ...fields, org_id: orgId })`.
   - No special-case handling needed for the backend's 403 responses
     ("Organization is not active." / "You must be a member of this
     organization to create events under it.") beyond the existing
     `failure(error)` helper — `ApiError.message` already carries the
     backend's exact text, which is clear enough to show directly as the
     form's `field__error`. Confirm this renders sensibly during manual
     testing (step below) rather than adding bespoke message mapping.
2. `app/organizer/events/new/page.js`:
   - **Remove** the `EVENT_MANAGING_ROLES` filter (`managing = memberships.filter(...)`)
     and its `redirect('/organizer')` on `managing.length === 0` — this was
     the *old* legacy-entity rule (only `owner/president/event_manager` could
     create). The new backend only checks `isMember()`, which has no role
     condition, so filtering by `EVENT_MANAGING_ROLES` here now **wrongly
     excludes plain `member`s** who are perfectly eligible. Drop the
     `EVENT_MANAGING_ROLES` import from this file entirely.
   - Instead, fetch `memberships` via `requireOrganizer()` (unchanged) and
     filter to orgs that are actually usable: `const eligible = memberships.filter((m) => m.org?.status === 'active')`.
     (`GET /api/organizer/my-organizers` returns `{ ...membership, org: {...} }`
     per `backend/routes/organizer.js:71-74` — `getMembershipsForUser()`
     already filters to `status: 'active'` *memberships*, but does **not**
     check whether the org itself is active, so this client-side filter is
     still required.)
   - If `eligible.length === 0`: do **not** silently redirect away (that
     hides the real reason and looks like a bug). Render the page's normal
     chrome with an explanatory block instead of the form, e.g. "You need to
     be an active member of an active organization to create events. [contact
     your organization's manager / an admin]" — there is no self-serve
     "join an organization" flow anywhere in this codebase (confirmed via
     grep), so the copy should not imply one exists.
   - Otherwise pass `organizers={eligible}` to `<EventForm>` (prop name kept
     for minimal diff against step 3; rename both together if preferred).
3. `components/organizer/EventForm.jsx`:
   - **Keep** the org picker (`organizerId` select, line 38-58) — do **not**
     remove it, and do **not** make it optional. `required` stays.
   - Fix the membership field names to match the real `GET
     /api/organizer/my-organizers` shape, which is `{ ...membership, org:
     {...} }` (field is `org`/`org_id`, **not** `organizer`/`organizer_id` —
     that was this component's pre-existing bug against the *old* contract,
     now also wrong against the *new* one, just under different field
     names): change `defaultValue={organizers[0]?.organizer_id}` →
     `organizers[0]?.org_id`, `value={membership.organizer_id}` →
     `membership.org_id`, and the label `membership.organizer?.name` →
     `membership.org?.name`. Consider also showing `MEMBER_ROLE_LABELS[membership.role]`
     next to the org name as already done today — still correct, just cosmetic
     now rather than a gate.
   - Recommended but optional cleanup: rename the select's `name` from
     `organizerId` to `org_id` so the server action in step 1 needs no
     remapping — either is correct, pick whichever keeps the diff smaller
     for the reviewer.
4. `app/organizer/page.js` ("My Events") and `app/organizer/check-in/page.js`
   are **not** part of this phase — they list existing events the user is
   already on the team of, not creation, and are unaffected by the org_id
   correction. They remain Phase 3's responsibility (their own stale
   `EVENT_MANAGING_ROLES`-gated per-org listing pattern, a separate bug from
   this one, predates this correction).

## Files

- `app/organizer/actions.js`
- `app/organizer/events/new/page.js`
- `components/organizer/EventForm.jsx`

## Verification

- `npm run lint`
- `npm run build`
- Manual: user with **zero** org memberships → `/organizer/events/new` shows
  the "join an organization first" explanation, no form rendered, no crash.
- Manual: user whose only org membership belongs to an org with
  `status: 'pending'` or `'inactive'` → same blocked state; confirm that org
  is *not* offered in the picker (it should behave identically to having zero
  memberships, since it's not usable).
- **Regression check:** user who is a plain `member` (not `org_manager`) of
  an active org → confirm they **can** now create an event under that org.
  This is a deliberate behavior change from the old frontend (which required
  `owner/president/event_manager`) and should be explicitly exercised, not
  assumed.
- Manual: submit with a valid active-org membership selected → draft event is
  created, user lands on `/organizer/events/:id` as `main_organizer`, and
  `event.org_id` matches the chosen org.
- Manual: confirm the backend's 403 message (e.g. org deactivated between
  page load and submit) surfaces as a readable form error, not a blank screen
  or unhandled exception.
