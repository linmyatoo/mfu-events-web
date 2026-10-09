# Phase 2 punch list

Produced by the Phase 2 spacing audit (grep pass + logged-in browser pass
against `localhost:3000`, post–Phase 1). Items are tagged `[Part A]` (static
grep, no browser) or `[Part B]` (visually confirmed in Chrome) and `[Phase N]`
for which portal pass should pick them up (3=user, 4=organizer, 5=admin,
6=auth). No code changes were made in this phase.

## Headline finding (highest priority — fix this first)

### 1. `.event-detail__intro` used as a bare `<header>` loses ~16px of spacing before the first section — 6 pages affected [Part B, visually confirmed on 3 of 6]

**Symptom:** the last meta line (e.g. "Requested by Htet Aung" / "0 booked of
1 · registration closes…") sits almost flush against the next heading
("Description"), 4px apart instead of a normal section gap. This is the
closest match in the whole audit to the user's original "text too close to
boxes" complaint.

**Root cause:** `components.css:680-682` gives `.event-detail__intro` only
`padding-top: var(--space-4)`, no bottom spacing. Its last child
`.event-detail__meta` (`components.css:699`) contributes `margin: 0 0
var(--space-1)` (4px). The very next element, `.page-section:first-child`,
has its top margin explicitly zeroed by `components.css:715-717`
(`.event-detail__main > .page-section:first-child { margin-top: 0; }`) — a
rule that assumes something upstream already supplies the gap. On the one
page that works correctly, `app/(app)/events/[id]/page.js`, `.event-detail__intro`
is wrapped in `<header className="event-detail__header">`, and
`.event-detail__header` (`components.css:674-676`) supplies `margin-bottom:
var(--space-5)` (20px) — giving ~24px total. Every other page skips that
wrapper and uses `.event-detail__intro` itself as the `<header>`, so they only
get the 4px.

**Confirmed visually (dark/light, 1280px+) on:**
- `app/organizer/events/[id]/page.js:75` — Organizer event detail [Phase 4]
- `app/admin/events/[id]/page.js:57` — Admin event detail [Phase 5]
- `app/admin/event-requests/[id]/page.js:49` — Admin event-request detail [Phase 5]

**Same structure, not individually re-screenshotted but same CSS classes in
the same arrangement (high-confidence, should be fixed together):**
- `app/(app)/staff-calls/[id]/page.js:50` — User staff-call detail [Phase 3]
- `app/organizer/staff-calls/[id]/page.js:49` — Organizer staff-call detail [Phase 4]
- `app/(app)/event-requests/[id]/page.js:59` — User event-request detail [Phase 3]

**Not affected (reference-correct):**
- `app/(app)/events/[id]/page.js:64` — wraps intro in `.event-detail__header`, already has the full gap.

**Suggested fix direction (decide in the executing phase, not here):** add the
missing spacing to the shared `.event-detail__intro` rule in
`styles/components.css` (e.g. `margin-bottom: var(--space-5)`) so all 6 pages
inherit it, then re-check `app/(app)/events/[id]/page.js` doesn't end up with
double spacing from `.event-detail__header`'s own `margin-bottom` — likely
means moving the space-5 off `.event-detail__header` and onto
`.event-detail__intro` instead of stacking both. One shared-primitive edit,
cascades to 6 files — same leverage pattern as Phase 1.

---

## Other Part B findings (visual)

### 2. `.app-header__points` icon+text gap is 6px, not 8px [Part B confirmed + Part A grep, `layout.css:163`]
Cross-portal — `components/layout/Header.jsx:89-90`, rendered in every
portal's header. Side-by-side zoom comparison against the now-fixed
`.event-card__meta` (8px, confirmed comfortable) shows the points pill
reading visibly tighter. Same fix pattern as Phase 1's three selectors: bump
`gap: 6px` → `gap: var(--space-2)`. Tag: cross-portal shared primitive —
recommend whichever of Phase 3-6 runs first takes this, since it's not
portal-specific. **[Phase 3, but affects all]**

### 3. Chip/badge/pill paddings read acceptable in practice despite being off-scale
Zoomed in on `.chip` ("School of Computing") and `.badge` ("Registration
open") side by side on `/events/e1` — both are legible and don't read as
"touching the border" even though `.chip`'s padding (6px vertical,
`components.css:561`) and gap (6px, `components.css:560`) are off the
`--space-*` scale. Visually this one is **not** a confirmed bug; downgraded
from Part A's grep flag (see item 8 below) to "cosmetic nit only, optional."

### 4. Bottom-nav and breakpoint-dependent styles — NOT visually testable this session
`mcp__claude-in-chrome__resize_window` did not actually resize the browser
viewport in this environment: repeated calls at 480×900, 768×1024, and
2000×1200 all left `window.innerWidth`/`innerHeight` unchanged (confirmed via
`javascript_tool`: stuck at whatever the window happened to be, independent
of the requested size — same result in a second, fresh tab). This blocks any
*visual* confirmation of the 1024px/768px/480px tiers, including
`.mobile-nav__link` (bottom nav, only rendered ≤768px), `.app-header`'s
mobile padding/gap, `.btn` padding at 480px, and the single-column event-card
layout. Only the ≥1280px desktop tier (actual window was ~1440px wide
throughout) was visually confirmed. The 1024/768/480 items below are
CSS-reasoned from `styles/responsive.css` only, not screenshot-verified —
flag for whoever runs Phase 3-6 to re-check with working viewport resize
(real device, DevTools device toolbar, or a working resize tool).

### 5. Dark theme — no contrast-masquerading-as-spacing issues found
Checked `/` (feed) and `/events/e1` in dark theme at the reachable viewport
width. Icon/text and card-edge contrast all read fine; no instance where a
dark-on-dark pairing made spacing look tighter than it is.

---

## Part A — static grep findings

Ran the four grep commands from the phase doc. Full inventory:

**Confirmed clean / no regressions:**
- `grep -rn "style=" app components --include="*.js" --include="*.jsx"` → zero matches (no inline styles).
- `grep -rn "#[0-9a-fA-F]\{6\}" styles/*.css` → only the two brand blues (`#1a3fc4`/`#0f2a8c`), the dark-theme lift (`#5b7fff`), neutrals, and pre-existing status colors (success/warning/danger/star). No third hue.
- `grep -rn "Icon name=" app components` → 72 usages total.

**Exceptions confirmed per `research/existing-code.md` §3 (leave alone, no action):**
`components.css:112` (`.input`/`.select`/`.textarea` padding 13px),
`components.css:296` (`.event-hero__body` 10px),
`components.css:370` (`.points-pill` 5px — has an adjacent comment citing the Flutter price pill),
`components.css:384/389` (`.pill-toggle`/`.pill-toggle__item` — has an adjacent comment citing `_pill in MyBookingPage`),
`components.css:470` (`.settings-tile` 14px),
`components.css:490-492` (`.settings-tile__icon` 34px/10px),
`components.css:573` (`.badge` padding 6px 10px),
`components.css:404` (`.date-block` 50px),
plus the documented logo/avatar/card/rail sizes.

**New candidates found (not in the §3 exception list) — add to Phases 3-6:**

6. `components.css:572` `.badge { gap: 5px; }` — off-scale icon+label gap. **Low priority / latent**: checked every `.badge` usage in the repo (`app/admin/flags/page.js`, `components/events/ReviewsSection.jsx`, `components/organizer/StaffCallsManager.jsx`, etc.) and none currently render an icon alongside the text, so this gap has no visible effect today. Fix opportunistically if touching the selector for item 2, otherwise skip. **[Phase 5 if touched, else skip]**

7. `components.css:445` `.portal-switch__item { padding: 6px var(--space-3); }` — off-scale vertical padding on the User/Organizer/Admin header switcher. No adjacent Flutter-citing comment. Visually acceptable in the light/dark screenshots taken (see item 3) but flagged for completeness since it's off-scale. **[cross-portal / Header.jsx, low priority]**

8. `components.css:560-561` `.chip { gap: 6px; padding: 6px var(--space-3); }` — off-scale, same family as Phase 1's three fixed selectors, but visual check (item 3) shows it reads fine. **[Phase 3-6, low priority / optional]**

9. `components.css:544` `.pill { padding: 10px var(--space-4); }` — **dead CSS**: grepped every `className` in `app`/`components` for a bare `"pill"` class and found zero usages (only `.points-pill`, `.pill-toggle__item`, `.portal-switch__item` are actually rendered). Not a visual bug since nothing renders it. Note for a future cleanup pass, not a Phase 3-6 action item.

10. `layout.css:389` `.rail { gap: 14px; }` — off-scale (between `--space-3`=12 and `--space-4`=16), no citing comment. This is inter-card gap in the horizontal hero rail, not text-to-box padding — low confidence this is visually a problem (couldn't confirm the rail rendered on the reachable pages during this pass since feed scroll didn't surface it at the screenshotted moment). **[Phase 3, low priority — spot check the home feed rail specifically]**

11. `layout.css:353` `.mobile-nav__link { gap: 2px; }` — icon-above-label gap in the bottom nav, only rendered ≤768px. Could not visually confirm due to the resize_window limitation (see item 4). 2px is noticeably tighter than every other icon+label gap in the system (8px standard) — CSS-reasoned candidate, flag for re-check once viewport resize works. **[Phase 3/6, needs re-verification]**

12. `components.css:438-439` `.portal-switch { gap: 4px; padding: 4px; }` — technically matches `--space-1` (4px) exactly, just written as a bare number instead of `var(--space-1)`. Not a visual bug (value is correct), pure token-hygiene nit. Optional cleanup only.

---

## Pages not reached / not applicable

- `/login`, `/register` — could not be visually reached: the audit session
  stayed authenticated as `kyaw.zin.latt@mfu.ac.th` throughout (test creds
  from `~/Desktop/MFU-Events/backend/lib/seed.js`, password `demo1234`;
  that account carries `ADMIN` role plus an `ORG_MANAGER` membership on
  `org0`, so it could reach all three portals without re-authenticating),
  and both pages `redirect('/')` server-side when a session cookie is
  present (confirmed via `app/login/page.js:15`). Read the source instead:
  both pages render `.page-header` directly (same class Phase 1 already
  fixed, confirmed in `app/login/page.js:20-31`), so the title/subtitle gap
  fix should already apply — but this needs an actual logged-out visual
  pass (incognito session or explicit sign-out) in Phase 6 to confirm, plus
  a look at `LoginForm`/`RegisterForm`'s own field spacing which wasn't
  covered by this grep pass beyond the shared `.field`/`.input` rules
  already marked clean.
- 1024px / 768px / 480px breakpoints, all portals — blocked by the
  non-functional `resize_window` tool this session (see item 4). Desktop
  tier (≥1280px, actual ~1440px window) is the only tier visually confirmed.

## Pages reached and visually clean (no new findings beyond the above)

User: `/` (feed, light+dark), `/events/e1` (light+dark), `/bookings`,
`/profile`, `/staff-calls`, `/event-requests` (empty state).
Organizer: `/organizer`, `/organizer/events/e5`, `/organizer/events/new`,
`/organizer/organizations`, `/organizer/venues`.
Admin: `/admin`, `/admin/organizers`, `/admin/users`, `/admin/points`,
`/admin/venues`, `/admin/events/e1`, `/admin/event-requests`,
`/admin/event-requests/er1`.

## Summary counts

- Part A grep candidates (new, not in §3 exceptions): 7 (items 6-12), of
  which 1 is dead CSS (9) and 1 is a non-visual hygiene nit (12) — effectively
  5 actionable-but-low-priority items.
- Part B visual findings: 1 headline bug (6 pages, items 1), 1 confirmed
  small gap bug (item 2, cross-portal), 1 breakpoint-testing gap to close
  later (item 4/11).
- Most notable: the `.event-detail__intro` cramped-header bug (item 1) —
  this is the real successor to Phase 1's two fixes and should be the first
  thing Phases 3-5 pick up, since it reproduces the user's original
  complaint on 6 separate pages across all three portals.
