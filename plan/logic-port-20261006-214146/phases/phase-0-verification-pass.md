# Phase 0 — verification pass on components not exhaustively diffed

Status: done (2026-10-06). No real divergences found — no code changes made.

## Findings

All five pairs checked against the reference and the backend contract:

- `components/admin/OrganizerMembers.jsx` vs `CreatorDetail.jsx`'s
  `AddMemberForm` (95-135): target uses a search-based picker
  (`searchUsersAction`) instead of a raw user-id input; both send
  `{ userId, role }` to `POST /api/admin/organizers/:id/members`, matching
  `orgEntityService.addMember` (`backend/lib/services/orgEntityService.js:99`).
  Functionally equivalent, per the phase file's own "either is fine" note.
- `components/admin/NewOrganizerForm.jsx` vs `Creators.jsx`'s
  `CreateOrganizerForm` (105-149): both send exactly `{ name, type,
  description }` to `POST /api/admin/organizers`
  (`app/admin/actions.js:96-111`). Match.
- `components/admin/ItemRequestReview.jsx` vs `EventDetail.jsx`'s
  `resolveItem` (118-126) / `Events.jsx` (109-117): approve sends
  `{ quantity }` defaulted to `quantity_requested`
  (`app/admin/actions.js:235-249`, `components/admin/ItemRequestReview.jsx:56`),
  reject sends no body — matches `itemService.approveRequest`/`rejectRequest`
  (`backend/lib/services/itemService.js:72-102`). Match.
- `components/admin/UserActions.jsx` vs `Users.jsx` (17-25, 85-102): target
  exposes suspend/reinstate/deactivate (reference's UI only wires up
  suspend/reinstate even though the backend has a real `deactivate` route at
  `backend/routes/admin.js:48`); target never lets an admin account be the
  target (`user.role === 'admin'` guard), matching
  `userService.setStatus`'s own guard
  (`backend/lib/services/userService.js:25`). Target offering the extra,
  backend-supported action is not a regression — same pattern as verified
  non-issue #4 in `plan.md`. Match, nothing to fix.
- `components/auth/LoginForm.jsx` vs `Login.jsx` (26-37): target's
  `loginAction` (`app/actions.js:34-67`) surfaces `ApiError.message`
  verbatim for both invalid-credentials (401) and deactivated-account (403)
  responses from `backend/routes/auth.js:34-58`, same as reference's
  `err.message` surfacing. Match.

No divergence met the evidence bar used for D1-D4; `plan.md`'s divergence
list is unchanged.

## Why

This planning pass read every page pair and every service/route file for the
four "pay special attention" areas plus event lifecycle, organizer teams,
item approval, points/health, check-in, and venue conflict/capacity. A
handful of smaller admin components were read on the target side but not
cross-checked line-by-line against their reference counterpart (time budget).
Before declaring the port complete, check these pairs:

| Target | Reference | What to check |
|---|---|---|
| `components/admin/OrganizerMembers.jsx` | `frontend/src/pages/admin/CreatorDetail.jsx` (`AddMemberForm`, lines 95-135) | Does target's add-member form require a raw user id (reference does — `<input placeholder="User id (e.g. u7)">`) or does it have search like `TeamManager.jsx`? Either is fine functionally against `orgEntityService.addMember`, but confirm the payload shape (`{ userId, role }`) matches. |
| `components/admin/NewOrganizerForm.jsx` | `frontend/src/pages/admin/Creators.jsx` (`CreateOrganizerForm`, lines 105-149) | Confirm fields sent are exactly `{ name, type, description }` matching `orgEntityService.create`. |
| `components/admin/ItemRequestReview.jsx` | `frontend/src/pages/admin/EventDetail.jsx` (`resolveItem`, lines 118-126) / `Events.jsx` (lines 109-117) | Confirm approve sends `{ quantity }` (defaulting to `quantity_requested` when unset) and reject sends nothing, matching `itemService.{approveRequest,rejectRequest}`. |
| `components/admin/UserActions.jsx` | `frontend/src/pages/admin/Users.jsx` (lines 17-25, 85-102) | Confirm the exact action set exposed (suspend/reinstate/deactivate) and that an admin account can never be the target, matching `userService.setStatus`'s guard (`backend/lib/services/userService.js:25-32`). |
| `components/auth/LoginForm.jsx` | `frontend/src/pages/Login.jsx` (lines 26-37) | Confirm error surfacing matches (invalid credentials, deactivated account) against `backend/routes/auth.js:34-58`. |

## Verification

No code changes in this phase — just confirm or produce new findings. If a
real divergence turns up, add it to `plan.md`'s divergence list with
file:line evidence before fixing it, following the same evidence bar used
for D1-D4.
