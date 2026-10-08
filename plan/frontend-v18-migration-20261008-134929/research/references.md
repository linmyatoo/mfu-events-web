# References

## Authoritative spec (ground truth for this plan)

`/Users/panda/Desktop/MFU-Events/.docs/03-engineering/frontend-v18-migration.md`

Sections used:
- TL;DR (entity-free organizer model summary)
- Breaking Changes — Fix These First (items 1-10)
- Auth — New Routes
- New Features to Build (Register, Event Requests x2, Admin Organizations, Admin Points, Contributors, Staff Calls, Self Check-In, Recognition, Points, Review Edit & Delete, Platform Settings)
- Full API Surface Reference (`/api/auth/*`, `/api/user/*`, `/api/organizer/*`, `/api/admin/*` tables)

## Backend migration-tracking docs (context only, not authoritative for the frontend contract)

- `/Users/panda/Desktop/MFU-Events/docs/MIGRATION_PLAN.md` — 24-phase backend migration plan (universities → academic units → organizations → org membership → event/org relationship + request gating → EventOrganizer verification → compatibility layer → org management routes → event lifecycle → booking/check-in hardening → reviews/health/recognition/points → notifications → authz matrix → audit logging → data backfill → validation → switch reads/writes → contract). Useful for understanding *why* the backend shape changed and what's still in flight on the backend side, but the frontend should only ever code against `frontend-v18-migration.md`'s documented response shapes, not infer from backend-internal phase docs.
- `/Users/panda/Desktop/MFU-Events/docs/MIGRATION_ANALYSIS.md` — Phase 0 audit: active vs. legacy collections, current role/permission model, proposed schema mapping, data counts, potential migration conflicts. Confirms `organizers.json`/`organizerMembers.json`/`items.json`/`eventItemRequests.json` are legacy (section 3) — corroborates breaking changes #9 and #10 independently of the frontend-facing doc.

## Repository files read during planning (for traceability)

- `lib/api.js`, `lib/session.js`, `lib/events.js`, `lib/points.js`
- `app/actions.js`, `app/organizer/actions.js`, `app/admin/actions.js`
- `app/login/page.js`, `app/(app)/layout.js`, `app/(app)/profile/page.js`, `app/(app)/items/page.js`
- `app/organizer/layout.js`, `app/organizer/page.js`, `app/organizer/check-in/page.js`, `app/organizer/events/new/page.js`, `app/organizer/events/[id]/page.js`
- `app/admin/layout.js`, `app/admin/page.js`, `app/admin/flags/page.js`, `app/admin/items/page.js`, `app/admin/events/[id]/page.js`, `app/admin/events/new/page.js`, `app/admin/organizers/page.js`, `app/admin/organizers/[id]/page.js`
- `components/navigation/navItems.js`, `components/organizer/EventForm.jsx`, `components/organizer/TeamManager.jsx`, `components/admin/FlagResolver.jsx`, `components/admin/NewOrganizerForm.jsx`, `components/admin/OrganizerMembers.jsx`, `components/admin/EventReview.jsx`, `components/events/ReviewsSection.jsx`
- `package.json` (scripts: `dev`, `build`, `start`, `lint` — no `test` script exists in this repo)
