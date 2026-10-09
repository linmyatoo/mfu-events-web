# Campus Commons rollout + spacing audit

**Status:** in progress — Phases 1-6 done (shared primitives, spacing audit, user/organizer/admin/auth+misc portal passes, all confirmation-only with no regressions found); Phase 7 (non-goal write-up) remains. Note: logged-out browser verification of `/login`/`/register` is still outstanding across Phases 2 and 6 — no browser/MCP tool was available in either run.
**Created:** 2026-10-09
**Owner thread:** "I want to change the whole web UI... text too closed to boxes" (organizer My Events screenshot)

## One-line goal

Finish rolling the two-blue "Campus Commons" direction (already applied to `styles/variables.css` and the profile page) across every portal, and fix the systemic spacing/tightness bugs that make text read as cramped against its container — without inventing any UI that depends on data the backend doesn't have.

## What's already done (uncommitted, in working tree)

- `styles/variables.css` — two-blue tokens (`#1A3FC4` / `#0F2A8C`), dark-theme override, radius scale.
- `app/(app)/profile/page.js` + `.profile-hero`/`.profile-stats`/`.profile-tiles`/`.profile-signout` in `styles/components.css` — hero/stat-grid/tile-grid rebuild.
- `components/auth/LogoutButton.jsx` — dropped `block` prop.

## Key finding: the app is already CSS-token-clean

`grep -rn "style=" app components` returns **zero** inline styles anywhere in the codebase. Every page/component already uses the class + CSS-variable system in `styles/*.css`. This is not a "rewrite bespoke markup" job — it is:

1. two concrete, root-caused spacing **bugs** in shared primitives (below),
2. a handful of magic-number paddings/gaps that fight the 4/8/12/16/20px scale,
3. a confirmation pass (screenshots) once visual tooling is available, and
4. explicit guardrails against inventing fake data (category colors, attendee counts) the backend doesn't have.

## Top 3 concrete spacing issues found (code-confirmed, not guessed)

1. **`.page-header` has no flex/gap rule** (`styles/layout.css:247-259`). `PageContainer` renders `title` → `subtitle` → `actions` as plain block siblings. `.page-header__subtitle` has `margin: 0` and the `actions` button (`.btn`, `display: inline-flex`) has no margin-top anywhere, so when a page passes `actions`, the primary button renders **flush against the subtitle text with a 0px gap** — box-touching-text, not just visual tightness. This is exactly the organizer "My Events" header in the user's screenshot, and it is systemic: every page that passes `actions=` to `PageContainer` has the same bug — `app/organizer/page.js`, `app/(app)/event-requests/page.js`, `app/admin/page.js`, `app/admin/points/page.js`.
2. **Icon-to-label gap on event meta rows is 4px, not 8px** — `.event-card__meta`, `.event-hero__meta`, and `.back-link` (`styles/components.css:247-257`, `308-317`, `655-663`) all use `gap: var(--space-1)` (4px) between a 16px icon and its text, vs. `.btn`'s `gap: var(--space-2)` (8px). This is the actual "icon touches text" read — it shows up on every event card/row in every portal (user feed, organizer My Events, admin events/organizers lists, event detail back-link), not just the one button in the screenshot.
3. **Inconsistent off-scale magic-number paddings** scattered through `styles/components.css` (e.g. `padding: 10px var(--space-3)` on `.event-hero__body`'s sibling rules, `10px 14px` on `.pill-toggle__item`, `14px` flat on `.settings-tile`, `13px var(--space-4)` on `.input`) — individually each was hand-tuned to match the Flutter source (comments say so explicitly), so they are not all bugs, but they are undocumented exceptions to the 4/8/12/16/20px scale and need a single audit pass to decide "keep as intentional Flutter-parity value" vs. "snap to scale," rather than being fixed ad hoc per page.

**Note on the screenshot's icon:** the `calendar` SVG path in `components/common/Icon.jsx` has a roughly centered ~3px/24 inset on each side (not lopsided), so the icon asset itself is not the bug — the gap gets eaten by issue #1 (header spacing) compounding with issue #2 (meta-row gap), not by SVG whitespace. Do not "fix" `Icon.jsx` viewBoxes as a first move.

## Non-goals (explicit)

- No category-color pills, no "N people going" social proof, no attendee-count badges. `lib/events.js` and the backend (`~/Desktop/MFU-Events/backend/lib/seed.js`) carry no `category` field on `Event` (only on point-ledger rows, unrelated) and no attendee/going-count field. If a future phase wants these, it is a **backend-dependent follow-up**, tracked but out of scope here — do not fake it client-side.
- No new hue. Everything stays within `#1A3FC4` / `#0F2A8C` (+ opacity variants + the dark-theme `#5B7FFF` lift, which is intentional contrast-fix, not a new color).
- No MCP-driven visual diffing was performed in this planning pass — this agent's toolset only had `Read`/`Bash` (no browser/MCP tool available), so all findings are code/CSS-cascade-derived, not pixel-screenshot-derived. Phase 0 of implementation should open the already-running `localhost:3000` in the user's enabled browser MCP (or manual devtools) to confirm before/after on the pages listed in `phases/`.

## Where to look

- `plan.md` — full phase breakdown, acceptance criteria, risks.
- `research/existing-code.md` — file-by-file inventory of what's token-clean vs. what has magic numbers.
- `research/requirements.md` — restated goal, constraints, non-goals.
- `phases/` — one file per phase with exact edits and verification steps.
