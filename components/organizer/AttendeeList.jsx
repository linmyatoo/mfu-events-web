'use client';

import { useState, useTransition } from 'react';

import {
  checkInBookingAction,
  markNoShowAction,
} from '../../app/organizer/actions';
import { BOOKING_STATUS, bookingStatusMeta, formatDate } from '../../lib/events';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

/**
 * Attendance for one event.
 *
 * Checking someone in awards their attendance points; marking a no-show
 * applies the health penalty. Both are one-way — the backend answers 409 for
 * any booking that is not still `booked`.
 */
export default function AttendeeList({ eventId, attendees }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function run(action) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  const live = attendees.filter(
    (booking) => booking.status !== BOOKING_STATUS.CANCELLED
  );

  return (
    <section className="page-section" aria-labelledby="attendees-heading">
      <h2 className="section-title" id="attendees-heading">
        Attendees ({live.length})
      </h2>

      {error ? (
        <p className="notice notice--danger" role="status">
          {error}
        </p>
      ) : null}

      {attendees.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="ticket"
            title="Nobody has booked yet"
            message="Bookings appear here as soon as registration opens."
          />
        </div>
      ) : (
        <ul className="stack">
          {attendees.map((booking) => {
            const status = bookingStatusMeta(booking.status);
            const open = booking.status === BOOKING_STATUS.BOOKED;

            return (
              <li className="card card--padded" key={booking.id}>
                <div className="event-card__heading">
                  <h3 className="event-card__title">{booking.userName}</h3>
                  <span className={`badge badge--${status.variant}`}>
                    {status.label}
                  </span>
                </div>

                <p className="event-card__meta">
                  {booking.qr_token} · booked {formatDate(booking.booked_at)}
                  {booking.checked_in_at
                    ? ` · in at ${formatDate(booking.checked_in_at)}`
                    : ''}
                </p>

                {open ? (
                  <div className="booking-panel__row">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(() => checkInBookingAction(booking.id, eventId))
                      }
                    >
                      Check in
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => run(() => markNoShowAction(booking.id, eventId))}
                    >
                      No-show
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
