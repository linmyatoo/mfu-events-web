'use client';

import { useActionState } from 'react';

import { checkInByTokenAction } from '../../app/organizer/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/**
 * POST /api/organizer/checkin/scan.
 *
 * A plain text field rather than a camera: `Booking.qr_token` is the literal
 * string the QR encodes, and the backend resolves the event from it, so any
 * handheld scanner that types the code works here too.
 */
export default function CheckInScanner() {
  const [state, formAction, pending] = useActionState(checkInByTokenAction, initialState);

  return (
    <form className="card card--padded qa-form" action={formAction}>
      <div className="field">
        <label className="field__label" htmlFor="qrToken">
          Check-in token
        </label>
        <input
          id="qrToken"
          name="qrToken"
          className="input"
          placeholder="EVMFU-…"
          autoComplete="off"
          autoFocus
        />
        <p className="field__hint">
          Scan the attendee&apos;s QR or type the code. Checking someone in
          awards their attendance points immediately.
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

      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? 'Checking in…' : 'Check in'}
      </Button>
    </form>
  );
}
