# Phase 3 — User portal pass

Status: not started
Depends on: Phase 1 (primitives fixed), Phase 2 (punch list exists)

## Scope

`app/(app)/*` and the components they render:
- `app/(app)/page.js` → `EventFeed.jsx` → `EventCard.jsx` / `EventHeroCard.jsx`
- `app/(app)/events/[id]/page.js` → `BookingPanel.jsx`, `QuestionsSection.jsx`,
  `ReviewsSection.jsx`
- `app/(app)/bookings/page.js` → `BookingsList.jsx`, `SelfCheckIn.jsx`
- `app/(app)/staff-calls/page.js`, `app/(app)/staff-calls/[id]/page.js` →
  `StaffCallApplyForm.jsx`
- `app/(app)/organizations/page.js` → `OrgApplyForm.jsx`
- `app/(app)/event-requests/*` → `EventRequestForm.jsx`
- `app/(app)/points/page.js`, `app/(app)/recognition/page.js`
- `app/(app)/profile/page.js` — already redone; spot-check only against the
  punch list, don't re-touch unless the audit found a specific issue.

## Approach

This portal was found to already be fully token-driven (research §2, §4, §5).
Expect this phase to be **mostly confirmation**, with edits limited to
whatever Phase 2's punch list actually surfaced for these files. Do not
invent additional changes beyond the punch list — resist scope creep.

Known baseline after Phase 1: event-card/hero icon gaps and any `actions`
header gaps on this portal's pages are already fixed by the shared-primitive
change. This phase's job is to catch anything *not* covered by those two
fixes (e.g. bespoke spacing inside `BookingPanel`, `ReviewsSection` stars
layout, `QuestionsSection` Q&A spacing — all reviewed as clean in research,
but confirm visually).

## Verification

- Visual confirmation at the 4 breakpoints × 2 themes for each page listed
  above (per Phase 2's method).
- `npm run lint` / `npm run build` after any edits.
- No new hex colors, no inline styles, no fake category/attendee data added.
