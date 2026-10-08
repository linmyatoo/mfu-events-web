'use client';

import { useActionState } from 'react';

import { createOrganizerAction } from '../../app/admin/actions';
import { ORGANIZER_TYPE_LABELS } from '../../lib/events';
import Button from '../common/Button';

const initialState = { error: null };

/**
 * POST /api/admin/organizers — the admin-direct alias of
 * POST /api/admin/organizations that creates the org already `active`
 * (skips the normal pending → active step).
 */
export default function NewOrganizerForm() {
  const [state, formAction, pending] = useActionState(createOrganizerAction, initialState);

  return (
    <form className="card card--padded qa-form" action={formAction}>
      <div className="field">
        <label className="field__label" htmlFor="org-name">
          Name
        </label>
        <input id="org-name" name="name" className="input" required />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="org-type">
          Type
        </label>
        <select id="org-type" name="type" className="select" defaultValue="student_club">
          {Object.entries(ORGANIZER_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="org-description">
          Description
        </label>
        <textarea id="org-description" name="description" className="textarea" />
      </div>

      {state?.error ? <p className="field__error">{state.error}</p> : null}

      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create organizer'}
      </Button>
    </form>
  );
}
