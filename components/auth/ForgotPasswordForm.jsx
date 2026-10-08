'use client';

import { useActionState } from 'react';

import { forgotPasswordAction } from '../../app/actions';
import Button from '../common/Button';

const initialState = { error: null };

/**
 * Single-field "send me a reset link" form.
 *
 * `forgotPasswordAction` always returns the same success message regardless
 * of whether the email exists, matching the backend's anti-enumeration
 * behaviour — this form never reveals the outcome either.
 */
export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state?.ok) {
    return (
      <div className="card card--padded">
        <p className="notice notice--success" role="status">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form className="card card--padded stack" action={formAction}>
      <div className="field">
        <label className="field__label" htmlFor="email">
          University email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="username"
          placeholder="you@mfu.ac.th"
          required
        />
      </div>

      {state?.error ? (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button variant="primary" type="submit" block disabled={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
