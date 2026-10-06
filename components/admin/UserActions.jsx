'use client';

import { useState, useTransition } from 'react';

import { userStatusAction } from '../../app/admin/actions';
import Button from '../common/Button';

/**
 * Suspend / reinstate / deactivate.
 *
 * `userService.setStatus` refuses to touch another admin, and a deactivated
 * account cannot authenticate at all — so the buttons shown follow the
 * account's current status rather than offering every verb every time.
 */
export default function UserActions({ user }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function run(step) {
    setError(null);
    startTransition(async () => {
      const result = await userStatusAction(user.id, step);
      if (result?.error) setError(result.error);
    });
  }

  if (user.role === 'admin') {
    return <p className="text-muted">Admin accounts cannot be changed here.</p>;
  }

  return (
    <>
      {error ? (
        <p className="notice notice--info" role="status">
          {error}
        </p>
      ) : null}

      <div className="booking-panel__row">
        {user.status !== 'active' ? (
          <Button
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => run('reinstate')}
          >
            Reinstate
          </Button>
        ) : null}

        {user.status === 'active' ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run('suspend')}
          >
            Suspend
          </Button>
        ) : null}

        {user.status !== 'deactivated' ? (
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => run('deactivate')}
          >
            Deactivate
          </Button>
        ) : null}
      </div>
    </>
  );
}
