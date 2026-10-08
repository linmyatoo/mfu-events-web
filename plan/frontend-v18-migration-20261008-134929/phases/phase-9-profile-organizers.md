# Phase 9 — Profile page: drop `/api/user/me/organizers`

**Status:** Complete (2026-10-08).
**Breaking change:** #5 / #3.
**Depends on:** Phase 1 conceptually (same "organizer is not a gate" theme) but no code dependency.
**Risk:** Low.
**Independently shippable:** Yes.

## Confirmation against backend source

Verified directly against `/Users/panda/Desktop/MFU-Events/backend/routes/user.js`
(no `/me/organizers` route exists anywhere in the file — grep confirmed) and
`backend/routes/organizer.js` (`router.get('/my-organizers', ...)` exists,
returning `memberships.map((m) => ({ ...m, org: orgService.getById(m.org_id) }))`
— matches `lib/session.js`'s documented `getMyOrganizers()` shape exactly,
field names `org`/`org_id`/`status` confirmed, no re-derivation needed).

## Steps

1. `app/(app)/profile/page.js`:
   - Remove the `organizers` fetch (line 34-39, `apiGet('/api/user/me/organizers')` wrapped in try/catch).
   - Remove the "Organizer memberships" section (line 79-103) that renders from it.
   - If an "organizer involvement" summary is still wanted on the profile page, source it from `GET /api/organizer/events` (per doc §5 replacement guidance) and render a simple count/list instead — optional, not required to close this breaking change; the minimal fix is just removing the dead call. Recommend keeping this phase minimal (just remove) and letting Phase 17 (Recognition) or a future profile enhancement cover richer organizer-involvement display, since the doc's Recognition endpoint (`GET /api/user/me/recognition`) already surfaces an `organized: { count, tier, title }` summary that's a better fit than re-fetching event lists here.
   - The `items` catalogue entry in `TILES` is handled by Phase 8, not here — don't duplicate.

## Files

- `app/(app)/profile/page.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual: open `/profile` for any signed-in user. Confirm no network call to `/api/user/me/organizers`, no console/server error, page renders normally without the removed section.

## Outcome

Implemented the minimal-removal path recommended in Steps above: removed the
`apiGet('/api/user/me/organizers')` try/catch fetch and its unused `ApiError`
import, and removed the entire "Organizer memberships" `<section>`. Did not
add a richer organizer-involvement summary — left for Phase 17 (Recognition)
per the recommendation in this file's Steps section. `TILES` already had no
`items` entry (Phase 8 handled that) so nothing to deduplicate.

- `npm run lint` — clean, no errors/warnings.
- `npm run build` — compiled successfully, `/profile` still listed as a
  dynamic (`ƒ`) route.
- No drift found beyond what the phase file already anticipated; backend
  confirmation matched the plan's claims exactly.
