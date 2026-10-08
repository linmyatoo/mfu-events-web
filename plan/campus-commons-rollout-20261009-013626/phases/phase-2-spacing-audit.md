# Phase 2 — Spacing audit methodology + run

Status: not started
Depends on: Phase 1 merged (audit the post-fix state, not the pre-fix state)

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
