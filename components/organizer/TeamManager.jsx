'use client';

import { useActionState, useState, useTransition } from 'react';

import {
  addTeamMemberAction,
  changeTeamRoleAction,
  removeTeamMemberAction,
  searchUsersAction,
} from '../../app/organizer/actions';
import { ORGANIZER_ROLE_LABELS, initialsOf } from '../../lib/events';
import Button from '../common/Button';

const initialState = { error: null, message: null };

const ROLES = [
  { value: 'main_organizer', label: 'Main organizer' },
  { value: 'co_organizer', label: 'Co-organizer' },
  { value: 'checkin_staff', label: 'Check-in staff' },
];

/**
 * The per-event team (EventOrganizer), not membership of the Organizer entity.
 *
 * Only a Main Organizer may change it, and the backend answers 409 once an
 * event is completed or cancelled.
 */
export default function TeamManager({ event, team, canManage }) {
  const [state, formAction, adding] = useActionState(addTeamMemberAction, initialState);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const [searching, startSearch] = useTransition();

  function search(value) {
    setQuery(value);
    setPicked(null);
    startSearch(async () => {
      const result = await searchUsersAction(value);
      setResults(result.users ?? []);
    });
  }

  function run(action) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section className="page-section" aria-labelledby="team-heading">
      <h2 className="section-title" id="team-heading">
        Event team ({team.length})
      </h2>

      {error ? (
        <p className="notice notice--info" role="status">
          {error}
        </p>
      ) : null}

      <ul className="stack">
        {team.map((member) => (
          <li className="card card--padded" key={member.id ?? member.user_id}>
            <div className="organizer">
              <span className="organizer__avatar" aria-hidden="true">
                {initialsOf(member.name ?? '')}
              </span>
              <span>
                <span className="organizer__name">{member.name}</span>
                <span className="organizer__role text-muted">
                  {ORGANIZER_ROLE_LABELS[member.role] ?? member.role}
                </span>
              </span>
            </div>

            {canManage ? (
              <div className="booking-panel__row">
                <label className="visually-hidden" htmlFor={`role-${member.user_id}`}>
                  Role for {member.name}
                </label>
                <select
                  id={`role-${member.user_id}`}
                  className="select"
                  value={member.role}
                  disabled={pending}
                  onChange={(changeEvent) =>
                    run(() =>
                      changeTeamRoleAction(
                        event.id,
                        member.user_id,
                        changeEvent.target.value
                      )
                    )
                  }
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() => removeTeamMemberAction(event.id, member.user_id))
                  }
                >
                  Remove
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {canManage ? (
        <form className="card card--padded qa-form" action={formAction}>
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="userId" value={picked?.id ?? ''} />

          <div className="field">
            <label className="field__label" htmlFor="team-search">
              Add someone
            </label>
            <input
              id="team-search"
              className="input"
              value={picked ? `${picked.name} (${picked.email})` : query}
              onChange={(changeEvent) => search(changeEvent.target.value)}
              placeholder="Search by name or email"
              autoComplete="off"
            />
            <p className="field__hint">
              {searching
                ? 'Searching…'
                : 'Type at least two characters. Anyone with an account can be added.'}
            </p>
          </div>

          {!picked && results.length > 0 ? (
            <ul className="stack">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="settings-tile"
                    onClick={() => {
                      setPicked(user);
                      setResults([]);
                    }}
                  >
                    <span className="settings-tile__icon" aria-hidden="true">
                      {initialsOf(user.name)}
                    </span>
                    <span>
                      {user.name}
                      <span className="text-muted"> · {user.email}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="field">
            <label className="field__label" htmlFor="team-role">
              Role
            </label>
            <select id="team-role" name="role" className="select" defaultValue="co_organizer">
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {state?.error ? <p className="field__error">{state.error}</p> : null}
          {state?.message ? (
            <p className="notice notice--success" role="status">
              {state.message}
            </p>
          ) : null}

          <Button variant="primary" type="submit" disabled={adding || !picked}>
            {adding ? 'Adding…' : 'Add to team'}
          </Button>
        </form>
      ) : (
        <p className="text-muted">Only a Main Organizer can change the team.</p>
      )}
    </section>
  );
}
