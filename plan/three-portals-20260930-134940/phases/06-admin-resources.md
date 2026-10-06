# Phase 6 — admin resources

Status: **done**

- `/admin/venues` — list, inline edit, create. Capacity carries the warning
  that assignment is refused below an event's `expected_participants`.
- `/admin/venues/schedule` — every room with the events holding it.
- `/admin/items` — `GET /items/inventory`, so each row shows total, allocated
  and pending quantities; inline edit and create.
- Item requests are reviewed on the event page (`ItemRequestReview`), where
  the admin can allocate a different quantity than was asked for.

`available_quantity` is derived by the backend and stripped from any PATCH, so
the item form never posts it.
