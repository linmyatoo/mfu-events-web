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
    <main className="app-main">
      <div className="page-container">
        <div className="page-header">
          <span className="app-header__brand">
            <span className="app-header__logo">
              <Image src="/mfu-logo.png" alt="" width={44} height={44} />
            </span>
            <span>MFU-Events</span>
          </span>
          <h1 className="page-header__title">Forgot your password?</h1>
          <p className="page-header__subtitle">
            Enter your university email and we&apos;ll send you a reset link.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="field__hint">
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
