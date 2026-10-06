# Phase 5 — admin people

Status: **done**

- `/admin/users` + `/admin/users/[id]` — status filters, suspend / reinstate /
  deactivate, and the read-time `organizerStats` block. Admin accounts show a
  note instead of buttons, matching `userService.setStatus`.
- `/admin/organizers` + `/admin/organizers/[id]` — status filters, create,
  approve / reject a pending entity, and full member management with user
  search.

The UI keeps the two "organizer" concepts apart: `OrganizerMembers` edits
membership of the entity (owner / president / event_manager / member), while
`TeamManager` in the Organizer portal edits the per-event team
(main_organizer / co_organizer / checkin_staff).
