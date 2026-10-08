# Phase 17 — Recognition (user app)

**Spec section:** "Recognition — User App".
**Depends on:** None.
**Risk:** Low — single read-only GET, simple rendering.
**Independently shippable:** Yes.

## Steps

1. New page `app/(app)/recognition/page.js` (or fold into `app/(app)/profile/page.js` as a new section — recommend a dedicated page since the doc treats it as a first-class feature with its own nav-worthy content, consistent with how Points and Health already have dedicated pages rather than being profile sub-sections).
2. `GET /api/user/me/recognition` → render `attended`/`organized`/`contributed` as three tiles, each showing `count`, a tier badge, and `title` (render "Not yet earned" or similar when `title` is `null`).
3. `components/navigation/navItems.js` — add `{ href: '/recognition', label: 'Recognition', icon: '...' }` to `userNavItems`.

## Files

- `app/(app)/recognition/page.js` (new)
- `components/navigation/navItems.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual: open `/recognition` as a user with some attendance/organizing history, confirm tiers/titles render correctly, including the `title: null` → tier-0 case for `contributed` on a fresh account.

## Status: Complete (2026-10-08)

- Confirmed response shape directly against
  `/Users/panda/Desktop/MFU-Events/backend/lib/services/recognitionService.js`:
  `{ attended: {count, tier, title}, organized: {count, tier, title},
  contributed: {count, tier, title} }`. Note on `title: null`: with the
  service's default tier-threshold settings, every reachable tier index has a
  matching entry in the title arrays (`ATTENDEE_TITLES`/`ORGANIZER_TITLES`/
  `CONTRIBUTOR_TITLES`), so `title` is only `null` if an admin configures
  more tiers (`db.getSettings().*_tiers`) than that category's title array
  has entries — a real but non-default case. The page still renders a
  graceful "Not yet earned" fallback whenever `title` is falsy, per the
  phase spec.
- Built `app/(app)/recognition/page.js` (new) as a dedicated page (not a
  profile sub-section), per the phase's own recommendation and Phase 9's
  deferral note — reuses the `PageContainer` + `card card--padded` +
  `booking-panel__row` stat pattern from `app/(app)/points/page.js` and
  `app/(app)/health/page.js`. Renders one card per category (Attended /
  Organized / Contributed) showing a `Tier N` badge, the raw count, and the
  title (or "Not yet earned").
- Added `{ href: '/recognition', label: 'Recognition', icon: 'star' }` to
  `userNavItems` in `components/navigation/navItems.js`, between `/points`
  and `/health` (no existing nav icon fit better; `star` is unused elsewhere
  in the user portal nav).
- Did not touch `app/(app)/profile/page.js` — out of this phase's file list;
  its `TILES` shortcuts array is already a partial subset (omits
  event-requests/staff-calls too), so leaving it as-is is consistent with
  existing precedent rather than a gap.
- `npm run lint` — clean, no errors.
- `npm run build` — succeeded; `/recognition` listed as a dynamic (`ƒ`)
  route alongside the other portal pages.
- No drift beyond the `title: null` nuance above — endpoint path, method,
  and field names all matched the phase file and parent-task description
  exactly.
