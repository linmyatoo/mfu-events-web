'use client';

import { useActionState, useState } from 'react';

import { resetPasswordAction } from '../../app/actions';
import Button from '../common/Button';

const initialState = { error: null };

/**
 * New-password form for the `/reset-password?token=` link emailed by
 * `forgot-password`. `resetPasswordAction` redirects to `/login` on success,
 * so this component only ever renders the form or an error.
 */
export default function ResetPasswordForm({ token }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  function handleSubmit(event) {
    const form = event.currentTarget;
    const password = form.elements.namedItem('password')?.value ?? '';
    const confirmPassword = form.elements.namedItem('confirmPassword')?.value ?? '';
    if (password !== confirmPassword) {
      event.preventDefault();
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
  }

  return (
    <form className="card card--padded stack" action={formAction} onSubmit={handleSubmit}>
      <input type="hidden" name="token" value={token ?? ''} />

      <div className="field">
        <label className="field__label" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="new-password"
          required
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className="input"
          autoComplete="new-password"
          required
        />
        {passwordMismatch ? (
          <p className="field__error" role="alert">
            Passwords do not match.
          </p>
        ) : null}
      </div>

      {state?.error ? (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button variant="primary" type="submit" block disabled={pending || !token}>
        {pending ? 'Resetting…' : 'Reset password'}
      </Button>

      {!token ? (
        <p className="field__hint">
          This link is missing its reset token. Use the link from your email.
        </p>
      ) : null}
    </form>
  );
}
