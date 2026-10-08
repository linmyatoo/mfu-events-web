# Requirements

## Restated goal

Roll the "Campus Commons" two-blue visual direction (rounded cards, warm display
headings, color-coded status pills, initials-circle avatars) out across every
portal — user, organizer, admin — and fix the systemic spacing/tightness issues
("text too close to boxes") that the organizer My Events header screenshot
surfaced, using a repeatable audit method rather than one-off fixes.

## Hard constraints (from the user, carried over from earlier rounds)

1. **Only two blues**: `#1A3FC4` (`--primary-color`/`--primary-light`/`--primary-sky`)
   and `#0F2A8C` (`--primary-deep`/`--primary-dark`/`--primary-navy`). No third hue.
   Soft fills at low opacity of these two colors are allowed and are *not* a new color.
2. **Dark-theme override is intentional**: `:root[data-theme='dark']` repoints
   `--primary-color`/`--primary-light`/`--primary-tint` to `#5B7FFF` because the
   literal `#1A3FC4` fails contrast on dark surfaces. Do not revert this.
3. **Two fixed brand marks, never remove/alter**:
   - the torch/flame wordmark lockup in `components/layout/Header.jsx`
     (`.app-header__brand` / `.app-header__logo`, currently `/mfu-logo.png`)
   - `components/layout/BrandBadge.jsx` → `/adt-logo.png`, fixed bottom-right,
     `aria-hidden`, rendered in every page via the app shell.
4. **No fake data**. `Event` rows (per `lib/events.js` and backend
   `~/Desktop/MFU-Events/backend/lib/seed.js`) have no `category` field and no
   attendee/"going" count. Any design that implies these (category-color pills,
   "N going" social proof) is a backend-dependent follow-up, flagged not built.
5. Scope is **the whole app**, not just profile — every page under `app/`,
   every shared component under `components/`, every stylesheet under `styles/`.

## Success criteria

- Every page that passes `actions` to `PageContainer` has visible, consistent
  spacing between subtitle and the action button (no 0px/flush gap).
- Icon+label gap is consistent with the rest of the token scale (8px, matching
  `.btn`) across event meta rows (`.event-card__meta`, `.event-hero__meta`,
  `.event-detail__meta`, `.back-link`), not 4px.
- A written, repeatable spacing-audit method exists (grep rules + breakpoints +
  screenshot checklist) that the next person (or agent) can re-run without
  re-deriving it from scratch.
- No new hue introduced anywhere; dark-theme override untouched.
- Both brand marks untouched.
- Organizer, admin, and user portals all reviewed, not just two pages.
