import AppShell from '../../components/layout/AppShell';
import { organizerNavItems } from '../../components/navigation/navItems';
import { PORTALS, portalsFor, requireOrganizer } from '../../lib/session';

export const dynamic = 'force-dynamic';

/**
 * Chrome for the Organizer portal.
 *
 * Any authenticated user can reach the Organizer portal UI regardless of org
 * membership — `requireOrganizer` only requires a signed-in session.
 * Org membership still gates individual actions (e.g. creating an event),
 * which the backend enforces per request.
 */
export default async function OrganizerLayout({ children }) {
  const { user, memberships } = await requireOrganizer();

  const names = memberships
    .map((membership) => membership.organizer?.name)
    .filter(Boolean);

  return (
    <AppShell
      user={user}
      navItems={organizerNavItems}
      portals={await portalsFor(user, memberships)}
      portal={PORTALS.ORGANIZER}
      sidebarNote={{
        title: 'Organizing for',
        body: names.length ? names.join(', ') : 'Not affiliated with an organization.',
      }}
    >
      {children}
    </AppShell>
  );
}
