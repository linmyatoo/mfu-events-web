import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import RegisterForm from '../../components/auth/RegisterForm';
import { getSession } from '../../lib/session';

export const metadata = { title: 'Register · MFU-Events' };

// Reads the session cookie to bounce an already-signed-in visitor.
export const dynamic = 'force-dynamic';

/** POST /api/auth/register — creates a pending account and emails a verification link. */
export default async function RegisterPage() {
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
          <h1 className="page-header__title">Create an account</h1>
          <p className="page-header__subtitle">
            Register with your university email to start booking events.
          </p>
        </div>

        <div className="auth-card">
          <RegisterForm />
        </div>

        <div className="auth-actions">
          <p className="auth-actions__register">
            Already have an account?{' '}
            <Link href="/login" className="auth-actions__link auth-actions__link--primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
