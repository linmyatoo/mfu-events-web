'use client';

import { useActionState, useState, useTransition } from 'react';

import {
  addContributorAction,
  removeContributorAction,
  searchUsersAction,
} from '../../app/organizer/actions';
import { initialsOf } from '../../lib/events';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/**
 * Contributors (EventContributor) — a team tier below full organizer with a
 * free-text position_title instead of a fixed role. Only a Main Organizer
 * may manage them (same gate as TeamManager's canManage). No change-role
 * action exists for contributors — add/remove only, per the backend's API
 * surface (no PATCH route).
 */
export default function ContributorsManager({ event, contributors, canManage }) {
  const [state, formAction, adding] = useActionState(addContributorAction, initialState);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [positionTitle, setPositionTitle] = useState('');
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
    <section className="page-section" aria-labelledby="contributors-heading">
      <h2 className="section-title" id="contributors-heading">
        Contributors ({contributors.length})
      </h2>

      {error ? (
        <p className="notice notice--danger" role="status">
          {error}
        </p>
      ) : null}

      {contributors.length === 0 ? (
        <p className="text-muted">No contributors added yet.</p>
      ) : (
        <ul className="stack">
          {contributors.map((contributor) => (
            <li className="card card--padded" key={contributor.id ?? contributor.user_id}>
              <div className="organizer">
                <span className="organizer__avatar" aria-hidden="true">
                  {initialsOf(contributor.name ?? '')}
                </span>
                <span>
                  <span className="organizer__name">{contributor.name}</span>
                  <span className="organizer__role text-muted">
                    {contributor.position_title}
                  </span>
                </span>
              </div>

              {canManage ? (
                <div className="booking-panel__row">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => removeContributorAction(event.id, contributor.user_id))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form className="card card--padded qa-form" action={formAction}>
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="userId" value={picked?.id ?? ''} />

          <div className="field">
            <label className="field__label" htmlFor="contributor-search">
              Add someone
            </label>
            <input
              id="contributor-search"
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
            <label className="field__label" htmlFor="contributor-position">
              Position title
            </label>
            <input
              id="contributor-position"
              name="positionTitle"
              className="input"
              value={positionTitle}
              onChange={(changeEvent) => setPositionTitle(changeEvent.target.value)}
              placeholder="e.g. Stage Crew, Photographer"
            />
          </div>

          {state?.error ? <p className="field__error">{state.error}</p> : null}
          {state?.message ? (
            <p className="notice notice--success" role="status">
              {state.message}
            </p>
          ) : null}

          <Button variant="primary" type="submit" disabled={adding || !picked}>
            {adding ? 'Adding…' : 'Add contributor'}
          </Button>
        </form>
      ) : (
        <p className="text-muted">Only a Main Organizer can manage contributors.</p>
      )}
    </section>
  );
}
