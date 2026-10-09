# Phase 6 — Auth + misc pages pass

Status: done (confirmation-only, no code changes; browser verification of
`/login`/`/register` still outstanding — see below)
Depends on: Phase 1, Phase 2

## Scope

`app/login/page.js`, `app/register/page.js`, `app/forgot-password/page.js`,
`app/reset-password/page.js`, `app/verify-email/page.js` — these render a
`.page-header` inline (not through `PageContainer.jsx`, per the grep in
`research/existing-code.md` §4) with just `title`+`subtitle`, no `actions`.

Also: `app/(app)/health/page.js`, `app/error.js`/`app/(app)/error.js`/
`app/admin/error.js`/`app/organizer/error.js`, `app/loading.js`.

## Approach

Since none of these pass `actions`, Phase 1's header-actions bug doesn't
apply to them directly — but they DO inherit the `.page-header` flex-column
conversion, so confirm title→subtitle spacing still looks right after Phase 1
(should be unchanged, since that gap was already working via
`page-header__title`'s `margin-bottom`, now via the parent `gap` instead —
verify the chosen gap value matches the old `--space-1` visually, adjust if
Phase 1's flex-column introduced a different title→subtitle gap than before).

## Verification

Visual check of all 5 auth pages at 2 breakpoints (768px drawer/mobile-nav
breakpoint doesn't apply to auth pages — they're likely centered single-column
regardless; confirm) + light/dark.

## Findings (2026-10-09)

No browser tool was available in this run either, so `/login` and `/register`
could not be visually re-verified logged-out (same blocker Phase 2 hit — the
session stays authenticated). Everything below is confirmed by reading
`styles/layout.css`, `styles/variables.css`, `styles/responsive.css`,
`components/layout/PageContainer.jsx`, and the five page source files, plus
`git show 4b2e16c -- styles/layout.css` to see Phase 1's exact diff.

**Confirmed, no regression — no code changes made:**

- `styles/layout.css:247-252` — `.page-header` is `display:flex;
  flex-direction:column; gap: var(--space-2)` (8px), unconditionally (no
  breakpoint override anywhere in `styles/responsive.css` — grepped, zero
  `page-header` hits there). All five auth pages
  (`app/login/page.js`, `app/register/page.js`, `app/forgot-password/page.js`,
  `app/reset-password/page.js`, `app/verify-email/page.js`) render
  `.page-header` inline with the same markup shape: a brand/logo row
  (`<span className="app-header__brand">`), `.page-header__title`, and
  (except verify-email) `.page-header__subtitle`. None pass `actions`, so
  Phase 1's actions-gap fix doesn't apply here, but the flex-column + gap
  conversion does, and it's breakpoint-independent — confirmed these pages
  are "centered single-column regardless of breakpoint" as the phase doc
  assumed (`.page-container` is the same `max-width: 1200px; margin: 0 auto`
  container used everywhere, no auth-specific width override exists in any
  stylesheet).
- Title→subtitle gap: per Phase 1's diff, this used to be 4px (old
  `.page-header__title { margin-bottom: var(--space-1) }`, removed) and is
  now 8px (new parent `gap: var(--space-2)`). Reasoned through the cascade:
  this is a visible but minor increase, not a regression — 8px matches the
  gap already in use for the 4 `actions`-bearing pages and for every other
  `PageContainer` consumer's title/subtitle pair, so auth pages are now
  *more* consistent with the rest of the app, not less. No fix needed.
- **New observation, not a regression:** the auth pages' brand/logo row
  (`<span className="app-header__brand">...<span>MFU-Events</span></span>`)
  sits *before* the title inside `.page-header` — a child `PageContainer.jsx`
  never renders (it only ever renders title/subtitle/actions, confirmed by
  reading the component). Pre-Phase-1, `.page-header` had no `display:flex`
  and no gap, so with both the brand span and `h1` at `margin: 0`
  (`app-header__brand` sets no margin; `globals.css:24-30` zeroes all heading
  margins), the logo row and the title butted up with **0px** gap between
  them. Post-Phase-1, the same flex-column `gap: var(--space-2)` that fixes
  title→subtitle also now puts 8px between the logo row and the title — an
  incidental improvement (more breathing room above the heading), not a
  regression, so left as-is per "fix only if it's an actual regression."
- `app/(app)/health/page.js` — plain `PageContainer` with title+subtitle, no
  actions; same shape as the ~24 other non-actions `PageContainer`
  consumers already covered by Phases 1/3/4/5's confirmation. No new issue.
- `app/error.js` (root) — does not use `.page-header`/`PageContainer` at all
  (bare `card card--padded` + `EmptyState`); not affected by Phase 1.
- `app/(app)/error.js`, `app/admin/error.js`, `app/organizer/error.js` — each
  uses `PageContainer title="Something went wrong"` with no `subtitle` and no
  `actions`, i.e. a single child in `.page-header`. With only one flex child,
  `gap` has nothing to apply between, so these have zero exposure to either
  the Phase 1 fix or this phase's gap question.
- `app/loading.js` does not exist — the actual file is
  `app/(app)/loading.js`, which renders only `<Loading label="Loading…" />`
  (no `.page-header` at all). Noting the path correction here since the
  phase doc listed the wrong path; no action needed either way.

**Unrelated pre-existing issue spotted, explicitly left alone (scope creep
guard):** `styles/responsive.css:68-69` (`@media (max-width: 480px)
{ .app-header__brand span { display: none; } }`) is a descendant selector,
so at ≤480px it hides *every* `span` under `.app-header__brand` — not just
the "MFU-Events" wordmark text (the apparent intent, matching how it's used
in the real `Header.jsx` nav bar) but also the `.app-header__logo` span that
wraps the actual logo `<Image>`, since that's a span too. This affects the
real app header *and* these auth pages' reused brand markup identically, and
predates this entire rollout (not introduced or touched by Phase 1's
`.page-header` diff) — out of scope here per "resist scope creep... fix only
if an actual regression from Phase 1." Flagging for a future pass or
`phases/phase-7-non-goal-followups.md` if the team wants it tracked.

**Outstanding:** actual logged-out browser verification of `/login` and
`/register` (and the other three auth pages) did not happen in this run
either — no browser/MCP tool was available, same blocker as Phase 2. All
conclusions above are CSS-cascade reasoning from source, not a rendered
screenshot. Whoever has browser access next should do a quick incognito/
signed-out pass on all five auth pages at light+dark to close this out.

**Verification run:** `npm run lint` (clean), `npm run build` (succeeds, all
auth routes listed in output), `grep -rn "style=" app components` (empty),
`grep -rn "#[0-9a-fA-F]\{6\}" styles/*.css` (only brand blues / dark-theme
lift / status colors / neutrals — no new hex).
