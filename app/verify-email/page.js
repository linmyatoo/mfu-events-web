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
    <main className="app-main">
      <div className="page-container">
        <div className="page-header">
          <span className="app-header__brand">
            <span className="app-header__logo">
              <Image src="/mfu-logo.png" alt="" width={44} height={44} />
            </span>
            <span>MFU-Events</span>
          </span>
          <h1 className="page-header__title">Email verification</h1>
        </div>

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
          <p className="field__hint">
            <Link href="/login">Go to sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
