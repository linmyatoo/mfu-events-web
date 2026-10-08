# Plan: Campus Commons rollout + spacing audit

Source of truth for implementation. Read this before starting any phase; update
the status line per phase as work completes.

## Goal

Finish the two-blue Campus Commons rollout across every portal and fix the
systemic "text too close to boxes" spacing bugs, via shared-primitive fixes
first (cheap, high leverage, cascades to ~28-32 pages each) then a portal-by-
portal visual confirmation pass — with no fake data and no new hues.

## Acceptance criteria

- `.page-header` has a defined, non-zero gap between subtitle and `actions`
  on every page that passes `actions` to `PageContainer` (currently 4: My
  Events, Event Requests, Admin Events, Admin Points — verify all 4 plus any
  added during the rollout).
- Icon+label gap on `.event-card__meta`, `.event-hero__meta`, `.back-link` is
  8px (`--space-2`), matching `.btn`, not 4px.
- A written spacing-audit checklist exists and has been run once across
  user/organizer/admin portals at 1280/1024/768/480px, light + dark.
- No third hue anywhere; `grep -rn "#[0-9a-fA-F]\{6\}" styles/` contains only
  the two brand blues, their dark-theme lift (`#5B7FFF`), status colors
  (success/warning/danger — pre-existing, out of scope), and neutrals.
- Both brand marks (`Header.jsx` wordmark, `BrandBadge.jsx`) unmodified.
- No `category`/attendee-count UI added without a corresponding backend note
  filed as a follow-up (not built here).

## Existing patterns to follow

- All styling lives in `styles/{variables,globals,layout,components,responsive}.css`
  and is consumed via `className`, never inline `style=`. Keep it that way —
  do not introduce CSS-in-JS or inline styles.
- Shared layout primitives (`Button`, `Icon`, `PageContainer`, `.card`,
  `.badge`, `.pill`, `.chip`, `.nav-item`) are the right place to fix anything
  that repeats across pages — pages themselves are thin JSX over these classes.
- The `--space-*` scale is the only vocabulary for gaps/padding; any new or
  edited rule should reference a `--space-N` var unless there's a documented
  Flutter-parity reason not to (see `research/existing-code.md` section 3).
- Dark theme is a token repoint under `:root[data-theme='dark']` in
  `variables.css` — never branch component CSS on `[data-theme]` directly if
  a token repoint will do.

## Files to change

Phase 1 (primitives):
- `styles/layout.css` — `.page-header` (add flex/column + gap, or add a gap
  rule targeting the actions slot)
- `components/layout/PageContainer.jsx` — may need to wrap `actions` in a
  dedicated `<div className="page-header__actions">` to have something to
  target with CSS (currently it's a bare `{actions}` with no wrapper)
- `styles/components.css` — `.event-card__meta`, `.event-hero__meta`,
  `.back-link` gap 4px → 8px

Phase 2+ (portal passes, read-only confirmation + targeted fixes found during
screenshot review — exact files TBD per phase, see `phases/`):
- `app/(app)/*`, `app/organizer/*`, `app/admin/*` pages (visual confirmation)
- `styles/components.css` off-scale paddings flagged in research section 3
  (decide keep-vs-snap per item, edit only the ones that read as bugs)

## Phase plan

1. **Phase 1 — Shared primitive fixes** (`phases/phase-1-shared-primitives.md`)
   Fix `.page-header` actions gap and the three 4px→8px icon/text gaps. Zero
   page-level JSX changes except the one `PageContainer` wrapper div. Highest
   leverage, lowest risk, cascades to 28+32 files automatically.

2. **Phase 2 — Spacing audit methodology + run** (`phases/phase-2-spacing-audit.md`)
   Write the repeatable audit method (grep rules + screenshot checklist across
   4 breakpoints × light/dark) and run it once against the current state
   (post Phase 1) to catch anything Phase 1 didn't cover. Produces a punch
   list, not code changes.

3. **Phase 3 — User portal pass** (`phases/phase-3-user-portal.md`)
   Apply punch-list fixes to `app/(app)/*` + `EventFeed`/`EventCard`/
   `EventHeroCard`/event detail/bookings/staff-calls/organizations.

4. **Phase 4 — Organizer portal pass** (`phases/phase-4-organizer-portal.md`)
   Apply punch-list fixes to `app/organizer/*` (dashboard, event
   create/edit/detail, organizations, venues, check-in).

5. **Phase 5 — Admin portal pass** (`phases/phase-5-admin-portal.md`)
   Apply punch-list fixes to `app/admin/*` (events, organizers, users, points,
   venues, flags, logs, settings).

6. **Phase 6 — Auth + misc pages pass** (`phases/phase-6-auth-and-misc.md`)
   Login/register/forgot-password/reset-password/verify-email — these use a
   centered `page-header` variant inline (not through `PageContainer`); confirm
   the Phase 1 CSS fix covers them too (same class names) and spot-check.

7. **Phase 7 — Non-goal flagging** (`phases/phase-7-non-goal-followups.md`)
   Write up the backend-dependent follow-ups (category color, attendee counts)
   as a tracked note, not implemented here.

Phases 3-6 are independently shippable and can be reordered by priority; the
screenshot/audit evidence from Phase 2 should drive how much real work each
needs (likely "confirm and move on" for most pages, given the token-clean
baseline found in research).

## Risks and unknowns

- **No browser/MCP tool was available to this planning agent** (toolset was
  Read + Bash only). All findings are derived from CSS cascade reasoning, not
  rendered screenshots. Phase 1's fix is based on correct CSS semantics
  (confirmed: block container + 0-margin siblings = 0 gap), but Phase 2 must
  open the running `localhost:3000` in a real browser/MCP before trusting any
  "looks fine" conclusion beyond Phase 1's two bugs.
- Wrapping `actions` in a new `page-header__actions` div in `PageContainer.jsx`
  changes the DOM shape for all 28 consumers — verify no page relies on
  `actions` being a bare inline sibling (grep confirmed only 4 pages pass
  `actions` today, so blast radius for visual regression is small, but check
  `app/admin/points/page.js`'s `PointsSyncButton` and `app/admin/page.js`'s
  inline `<Button>` render fine inside a wrapping div — they should, since
  `.btn` doesn't care about its parent).
- The off-scale magic-number paddings (research section 3) are mostly
  **intentional** Flutter-parity values per existing code comments — resist
  the urge to "fix" them to the nearest `--space-N` without a visual reason;
  that would be scope creep against "smallest viable change set."
- Dark-theme contrast is already handled (`#5B7FFF` override) — do not touch
  `variables.css` dark-theme block during this work.

## Verification

- `grep -rn "style=" app components` → must stay empty (no inline-style regressions).
- `grep -c "#1a3fc4\|#1A3FC4\|#0f2a8c\|#0F2A8C\|#5b7fff\|#5B7FFF" styles/variables.css` → confirm no new hex added elsewhere: `grep -rn "#[0-9a-fA-F]\{6\}" styles/*.css` and manually confirm every non-status, non-neutral hex is one of the brand blues.
- Manual/visual: open `localhost:3000` logged in, visit `/organizer` (My Events), `/event-requests`, `/admin`, `/admin/points` — confirm visible gap between subtitle and action button.
- Manual/visual: visit `/` (feed), `/organizer`, `/admin/organizers` — confirm icon+label gap on event rows no longer reads as touching.
- `npm run lint` (if configured) after each phase's CSS/JSX edits.
- `npm run build` once at the end of Phase 1 to catch any JSX/CSS syntax errors from the `PageContainer` wrapper change.

## Recommended first implementation step

Start with `phases/phase-1-shared-primitives.md`: edit `styles/layout.css`
(`.page-header` gap) and `components/layout/PageContainer.jsx` (wrap
`actions`), then `styles/components.css` (3 gap selectors 4px→8px). This is a
~15-line diff across 2 files that fixes the exact screenshot bug plus its
twin, with no JSX changes beyond one wrapper div, and no risk to the brand
marks or color tokens.

## Plan folder

`plan/campus-commons-rollout-20261009-013626/`
