# Ground-truth backend contract (read before trusting the reference frontend)

Source of truth: `/Users/panda/Desktop/MFU-Events/backend`. The task brief
says "same API contract for both frontends" — true for *mounting*, but the
reference frontend itself contains calls to routes that do not exist on this
backend. Where reference and backend disagree, this plan treats the backend
as ground truth, per the task's own instruction ("...or from the actual
backend contract").

## Route mounting (`backend/server.js:29-35`)

```
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);       // routes/user.js
app.use('/api/organizer', organizerRoutes); // routes/organizer.js
app.use('/api/admin', adminRoutes);     // routes/admin.js
app.use('/api/creator', organizerRoutes);   // <-- also organizerRoutes, NOT routes/creator.js
```

`backend/routes/creator.js` exists on disk but is **never mounted**. It
references `constants.ROLES.CREATOR` and `constants.ORGANIZER_ROLES.CHECKIN`,
neither of which exist in the current `backend/lib/constants.js` (roles are
`student|faculty|staff|admin`; organizer team roles are
`main_organizer|co_organizer|checkin_staff`). It is dead legacy code from an
earlier design. **Do not use `routes/creator.js` as a reference for anything
in this port.**

`backend/routes/auth.js:21-28` (`derivePortalRole`) returns `'organizer'`
(not `'creator'`) for any user with an active `OrganizerMember` row, and
`'admin'` for role `admin`, else `'user'`. The reference frontend's
`SessionContext` (`frontend/src/context/SessionContext.jsx:32-35`) binds
`makeApi(session.role)`, so reference "creator" pages (directory name only)
actually call `/api/organizer/...` at runtime — confirmed by grep: every
`api.get/post/patch/del` call inside `frontend/src/pages/creator/*.jsx` uses
paths that exist on `routes/organizer.js` (`/my-organizers`,
`/organizers/:orgId/events`, `/events/:id/team`, `/events/:id/clone`, etc.).
So **`backend/routes/organizer.js` is the real, single contract** behind both
the reference's `creator/*` pages and the target's `app/organizer/*` pages.

## Two confirmed dead/unreachable endpoints referenced by the reference app

- `frontend/src/pages/user/Points.jsx:5` calls `api.get('/me/points')` under
  role `user` → `GET /api/user/me/points`. `backend/routes/user.js` defines
  no such route (full route list at lines 53-98: `/me`, `/events`,
  `/events/:id`, `/events/:id/book`, `/bookings/:id/cancel`, `/bookings`,
  `/events/:id/questions`, `/events/:id/reviews`, `/me/health`,
  `/me/organizers`, `/items`). This call would 404 against the real backend.
- `frontend/src/pages/creator/Points.jsx:5` calls `api.get('/me/points')`
  under role `organizer` (session.role) → `GET /api/organizer/me/points`.
  `backend/routes/organizer.js` (full list at lines 70-273) has no `/me/points`
  route either. The only `/me/points` route in the codebase is
  `backend/routes/creator.js:122-125`, which is unmounted dead code.

`mfu-events-web/lib/points.js:1-18` already documents this exact finding and
derives the balance from `GET /api/user/bookings` instead — this is the
**correct** fix, already done. Do not revert it to call the nonexistent
endpoint, and do not build an organizer-side "My points" page against a route
that does not exist (`app/organizer/` correctly has none).

## Permission model difference (not a bug, just context)

The backend's admin routes are gated per-area via `requirePermission(area)`
(`backend/middleware/auth.js:62-69`, checked against `req.user.admin_permissions`),
not a flat `role === 'admin'` check. `mfu-events-web/lib/api.js:128-135`
(`apiGetAllowed`) and every `app/admin/**/page.js` already handle this
correctly (403 → `null` → `<PermissionNotice>`), matching the backend. The
reference frontend's admin pages have no such area-gating (`routes/admin.js`'s
`requirePermission` wasn't yet in place when those pages were written) — this
is a case where target is already ahead of reference; nothing to port.
