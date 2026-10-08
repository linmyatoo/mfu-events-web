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
    <main className="app-main">
      <div className="page-container">
        <div className="page-header">
          <span className="app-header__brand">
            <span className="app-header__logo">
              <Image src="/mfu-logo.png" alt="" width={44} height={44} />
            </span>
            <span>MFU-Events</span>
          </span>
          <h1 className="page-header__title">Reset your password</h1>
          <p className="page-header__subtitle">Choose a new password for your account.</p>
        </div>

        <ResetPasswordForm token={token} />

        <p className="field__hint">
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
