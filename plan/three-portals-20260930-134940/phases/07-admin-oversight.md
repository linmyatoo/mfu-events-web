# Phase 7 — admin oversight

Status: **done**

- `/admin/flags` — organizer flags and health flags in one queue, filtered by
  status. Open organizer flags pull `…/evidence`, which returns up to three
  negative reviews, already redacted for anonymity.
  Resolutions: dismiss / warn / suspend / deactivate (organizer) and
  dismiss / warn / restrict (health).
- `/admin/logs` — `GET /logs` with prefix filters over `action_type`.

Both flag types are advisory: nothing happens to an account until an admin
resolves the flag, which the page states rather than implying automation.
Anonymous reviews are logged with a null actor, so the activity log cannot be
used to identify their author.
