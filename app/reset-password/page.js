import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { getSession } from '../../lib/session';

export const metadata = { title: 'Reset password · MFU-Events' };

// Reads the session cookie to bounce an already-signed-in visitor.
export const dynamic = 'force-dynamic';

/** POST /api/auth/reset-password — `token` comes from the emailed link. */
export default async function ResetPasswordPage({ searchParams }) {
  if (await getSession()) redirect('/');

  const { token = '' } = await searchParams;

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
          <h1 className="page-header__title">Reset your password</h1>
          <p className="page-header__subtitle">Choose a new password for your account.</p>
        </div>

        <div className="auth-card">
          <ResetPasswordForm token={token} />
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
