# Phase 4 — Organizer portal pass

Status: done
Depends on: Phase 1, Phase 2, Phase 3 (shared-primitive fixes already landed)

## Outcome

Pure confirmation pass — **no code edits made**. Phase 3 already fixed the
two cross-portal shared-primitive bugs from the punch list
(`.event-detail__intro` margin-bottom, `.app-header__points` gap), and this
phase's job was to confirm the organizer portal inherits them correctly, plus
independently check the rest of the scoped files for anything the punch list
might have missed. No genuine bugs were found.

### Confirmed: Phase 3's `.event-detail__intro` fix inherits correctly

Read `app/organizer/events/[id]/page.js:75` and
`app/organizer/staff-calls/[id]/page.js:49` — both use
`<header className="event-detail__intro">` directly (no `.event-detail__header`
wrapper, no local override of `margin-bottom`), so both now get the full
`var(--space-5)` (20px) gap before the next section from the shared
`styles/components.css` rule, exactly as Phase 3 intended. No double-spacing
risk (neither page wraps `.event-detail__intro` inside `.event-detail__header`).

### Confirmed: Phase 1's `.page-header` actions-gap fix resolved the original screenshot page

`app/organizer/page.js` (My Events — the exact page from the original bug
report) passes `actions={<Button>New event</Button>}` to `PageContainer`.
Read `components/layout/PageContainer.jsx`: `actions` is wrapped in
`<div className="page-header__actions">`, and `styles/layout.css:247-265`
confirms `.page-header` is `flex-direction: column; gap: var(--space-2)` with
an additional `.page-header__actions { margin-top: var(--space-2) }` — the
title/subtitle/actions now have real, non-zero gaps throughout, including the
reported page.

### Rest of scope read, no new issues found

Read in full: `app/organizer/events/new/page.js`,
`app/organizer/events/[id]/edit/page.js`, `app/organizer/organizations/page.js`,
`app/organizer/organizations/[id]/page.js`, `app/organizer/venues/page.js`,
`app/organizer/check-in/page.js`, `components/organizer/EventForm.jsx`,
`EventLifecycle.jsx`, `ContributorsManager.jsx`, `AttendeeList.jsx`,
`CheckInScanner.jsx`, `AnswerForm.jsx`, `TeamManager.jsx`,
`OrgApplicationsManager.jsx`, `StaffCallsManager.jsx`.

- **`EventForm.jsx` (closest look, per phase instructions)** — every field
  uses the standard `.field` → `.field__label` → `.input`/`.select`/`.textarea`
  → optional `.field__hint`/`.field__error` pattern, same as every other
  clean form in the app. `.field__hint`/`.field__error { margin-top:
  var(--space-1) }` (4px) against the input above it (flagged by the phase
  file as a candidate) was checked directly: this is a deliberate, uniform
  helper-text gap used identically across every form in all three portals
  (`CheckInScanner.jsx`, `AnswerForm.jsx`, `TeamManager.jsx`,
  `ContributorsManager.jsx`, `StaffCallsManager.jsx`, user-portal forms from
  Phase 3, admin-portal forms). It is not the punch-list's headline bug
  pattern (that was a *section*-level gap reading as 4px when it should've
  been ~20-24px); 4px between an input's bottom border and its own caption
  text is a standard, intentional micro-gap, not a "text touching a box"
  bug. The punch list (already written, Phase 2) did not flag this item as
  confirmed — per the task instructions, left untouched since no genuine
  problem was found on inspection.
- All other components/pages use `.card`, `.card--padded`, `.stack`,
  `.page-section`, `.section-title`, `.booking-panel__row`, `.organizer`,
  `.qa-form`, `.event-card__meta`, `.chip`, `.badge` consistently with their
  shared-primitive definitions in `styles/components.css`/`styles/layout.css`
  — no local spacing overrides, no off-pattern magic numbers, no inline
  styles.

## Skipped / not touched

Same low-priority punch-list items Phase 3 already triaged as skip
(`.chip` gap/padding, `.rail` gap, `.mobile-nav__link` gap,
`.portal-switch__item`/`.portal-switch`/`.badge` gap hygiene nits) — none are
tagged to Phase 4 specifically, and none were newly confirmed as bugs during
this pass. No new punch-list items surfaced for the organizer portal.

## Verification run

- `npm run lint` — clean, no errors/warnings.
- `npm run build` — compiled successfully; all organizer routes
  (`/organizer`, `/organizer/check-in`, `/organizer/events/[id]`,
  `/organizer/events/[id]/edit`, `/organizer/events/new`,
  `/organizer/organizations`, `/organizer/organizations/[id]`,
  `/organizer/staff-calls`, `/organizer/staff-calls/[id]`,
  `/organizer/venues`) generated without error.
- `grep -rn "style=" app components` — empty.
- `grep -rn "#[0-9a-fA-F]\{6\}" styles/*.css` — only brand blues
  (`#1a3fc4`/`#0f2a8c`), dark-theme lift (`#5b7fff`), and pre-existing
  status/neutral colors. No third hue.
- No files were edited this phase (zero-diff confirmation pass).

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
