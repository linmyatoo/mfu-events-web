import AppShell from '../../components/layout/AppShell';
import { organizerNavItems } from '../../components/navigation/navItems';
import { PORTALS, portalsFor, requireOrganizer } from '../../lib/session';

export const dynamic = 'force-dynamic';

/**
 * Chrome for the Organizer portal.
 *
 * Access is not a user role — it is having an active OrganizerMember row.
 * `requireOrganizer` sends accounts without one back to the User portal; the
 * backend checks the same thing per request, inline.
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
        body: names.length ? names.join(', ') : 'No organizer entity yet.',
      }}
    >
      {children}
    </AppShell>
  );
}
