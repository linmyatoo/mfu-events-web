/**
 * Navigation for each portal.
 *
 * Every entry maps to endpoints in MFU-Events/backend/routes/ — there is no
 * screen here without data behind it.
 */

/** /api/user — any signed-in account. */
export const userNavItems = [
  { href: '/', label: 'Events', icon: 'home' },
  { href: '/bookings', label: 'My Bookings', icon: 'ticket' },
  { href: '/event-requests', label: 'Event Requests', icon: 'calendar' },
  { href: '/staff-calls', label: 'Staff Calls', icon: 'user' },
  { href: '/organizations', label: 'Organizations', icon: 'place' },
  { href: '/points', label: 'Points', icon: 'sparkle' },
  { href: '/recognition', label: 'Recognition', icon: 'star' },
  { href: '/health', label: 'Health', icon: 'heart' },
  { href: '/profile', label: 'Profile', icon: 'user' },
];

/** /api/organizer — accounts with an active OrganizerMember row. */
export const organizerNavItems = [
  { href: '/organizer', label: 'My Events', icon: 'calendar' },
  { href: '/organizer/check-in', label: 'Check-in', icon: 'ticket' },
  { href: '/organizer/venues', label: 'Venues', icon: 'place' },
  { href: '/organizer/staff-calls', label: 'Staff Calls', icon: 'user' },
  { href: '/organizer/organizations', label: 'My Organizations', icon: 'home' },
];

/** /api/admin — role `admin`, gated further per area by admin_permissions. */
export const adminNavItems = [
  { href: '/admin', label: 'Events', icon: 'calendar' },
  { href: '/admin/event-requests', label: 'Event Requests', icon: 'ticket' },
  { href: '/admin/users', label: 'Users', icon: 'user' },
  { href: '/admin/organizers', label: 'Organizers', icon: 'home' },
  { href: '/admin/venues', label: 'Venues', icon: 'place' },
  { href: '/admin/points', label: 'Points', icon: 'star' },
  { href: '/admin/flags', label: 'Flags', icon: 'heart' },
  { href: '/admin/logs', label: 'Activity', icon: 'search' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

/** Kept for the User portal's own imports. */
export const primaryNavItems = userNavItems;

/**
 * True when `href` is the active route for `pathname`.
 *
 * Portal roots (`/`, `/organizer`, `/admin`) would otherwise match every child
 * route, so they only match exactly — plus the detail routes they own.
 */
export function isActiveRoute(pathname, href) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/events');
  if (href === '/organizer') {
    return pathname === '/organizer' || pathname.startsWith('/organizer/events');
  }
  if (href === '/admin') {
    return pathname === '/admin' || pathname.startsWith('/admin/events');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
