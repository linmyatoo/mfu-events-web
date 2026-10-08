/**
 * Session and portal access.
 *
 * `GET /api/auth/me` is the cheap check — it returns `{ portalRole, user }`
 * with only the safe user fields. The full profile row (school, year,
 * health_score, booking_restricted) comes from `GET /api/user/me`.
 *
 * `portalRole` decides which portals the switcher offers. It is not the
 * authorization boundary: each portal layout re-derives access, and the
 * backend enforces it on every request regardless of what the UI shows.
 */

import { redirect } from 'next/navigation';

import { ApiError, apiGet } from './api';

export const PORTALS = {
  USER: 'user',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
};

function isSignedOut(error) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/** The signed-in session, or null when there is no valid cookie. */
export async function getSession() {
  try {
    return await apiGet('/api/auth/me');
  } catch (error) {
    if (isSignedOut(error)) return null;
    throw error;
  }
}

/** Full user row for the signed-in account; redirects to /login when signed out. */
export async function requireUser() {
  try {
    return await apiGet('/api/user/me');
  } catch (error) {
    if (isSignedOut(error)) redirect('/login');
    throw error;
  }
}

/**
 * Organizer entities this account can act for.
 *
 * `/api/organizer/my-organizers` returns every active membership; only
 * `EVENT_MANAGING_ROLES` (owner / president / event_manager) may create or
 * manage events, so plain members get an explanatory empty state rather than
 * a portal full of 403s.
 */
export const EVENT_MANAGING_ROLES = ['owner', 'president', 'event_manager'];

export async function getMyOrganizers() {
  try {
    return await apiGet('/api/organizer/my-organizers');
  } catch (error) {
    if (isSignedOut(error)) return [];
    throw error;
  }
}

/** Guard for `/organizer/*`. Returns the user plus their memberships. */
export async function requireOrganizer() {
  const user = await requireUser();
  const memberships = await getMyOrganizers();
  return { user, memberships };
}

/** Guard for `/admin/*`. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/');
  return user;
}

/** Which portals to offer in the header switcher. */
export async function portalsFor(user, memberships) {
  const portals = [{ id: PORTALS.USER, label: 'User', href: '/' }];
  if (user) {
    portals.push({ id: PORTALS.ORGANIZER, label: 'Organizer', href: '/organizer' });
  }
  if (user.role === 'admin') {
    portals.push({ id: PORTALS.ADMIN, label: 'Admin', href: '/admin' });
  }
  return portals;
}
