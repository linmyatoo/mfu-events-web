'use client';

import { useState, useTransition } from 'react';

import { resolveItemRequestAction } from '../../app/admin/actions';
import Button from '../common/Button';

const STATUS_META = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

/** Allocate or refuse the equipment an organizer asked for. */
export default function ItemRequestReview({ requests, eventId }) {
  const [amounts, setAmounts] = useState({});
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function run(action) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  if (requests.length === 0) {
    return (
      <section className="page-section">
        <h2 className="section-title">Equipment requests</h2>
        <p className="text-muted">The organizer has not requested any equipment.</p>
      </section>
    );
  }

  return (
    <section className="page-section" aria-labelledby="item-requests-heading">
      <h2 className="section-title" id="item-requests-heading">
        Equipment requests
      </h2>

      {error ? (
        <p className="notice notice--danger" role="status">
          {error}
        </p>
      ) : null}

      <ul className="stack">
        {requests.map((request) => {
          const meta = STATUS_META[request.status] ?? {
            label: request.status,
            variant: 'neutral',
          };
          const open = request.status === 'pending';
          const amount = amounts[request.id] ?? request.quantity_requested;

          return (
            <li className="card card--padded" key={request.id}>
              <div className="event-card__heading">
                <h3 className="event-card__title">
                  {request.item?.name ?? request.item_id}
                </h3>
                <span className={`badge badge--${meta.variant}`}>{meta.label}</span>
              </div>

              <p className="event-card__meta">
                Asked for {request.quantity_requested}
                {request.item ? ` · ${request.item.available_quantity} in stock` : ''}
                {request.quantity_allocated != null
                  ? ` · allocated ${request.quantity_allocated}`
                  : ''}
              </p>

              {open ? (
                <div className="booking-panel__row">
                  <label className="visually-hidden" htmlFor={`alloc-${request.id}`}>
                    Quantity to allocate
                  </label>
                  <input
                    id={`alloc-${request.id}`}
                    type="number"
                    min="1"
                    className="input"
                    value={amount}
                    onChange={(changeEvent) =>
                      setAmounts((current) => ({
                        ...current,
                        [request.id]: Number(changeEvent.target.value),
                      }))
                    }
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        resolveItemRequestAction(request.id, 'approve', amount, eventId)
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        resolveItemRequestAction(request.id, 'reject', null, eventId)
                      )
                    }
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
