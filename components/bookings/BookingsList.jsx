'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { cancelBookingAction } from '../../app/actions';
import {
  BOOKING_STATUS,
  bookingStatusMeta,
  dateBlock,
  formatEventWhen,
  isPastEvent,
} from '../../lib/events';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import Icon from '../common/Icon';
import Modal from '../common/Modal';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Completed' },
];

/**
 * Upcoming / Completed split over `GET /api/user/bookings`.
 *
 * "Upcoming" is a live reservation for an event that has not finished yet;
 * everything else (attended, no-show, cancelled, finished) is history.
 */
export default function BookingsList({ bookings }) {
  const [tab, setTab] = useState('upcoming');
  const [confirming, setConfirming] = useState(null);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const now = new Date();
  const upcoming = bookings.filter(
    (booking) =>
      booking.status === BOOKING_STATUS.BOOKED && !isPastEvent(booking.event, now)
  );
  const past = bookings.filter((booking) => !upcoming.includes(booking));
  const shown = tab === 'upcoming' ? upcoming : past;

  function handleCancel() {
    const booking = confirming;
    setConfirming(null);
    setError(null);
    startTransition(async () => {
      const result = await cancelBookingAction(booking.id, booking.event_id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <>
      <div className="pill-toggle" role="tablist" aria-label="Booking status">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`pill-toggle__item${
              tab === item.id ? ' pill-toggle__item--active' : ''
            }`}
            onClick={() => setTab(item.id)}
          >
            {item.label} ({item.id === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {error ? (
        <p className="notice notice--danger" role="status">
          {error}
        </p>
      ) : null}

      {shown.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="ticket"
            title={tab === 'upcoming' ? 'No upcoming bookings' : 'Nothing here yet'}
            message={
              tab === 'upcoming'
                ? 'Book an event from the feed and it will show up here.'
                : 'Events you attended, missed or cancelled will be listed here.'
            }
            action={
              tab === 'upcoming' ? (
                <Button variant="primary" href="/">
                  Browse events
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <ul className="stack">
          {shown.map((booking) => {
            const { day, month } = dateBlock(booking.event.start_time);
            const status = bookingStatusMeta(booking.status);

            return (
              <li key={booking.id} className="card">
                <Link href={`/events/${booking.event_id}`} className="event-card">
                  <div className="date-block" aria-hidden="true">
                    <span className="date-block__day">{day}</span>
                    <span className="date-block__month">{month}</span>
                  </div>

                  <div className="event-card__body">
                    <div className="event-card__heading">
                      <h3 className="event-card__title">{booking.event.title}</h3>
                      <span className={`badge badge--${status.variant}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="event-card__meta">
                      <Icon name="calendar" size={16} />
                      {formatEventWhen(booking.event)}
                    </p>

                    <div className="event-card__footer">
                      <span className="event-card__meta event-card__venue">
                        <Icon name="ticket" size={16} />
                        {booking.qr_token}
                      </span>
                      {booking.event.points_value > 0 ? (
                        <span className="points-pill">
                          +{booking.event.points_value} pts
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>

                {booking.status === BOOKING_STATUS.BOOKED ? (
                  <div className="booking-tile__actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirming(booking)}
                      disabled={pending}
                    >
                      {pending ? 'Working…' : 'Cancel booking'}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(confirming)}
        title="Cancel this booking?"
        onClose={() => setConfirming(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Cancel booking
            </Button>
          </>
        }
      >
        <p>
          You will lose your place at{' '}
          <strong>{confirming?.event?.title}</strong>. You can book again while
          registration is still open.
        </p>
      </Modal>
    </>
  );
}
