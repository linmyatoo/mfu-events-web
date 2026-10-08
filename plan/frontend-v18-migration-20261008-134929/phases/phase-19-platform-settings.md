# Phase 19 — Admin Platform Settings page

**Status: Complete (2026-10-08).** Implemented as scoped (Steps 1-3). Step
4 (thread the real `review_edit_window_days` value down to
`ReviewsSection.jsx`) was attempted but found genuinely blocked, not just
deferred: `GET /api/admin/settings` is mounted behind `requireAdmin` for the
whole router (confirmed `backend/routes/admin.js:40`,
`backend/middleware/auth.js:52-57`) and no other route file (`user.js`,
`organizer.js`) exposes any settings read. `ReviewsSection.jsx` only ever
renders in the User portal (`app/(app)/events/[id]/page.js`) and Organizer
portal (`app/organizer/events/[id]/page.js`) — never the Admin portal — so
there is no session context in which this component could call the admin
settings endpoint even with prop-threading added at the page level. Left
`REVIEW_EDIT_WINDOW_DAYS = 7` hardcoded in `ReviewsSection.jsx`, updated its
comment to explain the block precisely and note this needs a backend change
(a non-admin-readable settings subset, or embedding the field in the
event/booking payload) to actually unblock — out of scope for this
frontend-only plan. This confirms (rather than contradicts) Phase 18's own
finding, which already flagged this same admin-only gate.

`npm run lint` and `npm run build` both pass. Added a `settings` gear-icon
path to `components/common/Icon.jsx` (none of the existing glyphs fit;
reusing another admin icon would have duplicated it on the nav) per that
file's own "add a new entry to `paths`" convention.

Manual verification against a running backend (change a threshold, save,
confirm `GET /api/admin/settings` reflects it after reload) was not
performed in this session — do that before considering the cross-phase
smoke test in `plan.md` fully satisfied.

**Spec section:** "Platform Settings — Admin App".
**Depends on:** None to build; Phase 18 benefits from it existing (so `review_edit_window_days` can be read live instead of hardcoded).
**Risk:** Low — single GET/PATCH form, same pattern as `components/admin/VenueForm.jsx`/`ItemForm.jsx` (edit-existing-row style, minus the create branch).
**Independently shippable:** Yes. Recommend doing this early in Part B specifically so Phase 18 can consume it, but it has no hard code dependency forcing that order.

## Steps

1. `app/admin/actions.js` — add `updateSettingsAction(_prevState, formData)` → `PATCH /api/admin/settings`, body built from whatever fields the backend's settings object actually contains (confirm the full field list against the backend's `DEFAULT_SETTINGS` in `constants.js`, referenced in `lib/events.js:281-283` and `app/admin/actions.js:17` style comments — likely includes health-flag thresholds, review edit window, check-in grace period, tier definitions per the doc's one-line description).
2. New page `app/admin/settings/page.js` — `GET /api/admin/settings` via `apiGetAllowed` (gated by `admin_permissions` like every other admin page), render a form pre-filled with current values, submit via the new action.
3. `components/navigation/navItems.js` — add `{ href: '/admin/settings', label: 'Settings', icon: '...' }` to `adminNavItems`.
4. Once this ships, circle back to Phase 18 and thread the real `review_edit_window_days` value down to `ReviewsSection.jsx` instead of the hardcoded `7` (fetch once in the event detail page's data loading alongside the event itself, pass as a prop).

## Files

- `app/admin/actions.js`
- `app/admin/settings/page.js` (new)
- `components/admin/SettingsForm.jsx` (new)
- `components/navigation/navItems.js`
- `components/common/Icon.jsx` (new `settings` glyph, not in the original file list)
- `components/events/ReviewsSection.jsx` (comment updated only — prop-threading
  turned out to be blocked by the admin-only settings route, see Status above;
  `REVIEW_EDIT_WINDOW_DAYS` stays hardcoded)

## Verification

- `npm run lint`
- `npm run build`
- Manual: `/admin/settings`, change a threshold value, save, confirm `GET /api/admin/settings` reflects the new value after reload (and that `app/(app)/profile/page.js`'s `healthBand()` or Phase 18's review window actually respects it, once wired).
