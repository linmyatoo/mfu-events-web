import AppShell from '../../components/layout/AppShell';
import { userNavItems } from '../../components/navigation/navItems';
import { ApiError, apiGet } from '../../lib/api';
import { derivePoints } from '../../lib/points';
import {
  PORTALS,
  getMyOrganizers,
  portalsFor,
  requireUser,
} from '../../lib/session';

// Every page under this layout is per-user and reads the session cookie, so
// none of them can be prerendered at build time.
export const dynamic = 'force-dynamic';

/**
 * Chrome for the User portal.
 *
 *   GET /api/user/me                 → header avatar, sidebar audience line
 *   GET /api/user/bookings           → the points chip (see lib/points.js)
 *   GET /api/organizer/my-organizers → whether to offer the portal switcher
 */
export default async function AppLayout({ children }) {
  const user = await requireUser();
  const [memberships, bookings] = await Promise.all([
    getMyOrganizers(),
    apiGet('/api/user/bookings').catch((error) => {
      // The header chip is not worth failing a page render over.
      if (error instanceof ApiError) return [];
      throw error;
    }),
  ]);

  return (
    <AppShell
      user={user}
      pointsBalance={derivePoints(bookings).balance}
      navItems={userNavItems}
      portals={await portalsFor(user, memberships)}
      portal={PORTALS.USER}
    >
      {children}
    </AppShell>
  );
}
