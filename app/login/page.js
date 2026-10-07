import Image from 'next/image';
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
    <main className="app-main">
      <div className="page-container">
        <div className="page-header">
          <span className="app-header__brand">
            <span className="app-header__logo">
              <Image src="/mfu-logo.png" alt="" width={44} height={44} />
            </span>
            <span>MFU-Events</span>
          </span>
          <h1 className="page-header__title">Sign in</h1>
          <p className="page-header__subtitle">
            Use your university account to see the events open to you.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
