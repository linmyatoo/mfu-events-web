'use client';

import { useFormStatus } from 'react-dom';

import { logoutAction } from '../../app/actions';
import Button from '../common/Button';

/**
 * A form, not an onClick handler: `logoutAction` ends in `redirect('/login')`,
 * and a form action is the path that handles that redirect — including when
 * JavaScript has not hydrated yet.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button variant="outline" block type="submit" disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}

/** Clears the `mfu_token` cookie on both this origin and the backend. */
export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton />
    </form>
  );
}
