# Phase 20 — Real `review_edit_window_days` via `GET /api/user/settings`

**Status: Not started.**

**Spec section:** N/A in the original migration doc — this consumes a
**post-Phase-19 backend follow-up**, commit `029684f` ("fix: address three
backend follow-ups from plan review") in `MFU-Events`. Verified directly
against `backend/routes/user.js:60-65` (new route, inserted right after
`GET /api/user/me`, mounted under the same `router.use(authenticate)` as
every other `/api/user/*` route — no extra role check):

```js
const PUBLIC_SETTING_KEYS = ['review_edit_window_days', 'checkin_window_grace_minutes'];
router.get('/settings', handle(() => {
  const all = db.getSettings();
  return Object.fromEntries(PUBLIC_SETTING_KEYS.map((k) => [k, all[k]]));
}));
```

Response shape: `{ review_edit_window_days: 7, checkin_window_grace_minutes: 15 }`
(defaults per seed — confirm live values are not assumed anywhere in code).
Also confirmed consistent with the backend-doc addendum `48ffc32` ("Public
Settings — User / Organizer Apps" section) and exercised in
`backend/smoke-test.js`'s "public settings" check (commit `fd9f343`) — doc
and smoke test agree with the route source, no drift found this time.

**Depends on:** Phase 18 (`ReviewsSection.jsx` edit/delete UI) and Phase 19
(admin settings page, unrelated but same component's blocking note) —
both already shipped. This phase removes the "genuinely blocked" status
Phase 19 recorded for this exact gap.
**Risk:** Low — one new fetch, one hardcoded-constant deletion, prop-drilled
through two existing page components into one existing component.
**Independently shippable:** Yes.

## Why this was blocked before, and why it isn't now

`components/events/ReviewsSection.jsx:13-32` hardcodes
`REVIEW_EDIT_WINDOW_DAYS = 7` with a comment explaining that `GET
/api/admin/settings` is `requireAdmin`-gated and `ReviewsSection` never
renders in the Admin portal, so there was no session context from which to
read the real value (Phase 18 and Phase 19 both hit this and left it
hardcoded). `GET /api/user/settings` removes that blocker: it requires only
`authenticate` (any signed-in user), and `ReviewsSection` only ever renders
for signed-in users (User portal: `app/(app)/events/[id]/page.js`;
Organizer portal, read-only: `app/organizer/events/[id]/page.js`).

## Steps

1. `app/(app)/events/[id]/page.js` — add `apiGet('/api/user/settings')` to
   the existing `Promise.all([requireUser(), loadEvent(id)])` (becomes a
   3-way `Promise.all`), pass `reviewEditWindowDays={settings.review_edit_window_days}`
   as a new prop to `<ReviewsSection>` (currently called with just `event`/`user`,
   see `app/(app)/events/[id]/page.js:133`).
2. `app/organizer/events/[id]/page.js` — same fetch, same prop, passed into
   the `readOnly` call site (`app/organizer/events/[id]/page.js:173`). Note:
   because `readOnly` forces `isOwn` to `false` inside `ReviewsSection`
   (`canEdit` can never be `true` when `readOnly`), this fetch is technically
   inert on this page today — included anyway so the component's prop
   contract doesn't silently differ per portal, and so it's already wired if
   a future phase ever lets a co-organizer author/edit a review. Flag this
   as optional if the implementer wants to skip it and default the prop
   instead (see step 3).
3. `components/events/ReviewsSection.jsx` — delete the
   `REVIEW_EDIT_WINDOW_DAYS` constant and its now-stale comment block (lines
   13-32). Accept a new prop `reviewEditWindowDays` (default to `7` if
   `undefined`, as a defensive fallback matching the old hardcoded default —
   do **not** silently treat a missing prop as "never editable"). Replace
   the one call site, `daysSince(review.created_at) <= REVIEW_EDIT_WINDOW_DAYS`
   (line 148), with `daysSince(review.created_at) <= reviewEditWindowDays`.
4. Update the component's doc comment (lines 13-16, the ones describing the
   edit/delete window) to describe the real source
   (`GET /api/user/settings`) instead of the "no user-facing way to read the
   real setting" explanation, which is no longer true.

## Files

- `app/(app)/events/[id]/page.js`
- `app/organizer/events/[id]/page.js`
- `components/events/ReviewsSection.jsx`

## Verification

- `npm run lint`
- `npm run build`
- Manual: change `review_edit_window_days` via `/admin/settings` (Phase 19)
  to a small number (e.g. `0`), sign in as a user with a recent review,
  reload the event page, confirm Edit/Delete disappear immediately
  (previously this required a code change since `7` was hardcoded).
- Manual: confirm `/organizer/events/[id]` still renders reviews read-only
  with no Edit/Delete controls regardless of the new prop (readOnly gate
  unaffected).
