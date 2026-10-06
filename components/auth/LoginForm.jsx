'use client';

import { useActionState } from 'react';

import { loginAction } from '../../app/actions';
import Button from '../common/Button';

const initialState = { error: null };

/**
 * Email + password sign-in.
 *
 * `loginAction` copies the backend's `mfu_token` cookie onto this origin and
 * redirects, so a successful submit never returns to this component.
 */
export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form className="card card--padded qa-form" action={formAction}>
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

      <div className="field">
        <label className="field__label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error ? (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button variant="primary" type="submit" block disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="field__hint">
        Seeded development accounts all use the password <code>demo1234</code> —
        run <code>npm run seed</code> in the backend if sign-in is rejected.
      </p>
    </form>
  );
}
