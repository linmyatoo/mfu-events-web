# Phase 4 — Organizer portal pass

Status: not started
Depends on: Phase 1, Phase 2

## Scope

`app/organizer/*`:
- `app/organizer/page.js` — **the exact screenshot page**; re-verify Phase 1's
  fix resolved the reported issue before anything else in this phase.
- `app/organizer/events/new/page.js`, `app/organizer/events/[id]/page.js`,
  `app/organizer/events/[id]/edit/page.js` → `EventForm.jsx`,
  `EventLifecycle.jsx`, `ContributorsManager.jsx`, `AttendeeList.jsx`,
  `CheckInScanner.jsx`, `AnswerForm.jsx`
- `app/organizer/organizations/page.js`, `app/organizer/organizations/[id]/page.js`
  → `TeamManager.jsx`, `OrgApplicationsManager.jsx`, `StaffCallsManager.jsx`
- `app/organizer/venues/page.js`, `app/organizer/check-in/page.js`

## Approach

Same as Phase 3 — token-clean baseline, confirmation-first. This portal has
the most forms (`EventForm.jsx` is likely the most complex single component
in the app) — give it the closest look of the three portals since form field
density is where tight spacing is most likely to still read as cramped even
after Phase 1 (e.g. multi-field rows, inline validation messages under
inputs — check `.field__error`/`.field__hint` margin-top of `--space-1` (4px)
against the input above it; this is a candidate the punch list may flag).

## Verification

Same as Phase 3, applied to this portal's pages, plus explicit re-confirmation
of the original screenshot page (`/organizer`, "New event" button).
