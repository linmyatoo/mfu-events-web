# Phase 1 — Organizer portal access for any authenticated user

**Status: Complete (2026-10-08).** Implemented exactly as scoped below.
`lib/session.js`: `requireOrganizer()` no longer redirects on zero
memberships; `portalsFor()` now pushes the Organizer portal entry for any
non-null `user` instead of gating on `memberships?.length`. `app/organizer/layout.js`:
updated the stale doc comment (previously said `requireOrganizer` sends
unaffiliated accounts back to the User portal — no longer true) and reworded
the empty-state sidebar note from "No organizer entity yet." to "Not
affiliated with an organization." per the phase's own suggestion. Verified:
`npm run lint` (clean) and `npm run build` (succeeds, all routes compile,
`/organizer` still present as a dynamic route). Manual sign-in verification
against a running backend was not performed in this session — do that before
considering the cross-phase smoke test in `plan.md` fully satisfied.

**Breaking change:** #6 in the spec (`requireOrganizer` / portal switcher gating).
**Risk:** Low-medium. Touches the shared guard used by every organizer-portal page, but the change itself is a removed conditional, not a new one.
**Independently shippable:** Yes — ships as "any signed-in user now sees the Organizer tab," with the rest of the organizer portal still assuming per-org events until Phase 2/3 land. Acceptable as an intermediate state (a user with no org events sees an empty "My Events" list, which already has an empty-state per `app/organizer/page.js:59-70`), but ship Phase 2 immediately after to avoid a confusing dangling state.

## Steps

1. `lib/session.js`
   - `requireOrganizer()` (line 67-72): remove the `if (memberships.length === 0) redirect('/')` line. Keep calling `getMyOrganizers()` and returning `{ user, memberships }` — `memberships` stays useful for the optional "Organizing for" sidebar note and any org-affiliation picker.
   - `portalsFor(user, memberships)` (line 82-91): change `if (memberships?.length) { portals.push(...organizer...) }` to always push the Organizer portal entry for any non-null `user` (every caller already has a non-null `user` by the time `portalsFor` runs, since it's called after a `require*` guard).
2. `app/organizer/layout.js` — no code change expected; re-verify the `sidebarNote.body` fallback text ("No organizer entity yet.") still reads sensibly when `memberships` is legitimately empty for a user who has never joined an org. Consider wording it as "Not affiliated with an organization" to avoid implying something is missing.

## Files

- `lib/session.js`
- `app/organizer/layout.js` (copy review only, likely no diff)

## Verification

- `npm run lint`
- `npm run build`
- Manual: sign in as a plain student account with zero org memberships (check backend seed/test data for one). Confirm the Organizer tab now appears in the portal switcher and `/organizer` no longer redirects to `/`.
- Manual: sign in as an account that still has an org membership. Confirm no regression — Organizer tab still appears, "Organizing for" note still lists the org name(s).

## Correction note (2026-10-08)

Confirmed scope after reviewing backend commits `1411ddd`/`2ff2609`: this
phase is about **portal entry gating only** (`lib/session.js`
`requireOrganizer()`/`portalsFor()` — whether the Organizer tab/route is
reachable at all) and does **not** claim event creation or event-request
submission is org-free. Those now require an active org membership again
(see the corrected Phase 2 and Phase 12). No change to this phase's steps —
it only removes the `memberships.length === 0` redirect that gates *portal
access*, which is unaffected by the org_id-for-creation correction. The
phase's own text above does not bleed into creation semantics, so no edit
was needed beyond this confirmation note.
