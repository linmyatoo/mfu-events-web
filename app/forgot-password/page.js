import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { getSession } from '../../lib/session';

export const metadata = { title: 'Forgot password · MFU-Events' };

// Reads the session cookie to bounce an already-signed-in visitor.
export const dynamic = 'force-dynamic';

/** POST /api/auth/forgot-password */
export default async function ForgotPasswordPage() {
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
          <h1 className="page-header__title">Forgot your password?</h1>
          <p className="page-header__subtitle">
            Enter your university email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="auth-card">
          <ForgotPasswordForm />
        </div>

        <div className="auth-actions">
          <Link href="/login" className="auth-actions__link auth-actions__link--primary">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
