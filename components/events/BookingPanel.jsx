'use client';

import { useState } from 'react';

import {
  BOOKING_STATUS,
  bookingStatusMeta,
  formatDate,
  isRegistrationClosed,
} from '../../lib/events';
import Button from '../common/Button';
import Icon from '../common/Icon';
import Modal from '../common/Modal';

/**
 * Book / cancel panel.
 *
 * Mirrors the guards in bookingService.createBooking + cancelBooking:
 *   - registration_deadline in the past → cannot book
 *   - user.booking_restricted           → cannot book
 *   - an active booking already exists  → cancel instead of book
 *   - only a `booked` row can be cancelled (not attended / no_show)
 *
 * UI-only: nothing is sent anywhere, the new state is held in React.
 * Capacity is not checked here because the feed does not return a booked
 * count — the server owns that rejection.
 */
export default function BookingPanel({ event, user }) {
  const [booking, setBooking] = useState(event.myBooking);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(null);

  const registrationClosed = isRegistrationClosed(event);
  const restricted = user.booking_restricted;
  const active = booking && booking.status !== BOOKING_STATUS.CANCELLED;
  const canCancel = booking?.status === BOOKING_STATUS.BOOKED;

  function handleBook() {
    setPending(true);
    setNotice(null);

    // Stands in for POST /api/user/events/:id/book.
    setTimeout(() => {
      setBooking({
        id: `local-${event.id}`,
        event_id: event.id,
        user_id: user.id,
        status: BOOKING_STATUS.BOOKED,
        qr_token: `EVMFU-LOCAL-${event.id.toUpperCase()}`,
        booked_at: new Date().toISOString(),
        cancelled_at: null,
        checked_in_at: null,
      });
      setPending(false);
      setNotice({ tone: 'success', text: 'Booked. Show your QR token at check-in.' });
    }, 400);
  }

  function handleCancel() {
    setConfirmOpen(false);
    setPending(true);

    // Stands in for POST /api/user/bookings/:id/cancel.
    setTimeout(() => {
      setBooking((current) => ({
        ...current,
        status: BOOKING_STATUS.CANCELLED,
        cancelled_at: new Date().toISOString(),
      }));
      setPending(false);
      setNotice({ tone: 'info', text: 'Booking cancelled.' });
    }, 400);
  }

  const status = booking ? bookingStatusMeta(booking.status) : null;

  return (
    <aside className="booking-panel card card--padded" aria-label="Booking">
      <div className="booking-panel__row">
        <span className="text-muted">Your booking</span>
        {status ? (
          <span className={`badge badge--${status.variant}`}>{status.label}</span>
        ) : (
          <span className="badge badge--neutral">Not booked</span>
        )}
      </div>

      {event.points_value > 0 ? (
        <div className="booking-panel__row">
          <span className="text-muted">Attendance points</span>
          <span className="points-pill">+{event.points_value} pts</span>
        </div>
      ) : null}

      <div className="booking-panel__row">
        <span className="text-muted">Registration closes</span>
        <span>{formatDate(event.registration_deadline)}</span>
      </div>

      {active && booking.qr_token ? (
        <div className="qr-token">
          <p className="qr-token__label">Check-in token</p>
          <p className="qr-token__value">{booking.qr_token}</p>
        </div>
      ) : null}

      {notice ? (
        <p className={`notice notice--${notice.tone}`} role="status">
          {notice.text}
        </p>
      ) : null}

      <div className="booking-panel__actions">
        {canCancel ? (
          <Button
            variant="outline"
            block
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
          >
            {pending ? 'Cancelling…' : 'Cancel booking'}
          </Button>
        ) : active ? (
          <p className="text-muted">
            {booking.status === BOOKING_STATUS.ATTENDED
              ? 'You attended this event.'
              : 'This booking can no longer be changed.'}
          </p>
        ) : restricted ? (
          <>
            <Button variant="primary" block disabled>
              Booking restricted
            </Button>
            <p className="field__error">
              Your account is restricted from booking new events. See your{' '}
              <a href="/health">account health</a>.
            </p>
          </>
        ) : registrationClosed ? (
          <Button variant="primary" block disabled>
            Registration closed
          </Button>
        ) : (
          <Button variant="primary" block onClick={handleBook} disabled={pending}>
            <Icon name="ticket" size={18} />
            {pending ? 'Booking…' : 'Book this event'}
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        title="Cancel this booking?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Cancel booking
            </Button>
          </>
        }
      >
        <p>
          You will lose your place at <strong>{event.title}</strong>. You can book
          again while registration is still open.
        </p>
      </Modal>
    </aside>
  );
}
