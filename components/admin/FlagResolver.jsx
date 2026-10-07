'use client';

import { useState, useTransition } from 'react';

import {
  resolveHealthFlagAction,
  resolveOrganizerFlagAction,
} from '../../app/admin/actions';
import Button from '../common/Button';

/**
 * Resolving a flag is what actually changes an account — nothing is automatic.
 *
 * Organizer flags: dismiss | warn | suspend | deactivate.
 * Health flags:    dismiss | warn | restrict (sets `booking_restricted`).
 * `warn` records the decision without touching the account.
 */
const ORGANIZER_ACTIONS = [
  { value: 'dismiss', label: 'Dismiss', variant: 'outline' },
  { value: 'warn', label: 'Warn', variant: 'outline' },
  { value: 'suspend', label: 'Suspend', variant: 'danger' },
  { value: 'deactivate', label: 'Deactivate', variant: 'danger' },
];

const HEALTH_ACTIONS = [
  { value: 'dismiss', label: 'Dismiss', variant: 'outline' },
  { value: 'warn', label: 'Warn', variant: 'outline' },
  { value: 'restrict', label: 'Restrict booking', variant: 'danger' },
];

export default function FlagResolver({ flagId, kind }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const actions = kind === 'organizer' ? ORGANIZER_ACTIONS : HEALTH_ACTIONS;

  function run(action) {
    setError(null);
    startTransition(async () => {
      const result =
        kind === 'organizer'
          ? await resolveOrganizerFlagAction(flagId, action)
          : await resolveHealthFlagAction(flagId, action);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      {error ? (
        <p className="notice notice--danger" role="status">
          {error}
        </p>
      ) : null}

      <div className="booking-panel__row">
        {actions.map((action) => (
          <Button
            key={action.value}
            variant={action.variant}
            size="sm"
            disabled={pending}
            onClick={() => run(action.value)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </>
  );
}
