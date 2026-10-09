'use client';

import { useActionState, useState } from 'react';

import { createPointEventAction } from '../../app/admin/actions';
import Button from '../common/Button';

const initialState = { error: null };

const ORGANIZER_ROLES = [
  { value: 'main_organizer', label: 'Main organizer' },
  { value: 'co_organizer', label: 'Co-organizer' },
  { value: 'checkin_staff', label: 'Check-in staff' },
];

/**
 * Admin-only point event creation. `is_point_event` / `organizer_points_base`
 * are set server-side in the action — eventService.createEvent throws 403 if
 * either is set by a non-Admin actor, so organizers can never propose their
 * own points (design doc Section 9).
 *
 * Main gets the full base amount, Co-Organizer 50%, Check-in Staff 15% — see
 * ORGANIZER_ROLE_WEIGHTS in the backend's constants.js.
 */
export default function PointEventForm({ users }) {
  const [state, formAction, pending] = useActionState(createPointEventAction, initialState);
  const [rows, setRows] = useState([{ userId: users[0]?.id ?? '', role: 'main_organizer' }]);

  function updateRow(index, patch) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setRows((current) => [...current, { userId: users[0]?.id ?? '', role: 'co_organizer' }]);
  }
  function removeRow(index) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  return (
    <form className="card card--padded stack" action={formAction}>
      <div className="field">
        <label className="field__label" htmlFor="title">
          Title
        </label>
        <input id="title" name="title" className="input" required />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="description">
          Description
        </label>
        <textarea id="description" name="description" className="textarea" />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="start_time">
          Starts
        </label>
        <input id="start_time" name="start_time" type="datetime-local" className="input" required />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="end_time">
          Ends
        </label>
        <input id="end_time" name="end_time" type="datetime-local" className="input" required />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="capacity">
          Capacity
        </label>
        <input id="capacity" name="capacity" type="number" min="1" className="input" defaultValue={50} />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="organizer_points_base">
          Organizer points pool (base)
        </label>
        <input
          id="organizer_points_base"
          name="organizer_points_base"
          type="number"
          min="0"
          className="input"
          defaultValue={100}
        />
      </div>

      <fieldset className="field">
        <legend className="field__label">Organizing team</legend>
        <div className="organizer-rows">
          {rows.map((row, index) => (
            <div className="organizer-row" key={index}>
              <label className="visually-hidden" htmlFor={`organizer-user-${index}`}>
                Organizer
              </label>
              <select
                id={`organizer-user-${index}`}
                name="organizer_user_id"
                className="select"
                value={row.userId}
                onChange={(e) => updateRow(index, { userId: e.target.value })}
              >
                <option value="">Choose a person…</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>

              <label className="visually-hidden" htmlFor={`organizer-role-${index}`}>
                Role
              </label>
              <select
                id={`organizer-role-${index}`}
                name="organizer_role"
                className="select"
                value={row.role}
                onChange={(e) => updateRow(index, { role: e.target.value })}
              >
                {ORGANIZER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              {rows.length > 1 ? (
                <Button variant="outline" size="sm" type="button" onClick={() => removeRow(index)}>
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" type="button" onClick={addRow}>
          + Add organizer
        </Button>
      </fieldset>

      {state?.error ? (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create point event'}
      </Button>
    </form>
  );
}
