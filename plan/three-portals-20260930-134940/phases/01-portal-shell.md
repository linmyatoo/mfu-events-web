# Phase 1 — portal shell

Status: **done**

- `lib/api.js` — added `apiPatch` / `apiPut` / `apiDelete` / `apiGetAllowed`, and
  `ApiError.details` so the 409 `conflicts` array from venue assignment survives.
- `lib/session.js` — `PORTALS`, `getMyOrganizers`, `requireOrganizer`,
  `requireAdmin`, `portalsFor`.
- `components/navigation/navItems.js` — `userNavItems` / `organizerNavItems` /
  `adminNavItems`; `isActiveRoute` no longer lets a portal root match every child.
- `AppShell` / `Sidebar` / `MobileNav` take `navItems`; `Header` gained a portal
  switcher (hidden below 1024px, where the drawer carries it instead).
- `lib/events.js` — every lifecycle state in `eventStatusMeta`, plus
  `EVENT_TRANSITIONS`, `canTransition`, `MEMBER_ROLE_LABELS`,
  `ORGANIZER_TYPE_LABELS`, and `toLocalInput` / `fromLocalInput` (fixed +07:00,
  round-trip verified).
- Layouts: `app/(app)/layout.js`, `app/organizer/layout.js`, `app/admin/layout.js`.
