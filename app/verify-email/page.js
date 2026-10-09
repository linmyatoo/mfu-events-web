import Image from 'next/image';
import Link from 'next/link';

import { ApiError, apiGet } from '../../lib/api';

export const metadata = { title: 'Verify email · MFU-Events' };

// Calls the backend on every load — the verification itself is the side effect.
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/verify-email?token= — the link in the verification email
 * points straight here (see `notificationService.notifyEmailVerification`),
 * so this page makes the backend call itself rather than the backend
 * redirecting back to a frontend route.
 */
export default async function VerifyEmailPage({ searchParams }) {
  const { token = '' } = await searchParams;

  let message = null;
  let error = null;

  if (!token) {
    error = 'Verification token is required.';
  } else {
    try {
      const data = await apiGet(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      message = data.message;
    } catch (caught) {
      error = caught instanceof ApiError ? caught.message : 'Something went wrong. Please try again.';
    }
  }

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
          <h1 className="page-header__title">Email verification</h1>
        </div>

        <div className="auth-card">
          <div className="card card--padded">
            {message ? (
              <p className="notice notice--success" role="status">
                {message}
              </p>
            ) : (
              <p className="field__error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="auth-actions">
          <Link href="/login" className="auth-actions__link auth-actions__link--primary">
            Go to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
