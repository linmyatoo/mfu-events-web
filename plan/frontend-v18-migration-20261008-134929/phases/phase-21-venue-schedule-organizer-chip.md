# Phase 21 — Restore the organizer chip on the admin venue schedule

**Status: Not started.**

**Spec section:** N/A in the original migration doc — consumes the same
post-Phase-19 backend follow-up commit, `029684f`, specifically its
`venueService.schedule()` change. Verified directly against
`MFU-Events/backend/lib/services/venueService.js:109-123`:

```js
function schedule() {
  const venues = listAll();
  return venues.map((v) => {
    const events = db.filter('events', (e) => e.venue_id === v.id && BLOCKING_STATUSES.includes(e.status))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .map((e) => {
        const org = e.org_id ? db.getById('organizations', e.org_id) : null;
        const mainOrgRow = db.find('eventOrganizers', (eo) => eo.event_id === e.id && eo.role === 'main_organizer');
        const mainOrganizer = mainOrgRow ? db.getById('users', mainOrgRow.user_id) : null;
        return {
          ...e,
          org: org ? { id: org.id, name: org.name } : null,
          main_organizer: mainOrganizer ? { id: mainOrganizer.id, name: mainOrganizer.name } : null,
        };
      });
    return { ...v, events };
  });
}
```

So `GET /api/admin/venues/schedule` now returns, per event, `org: {id,
name} | null` and `main_organizer: {id, name} | null` alongside the raw
event row — exactly the embed Phase 6 asked for as a backend follow-up
when it dropped the chip (`plan.md`'s "Outstanding follow-ups" bullet on
this exact page, and `phases/phase-6-admin-organizations.md`'s "Scope
note" at the bottom). Both can be `null` in theory (`org_id` is nullable on
very old/seed rows; a `main_organizer` team row could theoretically be
missing), so render defensively, matching `app/admin/page.js`'s existing
`mainOrganizerName(event) ?? 'No organizer'` fallback pattern (that page
reads `event.team`, a different embed, but the same null-coalescing idea
applies here).

**Depends on:** Phase 6 (this page's structure; the chip removal being
undone here). **Risk:** Low — single file, additive only (one new `<span>`
per event row, no existing markup removed). **Independently shippable:**
Yes.

## Steps

1. `app/admin/venues/schedule/page.js` — in the `venue.events.map((event) =>
   ...)` block (around line 44-64), add a `chip` span inside
   `event-card__footer`-style markup, matching `app/admin/page.js`'s
   `<span className="chip">{mainOrganizerName(event) ?? 'No organizer'}</span>`
   pattern. Since this page's event card currently has no
   `event-card__footer` div at all (unlike `app/admin/page.js` and
   `app/admin/event-requests/page.js`), add one:
   ```jsx
   <div className="event-card__footer">
     <span className="chip">{event.main_organizer?.name ?? 'No organizer'}</span>
     {event.org ? (
       <span className="event-card__meta">
         <Icon name="home" size={16} />
         {event.org.name}
       </span>
     ) : null}
   </div>
   ```
   (`Icon` is already imported on this page; `home` is an existing glyph
   per `components/common/Icon.jsx:10` — no new icon needed.)
2. Update the page's top-of-file doc comment (lines 12-16, which currently
   only describes `BLOCKING_STATUSES`) to note the new `org`/`main_organizer`
   embed, so a future reader doesn't re-discover this by reading the
   backend again.
3. Delete the now-stale "organizer chip dropped" bullet from `plan.md`'s
   "Outstanding follow-ups" section once this ships (tracked separately in
   this planning pass's edit to `plan.md` — see that file's updated
   follow-ups list).

## Files

- `app/admin/venues/schedule/page.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual: `/admin/venues/schedule`, confirm each scheduled event shows a
  chip with its main organizer's name (or "No organizer" if somehow
  missing) and, where `org_id` is set, the requesting org's name.
