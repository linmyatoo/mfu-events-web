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
    <main className="app-main">
      <div className="page-container">
        <div className="page-header">
          <span className="app-header__brand">
            <span className="app-header__logo">
              <Image src="/mfu-logo.png" alt="" width={44} height={44} />
            </span>
            <span>MFU-Events</span>
          </span>
          <h1 className="page-header__title">Create an account</h1>
          <p className="page-header__subtitle">
            Register with your university email to start booking events.
          </p>
        </div>

        <RegisterForm />

        <p className="field__hint">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
