# Plan — Organizer and Admin portals

## Goal

Wire every remaining backend endpoint into `mfu-events-web`, keeping the
existing UI vocabulary (`.card`, `.badge`, `.event-card`, `.settings-tile`,
`.pill-toggle`, `.stack`) and changing no backend code.

## Existing patterns to follow

- `lib/api.js` — every backend call is server-side and forwards `mfu_token`.
- `lib/session.js` — `getSession()` / `requireUser()`.
- `app/actions.js` — Server Actions returning `{ ok }` / `{ error }`.
- `app/(app)/layout.js` — auth guard + `AppShell`.
- Forms use `useActionState`; non-form mutations use `useTransition`.

## Architecture decisions

### Routing
Route groups do not add URL segments, so the portals are real directories:

| URL | Directory | Guard |
| --- | --- | --- |
| `/`, `/bookings`, … | `app/(app)/` | any signed-in user |
| `/organizer/…` | `app/organizer/` | an active OrganizerMember row |
| `/admin/…` | `app/admin/` | `user.role === 'admin'` |

`GET /api/auth/me` already returns `portalRole` (`user` / `organizer` /
`admin`); it decides which portals the switcher offers, not what is allowed —
the guards re-derive access themselves, and the backend enforces it regardless.

### Chrome
`AppShell` takes `navItems` and `portals` props. Each portal layout supplies
its own nav. The header gains a portal switcher, shown only when the account
can reach more than one portal.

### Two different "organizer" concepts
The backend has two, and the UI must not blur them:
- **Organizer entity** (`organizers`) — a club or department. Users join via
  `organizerMembers` with `owner` / `president` / `event_manager` / `member`.
  `EVENT_MANAGING_ROLES` (the first three) may create events.
- **Event team** (`eventOrganizers`) — per event: `main_organizer` /
  `co_organizer` / `checkin_staff`.

### Actions
Split by portal so each file's guards are obvious:
`app/actions.js`, `app/organizer/actions.js`, `app/admin/actions.js`.

## Phases

1. **Portal shell** — per-portal nav, guards, switcher, session helpers.
2. **Organizer: events** — org picker, event list, detail, create/edit draft,
   submit, resubmit, clone, open/close registration, cancel.
3. **Organizer: running an event** — team, attendees, check-in, item requests,
   venue availability, answering Q&A.
4. **Admin: events** — list, detail, full approval lifecycle, venue assignment.
5. **Admin: people** — users, organizers, organizer members.
6. **Admin: resources** — venues, venue schedule, items, inventory, requests.
7. **Admin: oversight** — organizer flags with evidence, health flags, logs.

## Risks

- **Venue assignment returns 409 with a `conflicts` array.** `lib/api.js`
  currently drops everything but `error`. It must carry `conflicts` through or
  the admin cannot see what clashed.
- **`GET /api/admin/*` is permission-gated** per area via `admin_permissions`.
  The seeded admin holds all six, but a real one may not — every admin page
  must degrade to a readable message on 403 rather than crash.
- **Event edits are DRAFT-only** for organizers (`updateEvent` throws
  otherwise). The edit form must not be offered on a submitted event.
- **`POST /api/organizer/events/:id/clone` and team writes 409 on finished
  events.** Surface the message rather than pre-guessing every rule.
- **No points-approval endpoint exists.** `pointsService.listPendingApprovals`
  and `resolveOrganizerPoints` are not routed anywhere, so the admin
  points-approval queue cannot be built without backend changes. Out of scope.

## Verification

Per phase: `eslint`, `next build`, then curl each new route with a real session
cookie for the role in question and assert on rendered content.
