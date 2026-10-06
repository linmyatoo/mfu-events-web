'use client';

import { useActionState } from 'react';

import { saveVenueAction } from '../../app/admin/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/** POST /api/admin/venues, or PATCH when `venue` is supplied. */
export default function VenueForm({ venue = null }) {
  const [state, formAction, pending] = useActionState(saveVenueAction, initialState);
  const id = venue?.id ?? 'new';

  return (
    <form className="card card--padded qa-form" action={formAction}>
      {venue ? <input type="hidden" name="venueId" value={venue.id} /> : null}

      <div className="field">
        <label className="field__label" htmlFor={`v-name-${id}`}>
          Name
        </label>
        <input
          id={`v-name-${id}`}
          name="name"
          className="input"
          defaultValue={venue?.name ?? ''}
          required
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`v-building-${id}`}>
          Building
        </label>
        <input
          id={`v-building-${id}`}
          name="building"
          className="input"
          defaultValue={venue?.building ?? ''}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`v-location-${id}`}>
          Location
        </label>
        <input
          id={`v-location-${id}`}
          name="location"
          className="input"
          defaultValue={venue?.location ?? ''}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`v-capacity-${id}`}>
          Capacity
        </label>
        <input
          id={`v-capacity-${id}`}
          name="capacity"
          type="number"
          min="1"
          className="input"
          defaultValue={venue?.capacity ?? ''}
          required
        />
        <p className="field__hint">
          Assignment is refused when this is below an event&apos;s expected
          participants.
        </p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`v-equipment-${id}`}>
          Equipment
        </label>
        <input
          id={`v-equipment-${id}`}
          name="equipment"
          className="input"
          placeholder="projector, whiteboard, wifi"
          defaultValue={(venue?.equipment ?? []).join(', ')}
        />
        <p className="field__hint">Comma separated.</p>
      </div>

      {venue ? (
        <div className="field">
          <label className="field__label" htmlFor={`v-status-${id}`}>
            Status
          </label>
          <select
            id={`v-status-${id}`}
            name="status"
            className="select"
            defaultValue={venue.status}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      ) : null}

      {state?.error ? <p className="field__error">{state.error}</p> : null}
      {state?.message ? (
        <p className="notice notice--success" role="status">
          {state.message}
        </p>
      ) : null}

      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? 'Saving…' : venue ? 'Save venue' : 'Create venue'}
      </Button>
    </form>
  );
}
