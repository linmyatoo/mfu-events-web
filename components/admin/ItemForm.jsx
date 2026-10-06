'use client';

import { useActionState } from 'react';

import { saveItemAction } from '../../app/admin/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/**
 * POST /api/admin/items, or PATCH when `item` is supplied.
 * `available_quantity` is derived from allocations, so it is never posted.
 */
export default function ItemForm({ item = null }) {
  const [state, formAction, pending] = useActionState(saveItemAction, initialState);
  const id = item?.id ?? 'new';

  return (
    <form className="card card--padded qa-form" action={formAction}>
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}

      <div className="field">
        <label className="field__label" htmlFor={`i-name-${id}`}>
          Name
        </label>
        <input
          id={`i-name-${id}`}
          name="name"
          className="input"
          defaultValue={item?.name ?? ''}
          required
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`i-description-${id}`}>
          Description
        </label>
        <input
          id={`i-description-${id}`}
          name="description"
          className="input"
          defaultValue={item?.description ?? ''}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`i-qty-${id}`}>
          Total quantity
        </label>
        <input
          id={`i-qty-${id}`}
          name="total_quantity"
          type="number"
          min="1"
          className="input"
          defaultValue={item?.total_quantity ?? 1}
          required
        />
      </div>

      {item ? (
        <div className="field">
          <label className="field__label" htmlFor={`i-status-${id}`}>
            Status
          </label>
          <select
            id={`i-status-${id}`}
            name="status"
            className="select"
            defaultValue={item.status}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      ) : null}

      {state?.error ? <p className="field__error">{state.error}</p> : null}
      {state?.message ? (
        <p className="notice notice--success" role="status">
          {state.message}
        </p>
      ) : null}

      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? 'Saving…' : item ? 'Save item' : 'Create item'}
      </Button>
    </form>
  );
}
