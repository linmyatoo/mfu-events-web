'use client';

import { useState, useTransition } from 'react';

import { assignVenueAction } from '../../app/admin/actions';
import { formatEventWhen } from '../../lib/events';
import Button from '../common/Button';

/**
 * GET /api/admin/venues/for-event/:eventId annotates every active venue with
 * `isRequested`, `matchesPreference`, `capacityOk` and `hasConflict`.
 *
 * The backend still re-checks on assign and answers 409 with a `conflicts`
 * array, which is why the failure path renders those rather than a bare
 * message — otherwise the admin cannot see what actually collided.
 */
export default function VenueAssigner({ event, venues }) {
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  function assign(venueId) {
    setResult(null);
    startTransition(async () => {
      setResult(await assignVenueAction(event.id, venueId));
    });
  }

  const conflicts = result?.details?.conflicts ?? [];

  return (
    <section className="page-section" aria-labelledby="venue-heading">
      <h2 className="section-title" id="venue-heading">
        Venue
      </h2>

      <p className="text-muted">
        Currently {event.venue ? event.venue.name : 'unassigned'}
        {event.requested_venue ? ` · organizer asked for ${event.requested_venue.name}` : ''}
        {event.venue_preference ? ` · preference "${event.venue_preference}"` : ''}
        {event.expected_participants
          ? ` · expects ${event.expected_participants} people`
          : ''}
      </p>

      {result?.error ? (
        <div className="notice notice--info" role="status">
          <p>{result.error}</p>
          {conflicts.length > 0 ? (
            <ul>
              {conflicts.map((clash) => (
                <li key={clash.id}>
                  {clash.title} — {formatEventWhen(clash)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {result?.ok ? (
        <p className="notice notice--success" role="status">
          Venue assigned.
        </p>
      ) : null}

      <ul className="stack">
        {venues.map((venue) => {
          const blocked = venue.hasConflict || !venue.capacityOk;
          return (
            <li className="card card--padded" key={venue.id}>
              <div className="event-card__heading">
                <h3 className="event-card__title">{venue.name}</h3>
                <span
                  className={`badge badge--${blocked ? 'danger' : 'success'}`}
                >
                  {venue.hasConflict
                    ? 'Clashes'
                    : venue.capacityOk
                      ? 'Available'
                      : 'Too small'}
                </span>
              </div>

              <p className="event-card__meta">
                {[venue.building, venue.location].filter(Boolean).join(' · ')} ·
                capacity {venue.capacity}
              </p>

              <div className="event-detail__tags">
                {venue.isRequested ? (
                  <span className="badge badge--info">Requested by organizer</span>
                ) : null}
                {venue.matchesPreference ? (
                  <span className="chip">Matches preference</span>
                ) : null}
                {venue.equipment?.map((piece) => (
                  <span className="chip" key={piece}>
                    {piece.replace('_', ' ')}
                  </span>
                ))}
              </div>

              {venue.conflicts?.length ? (
                <p className="text-muted">
                  Held by{' '}
                  {venue.conflicts
                    .map((clash) => `${clash.title} (${formatEventWhen(clash)})`)
                    .join('; ')}
                </p>
              ) : null}

              <div className="booking-panel__row">
                <Button
                  variant={blocked ? 'outline' : 'primary'}
                  size="sm"
                  disabled={pending || venue.id === event.venue_id}
                  onClick={() => assign(venue.id)}
                >
                  {venue.id === event.venue_id ? 'Assigned' : 'Assign'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
