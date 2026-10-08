# Phase 5 — Admin portal pass

Status: not started
Depends on: Phase 1, Phase 2

## Scope

`app/admin/*`:
- `app/admin/page.js` (dashboard, passes `actions` — re-verify Phase 1 fix)
- `app/admin/events/[id]/page.js`, `app/admin/events/new/page.js` →
  `EventReview.jsx`
- `app/admin/event-requests/page.js`, `app/admin/event-requests/[id]/page.js`
  → `EventRequestReview.jsx`
- `app/admin/organizers/page.js`, `app/admin/organizers/[id]/page.js` →
  `NewOrganizerForm.jsx`, `OrganizerMembers.jsx`
- `app/admin/users/page.js`, `app/admin/users/[id]/page.js` → `UserActions.jsx`
- `app/admin/points/page.js` (passes `actions` — re-verify) →
  `PointsResolver.jsx`, `PointsSyncButton.jsx`, `PointEventForm.jsx`
- `app/admin/venues/page.js`, `app/admin/venues/schedule/page.js` →
  `VenueForm.jsx`, `VenueAssigner.jsx`
- `app/admin/flags/page.js` → `FlagResolver.jsx`
- `app/admin/logs/page.js` → `RequesterHealthPanel.jsx`
- `app/admin/settings/page.js` → `SettingsForm.jsx`

## Approach

Same confirmation-first approach. Admin has the most data-table-like list
pages (`Disclosure.jsx` is used for expandable rows — check its internal
padding against `.card`/`.settings-tile` conventions since it's a pattern not
seen in the other two portals). Re-verify both `actions`-passing pages
(`/admin`, `/admin/points`) explicitly since they're 2 of the 4 total
`PageContainer actions` consumers that motivated Phase 1.

## Verification

Same as Phase 3/4, applied to admin pages, plus explicit re-confirmation of
`/admin` and `/admin/points` header spacing.
