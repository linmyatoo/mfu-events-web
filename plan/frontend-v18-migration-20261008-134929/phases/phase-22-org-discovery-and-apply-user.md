# Phase 22 — Organization discovery & self-serve join requests (user app)

**Status: Not started.**

**Spec section:** N/A in the original migration doc — entirely new backend
surface, `MFU-Events` commit `1d4a639` ("feat(org): add self-serve
join-request flow with manager approval queue"), confirmed by reading
`backend/lib/services/orgApplicationService.js`, the `/api/user/*`
additions in `backend/routes/user.js`, and the full test suite in
`backend/test/org-application.test.js` directly (not just the doc). The doc
addendum `48ffc32` ("Organization Discovery & Join Requests — User App")
was also checked and matches the source exactly — safe to cite as a
secondary reference.

Confirmed via `grep` that **zero** frontend code references `/api/org/`,
`application_open`, or `organizations/my-applications` anywhere in
`app/`/`lib/`/`components/` today — this is net-new, not a fix.

## Verified backend contract

```
GET  /api/user/organizations                 — any signed-in user
GET  /api/user/organizations/my-applications  — any signed-in user
POST /api/user/organizations/:id/apply        — any signed-in user, body { message? }
```

(`backend/routes/user.js:151-158` — note `/my-applications` is registered
**before** the bare `/organizations` route to avoid Express route
shadowing; irrelevant to the frontend, but explains why the backend file
orders them that way if you go read it.)

- **`GET /api/user/organizations`** → `orgApplicationService.listOpenOrgs()`
  → `db.filter('organizations', o => o.status === 'active' && o.application_open === true)`.
  Plain org objects (no embeds), always both `status: 'active'` and
  `application_open: true` by construction — no need to re-filter
  client-side.
- **`GET /api/user/organizations/my-applications`** →
  `orgApplicationService.listForUser(userId)` → every application this
  user has ever submitted (any status), each with `org` embedded:
  `{ ...application, org: orgService.getById(application.org_id) }`.
  `org` can theoretically be `null` if the org was later deleted (no
  deletion path exists today, but don't assume non-null without an
  optional-chain).
- **`POST /api/user/organizations/:id/apply`**, body `{ message? }` —
  `orgApplicationService.apply(orgId, userId, { message })`
  (`backend/lib/services/orgApplicationService.js:11-42`). Exact
  guard order and messages (confirmed in source, exercised 1:1 by
  `backend/test/org-application.test.js`):
  1. Org not found → **404** `"Organization not found."`
  2. `org.status !== 'active'` → **400** `"This organization is not active."`
  3. `!org.application_open` → **400** `"This organization is not currently open for applications."`
  4. Already an active member (`orgMembershipService.isMember`) → **409** `"You are already a member of this organization."`
  5. Already has a `pending` application to this org → **409** `"You already have a pending application to this organization."`
  6. Otherwise: inserts `{ id, org_id, user_id, message: message || null, status: 'pending', reviewed_by: null, reviewed_at: null, feedback: null, created_at }`.

**Application shape** (full row, as returned by both the apply response
and `my-applications`):
```js
{ id, org_id, user_id, message, status: 'pending'|'approved'|'rejected',
  reviewed_by, reviewed_at, feedback, created_at, org? }
```

**No `GET /api/user/organizations/:id` (singular) route exists.** Confirmed
by reading all of `backend/routes/user.js` and `backend/routes/org.js` —
`GET /api/org/:id` exists but requires the caller to already be a member
(`orgMembershipService.isMember`, 403 otherwise, `backend/routes/org.js:40-46`),
which is exactly the case this feature is for someone who is *not yet* a
member — calling it pre-membership would always 403. **Design
consequence:** do not build a `/organizations/[id]` detail page that
fetches a single org by id from the backend; there is nothing for it to
call. See Steps below for the inline-on-the-list-page design this forces.

## Existing patterns to follow

- List+apply pattern closest to this one: `app/(app)/staff-calls/page.js`
  + `components/events/StaffCallApplyForm.jsx` (browse → inline
  claim/apply), **not** `app/(app)/event-requests/` (that flow redirects to
  a detail page after creation, which doesn't apply here since there's no
  per-application detail view planned — see note above).
- Status badge helper pattern: `lib/events.js`'s `eventRequestStatusMeta`
  (`lib/events.js:325-334`) — add a sibling `orgApplicationStatusMeta`.
- Tab-switcher pattern: `components/admin/FilterTabs.jsx` is a generic
  `<Link>` + `pill-toggle` component with no admin-specific logic, but it
  lives in the admin-only component folder. **Decision for the
  implementer:** either (a) write a small local two-link tab switcher
  inline in this page (recommended — keeps this phase's diff isolated to
  the user portal, zero cross-portal import), or (b) move `FilterTabs.jsx`
  to `components/common/` and update its three existing admin importers.
  Default to (a) unless the reviewer prefers (b).
- Server-action pattern: `app/actions.js`'s existing `submitEventRequestAction`
  (`app/actions.js:347-366`) for the `failure(error)`/`revalidatePath`
  shape (no `redirect` here, since the apply form stays on the discover
  page — see Steps).

## Depends on / Risk / Shippability

**Depends on:** None. **Risk:** Medium — net-new surface, but small
(one list page, two small components, two-to-three server actions), and
the backend contract is unusually well-tested (`org-application.test.js`,
13 cases) so edge-case behavior is not guesswork. **Independently
shippable:** Yes.

## Steps

1. `lib/events.js` — add `ORG_APPLICATION_STATUS` constants (`pending`,
   `approved`, `rejected`) and `orgApplicationStatusMeta(status)`, mirroring
   `eventRequestStatusMeta` (warning/success/danger variants respectively).
2. `app/actions.js` — add:
   - `applyToOrgAction(_prevState, formData)` → reads `orgId` and
     `message` (trim; send `undefined`/omit when empty rather than `''`,
     since the backend already normalizes `message || null` but there's no
     reason to send an empty string over omitting the key) → `POST
     /api/user/organizations/:id/apply`. On success: `revalidatePath('/organizations')`,
     return `{ ok: true, message: 'Application submitted.' }` (no redirect
     — the user stays on the discover tab, consistent with the no-detail-page
     design above). On `ApiError`, return `failure(error)` as-is; the five
     guard messages above are already clear enough to show verbatim (no
     need for client-side pre-validation of "already a member" — the
     Discover list's own cross-reference, step 4, prevents most of these
     from being hit in the first place).
3. New component `components/events/OrgApplyForm.jsx` (client component) —
   small inline form per org card: optional `<textarea name="message">`
   plus a submit button, `useActionState(applyToOrgAction, initialState)`,
   hidden `orgId` input. Mirrors `StaffCallApplyForm.jsx`'s `application`
   branch structurally (dynamic optional field + single submit action), but
   simpler (one optional field, not N dynamic questions).
4. New page `app/(app)/organizations/page.js` — server component, reads
   `searchParams.view` (`'discover' | 'mine'`, default `'discover'`).
   - Fetch **both** `GET /api/user/organizations` and `GET
     /api/user/organizations/my-applications` unconditionally (cheap, both
     are small lists) regardless of which tab is active — the discover tab
     uses the my-applications list to mark any org the user already has a
     `pending` or `approved` application to (so the apply form can be
     swapped for a status badge instead of inviting a guaranteed 409/409-feeling
     duplicate-apply attempt). This is the "cross-reference" mentioned in
     step 2.
   - Discover tab: card per org (`name`, `type`, `description`), each
     showing either `<OrgApplyForm orgId={org.id} />` (no existing
     application) or a `badge` reflecting the existing application's status
     (pending/approved — a rejected application does **not** block
     re-applying, since the backend's duplicate check only looks at
     `status === 'pending'`; render the apply form again in that case, not
     a permanent rejected badge).
   - Mine tab: card per application — org name (`application.org?.name ??
     application.org_id`), `orgApplicationStatusMeta` badge, `message` if
     present, `feedback` if present (only meaningful when `rejected`),
     `created_at` via existing `formatDate` (from `lib/events.js`).
   - Empty states for both tabs via the existing `EmptyState` component.
5. `components/navigation/navItems.js` — add `{ href: '/organizations',
   label: 'Organizations', icon: 'place' }` to `userNavItems`. (`place` is
   unused within `userNavItems` specifically — it's reused from
   `organizerNavItems`'s Venues entry, which is fine; icons already repeat
   across portals in this file, e.g. `user` appears twice within
   `userNavItems` itself.)
6. `lib/events.js` / `components/navigation/navItems.js`'s `isActiveRoute`
   needs no change — the default `pathname === href ||
   pathname.startsWith(\`${href}/\`)` branch already covers `/organizations`
   with no portal-root special case needed (it's not a root route like `/`,
   `/organizer`, `/admin`).

## Files

- `lib/events.js`
- `app/actions.js`
- `components/events/OrgApplyForm.jsx` (new)
- `app/(app)/organizations/page.js` (new)
- `components/navigation/navItems.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual: sign in as a user with no org memberships, visit
  `/organizations`, confirm the seeded open orgs (`org1` Computing Society,
  `org2` Sports Club, per `backend/lib/seed.js`) appear on the Discover
  tab, submit an application with a message, confirm it appears on the
  Mine tab as `pending`.
- Manual: attempt to apply to the same org again before it's resolved,
  confirm the Discover tab now shows a "pending" badge instead of the form
  (not a 409 error) — this is the cross-reference from step 4, not just
  backend error surfacing.
- Manual: as an org_manager (seed `u2`), reject the application (requires
  Phase 23 to be shippable, or hit the route directly during manual testing
  before Phase 23 ships), confirm the Mine tab shows `rejected` with
  feedback, and the Discover tab lets the user apply to the same org again.
