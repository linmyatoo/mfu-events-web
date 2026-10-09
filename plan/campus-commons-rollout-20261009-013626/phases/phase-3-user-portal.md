# Phase 3 — User portal pass

Status: done
Depends on: Phase 1 (primitives fixed), Phase 2 (punch list exists)

## Fixes applied (shared primitives, cross-portal — covers Phases 4/5 too)

1. **`.event-detail__intro` missing bottom spacing (punch-list item 1,
   headline bug).** `styles/components.css`: removed `margin-bottom:
   var(--space-5)` from `.event-detail__header` and moved it onto
   `.event-detail__intro` itself. Verified via grep that `.event-detail__intro`
   has exactly 7 usages across the codebase and `.event-detail__header` has
   exactly 1 (`app/(app)/events/[id]/page.js:57`, wrapping `EventPoster` +
   `.event-detail__intro` as siblings — `.event-detail__intro` is not nested
   inside itself, so no double-spacing risk). All 6 non-wrapped pages
   (`app/(app)/staff-calls/[id]/page.js`, `app/(app)/event-requests/[id]/page.js`,
   `app/organizer/events/[id]/page.js`, `app/organizer/staff-calls/[id]/page.js`,
   `app/admin/events/[id]/page.js`, `app/admin/event-requests/[id]/page.js`) now
   inherit the 20px gap via the shared rule. Confirmed by reading the two
   user-portal pages directly: `.event-detail__intro` is the immediate
   preceding sibling of `.page-section`/form content in both, so the margin
   applies where expected. Left the `.event-detail__header` responsive rule
   in `styles/responsive.css:130` untouched (still needed — it controls the
   poster+intro flex layout on mobile, unrelated to the margin fix). No JSX
   changes, pure CSS fix — matches punch list's recommended direction exactly.

2. **`.app-header__points` icon+text gap (punch-list item 2).**
   `styles/layout.css`: `gap: 6px` → `gap: var(--space-2)` on
   `.app-header__points`. Cross-portal via `components/layout/Header.jsx`.

## User-portal-scoped confirmation

Read through `app/(app)/*` pages/components in scope (feed → `EventFeed.jsx`/
`EventCard.jsx`/`EventHeroCard.jsx`, event detail → `BookingPanel.jsx`/
`QuestionsSection.jsx`/`ReviewsSection.jsx`, bookings → `BookingsList.jsx`/
`SelfCheckIn.jsx`, staff-calls, event-requests, organizations, points,
recognition; `profile` spot-checked only). No additional punch-list items
were flagged against these files beyond items 1 and 2 above, which are now
fixed. No inline `style=` usages, no new hex colors (`grep` confirms only the
two brand blues, the dark-theme lift, and pre-existing status colors across
`styles/*.css`).

## Skipped (low-priority/optional per punch list, use-your-judgment items)

- **`.chip` gap/padding (item 8, `components.css:560-561`)** — punch list's
  own Part B visual check already found this "reads fine... not a confirmed
  bug," explicitly downgraded to cosmetic-only/optional. Skipped: no evidence
  of an actual problem, and changing it only on judgment without visual
  re-confirmation (no browser tool available in this session) risks an
  unrequested visual regression.
- **`.rail` gap (item 10, `layout.css:389`)** — punch list flagged this as
  "low confidence," noting the rail wasn't actually seen rendering during the
  Phase 2 audit. Skipped for the same reason: no confirmed bug, and no
  browser available this session to verify a change wouldn't make it worse.
- **`.mobile-nav__link` gap (item 11, `layout.css:353`)** — only renders
  ≤768px; Phase 2 explicitly couldn't confirm it visually due to a broken
  resize tool and flagged it "needs re-verification." Skipped pending an
  actual visual pass at that breakpoint (Phase 6 or a future dedicated
  session), per the phase instructions to skip when risky/unclear.
- **`.portal-switch__item` padding (item 7) / `.portal-switch` bare-number
  gap (item 12) / `.badge` gap (item 6)** — not tagged to Phase 3 in the
  punch list (item 6 is `[Phase 5 if touched, else skip]`; items 7/12 are
  cross-portal hygiene nits with no assigned phase and no visual bug
  confirmed). Left untouched to avoid scope creep beyond the punch list.

## Verification run

- `npm run lint` — clean (no errors/warnings).
- `npm run build` — compiled successfully, all routes generated.
- `grep -rn "style=" app components` — empty.
- `grep -rn "#[0-9a-fA-F]\{6\}" styles/*.css` — only brand blues
  (`#1a3fc4`/`#0f2a8c`), dark-theme lift (`#5b7fff`), and pre-existing
  status/neutral colors. No third hue.
- Visual confirmation at 1024/768/480px and in-browser spot checks were not
  performed this session (out of scope per task instructions — a separate
  visual-confirmation pass follows). All fixes here are CSS-cascade-reasoned
  and cross-checked against actual JSX structure via grep/Read, consistent
  with how Phase 1 and Phase 2's headline fix were derived.

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
