# Phase 4 — Organizer event detail response shape

**Status: Complete (2026-10-08).** Implemented largely as scoped, with one
correction found against the actual backend route source
(`backend/routes/organizer.js:110-127`): `GET /api/organizer/events/:id`
does **not** return an `event.organizer` field at all — it was fully
removed, not merely made optional/nullable as this phase file originally
assumed. The response only spreads the raw event (which carries `org_id`,
not an embedded org entity) plus `myRole`, `venue`, `team`, `contributors`,
`attendeeCount`, `questions`, `reviews`. There is no team-scoped endpoint to
resolve an org name from `org_id` on this page. Fix: removed the dead
`{event.organizer ? (...) : null}` block (previously rendered the org name
in the header meta) instead of leaving it as inert dead code, and added a
doc-comment note above the component explaining why no org name is shown.
Added a minimal read-only Contributors section (`event.contributors ?? []`,
mapped to `name`/`position_title`, same list styling as `TeamManager`) right
after `TeamManager`. `TeamManager.jsx` needed no changes — confirmed its
`id/user_id/role/name` field reads already match the new `team` shape
exactly. `event.myRole` usage was already correct, left as-is.
`npm run lint` and `npm run build` both pass.

**Breaking change:** #4 (organizer side).
**Depends on:** Phase 1-3 recommended but not strictly required (this page is reachable independently via direct URL even before those land).
**Risk:** Medium — the page composes several child components (`TeamManager`, `AttendeeList`, `AnswerForm`, `ItemRequestForm`, `ReviewsSection`, `EventLifecycle`) against the event object.
**Independently shippable:** Yes.

## Steps

1. `app/organizer/events/[id]/page.js`:
   - `event.team` already matches the new shape reasonably (`{ id, event_id, user_id, role, joined_via, name }` vs. old `{...eventOrganizers}` — `TeamManager.jsx` only reads `id/user_id/role/name`, so no change needed there).
   - Add rendering for `event.contributors` (new field, currently ignored) — at minimum list them read-only in this phase; full add/remove UI is Phase 14 (Part B). A minimal read-only list keeps this phase's diff about the *shape fix*, not the new feature.
   - `event.organizer` (the org entity) is now optional/nullable per doc §4 — the existing `{event.organizer ? (...) : null}` guard (line 98-103) already handles `null` correctly. No change needed, just confirm it still renders when `org_id` is unset.
   - Remove the item-requests/`ItemRequestForm` wiring from this file — out of scope here, handled in Phase 8 (Items removal) to avoid conflating two unrelated diffs. If Phase 8 ships first, skip this note.
2. Leave `event.myRole` usage as-is — it already matches the new shape exactly.

## Files

- `app/organizer/events/[id]/page.js`
- `components/organizer/TeamManager.jsx` (verify only — no expected diff)

## Verification

- `npm run lint`
- `npm run build`
- Manual: open an event detail page as `main_organizer`. Confirm team list renders, contributors section renders (even if empty), no console errors about missing `event.organizer`/`event.team` fields.
- Manual: open the same page as `checkin_staff` — confirm Q&A/reviews sections stay hidden per the existing `canEdit` gate (line 52, unaffected by this phase).
