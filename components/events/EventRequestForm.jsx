'use client';

import { useActionState, useState } from 'react';

import {
  CHECKIN_MODE,
  CHECKIN_MODE_LABELS,
  MEMBER_ROLE_LABELS,
  toLocalInput,
} from '../../lib/events';
import Button from '../common/Button';

const initialState = { error: null };

const AUDIENCE_OPTIONS = [
  { value: 'open', label: 'Open to everyone' },
  { value: 'school', label: 'One school only' },
  { value: 'year', label: 'One year group only' },
];

const CHECKIN_MODE_OPTIONS = [
  { value: CHECKIN_MODE.STAFF_SCAN, label: CHECKIN_MODE_LABELS.staff_scan },
  { value: CHECKIN_MODE.SELF_SCAN, label: CHECKIN_MODE_LABELS.self_scan },
];

/**
 * Create / resubmit form for an EventRequest.
 *
 * `org_id` is required on creation but **read-only on resubmit** —
 * `eventRequestService.resubmitRequest` doesn't re-validate membership, so
 * this form never gives a way to silently swap the org (see Phase 12 notes).
 * When `request` is set (resubmit mode) the org renders as plain text, not
 * an editable picker, and no `org_id` field is submitted at all.
 *
 * Only the fields `eventRequestService.createRequest` accepts appear here.
 */
export default function EventRequestForm({
  action,
  request = null,
  organizers = [],
  orgName = null,
  submitLabel = 'Submit request',
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [audience, setAudience] = useState(request?.audience_type ?? 'open');

  return (
    <form className="card card--padded stack" action={formAction}>
      {request ? <input type="hidden" name="requestId" value={request.id} /> : null}

      {request ? (
        <div className="field">
          <span className="field__label">Requested for</span>
          <p>{orgName}</p>
          <p className="field__hint">
            The organization can&apos;t be changed on resubmit — contact an
            admin if this needs to change.
          </p>
        </div>
      ) : (
        <div className="field">
          <label className="field__label" htmlFor="org_id">
            Requested for
          </label>
          <select
            id="org_id"
            name="org_id"
            className="select"
            defaultValue={organizers[0]?.org_id}
            required
          >
            {organizers.map((membership) => (
              <option key={membership.id} value={membership.org_id}>
                {membership.org?.name} (
                {MEMBER_ROLE_LABELS[membership.role] ?? membership.role})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          className="input"
          defaultValue={request?.title ?? ''}
          required
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="textarea"
          defaultValue={request?.description ?? ''}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="agenda">
          Agenda
        </label>
        <textarea
          id="agenda"
          name="agenda"
          className="textarea"
          placeholder="Rough run of show"
          defaultValue={request?.agenda ?? ''}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="start_time">
          Starts
        </label>
        <input
          id="start_time"
          name="start_time"
          type="datetime-local"
          className="input"
          defaultValue={toLocalInput(request?.start_time)}
          required
        />
        <p className="field__hint">All times are university time (Asia/Bangkok).</p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="end_time">
          Ends
        </label>
        <input
          id="end_time"
          name="end_time"
          type="datetime-local"
          className="input"
          defaultValue={toLocalInput(request?.end_time)}
          required
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="capacity">
          Capacity
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min="1"
          className="input"
          defaultValue={request?.capacity ?? 50}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="audience_type">
          Who can attend
        </label>
        <select
          id="audience_type"
          name="audience_type"
          className="select"
          value={audience}
          onChange={(changeEvent) => setAudience(changeEvent.target.value)}
        >
          {AUDIENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {audience === 'school' ? (
        <div className="field">
          <label className="field__label" htmlFor="target_school">
            School
          </label>
          <input
            id="target_school"
            name="target_school"
            className="input"
            placeholder="School of Computing"
            defaultValue={request?.target_school ?? ''}
          />
          <p className="field__hint">
            Must match the value on student records exactly.
          </p>
        </div>
      ) : null}

      {audience === 'year' ? (
        <div className="field">
          <label className="field__label" htmlFor="target_year">
            Year group
          </label>
          <input
            id="target_year"
            name="target_year"
            className="input"
            placeholder="Year 3"
            defaultValue={request?.target_year ?? ''}
          />
        </div>
      ) : null}

      <div className="field">
        <label className="field__label" htmlFor="venue_preference">
          Venue preference
        </label>
        <input
          id="venue_preference"
          name="venue_preference"
          className="input"
          placeholder="Somewhere with a projector"
          defaultValue={request?.venue_preference ?? ''}
        />
        <p className="field__hint">
          A request, not a booking — an admin assigns the actual room if this
          becomes an event.
        </p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="equipment_needs">
          Equipment needs
        </label>
        <textarea
          id="equipment_needs"
          name="equipment_needs"
          className="textarea"
          placeholder="Projector, microphones, tables…"
          defaultValue={request?.equipment_needs ?? ''}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="contact_phone">
          Contact phone
        </label>
        <input
          id="contact_phone"
          name="contact_phone"
          className="input"
          defaultValue={request?.contact_phone ?? ''}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="points_value">
          Points value
        </label>
        <input
          id="points_value"
          name="points_value"
          type="number"
          min="0"
          className="input"
          defaultValue={request?.points_value ?? 0}
        />
        <p className="field__hint">
          Suggested attendance points — an admin can change this when
          approving.
        </p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="checkin_mode">
          Check-in method
        </label>
        <select
          id="checkin_mode"
          name="checkin_mode"
          className="select"
          defaultValue={request?.checkin_mode ?? CHECKIN_MODE.STAFF_SCAN}
        >
          {CHECKIN_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="field__hint">
          Self-scan generates a venue QR attendees scan themselves instead of
          showing their booking QR to staff.
        </p>
      </div>

      {state?.error ? (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? 'Submitting…' : submitLabel}
      </Button>
    </form>
  );
}
