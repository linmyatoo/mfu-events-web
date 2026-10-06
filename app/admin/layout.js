import AppShell from '../../components/layout/AppShell';
import { adminNavItems } from '../../components/navigation/navItems';
import {
  PORTALS,
  getMyOrganizers,
  portalsFor,
  requireAdmin,
} from '../../lib/session';

export const dynamic = 'force-dynamic';

/**
 * Chrome for the Admin portal.
 *
 * Role `admin` gets in; individual areas are gated further by
 * `admin_permissions` on the backend, which each page handles itself rather
 * than hiding nav entries it cannot verify.
 */
export default async function AdminLayout({ children }) {
  const user = await requireAdmin();
  const memberships = await getMyOrganizers();

  const areas = user.admin_permissions ?? [];

  return (
    <AppShell
      user={user}
      navItems={adminNavItems}
      portals={await portalsFor(user, memberships)}
      portal={PORTALS.ADMIN}
      sidebarNote={{
        title: 'Administration',
        body: areas.length
          ? `Permissions: ${areas.join(', ')}.`
          : 'This account has no area permissions assigned.',
      }}
    >
      {children}
    </AppShell>
  );
}
