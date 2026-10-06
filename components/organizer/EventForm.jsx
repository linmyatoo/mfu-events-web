'use client';

import { useActionState, useState } from 'react';

import { MEMBER_ROLE_LABELS, toLocalInput } from '../../lib/events';
import Button from '../common/Button';

const initialState = { error: null };

const AUDIENCE_OPTIONS = [
  { value: 'open', label: 'Open to everyone' },
  { value: 'school', label: 'One school only' },
  { value: 'year', label: 'One year group only' },
];

/**
 * Create / edit form for an Event draft.
 *
 * Only the fields `eventService.createEvent` and `updateEvent` accept from a
 * non-admin appear here. `is_point_event`, `organizer_points_base`, `status`
 * and `venue_id` are stripped server-side no matter what is posted, so they
 * are deliberately absent rather than shown disabled.
 */
export default function EventForm({
  action,
  event = null,
  organizers = [],
  venues = [],
  submitLabel = 'Save draft',
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [audience, setAudience] = useState(event?.audience_type ?? 'open');

  return (
    <form className="card card--padded stack" action={formAction}>
      {event ? <input type="hidden" name="eventId" value={event.id} /> : null}

      {organizers.length > 0 ? (
        <div className="field">
          <label className="field__label" htmlFor="organizerId">
            Hosted by
          </label>
          <select
            id="organizerId"
            name="organizerId"
            className="select"
            defaultValue={organizers[0]?.organizer_id}
            required
          >
            {organizers.map((membership) => (
              <option key={membership.id} value={membership.organizer_id}>
                {membership.organizer?.name} (
                {MEMBER_ROLE_LABELS[membership.role] ?? membership.role})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field">
        <label className="field__label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          className="input"
          defaultValue={event?.title ?? ''}
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
          defaultValue={event?.description ?? ''}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="category">
          Category
        </label>
        <input
          id="category"
          name="category"
          className="input"
          placeholder="Workshop, talk, social…"
          defaultValue={event?.category ?? ''}
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
          defaultValue={toLocalInput(event?.start_time)}
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
          defaultValue={toLocalInput(event?.end_time)}
          required
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="registration_deadline">
          Registration closes
        </label>
        <input
          id="registration_deadline"
          name="registration_deadline"
          type="datetime-local"
          className="input"
          defaultValue={toLocalInput(event?.registration_deadline)}
        />
        <p className="field__hint">Defaults to the start time if left empty.</p>
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
          defaultValue={event?.capacity ?? 50}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="expected_participants">
          Expected participants
        </label>
        <input
          id="expected_participants"
          name="expected_participants"
          type="number"
          min="1"
          className="input"
          defaultValue={event?.expected_participants ?? ''}
        />
        <p className="field__hint">
          Admin matches this against venue capacity when assigning a room.
        </p>
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
            defaultValue={event?.target_school ?? ''}
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
            defaultValue={event?.target_year ?? ''}
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
          defaultValue={event?.venue_preference ?? ''}
        />
        <p className="field__hint">
          A request, not a booking — an admin assigns the actual room.
        </p>
      </div>

      {venues.length > 0 ? (
        <div className="field">
          <label className="field__label" htmlFor="requested_venue_id">
            Requested venue
          </label>
          <select
            id="requested_venue_id"
            name="requested_venue_id"
            className="select"
            defaultValue={event?.requested_venue_id ?? ''}
          >
            <option value="">No specific venue — let admin pick</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id} disabled={venue.available === false}>
                {venue.name} — capacity {venue.capacity}
                {[venue.building, venue.location].filter(Boolean).length
                  ? ` · ${[venue.building, venue.location].filter(Boolean).join(', ')}`
                  : ''}
                {venue.available === false ? ' (unavailable for this time)' : ''}
              </option>
            ))}
          </select>
          <p className="field__hint">
            An admin still makes the final assignment — this just flags the room you want.
          </p>
        </div>
      ) : null}

      <div className="field">
        <label className="field__label" htmlFor="requirements">
          Requirements
        </label>
        <textarea
          id="requirements"
          name="requirements"
          className="textarea"
          defaultValue={event?.requirements ?? ''}
        />
      </div>

      {state?.error ? (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
