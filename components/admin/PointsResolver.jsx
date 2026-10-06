'use client';

import { useState, useTransition } from 'react';

import { resolvePointsAction } from '../../app/admin/actions';
import Button from '../common/Button';

/**
 * Resolving a proposal is what actually credits (or clears) organizer points —
 * `proposeOrganizerPoints` only ever creates a `pending` row, never a
 * `approved`/`adjusted` one (design doc Section 9).
 */
export default function PointsResolver({ transactionId, defaultAmount }) {
  const [error, setError] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [amount, setAmount] = useState(defaultAmount);
  const [pending, startTransition] = useTransition();

  function run(action, adjustedAmount) {
    setError(null);
    startTransition(async () => {
      const result = await resolvePointsAction(transactionId, action, adjustedAmount);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      {error ? (
        <p className="notice notice--info" role="status">
          {error}
        </p>
      ) : null}

      <div className="booking-panel__row">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run('approve')}>
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setAdjusting((s) => !s)}
        >
          Adjust…
        </Button>
        <Button variant="danger" size="sm" disabled={pending} onClick={() => run('reject')}>
          Reject
        </Button>
      </div>

      {adjusting ? (
        <form
          className="booking-panel__row"
          onSubmit={(e) => {
            e.preventDefault();
            run('adjust', Number(amount));
          }}
        >
          <label className="visually-hidden" htmlFor={`adjust-${transactionId}`}>
            Adjusted amount
          </label>
          <input
            id={`adjust-${transactionId}`}
            className="input"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button variant="primary" size="sm" type="submit" disabled={pending}>
            Save adjusted amount
          </Button>
        </form>
      ) : null}
    </>
  );
}
