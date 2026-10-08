# Phase 7 — Organizer flag resolution action rename

**Breaking change:** #7.
**Depends on:** None.
**Risk:** Low.
**Independently shippable:** Yes — smallest phase in Part A.

## Steps

1. `components/admin/FlagResolver.jsx`:
   - `ORGANIZER_ACTIONS` (line 18-23): change `{ value: 'suspend', label: 'Suspend', variant: 'danger' }` to `{ value: 'restrict', label: 'Restrict', variant: 'danger' }`.
   - Update the file's doc comment (line 14-17) to read `dismiss | warn | restrict | deactivate` instead of `dismiss | warn | suspend | deactivate`, and note what `restrict` does (`organizer_restricted: true`, blocks event submission — not an account suspension).
2. `app/admin/actions.js`:
   - `resolveOrganizerFlagAction` doc comment (line 306): update `/** action: dismiss | warn | suspend | deactivate */` to `/** action: dismiss | warn | restrict | deactivate */`. The function body itself needs no change — it already forwards whatever `action` string the caller passes through to `POST /api/admin/flags/organizers/:id/resolve`.

## Files

- `components/admin/FlagResolver.jsx`
- `app/admin/actions.js` (comment only, line 306)

## Verification

- `npm run lint`
- `npm run build`
- Manual: `/admin/flags`, open an organizer flag, click "Restrict". Confirm the backend accepts it (no 400 for an unrecognized action) and the flag's `resolution_action` shows `restrict` after `revalidatePath`.

## Status: Complete (2026-10-08)

Implemented exactly as planned, with one backend-source confirmation beyond
the phase file's assumptions (per the correction-pass standard established
in Phases 4-6): verified directly against
`/Users/panda/Desktop/MFU-Events/backend/lib/services/flagService.js` and
`backend/routes/admin.js` rather than trusting the doc/phase file alone.

- `resolveOrganizerFlag` (flagService.js:82-100) branches on `action ===
  'restrict'` (sets `organizer_restricted: true`) and `action ===
  'deactivate'` (sets `status: 'deactivated'`) — no `'suspend'` exists
  anywhere in the backend. Confirms organizer flags support
  `dismiss | warn | restrict | deactivate` exactly as this phase file
  assumed.
- `resolveHealthFlag` (flagService.js:109-124) only branches on `restrict` —
  confirms health flags are `dismiss | warn | restrict` only, no
  `deactivate`, matching the existing `HEALTH_ACTIONS` array (left
  unchanged).
- Neither route (`backend/routes/admin.js:258,262`) validates/whitelists the
  `action` string server-side, so the rename was a pure client-side label/value
  fix with no backend-compat risk either way.
- **Drift found:** none beyond what the phase file already assumed — this
  phase's premise held up exactly as written, unlike Phases 4-6.

Files changed:
- `components/admin/FlagResolver.jsx` — doc comment (lines 14-17) and
  `ORGANIZER_ACTIONS` entry (line 21) `suspend` → `restrict`.
- `app/admin/actions.js` — `resolveOrganizerFlagAction` doc comment (line
  314) `suspend` → `restrict`. Function body unchanged (already forwards
  `action` verbatim).

Verification: `npm run lint` — clean. `npm run build` — compiled
successfully, all routes generated, no errors. Manual backend-accept check
not run against a live dev server in this session (no backend process
started); confirmed via source-code inspection instead per the task's
instruction to verify against backend source directly.
