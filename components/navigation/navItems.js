/**
 * Web routes for the User-role app surface.
 *
 * Each entry maps to an endpoint in MFU-Events/backend/routes/user.js —
 * there is no screen here without data behind it.
 *
 *   /          GET  /api/user/events
 *   /events/:id GET /api/user/events/:id
 *   /bookings  GET  /api/user/bookings
 *   /points    GET  /api/user/me/points
 *   /health    GET  /api/user/me/health
 *   /profile   GET  /api/user/me
 */

export const primaryNavItems = [
  { href: '/', label: 'Events', icon: 'home' },
  { href: '/bookings', label: 'My Bookings', icon: 'ticket' },
  { href: '/points', label: 'Points', icon: 'sparkle' },
  { href: '/health', label: 'Health', icon: 'heart' },
  { href: '/profile', label: 'Profile', icon: 'user' },
];

/** True when `href` is the active route for `pathname`. */
export function isActiveRoute(pathname, href) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/events');
  return pathname === href || pathname.startsWith(`${href}/`);
}
