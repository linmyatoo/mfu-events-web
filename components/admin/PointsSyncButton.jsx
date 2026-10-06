'use client';

import { useState, useTransition } from 'react';

import { runPointsSyncAction } from '../../app/admin/actions';
import Button from '../common/Button';

/**
 * POST /api/admin/points/sync — stub for the (not-yet-built) university
 * points API integration. Only marks rows as `synced`; never changes a
 * balance.
 */
export default function PointsSyncButton() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const outcome = await runPointsSyncAction();
      if (outcome?.error) setError(outcome.error);
      else setResult(outcome);
    });
  }

  return (
    <div className="stack">
      <Button variant="outline" size="sm" disabled={pending} onClick={run}>
        {pending ? 'Syncing…' : 'Run points sync'}
      </Button>
      {error ? (
        <p className="notice notice--info" role="status">
          {error}
        </p>
      ) : null}
      {result ? (
        <p className="notice notice--success" role="status">
          Synced {result.synced_count} transaction(s) (stub for the university API).
        </p>
      ) : null}
    </div>
  );
}
