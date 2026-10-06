# Backend surface

Source: `MFU-Events/backend/routes/*.js`. Not modified by this work.

## Auth — `/api/auth` (no guard)
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/login` | sets `mfu_token`; returns `{ portalRole, user }` |
| POST | `/logout` | clears the cookie |
| GET | `/me` | `{ portalRole, user }`; `portalRole` = admin / organizer / user |

## User — `/api/user` (authenticated) — DONE
All wired. `GET /demo-users` is a dev role-picker that returns no email, so it
cannot drive login; deliberately unused.

## Organizer — `/api/organizer` (authenticated + active status)
Access is per-organizer, not a global role — checked inline per request.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/my-organizers` | `{...membership, organizer}` |
| GET | `/organizers/:orgId/events` | `+ myRole` |
| POST | `/organizers/:orgId/events` | creates a DRAFT |
| GET | `/events/:id` | `+ myRole, organizer, team, attendeeCount, questions, reviews` |
| PATCH | `/events/:id` | DRAFT only |
| POST | `/events/:id/submit` | DRAFT → SUBMITTED, Main Organizer only |
| POST | `/events/:id/resubmit` | after request-changes |
| POST | `/events/:id/clone` | new DRAFT copy |
| POST | `/events/:id/open-registration` | Main or Co |
| POST | `/events/:id/close-registration` | Main or Co |
| POST | `/events/:id/cancel` | Main Organizer only |
| GET | `/events/:id/team` | `+ name` |
| POST/PATCH/DELETE | `/events/:id/team[/:userId]` | Main Organizer only; 409 on finished events |
| GET | `/events/:id/attendees` | `+ userName` |
| POST | `/checkin/scan` | `{ qrToken }` |
| POST | `/bookings/:id/checkin` | awards attendance points |
| POST | `/bookings/:id/noshow` | applies the health penalty |
| GET/PUT | `/events/:id/item-requests` | PUT replaces all pending rows |
| GET | `/items` | active items |
| GET | `/venues` | `?start_time&end_time&event_id` → `+ available, conflicts` |
| GET | `/users/search` | `?q=` min 2 chars, max 10 |
| POST | `/events/:id/questions/:qid/answer` | Main or Co |

`/api/creator` is mounted as a backward-compat alias of the same router.

## Admin — `/api/admin` (authenticated + role admin + per-area permission)
Permission areas: `users`, `organizers`, `venues`, `events`, `items`, `flags`.
`GET /logs` has no permission gate.

| Method | Path |
| --- | --- |
| GET | `/users`, `/users/:id` (`+ organizerStats`) |
| POST | `/users/:id/suspend`, `/reinstate`, `/deactivate` |
| GET | `/organizers`, `/organizers/:id`, `/organizers/:id/members` |
| POST | `/organizers`, `/organizers/:id/approve`, `/reject`, `/organizers/:id/members` |
| PATCH | `/organizers/:id`, `/organizers/:orgId/members/:userId` |
| DELETE | `/organizers/:orgId/members/:userId` |
| GET | `/venues`, `/venues/schedule`, `/venues/:id`, `/venues/for-event/:eventId` |
| POST | `/venues` · PATCH `/venues/:id` |
| GET | `/events`, `/events/:id` (`+ organizer, venue, requested_venue, team`) |
| POST | `/events/:id/` `start-review` `approve` `reject` `request-changes` `assign-venue` `publish` `complete` `cancel` |
| GET | `/items`, `/items/inventory`, `/items/:id` · POST `/items` · PATCH `/items/:id` |
| GET | `/events/:id/item-requests` · POST `/item-requests/:id/approve` `/reject` |
| GET | `/flags/organizers`, `/flags/organizers/:id/evidence`, `/flags/health` |
| POST | `/flags/organizers/:id/resolve`, `/flags/health/:id/resolve` |
| GET | `/logs` `?type&limit` |
| POST | `/dev/events`, `/dev/sweep-noshows` (test tooling — not surfaced) |

## Event lifecycle (`EVENT_TRANSITIONS`)

```
draft ──submit──> submitted ──start-review──> under_review
                                               ├─ approve ──> approved
                                               ├─ reject ───> rejected (terminal)
                                               └─ request-changes ──> draft
approved ──assign-venue──> venue_assigned ──publish──> published
                                            └─ open-registration ──┐
published ──open-registration──> registration_open <───────────────┘
registration_open ──close-registration──> registration_closed ──complete──> completed
draft | approved | venue_assigned | published | registration_open ──cancel──> cancelled
```

Organizer controls `submit`, `open/close-registration`, `cancel`.
Admin controls everything else.

## Not routed anywhere (cannot be built without backend changes)
- `pointsService.listPendingApprovals` / `resolveOrganizerPoints` — the admin
  organizer-points approval queue.
- `pointsService.syncStub` — the university points sync.
- No user-facing attendance-points read; `lib/points.js` derives it instead.
