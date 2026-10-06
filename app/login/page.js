import { redirect } from 'next/navigation';

import LoginForm from '../../components/auth/LoginForm';
import Icon from '../../components/common/Icon';
import { getSession } from '../../lib/session';

export const metadata = { title: 'Sign in · TripNest' };

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
              <Icon name="calendar" size={20} />
            </span>
            <span>TripNest</span>
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
