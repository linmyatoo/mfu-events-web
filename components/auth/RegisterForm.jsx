'use client';

import { useActionState, useState } from 'react';

import { registerAction } from '../../app/actions';
import Button from '../common/Button';

const initialState = { error: null };

/**
 * Name + email + password registration.
 *
 * `registerAction` never sets a session cookie (the backend creates a
 * `status: "pending"` user and emails a verification link instead), so a
 * successful submit swaps this form for a "check your inbox" state rather
 * than redirecting.
 */
export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
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

  if (state?.ok) {
    return (
      <div className="card card--padded">
        <p className="notice notice--success" role="status">
          {state.message}
        </p>
        <p className="field__hint">
          Didn&apos;t get it? Check your spam folder, then try registering
          again in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <form className="card card--padded stack" action={formAction} onSubmit={handleSubmit}>
      <div className="field">
        <label className="field__label" htmlFor="name">
          Full name
        </label>
        <input id="name" name="name" className="input" autoComplete="name" required />
      </div>

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
        <p className="field__hint">Only @mfu.ac.th addresses are accepted.</p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="password">
          Password
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
          Confirm password
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

      <div className="field">
        <label className="field__label" htmlFor="school">
          School (optional)
        </label>
        <input id="school" name="school" className="input" placeholder="School of Computing" />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="year">
          Year (optional)
        </label>
        <input id="year" name="year" className="input" placeholder="Year 3" />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="consent">
          <input id="consent" name="consent" type="checkbox" required />{' '}
          I agree to the PDPA personal data consent notice
        </label>
      </div>

      {state?.error ? (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button variant="primary" type="submit" block disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
