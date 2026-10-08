'use client';

import { useActionState } from 'react';

import { selfCheckInAction } from '../../app/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/**
 * POST /api/user/checkin/self-scan — `self_scan` events only.
 *
 * A plain text field rather than a camera, same reasoning as the
 * organizer-side `CheckInScanner`: the venue QR literally encodes
 * `event.checkin_qr_token` (`EVMFU-EVT_…`), so pasting/typing it works too.
 * Only rendered when `event.checkin_mode === 'self_scan'` and the booking is
 * still `booked` — `staff_scan` events keep showing the attendee's own QR
 * for staff to scan instead (unchanged, see `BookingPanel`).
 */
export default function SelfCheckIn() {
  const [state, formAction, pending] = useActionState(selfCheckInAction, initialState);

  return (
    <form className="self-checkin" action={formAction}>
      <div className="field">
        <label className="field__label" htmlFor="venueToken">
          Scan venue QR
        </label>
        <input
          id="venueToken"
          name="venueToken"
          className="input"
          placeholder="EVMFU-EVT_…"
          autoComplete="off"
        />
        <p className="field__hint">
          This event checks attendees in by scanning a QR code posted at the
          venue. Scan it (or type the code) once you arrive to mark yourself
          attended and collect your points.
        </p>

        {state?.error ? (
          <p className="field__error" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.message ? (
          <p className="notice notice--success" role="status">
            {state.message}
          </p>
        ) : null}
      </div>

      <Button variant="primary" type="submit" block disabled={pending}>
        {pending ? 'Checking in…' : 'Check in'}
      </Button>
    </form>
  );
}
