# Phase 2 — Spacing audit methodology + run

Status: done
Depends on: Phase 1 merged (audit the post-fix state, not the pre-fix state)

Ran both the static grep pass and a logged-in browser pass against
`localhost:3000` (post-Phase-1 state). Full results, file:line references,
and the triaged punch list are in `research/punch-list.md`. Headline finding:
a 6-page cramped-header bug on `.event-detail__intro` (used as a bare
`<header>` without the `.event-detail__header` margin-bottom that the one
working page has) — visually confirmed on 3 of the 6 pages
(`app/organizer/events/[id]/page.js`, `app/admin/events/[id]/page.js`,
`app/admin/event-requests/[id]/page.js`), same structure on the other 3
(`app/(app)/staff-calls/[id]/page.js`, `app/organizer/staff-calls/[id]/page.js`,
`app/(app)/event-requests/[id]/page.js`). Also found `.app-header__points`'s
6px icon/text gap (should be 8px like the rest) and several lower-priority
off-scale paddings (`.chip`, `.badge`, `.portal-switch__item`, `.rail`,
`.mobile-nav__link`).

**Not fully covered:**
- `/login` and `/register` could not be visually reached — the session
  stayed authenticated throughout (both pages `redirect('/')` server-side
  when a session cookie exists) and no logged-out pass was run. Source was
  read instead; confirmed both use `.page-header` directly so Phase 1's fix
  should apply, but needs a real logged-out visual check in Phase 6.
- The 1024px/768px/480px breakpoints were **not visually confirmed** for any
  page: `mcp__claude-in-chrome__resize_window` did not actually change the
  browser viewport this session (confirmed via `window.innerWidth` staying
  fixed across repeated resize calls, including in a fresh tab) — only the
  ≥1280px desktop tier was visually tested. Breakpoint-dependent findings
  (e.g. `.mobile-nav__link`) are CSS-reasoned only and need re-verification
  once a working resize/device-emulation path is available.

## Why this phase exists

The user's complaint ("text too closed to boxes") was backed by one
screenshot. Phase 1 fixed the two bugs findable by static CSS-cascade
reading. This phase defines a repeatable method so the rest of the audit
isn't vibes-based, and runs it once to produce a punch list for Phases 3-6.

## Method

### A. Static grep pass (no browser needed)

Run from repo root:

```bash
# 1. Any gap/padding/margin that is a bare px value, not a --space-N var,
#    outside the documented Flutter-parity exceptions in
#    research/existing-code.md §3. Review every hit.
grep -n "gap:\s*[0-9]\|padding:\s*[0-9]\|margin:\s*[0-9]" styles/components.css styles/layout.css styles/globals.css styles/responsive.css

# 2. Confirm no new inline styles crept in during Phase 1.
grep -rn "style=" app components --include="*.js" --include="*.jsx"

# 3. Confirm only the two brand blues (+ dark lift, + status colors) appear.
grep -rn "#[0-9a-fA-F]\{6\}" styles/*.css

# 4. Find every icon+text pairing pattern to check gap consistency at a glance.
grep -rn "Icon name=" app components --include="*.js" --include="*.jsx" | wc -l
```

For every bare-px gap/padding hit, classify as:
- **(a) intentional Flutter-parity geometry** (has a comment citing the
  Flutter widget, e.g. avatar/poster/rail sizes) → leave alone.
- **(b) unintentional drift** (no comment, doesn't match any `--space-N`,
  looks like a typo e.g. `13px` vs `--space-4`'s `16px`) → candidate fix,
  add to punch list with file:line.

### B. Visual pass (requires a browser — MCP devtools or manual)

This planning agent did not have browser/MCP tool access; this section is the
checklist for whoever runs Phase 2 with that access (same session resuming
with MCP enabled, or the user manually).

Breakpoints to check (match `styles/responsive.css`'s existing breakpoints,
don't invent new ones): **1280px, 1024px, 768px, 480px**. Each at light AND
dark theme (toggle via `ThemeToggle`).

Pages to screenshot per portal (representative, not exhaustive — expand if
something looks off):

- User: `/` (feed, rail + list), `/events/[id]` (detail + booking panel),
  `/bookings`, `/profile` (already redone, spot-check only), `/staff-calls`
- Organizer: `/organizer` (My Events — the screenshot page, re-check), `/organizer/events/[id]`, `/organizer/events/new`, `/organizer/organizations`
- Admin: `/admin` (dashboard), `/admin/organizers`, `/admin/users`, `/admin/points`, `/admin/venues`
- Auth: `/login`, `/register`

For each screenshot, check specifically:
1. Gap between page title/subtitle and any action button (Phase 1 target —
   confirm the fix rendered correctly).
2. Gap between any icon and adjacent label text (Phase 1 target for
   event-card/hero/back-link — confirm visually, and check any OTHER
   icon+label pairing not covered by those 3 selectors, e.g.
   `.app-header__points`, `.nav-item`, `.settings-tile`).
3. Padding between card edge and its innermost text/content (does any card
   feel like text touches its border?).
4. Button internal padding at the 480px breakpoint (responsive.css reduces
   `.btn` padding to `var(--space-3) var(--space-4)` — confirm this still
   reads comfortable, not cramped, at phone width).
5. Dark-theme-specific: does any text/icon combo lose enough contrast that it
   *reads* as "too close" because it's hard to see the separation at all
   (contrast issue masquerading as spacing issue)?

## Output of this phase

A punch list (append to this file or a new `research/punch-list.md`) of
file:line + screenshot evidence for anything found beyond Phase 1's two
fixes, triaged into Phases 3-6 by portal. No code changes in this phase
itself — it's audit + list, then Phases 3-6 execute the list.

## Verification

- The punch list exists and every item has a concrete file:line or component
  name — no vague "feels tight" entries without a locatable cause.
- Every item is tagged with which portal/phase it belongs to.
