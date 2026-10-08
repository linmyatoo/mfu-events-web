'use client';

import { useState, useTransition } from 'react';

import { bookEventAction, cancelBookingAction } from '../../app/actions';
import {
  BOOKING_STATUS,
  CHECKIN_MODE,
  bookingBlockedReason,
  bookingStatusMeta,
  formatDate,
} from '../../lib/events';
import SelfCheckIn from '../bookings/SelfCheckIn';
import Button from '../common/Button';
import Icon from '../common/Icon';
import Modal from '../common/Modal';

/**
 * Book / cancel panel — POST /api/user/events/:id/book and
 * POST /api/user/bookings/:id/cancel.
 *
 * The disabled states mirror the guards in bookingService so the common
 * rejections never need a round trip; anything the client cannot know
 * (capacity, audience) still comes back from the server as an error message.
 */
export default function BookingPanel({ event, user }) {
  const booking = event.myBooking;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [pending, startTransition] = useTransition();

  const blockedReason = bookingBlockedReason(event, user);
  const active = booking && booking.status !== BOOKING_STATUS.CANCELLED;
  const canCancel = booking?.status === BOOKING_STATUS.BOOKED;
  const isSelfScan = event.checkin_mode === CHECKIN_MODE.SELF_SCAN;

  function run(action) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      setNotice(
        result.error
          ? { tone: 'info', text: result.error }
          : { tone: 'success', text: result.message }
      );
    });
  }

  function handleBook() {
    run(async () => {
      const result = await bookEventAction(event.id);
      return result.error
        ? result
        : { message: 'Booked. Show your check-in token on the day.' };
    });
  }

  function handleCancel() {
    setConfirmOpen(false);
    run(async () => {
      const result = await cancelBookingAction(booking.id, event.id);
      return result.error ? result : { message: 'Booking cancelled.' };
    });
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

      {active && booking.qr_token && !isSelfScan ? (
        <div className="qr-token">
          <p className="qr-token__label">Check-in token</p>
          <p className="qr-token__value">{booking.qr_token}</p>
        </div>
      ) : null}

      {isSelfScan && booking?.status === BOOKING_STATUS.BOOKED ? (
        <SelfCheckIn />
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
            {pending ? 'Working…' : 'Cancel booking'}
          </Button>
        ) : active ? (
          <p className="text-muted">
            {booking.status === BOOKING_STATUS.ATTENDED
              ? 'You attended this event.'
              : 'This booking can no longer be changed.'}
          </p>
        ) : blockedReason ? (
          <>
            <Button variant="primary" block disabled>
              Booking unavailable
            </Button>
            <p className="field__error">
              {blockedReason}
              {user.booking_restricted ? (
                <>
                  {' '}
                  See your <a href="/health">account health</a>.
                </>
              ) : null}
            </p>
          </>
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
