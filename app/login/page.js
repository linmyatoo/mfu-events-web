import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import LoginForm from '../../components/auth/LoginForm';
import { getSession } from '../../lib/session';

export const metadata = { title: 'Sign in · MFU-Events' };

// Reads the session cookie to bounce an already-signed-in visitor.
export const dynamic = 'force-dynamic';

/** POST /api/auth/login — the only unauthenticated screen in the app. */
export default async function LoginPage() {
  if (await getSession()) redirect('/');

  return (
    <main className="auth-main">
      <div className="auth-shell">
        <div className="auth-brand">
          <span className="auth-brand__logo">
            <Image src="/mfu-logo.png" alt="" width={92} height={92} priority />
          </span>
          <span className="auth-brand__name">MFU-Events</span>
        </div>

        <div className="auth-heading">
          <h1 className="page-header__title">Sign in</h1>
          <p className="page-header__subtitle">
            Use your university account to see the events open to you.
          </p>
        </div>

        <div className="auth-card">
          <LoginForm />
        </div>

        <div className="auth-actions">
          <p className="auth-actions__register">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="auth-actions__link auth-actions__link--primary">
              Register
            </Link>
          </p>
          <Link
            href="/forgot-password"
            className="auth-actions__link auth-actions__link--muted"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
