'use client';

import { useActionState } from 'react';

import { applyToOrgAction } from '../../app/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/**
 * Inline apply form for one org card on the Discover tab — optional message
 * plus a submit button. POST /api/user/organizations/:id/apply.
 */
export default function OrgApplyForm({ orgId }) {
  const [state, formAction, pending] = useActionState(applyToOrgAction, initialState);

  return (
    <form className="stack" action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />

      <div className="field">
        <label className="field__label" htmlFor={`org-apply-message-${orgId}`}>
          Message (optional)
        </label>
        <textarea
          id={`org-apply-message-${orgId}`}
          name="message"
          className="textarea"
          placeholder="Tell the org manager why you'd like to join"
        />
      </div>

      {state?.error ? <p className="field__error">{state.error}</p> : null}
      {state?.message ? (
        <p className="notice notice--success" role="status">
          {state.message}
        </p>
      ) : null}

      <Button variant="primary" size="sm" type="submit" disabled={pending}>
        {pending ? 'Applying…' : 'Apply to join'}
      </Button>
    </form>
  );
}
