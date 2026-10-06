# Phase 3 — optional cleanup: dead `requested_venue_name` branch (D3)

Status: done (2026-10-06), bundled with Phase 2. Removed the dead
`requested_venue_name` branch from `venueName()` in `lib/events.js` exactly
as described below; `build`/`lint` pass. No runtime behavior change (branch
was provably unreachable).

## What

`mfu-events-web/lib/events.js:126` (`venueName()`):

```js
if (event.requested_venue_name) return `${event.requested_venue_name} (requested)`;
```

This field is only ever written by the backend's clone endpoint
(`backend/routes/organizer.js:134`) from a source field
(`event.requested_venue_name`) that `eventService.createEvent`
(`backend/lib/services/eventService.js:94-120`) never sets on any event —
so it is always `undefined`/`null` on every real event, cloned or not. The
branch is unreachable in practice; execution always falls through to the
`venue_preference` check on the next line, which is correct.

## Fix (if the user wants it)

Delete the dead `requested_venue_name` branch from `venueName()`, leaving:

```js
export function venueName(event) {
  if (event.venue?.name) return event.venue.name;
  if (event.venue_preference) return `${event.venue_preference} (preference)`;
  return 'Venue to be announced';
}
```

No caller depends on the removed branch (grep confirms `requested_venue_name`
is referenced nowhere else in `mfu-events-web`).

If Phase 1(a) is later implemented and a real `requested_venue` (resolved
object, matching the admin route's shape) becomes available on user/organizer
event payloads too, this function should instead branch on
`event.requested_venue?.name`, not the never-populated `requested_venue_name`
string field — note this for whoever picks up Phase 1.

## Verification

`npm run build` (pure refactor, no behavior change expected) — the removed
branch was provably dead, so no runtime check is strictly needed beyond
confirming the file still compiles and `venueName()`'s other two branches
are exercised by existing pages (events feed, admin events list, etc.).
