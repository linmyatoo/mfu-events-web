# Existing code inventory

## 0. Sanity check: no inline styles anywhere

```
grep -rn "style=" app components --include="*.js" --include="*.jsx"
```
returns zero matches. Every page/component uses `className` + the CSS files
under `styles/`. This changes the shape of the work: it's a CSS-cascade/token
audit, not a markup rewrite.

## 1. Design tokens — `styles/variables.css`

Already two-blue-compliant (done in the uncommitted working-tree change):
`--primary-color`/`--primary-light`/`--primary-sky` = `#1A3FC4`,
`--primary-deep`/`--primary-dark`/`--primary-navy` = `#0F2A8C`,
`--primary-tint` = rgba of `#1A3FC4` at 12%, dark-theme repoint to `#5B7FFF`.
Spacing scale: `--space-1`(4) `--space-2`(8) `--space-3`(12) `--space-4`(16)
`--space-5`(20) `--space-6`(24) `--space-8`(32) `--space-10`(40). Radius scale
`--radius-sm`(12) `--radius-md`(16) `--radius-lg`(22) `--radius-xl`(28)
`--radius-pill`(999). Nothing to change here for the color rollout — the
remaining work is *consumption* of these tokens, not the tokens themselves.

## 2. Shared primitives (fix here first — highest leverage)

| File | Status | Notes |
|---|---|---|
| `components/layout/PageContainer.jsx` + `.page-header*` in `styles/layout.css:247-259` | **BUG** | No flex/gap between title/subtitle/actions block. 0px gap when `actions` passed. Used by 28 pages; only 4 pages (`app/organizer/page.js`, `app/(app)/event-requests/page.js`, `app/admin/page.js`, `app/admin/points/page.js`) currently pass `actions`, so the bug is latent everywhere but only visibly triggered on those 4 today — more pages will trigger it as the redesign adds header actions elsewhere (e.g. admin venues, organizer organizations). |
| `.event-card__meta`, `.event-hero__meta` in `styles/components.css:247-257,308-317` | **BUG** | `gap: var(--space-1)` (4px) between 16px icon and text. Used by `EventCard.jsx`, `EventHeroCard.jsx` — rendered on every portal's list/feed page (32 files reference these classes). |
| `.back-link` in `styles/components.css:655-663` | **BUG (same root cause)** | Same 4px icon/text gap, used on every detail-style page with a "back" affordance. |
| `components/common/Icon.jsx` | **Clean** | 24x24 viewBox, glyphs roughly centered (~3px inset each side for `calendar`). Not the source of the complaint — do not touch viewBoxes as a first move. |
| `components/common/Button.jsx` + `.btn` in `styles/components.css:8-76` | **Clean** | `gap: var(--space-2)` (8px), consistent padding scale. This is the primitive other gaps should match, not the one to fix. |
| `components/layout/Header.jsx`, `BrandBadge.jsx` | **Do not touch** | Fixed brand marks per user constraint. |
| `components/common/EmptyState.jsx`, `Modal.jsx`, `Loading.jsx` | **Clean** | Token-driven spacing, no magic numbers beyond intentional ones. |

## 3. Off-scale magic numbers worth a single audit pass (not necessarily bugs)

Found via `grep -n "padding:\s*[0-9]"` across `styles/*.css`. Each has a comment
tying it to the Flutter source geometry, so treat as "confirm intentional or
snap to scale" rather than "delete":

- `.input`/`.select`/`.textarea` → `padding: 13px var(--space-4)` (components.css:112)
- `.event-hero__body` → `padding: 10px var(--space-3)` (components.css:296)
- `.pill-toggle__item` → `padding: 10px 14px` (components.css:389)
- `.settings-tile` → `padding: 14px` (components.css:470)
- `.settings-tile__icon` → `34px` square, `border-radius: 10px` (components.css:490-492)
- `.badge` → `padding: 6px 10px` (components.css:573)
- `.date-block` → `flex: 0 0 50px` (components.css:404)
- `.app-header__logo`/avatar sizes (`44px`, `32px`, `38px`, `48px`) — intentional, Flutter-parity, leave alone.
- Card/rail geometry (`280px`/`132px`/`92x72`/`260px`/`320px`) — intentional widget-parity per comments, leave alone unless a page pass finds a specific visual problem.

## 4. Portal/page inventory — PageContainer consumers (28 total)

User portal: `app/(app)/{page,bookings,event-requests,organizations,points,profile,recognition,staff-calls,health,error}.js`
Organizer portal: `app/organizer/{page,check-in,organizations,venues,error}.js`
Admin portal: `app/admin/{page,points,organizers,organizers/[id],users,users/[id],event-requests,flags,logs,settings,venues,venues/schedule,error}.js`

All render through the same `PageContainer` → `.page-header` markup, so the
Phase-1 CSS fix (below) is a single-file change with 28-page blast radius —
exactly the "fix shared primitives first" heuristic from the planning skill.

## 5. Portal/page inventory — event-card/meta/back-link consumers (~32 files)

Includes every list page (`EventCard`/organizer-events-as-cards pattern reused
raw in `app/admin/organizers/page.js`, `app/organizer/page.js`, etc.), every
detail page's back-link, `components/bookings/BookingsList.jsx`,
`components/organizer/AttendeeList.jsx`, `components/admin/VenueAssigner.jsx`.
Same story: one CSS fix (gap 4px → 8px on 3 selectors) cascades everywhere.

## 6. Data model check (non-goals validation)

- `lib/events.js` — enums only (`BOOKING_STATUS`, `EVENT_STATUS`,
  `AUDIENCE_TYPE`, `CHECKIN_MODE`...), no `category` or attendee-count field
  on the `Event` shape.
- `~/Desktop/MFU-Events/backend/lib/seed.js` — `category` only appears on
  `pointsTransactions` rows (`category: 'organizer'`, a ledger classification),
  not on `Event`. No `attendee`/`going`/`interested`/`rsvp` field anywhere.
- Confirms: category-color pills and "N going" social proof are **not
  buildable from live data today** — backend-dependent follow-up only.

## 7. Dark/light + breakpoint surface already covered

`styles/responsive.css` has 1280/1024/768/480px breakpoints wired to the
sidebar-collapse/drawer/bottom-nav/single-column behavior already. No new
breakpoint infrastructure needed — the audit should run *at* these four
widths, not invent new ones.
