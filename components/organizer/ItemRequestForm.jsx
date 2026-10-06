'use client';

import { useActionState } from 'react';

import { saveItemRequestsAction } from '../../app/organizer/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

const REQUEST_STATUS_META = {
  pending: { label: 'Awaiting admin', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

/**
 * Equipment requested for an event.
 *
 * `PUT /api/organizer/events/:id/item-requests` replaces every *pending* row,
 * so the form always posts the full list. Already-resolved rows are shown
 * read-only because the backend leaves them untouched.
 */
export default function ItemRequestForm({ eventId, items, requests, canEdit }) {
  const [state, formAction, pending] = useActionState(saveItemRequestsAction, initialState);

  const resolved = requests.filter((request) => request.status !== 'pending');
  const pendingByItem = Object.fromEntries(
    requests
      .filter((request) => request.status === 'pending')
      .map((request) => [request.item_id, request.quantity_requested])
  );

  return (
    <section className="page-section" aria-labelledby="items-heading">
      <h2 className="section-title" id="items-heading">
        Equipment requests
      </h2>

      {resolved.length > 0 ? (
        <ul className="stack">
          {resolved.map((request) => {
            const meta = REQUEST_STATUS_META[request.status] ?? {
              label: request.status,
              variant: 'neutral',
            };
            return (
              <li className="card card--padded" key={request.id}>
                <div className="event-card__heading">
                  <h3 className="event-card__title">
                    {request.item?.name ?? request.item_id}
                  </h3>
                  <span className={`badge badge--${meta.variant}`}>{meta.label}</span>
                </div>
                <p className="event-card__meta">
                  Requested {request.quantity_requested}
                  {request.quantity_allocated != null
                    ? ` · allocated ${request.quantity_allocated}`
                    : ''}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}

      {canEdit ? (
        <form className="card card--padded qa-form" action={formAction}>
          <input type="hidden" name="eventId" value={eventId} />

          <p className="field__hint">
            Set a quantity to request an item, or zero to withdraw it. Saving
            replaces every pending request for this event.
          </p>

          {items.map((item) => (
            <div className="field" key={item.id}>
              <label className="field__label" htmlFor={`qty-${item.id}`}>
                {item.name}
                <span className="text-muted"> · {item.available_quantity} free</span>
              </label>
              <input
                id={`qty-${item.id}`}
                name={`qty:${item.id}`}
                type="number"
                min="0"
                max={item.total_quantity}
                className="input"
                defaultValue={pendingByItem[item.id] ?? 0}
              />
            </div>
          ))}

          {state?.error ? <p className="field__error">{state.error}</p> : null}
          {state?.message ? (
            <p className="notice notice--success" role="status">
              {state.message}
            </p>
          ) : null}

          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save requests'}
          </Button>
        </form>
      ) : (
        <p className="text-muted">
          Only a Main or Co-Organizer can change equipment requests.
        </p>
      )}
    </section>
  );
}
