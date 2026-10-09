# Phase 5 — Admin portal pass

Status: done
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

## Outcome (confirmation pass, zero edits)

Read every file in scope: `app/admin/page.js`, `app/admin/events/[id]/page.js`,
`app/admin/events/new/page.js`, `app/admin/event-requests/page.js`,
`app/admin/event-requests/[id]/page.js`, `app/admin/organizers/page.js`,
`app/admin/organizers/[id]/page.js`, `app/admin/users/page.js`,
`app/admin/users/[id]/page.js`, `app/admin/points/page.js`,
`app/admin/venues/page.js`, `app/admin/venues/schedule/page.js`,
`app/admin/flags/page.js`, `app/admin/logs/page.js`,
`app/admin/settings/page.js`, plus `EventReview.jsx`,
`EventRequestReview.jsx`, `NewOrganizerForm.jsx`, `OrganizerMembers.jsx`,
`UserActions.jsx`, `PointsResolver.jsx`, `PointsSyncButton.jsx`,
`PointEventForm.jsx`, `VenueForm.jsx`, `VenueAssigner.jsx`,
`FlagResolver.jsx`, `RequesterHealthPanel.jsx`, `SettingsForm.jsx`,
`Disclosure.jsx` (all under `components/admin/`).

**Confirmed, no action needed:**

- `/admin` (dashboard = `AdminEventsPage`, `app/admin/page.js`) and
  `/admin/points` (`app/admin/points/page.js`) both pass `actions` to
  `PageContainer` and correctly inherit Phase 1's fix —
  `components/layout/PageContainer.jsx` wraps `actions` in
  `page-header__actions`, and `styles/layout.css:263-265` gives that a
  `margin-top: var(--space-2)` (8px) gap under the subtitle. Confirmed by
  reading the cascade directly, matching the two other
  `actions`-passing pages already fixed in Phase 1.
- `app/admin/events/[id]/page.js:57` and
  `app/admin/event-requests/[id]/page.js:49` both use
  `.event-detail__intro` as a bare `<header>` with no local override —
  confirmed they inherit Phase 3's fix
  (`styles/components.css:679-682`, `margin-bottom: var(--space-5)` directly
  on `.event-detail__intro`). No JSX or CSS change needed here, per the
  task's explicit instruction not to re-fix this.
- `components/layout/Header.jsx`'s `.app-header__points` (rendered in the
  admin header too) already carries Phase 3's `gap: var(--space-2)` fix
  (`styles/layout.css:160-171`) — admin inherits it with zero admin-specific
  code.
- `Disclosure.jsx` (used on `/admin/venues` to expand `VenueForm` inline) has
  no padding of its own — it's a bare `Button` + `children`. The expanded
  child (`VenueForm`, a `.card card--padded` form) sits inside an
  already-`.card card--padded` `<li>`, i.e. a padded card nested in a padded
  card. This is a pre-existing structural/visual-density choice, not a
  `--space-*` scale violation (both paddings are `var(--space-4)`) and isn't
  on the Phase 2 punch list, so left alone per "resist scope creep."
- All admin list/detail/form components use only standard token-based
  classes already audited clean elsewhere (`.card`/`.card--padded`, `.field`,
  `.booking-panel__row`, `.stack`, `.badge`, `.chip`, `.settings-tile`,
  `.organizer-list`, `.event-card__meta`, `.back-link`) — no inline styles,
  no new off-scale paddings, no new hex colors.
- Punch-list item 6 (`.badge { gap: 5px; }`, `components.css:572`) — grepped
  every `badge badge--*` usage across `app/admin` and `components/admin`
  (9 call sites: flags, users list/detail, points, event detail,
  organizer detail, VenueAssigner, RequesterHealthPanel ×2); none render an
  `Icon` beside the badge text, so the dead gap has no visible effect in this
  portal either. Not touched, per the phase file's "skip unless already
  editing that selector" instruction — nothing else in Phase 5 required
  touching `.badge`.
- Punch-list item 7 (`.portal-switch__item` padding) lives in
  `components/layout/Header.jsx`/`styles/components.css:445`, a cross-portal
  primitive, not admin-specific — no Phase 5 action, consistent with how
  Phase 4 treated it.

**No fixes were made in this phase** — the admin portal was already
token-clean post Phase 1/3, confirming the plan's prediction that most
portal passes would be "confirm and move on."

### Verification run
- `npm run lint` — clean, zero warnings/errors.
- `npm run build` — compiled successfully, all `/admin/*` routes listed.
- `grep -rn "style=" app components` — zero matches.
- `grep -rn "#[0-9a-fA-F]\{6\}" styles/*.css` — only the two brand blues
  (`#1a3fc4`/`#0f2a8c`), dark-theme lift (`#5b7fff`), and pre-existing
  neutral/status colors. No third hue, no admin-specific additions.
