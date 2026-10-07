'use client';

import { useActionState, useState, useTransition } from 'react';

import {
  addOrganizerMemberAction,
  organizerDecisionAction,
  removeOrganizerMemberAction,
  updateOrganizerMemberAction,
} from '../../app/admin/actions';
import { searchUsersAction } from '../../app/organizer/actions';
import { MEMBER_ROLE_LABELS, initialsOf } from '../../lib/events';
import Button from '../common/Button';

const initialState = { error: null, message: null };

const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'president', label: 'President' },
  { value: 'event_manager', label: 'Event manager' },
  { value: 'member', label: 'Member' },
];

/**
 * Membership of an Organizer entity — who belongs to the club, and with what
 * standing. Distinct from the per-event team; only owner, president and
 * event_manager may create events for it.
 */
export default function OrganizerMembers({ organizer, members }) {
  const [state, formAction, adding] = useActionState(addOrganizerMemberAction, initialState);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function search(value) {
    setQuery(value);
    setPicked(null);
    startTransition(async () => {
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
    <>
      {organizer.status === 'pending' ? (
        <section className="page-section">
          <div className="card card--padded stack">
            <p>
              This organizer is awaiting verification. Approving it lets its
              members create events.
            </p>
            <div className="booking-panel__row">
              <Button
                variant="primary"
                size="sm"
                disabled={pending}
                onClick={() => run(() => organizerDecisionAction(organizer.id, 'approve'))}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={() => run(() => organizerDecisionAction(organizer.id, 'reject'))}
              >
                Reject
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="page-section" aria-labelledby="members-heading">
        <h2 className="section-title" id="members-heading">
          Members ({members.length})
        </h2>

        {error ? (
          <p className="notice notice--danger" role="status">
            {error}
          </p>
        ) : null}

        <ul className="stack">
          {members.map((member) => (
            <li className="card card--padded" key={member.id}>
              <div className="organizer">
                <span className="organizer__avatar" aria-hidden="true">
                  {initialsOf(member.user?.name ?? '')}
                </span>
                <span>
                  <span className="organizer__name">
                    {member.user?.name ?? 'Unknown'}
                  </span>
                  <span className="organizer__role text-muted">
                    {member.user?.email} ·{' '}
                    {MEMBER_ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </span>
              </div>

              <div className="booking-panel__row">
                <label className="visually-hidden" htmlFor={`m-${member.user_id}`}>
                  Role
                </label>
                <select
                  id={`m-${member.user_id}`}
                  className="select"
                  value={member.role}
                  disabled={pending}
                  onChange={(changeEvent) =>
                    run(() =>
                      updateOrganizerMemberAction(
                        organizer.id,
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
                    run(() => removeOrganizerMemberAction(organizer.id, member.user_id))
                  }
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <form className="card card--padded qa-form" action={formAction}>
          <input type="hidden" name="orgId" value={organizer.id} />
          <input type="hidden" name="userId" value={picked?.id ?? ''} />

          <div className="field">
            <label className="field__label" htmlFor="member-search">
              Add a member
            </label>
            <input
              id="member-search"
              className="input"
              value={picked ? `${picked.name} (${picked.email})` : query}
              onChange={(changeEvent) => search(changeEvent.target.value)}
              placeholder="Search by name or email"
              autoComplete="off"
            />
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
            <label className="field__label" htmlFor="member-role">
              Role
            </label>
            <select id="member-role" name="role" className="select" defaultValue="member">
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
            {adding ? 'Adding…' : 'Add member'}
          </Button>
        </form>
      </section>
    </>
  );
}
