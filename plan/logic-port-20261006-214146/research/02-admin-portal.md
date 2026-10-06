# Admin portal diff notes

File pairs read in full:
- `frontend/src/pages/admin/{Events,EventDetail,CreatorFlags,HealthFlags,Items,Logs,Users,Venues,VenueSchedule,Creators,CreatorDetail}.jsx`
- `mfu-events-web/app/admin/{page,events/[id]/page,flags/page,items/page,logs/page,organizers/page,organizers/[id]/page,users/page,users/[id]/page,venues/page,venues/schedule/page}.js`
- `mfu-events-web/components/admin/{EventReview,VenueAssigner,FlagResolver}.jsx`
- Backend: `backend/routes/admin.js`, `backend/lib/services/{flagService,venueService,itemService,orgEntityService,userService,activityLogService}.js`

## CONFIRMED GAP — no admin UI for point events or organizer-points approval

Backend capability exists and is fully implemented:
- `backend/lib/services/eventService.js:83-131` (`createEvent`) — only an
  `admin`-role actor may set `is_point_event: true` /
  `organizer_points_base`; any other role is silently forced to `false`/`null`.
- `backend/lib/services/pointsService.js:36-67` (`proposeOrganizerPoints`),
  `:70-94` (`listPendingApprovals`, `resolveOrganizerPoints` —
  approve/adjust/reject), `:98-110` (`syncStub`).
- `backend/routes/admin.js` has no route wired to
  `pointsService.listPendingApprovals`/`resolveOrganizerPoints`/`syncStub` —
  **this is a backend gap too**, not just a frontend one (confirmed by full
  read of `routes/admin.js`, lines 1-212; the only points-adjacent surface is
  `userService.organizerStats`'s already-computed `organizerPoints` total,
  shown read-only on the admin user detail page).
- Reference has UI for the create-point-event half only:
  `frontend/src/pages/admin/CreatePointEvent.jsx` (not read in full for this
  pass, but its existence plus `eventService.createEvent`'s admin-only gate
  confirms the intended flow) and `frontend/src/pages/admin/PointsPending.jsx`
  for approvals — but note `PointsPending.jsx` would itself need a backend
  route that doesn't exist in `routes/admin.js`, so even the reference app's
  version of this screen may be partially non-functional against the current
  backend. This needs direct verification before any implementation work.

Target (`mfu-events-web`) has **no route at all** for either flow — confirmed
via `grep -rn "is_point_event|PointsPending|proposeOrganizerPoints"` across
`app/`, `components/`, `lib/`: the only hits are read-only displays of
`event.is_point_event`/`organizer_points_base` on existing event-detail pages
(`app/(app)/events/[id]/page.js:64`, `app/organizer/events/[id]/page.js:76`,
`app/admin/events/[id]/page.js:64-66`). There is no `app/admin/events/new`
and no `app/admin/points*`.

**This is a scope decision, not a "fix the logic under existing markup"
task** — closing it means adding at least one new admin page (and possibly a
new backend route for the approval half). Flagged for the user rather than
planned as a default phase.

## Everything else checked — matches, no action needed

- **Event review lifecycle** (`EventReview.jsx` vs reference `Events.jsx`/
  `EventDetail.jsx` `ADMIN_ACTIONS` tables) — target derives allowed buttons
  from `canTransition()` against `EVENT_TRANSITIONS`
  (`mfu-events-web/lib/events.js:172-206`, mirrors
  `backend/lib/constants.js:94-106` exactly) rather than a hand-maintained
  per-status action table. This is **more correct** than reference: target's
  `VenueAssigner` fetches `for-event` venues for
  `[APPROVED, VENUE_ASSIGNED]` (`app/admin/events/[id]/page.js:31,44-47`),
  matching the backend's actual `assign-venue` guard
  (`backend/routes/admin.js:156-158`, allows `['approved','venue_assigned']`).
  Reference only offers "Assign venue" for `status === 'approved'`
  (`frontend/src/pages/admin/EventDetail.jsx:21`,
  `frontend/src/pages/admin/Events.jsx:13`) — reference cannot re-assign a
  venue once `venue_assigned`, target can. **Do not regress target to match
  reference here.**
- **Item request approval** — `resolveItemRequestAction`
  (`app/admin/actions.js:235-249`) sends `{ quantity }` only on approve,
  matching `itemService.approveRequest(requestId, allocatedQty, adminId)`
  (`backend/lib/services/itemService.js:72-87`) and reference's
  `resolveItem()` calls in both `Events.jsx:109-117` and
  `EventDetail.jsx:118-126`. No divergence.
- **Flag resolution workflow** — `FlagResolver.jsx` action sets
  (`dismiss|warn|suspend|deactivate` for organizer flags,
  `dismiss|warn|restrict` for health flags) match
  `flagService.resolveOrganizerFlag`/`resolveHealthFlag`
  (`backend/lib/services/flagService.js:83-124`) and reference's
  `RESOLUTIONS` arrays in `CreatorFlags.jsx:10` / `HealthFlags.jsx:7`
  exactly. Evidence sampling (`sampleNegativeReviews`) is fetched eagerly
  server-side for every open flag in target
  (`app/admin/flags/page.js:42-50`) vs lazily on-click in reference
  (`CreatorFlags.jsx:61-70`) — a UI/UX timing difference only, not a logic
  divergence (same data, same redaction via `reviewPrivacy.redactReview`).
- **Organizer entity CRUD + membership** — `createOrganizerAction`
  (auto-approved, `apiPost('/api/admin/organizers', {name,type,description})`)
  matches `orgEntityService.create(fields, actorId, true)`
  (`backend/lib/services/orgEntityService.js:32-45`) and reference's "Create
  (auto-approved)" button (`Creators.jsx:146`). Approve/reject/add-member/
  remove-member/update-role actions all map 1:1 to
  `orgEntityService.{approve,reject,addMember,removeMember,updateMemberRole}`.
- **Venue CRUD, venue schedule, logs, users list/detail/suspend/reinstate/
  deactivate** — all read/write shapes match the corresponding service
  functions. One reference-side bug found and *not* present in target:
  reference's `AdminUsers.jsx:6` filter options include `'inactive'`, but the
  real status enum is `deactivated` (`backend/lib/constants.js:13-18`) —
  reference's filter dropdown has a dead option that can never match any
  user. Target's `FILTERS` in `app/admin/users/page.js:12-18` correctly uses
  `deactivated`. **Do not port the reference's typo.**
