# Phase 23 — Org manager applications queue & `application_open` toggle (organizer app)

**Status: Not started.**

**Spec section:** N/A in the original migration doc — the org_manager side
of the same net-new backend surface as Phase 22, `MFU-Events` commit
`1d4a639`. Verified directly against `backend/routes/org.js` in full and
`backend/lib/services/orgMembershipService.js`'s `isOrgManager`/`isMember`,
not just the doc.

## Verified backend contract

All routes below are mounted at `/api/org` (`backend/server.js` — confirm
mount path if touched; not expected to change) and require `authenticate`
(`backend/routes/org.js:9-10`). Every route past `/my-orgs` additionally
requires `isOrgManager(orgId, userId)` via a shared `requireOrgManager`
helper (`backend/routes/org.js:23-27`) — **distinct from plain membership**:
a `member`-role row returns `isMember() === true` but `isOrgManager() ===
false`, so a non-manager member hitting any of these gets a plain **403**
`"You must be an org_manager of this organization."`.

```
GET   /api/org/my-orgs                          — orgs where I am org_manager
GET   /api/org/:id                              — org detail (membership only, any role)
PATCH /api/org/:id                              — org_manager only
GET   /api/org/:id/applications                 — org_manager only, ?status= optional
POST  /api/org/:id/applications/:appId/approve  — org_manager only
POST  /api/org/:id/applications/:appId/reject   — org_manager only, body { feedback? }
```

- **`GET /api/org/my-orgs`** (`backend/routes/org.js:30-34`) —
  `orgMembershipService.getMembershipsForUser(userId).filter(m => m.role ===
  'org_manager')`, mapped to the full org row via `orgService.getById`.
  Returns **org objects**, not memberships — no `{...membership, org}`
  wrapper here (unlike `/api/organizer/my-organizers`, which does wrap).
  Zero-eligible-org case (no org_manager role anywhere) → `[]`, not an
  error.
- **`GET /api/org/:id`** (`backend/routes/org.js:37-44`) — any active
  member, not manager-only. 403 `"You are not a member of this
  organization."` if not even a plain member; 404 if the org itself
  doesn't exist. Returns the full org row including `application_open`.
- **`PATCH /api/org/:id`** (`backend/routes/org.js:81-85`) → delegates to
  `orgService.update(id, req.body, actorId)`
  (`backend/lib/services/orgService.js:46-67`), which only ever applies
  `name`/`description`/`contact_email`/`application_open` from the body —
  anything else sent is silently ignored, not an error. `application_open`
  is coerced with `=== true` (`backend/lib/services/orgService.js:65`), so
  sending any non-boolean-`true` value (including the string `"true"`
  from an unparsed form field) is equivalent to sending `false` — **send a
  real boolean**, not a form-field string, same caution as any other
  checkbox-backed PATCH in this codebase.
- **`GET /api/org/:id/applications`** (`backend/routes/org.js:92-95`) →
  `orgApplicationService.listForOrg(orgId, { status })`, each row embeds
  `user: db.getById('users', a.user_id)` (`orgApplicationService.js:46-49`).
  `status` query param is a plain equality filter (`'pending'`, `'approved'`,
  `'rejected'`); omit it for all statuses.
- **`POST .../approve`** (`backend/routes/org.js:98-101`) →
  `orgApplicationService.approveApplication(appId, actorId)` — 404 if the
  application doesn't exist, **409** `"This application has already been
  resolved."` if not `pending`. On success: sets `status: 'approved'`,
  `reviewed_by`/`reviewed_at`, and calls `orgMembershipService.addMember({
  org_id, user_id, role: 'member', invited_by: actorId })` — the applicant
  is always added as plain `member`, never `org_manager`, with no way to
  change that at approval time (promote separately afterward via the
  existing admin `OrganizerMembers.jsx` role `<select>`, which already
  supports `org_manager`/`member`, or add a member-role dropdown to this
  org_manager-side UI — **out of scope for this phase**, same 404/409
  shape as resolving a request twice).
- **`POST .../reject`** (`backend/routes/org.js:104-107`) →
  `orgApplicationService.rejectApplication(appId, actorId, feedback)` —
  same 404/409 as approve; `feedback` is optional free text, stored as-is
  or `null`.

## How the frontend already determines org_manager-ness (confirm before
building, do not assume a new client check is needed)

Checked `lib/session.js`, `getMyOrganizers()`, and every existing
`membership.role` read site (`components/organizer/EventForm.jsx:63`,
`components/events/EventRequestForm.jsx:75`, both via
`MEMBER_ROLE_LABELS[membership.role]`). **Finding:** `getMyOrganizers()`
(`GET /api/organizer/my-organizers`) already returns `{ ...membership, org
}` for every active membership, and `membership.role` is already either
`'org_manager'` or `'member'` (`lib/events.js:53-56`'s `MEMBER_ROLE_LABELS`
already has both). **So no new client-side role check is needed** — this
phase's "is this user an org_manager of org X" question is answered
server-side, for free, by `GET /api/org/my-orgs` only ever returning orgs
where that's already true. Do not duplicate the check client-side by
filtering `getMyOrganizers()` — call the real `/api/org/my-orgs` endpoint
instead, since it is the actual authorization boundary and
`getMyOrganizers()` could theoretically drift from it (they're separate
backend code paths reading the same underlying table).

## Existing patterns to follow

- Manage-a-list-with-actions UI: `components/organizer/TeamManager.jsx`
  (dual `useActionState`-form + `useTransition`-button pattern) and
  `components/organizer/ContributorsManager.jsx` (same pattern, simpler —
  add/remove only, no PATCH). This phase's approve/reject buttons are
  closer to `StaffCallsManager.jsx`'s per-application accept/reject review
  UI (`components/organizer/StaffCallsManager.jsx`) — reuse that
  structure (expandable per-call application list with inline
  accept/reject) rather than `TeamManager`'s add/remove-row shape.
- Single-button status toggle: `components/admin/OrganizerMembers.jsx`'s
  Activate/Deactivate button (`organizerDecisionAction`,
  `components/admin/OrganizerMembers.jsx:58-80`) — mirror this exactly for
  the `application_open` toggle (one button whose label/variant flips
  based on current state, `useTransition`, no form).
- Action file: `app/organizer/actions.js` (existing `failure`/`refresh`
  helpers at the top of the file, lines 20-30) — add new actions here, not
  a new file, following every other organizer-portal mutation in this
  plan (Phases 2-4, 14, 15, 16).
- Detail-page access-control pattern: `app/organizer/events/[id]/page.js`'s
  `try { ... } catch (error) { if (error instanceof ApiError &&
  [403, 404].includes(error.status)) notFound(); throw error; }` — use
  this exact shape for the new `/organizer/organizations/[id]` page, **not**
  `apiGetAllowed` (that helper exists specifically for admin
  `admin_permissions`-area gating, not this kind of per-resource
  authorization — confirmed its own doc comment in `lib/api.js:122-127`).

## Depends on / Risk / Shippability

**Depends on:** None (independent of Phase 22 — a org_manager could use
this queue even before any frontend exists for users to apply, by testing
against seed data or backend tests). **Risk:** Medium — net-new surface
with two pages and several actions, but every piece mirrors an existing
component 1:1 (see patterns above), so little novel UI design is needed.
**Independently shippable:** Yes.

## Steps

1. `app/organizer/actions.js` — add:
   - `toggleOrgApplicationsAction(orgId, open)` → `apiPatch(`/api/org/${orgId}`,
     { application_open: Boolean(open) })` → `revalidatePath('/organizer/organizations')`
     and `revalidatePath(`/organizer/organizations/${orgId}`)`. Positional-arg
     signature (`useTransition`-bound button), matching
     `organizerDecisionAction`'s shape, not a form.
   - `approveOrgApplicationAction(orgId, appId)` → `apiPost(`/api/org/${orgId}/applications/${appId}/approve`)`
     → same `revalidatePath` pair.
   - `rejectOrgApplicationAction(_prevState, formData)` → reads `orgId`,
     `appId`, `feedback` (optional) from `formData` → `apiPost(`/api/org/${orgId}/applications/${appId}/reject`,
     { feedback })` → same `revalidatePath` pair, return `{ ok: true }`.
     (`useActionState`-bound form, since it carries the optional feedback
     textarea — approve has no payload beyond path params, so it stays a
     plain `useTransition` button per the pattern above.)
   - All three use the file's existing `failure(error)` helper on
     `ApiError`, surfacing the 404/409 messages verbatim (e.g. "This
     application has already been resolved." if two tabs double-submit a
     decision — acceptable, matches how every other double-action race in
     this codebase is handled).
2. New page `app/organizer/organizations/page.js` — `apiGet('/api/org/my-orgs')`
   (any signed-in organizer-portal user may call this; it just returns
   `[]` for non-managers). Empty state: "You are not an org_manager of any
   organization. Ask an existing manager or an admin to promote you." (same
   tone as Phase 2/12's zero-eligible-org blocking copy). Non-empty:
   card per org (`name`, `type`, a badge reflecting `application_open`)
   linking to `/organizer/organizations/:id`.
3. New page `app/organizer/organizations/[id]/page.js` — `Promise.all([
   apiGet(`/api/org/${id}`), apiGet(`/api/org/${id}/applications`) ])`
   wrapped in the `try/catch → notFound()` pattern from the section above
   (a non-manager who navigates here directly gets 403 on the
   `/applications` call — both calls happen in the same `Promise.all`, so
   either one 403ing should route to `notFound()`). Render:
   - Org header (name/description/contact_email) plus the
     `toggleOrgApplicationsAction` button (step 1).
   - Filter links for `?status=` (`All`/`Pending`/`Approved`/`Rejected`) —
     write these as four plain inline `<Link>`s with the existing
     `pill-toggle`/`pill-toggle__item` classes (see Phase 22's note on
     `FilterTabs.jsx` — same decision applies here: inline rather than
     importing the admin-only component, unless the implementer prefers to
     promote it to `components/common/` once, for both phases to share).
   - Applications list via `<OrgApplicationsManager org={org}
     applications={applications} />` (new component, step 4).
4. New component `components/organizer/OrgApplicationsManager.jsx` — per
   application: applicant (`application.user.name`/`.email`, reuse
   `initialsOf`), `message` if present, `orgApplicationStatusMeta` badge
   (from Phase 22's `lib/events.js` addition — this phase depends on that
   helper existing; if Phase 22 hasn't shipped yet, add the helper here
   instead and let Phase 22 reuse it — whichever phase lands first owns
   it). For `status === 'pending'` rows only: an "Approve" button
   (`useTransition`, calls `approveOrgApplicationAction`) and an inline
   reject mini-form (`useActionState`, optional feedback textarea + submit,
   calls `rejectOrgApplicationAction`) — mirrors `StaffCallsManager.jsx`'s
   per-application accept/reject block structurally.
5. `components/navigation/navItems.js` — add `{ href:
   '/organizer/organizations', label: 'My Organizations', icon: 'home' }`
   to `organizerNavItems`. Shown unconditionally (even to non-managers, who
   see the empty state from step 2) — matches this plan's established
   convention of never hiding nav entries behind a role the frontend would
   have to re-derive client-side (Phase 1's whole point was the opposite:
   let the backend be the authorization boundary, not the nav).

## Files

- `app/organizer/actions.js`
- `app/organizer/organizations/page.js` (new)
- `app/organizer/organizations/[id]/page.js` (new)
- `components/organizer/OrgApplicationsManager.jsx` (new)
- `components/navigation/navItems.js`
- `lib/events.js` (only if Phase 22 hasn't already added `orgApplicationStatusMeta` — see step 4)

## Verification

- `npm run lint`
- `npm run build`
- Manual: sign in as a plain `member` (not `org_manager`) of a seeded org,
  confirm `/organizer/organizations` shows the empty "not an org_manager"
  state (seed `u7`/`u10` before Phase 22's approval, or any seeded plain
  member).
- Manual: sign in as an org_manager (seed `u2`, manager of `org1`), confirm
  `/organizer/organizations` lists `org1`, open its detail page, toggle
  `application_open` off and on, confirm the change is reflected after
  reload and (cross-check) that `/organizations` (Phase 22, user side) stops
  /resumes listing `org1` accordingly.
- Manual: submit an application as a different user (via Phase 22's UI or
  directly against the backend), confirm it appears in the Pending filter,
  approve it, confirm the applicant becomes a `member` (check via the
  existing admin `OrganizerMembers.jsx` or `GET /api/org/:id/members`), and
  reject a second one with feedback, confirm the feedback round-trips.
- Manual: attempt to resolve the same application twice (e.g. double-click
  Approve), confirm the second attempt surfaces the 409 message rather than
  crashing.
