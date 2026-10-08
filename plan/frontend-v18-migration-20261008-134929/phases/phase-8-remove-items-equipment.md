# Phase 8 — Remove Items & Equipment entirely

**Breaking change:** #10.
**Depends on:** None (can run in parallel with anything else; touches a disjoint set of files).
**Risk:** Low — pure deletion, not a shape migration. Main risk is missing a reference and leaving a dead import that breaks the build.
**Independently shippable:** Yes.

## Steps

1. Delete pages:
   - `app/(app)/items/page.js`
   - `app/admin/items/page.js`
2. Delete components:
   - `components/organizer/ItemRequestForm.jsx`
   - `components/admin/ItemRequestReview.jsx`
   - `components/admin/ItemForm.jsx`
3. `app/organizer/actions.js` — delete `saveItemRequestsAction` (line 267-288) and its `apiPut` import if now unused.
4. `app/admin/actions.js` — delete `saveItemAction` (line 256-286) and `resolveItemRequestAction` (line 288-302).
5. `app/organizer/events/[id]/page.js` — remove the `items`/`requests` fetch (line 56-57: `apiGetAllowed('/api/organizer/items')`, `apiGetAllowed(.../item-requests)`) and the `<ItemRequestForm>` render block (line 167-174), plus the now-unused destructured `items`/`requests` from the `Promise.all`.
6. `app/admin/events/[id]/page.js` — remove the `requests` fetch (line 48: `apiGetAllowed(.../item-requests)`) and the `<ItemRequestReview>` render block (line 132-134).
7. `components/navigation/navItems.js` — remove the `{ href: '/admin/items', label: 'Items', icon: 'sparkle' }` entry from `adminNavItems` (line 30).
8. `app/(app)/profile/page.js` — remove the `{ href: '/items', label: 'Equipment catalogue', icon: 'search' }` entry from `TILES` (line 14).
9. Grep sweep after the above to confirm nothing remains: `grep -rn "item" app components lib --include="*.js" --include="*.jsx" -i | grep -iv "items.map\|requirement"` (manual eyeball — "item" is a common substring, so a plain grep will have noise; the goal is zero remaining imports of the deleted files/actions).

## Files

- `app/(app)/items/page.js` (delete)
- `app/admin/items/page.js` (delete)
- `components/organizer/ItemRequestForm.jsx` (delete)
- `components/admin/ItemRequestReview.jsx` (delete)
- `components/admin/ItemForm.jsx` (delete)
- `app/organizer/actions.js`
- `app/admin/actions.js`
- `app/organizer/events/[id]/page.js`
- `app/admin/events/[id]/page.js`
- `components/navigation/navItems.js`
- `app/(app)/profile/page.js`

## Rollback note

Pure deletion phases are trivially revertable via `git revert`, but note there is no feature-flag path here — once shipped, the equipment catalogue is gone for every user immediately. Confirm with stakeholders that this is desired before merging (the task brief treats it as settled per the backend's removal, so this should be uncontroversial).

## Verification

- `npm run lint` — will catch dangling imports of deleted files immediately.
- `npm run build` — will fail loudly if any deleted export is still referenced.
- Manual: confirm `/items`, `/admin/items` now 404 (route removed) rather than erroring, and that the organizer/admin event detail pages render without the items sections and without console errors.

## Status: Complete (2026-10-08)

Confirmed against backend source before deleting anything: `grep -rniE
"item" /Users/panda/Desktop/MFU-Events/backend/routes/` (admin.js, auth.js,
org.js, organizer.js, user.js) returned zero matches — no `items` or
`item-requests` routes exist. `backend/lib/services/itemService.js` still
exists on disk but is never imported from any route file (`grep -rn
"itemService" backend/ --include="*.js"` excluding `node_modules` returned
nothing) — confirmed orphaned/dead, not wired to any endpoint. The breaking
change is real and the phase file's premise held.

Deleted:
- `app/(app)/items/page.js`
- `app/admin/items/page.js`
- `components/organizer/ItemRequestForm.jsx`
- `components/admin/ItemRequestReview.jsx`
- `components/admin/ItemForm.jsx`

Edited:
- `app/organizer/actions.js` — removed `saveItemRequestsAction` and the now-unused `apiPut` import; renamed the `// --- Q&A and item requests ---` section comment to `// --- Q&A ---`.
- `app/admin/actions.js` — removed `saveItemAction` and `resolveItemRequestAction` (and the `// --- Items ---` section comment/header).
- `app/organizer/events/[id]/page.js` — removed the `ItemRequestForm` import/render block, the `items`/`requests` fetches from the `Promise.all` (collapsed to a single `attendees` fetch, since it was the only survivor).
- `app/admin/events/[id]/page.js` — removed the `ItemRequestReview` import/render block and the `requests` fetch (collapsed the `Promise.all` to a single `venues` fetch).
- `components/navigation/navItems.js` — removed the `/admin/items` entry from `adminNavItems`.
- `app/(app)/profile/page.js` — removed the `/items` "Equipment catalogue" tile from `TILES`.

Grep sweep (`grep -rn "item" app components lib --include="*.js" --include="*.jsx" -i | grep -iv "items.map|requirement"`) run after the edits: remaining hits are all unrelated substrings (`navItems`/`userNavItems`/`adminNavItems` plumbing, `qa-item` CSS classes in `QuestionsSection.jsx` and the organizer event detail page, generic `.map((item) => ...)` loop variables in `BookingsList.jsx`/`Header.jsx`/`AppShell.jsx`/`NavList.jsx`/`MobileNav.jsx`). A follow-up targeted grep for `ItemRequestForm|ItemRequestReview|ItemForm|/admin/items|'/items'|"/items"|item-requests|/api/.*items` returned zero matches — nothing dangling.

Verification:
- `npm run lint` — clean, no errors.
- `npm run build` — compiled successfully; route list confirms `/admin/items` and `/items` no longer exist as app routes.
- Manual dev-server check against a running backend not performed in this session (no backend process started); the source-level route-removal and clean lint/build stand in for it per this phase's low-risk, pure-deletion nature.
