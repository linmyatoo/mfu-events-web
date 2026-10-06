/**
 * Server-side client for the EventMFU backend (MFU-Events/backend).
 *
 * Every call runs on the Next server and forwards the browser's `mfu_token`
 * cookie, which is what `middleware/auth.js` authenticates against. Nothing
 * here is reachable from the browser, so the backend never needs to allow a
 * cross-origin request and the session cookie can stay httpOnly.
 */

import { cookies } from 'next/headers';

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

/** Name of the JWT cookie set by `routes/auth.js`. */
export const SESSION_COOKIE = 'mfu_token';

export class ApiError extends Error {
  /**
   * `details` carries any extra fields the backend attached to the error body.
   * `POST /api/admin/events/:id/assign-venue` answers 409 with a `conflicts`
   * array naming the clashing events — dropping it would leave the admin with
   * no way to see what actually collided.
   */
  constructor(message, status, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * `GET /api/user/me` returns the raw user row, which still carries
 * `password_hash`. Strip it here so it can never reach a client component.
 */
function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    const { password_hash: _ignored, ...rest } = value;
    return Object.fromEntries(
      Object.entries(rest).map(([key, inner]) => [key, scrub(inner)])
    );
  }
  return value;
}

async function sessionHeader() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? { cookie: `${SESSION_COOKIE}=${token}` } : {};
}

/**
 * Low-level request. Returns the parsed `Response` alongside the body so the
 * login action can read the backend's `Set-Cookie` header.
 */
export async function apiRequest(path, { method = 'GET', body, sendSession = true } = {}) {
  let response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(sendSession ? await sessionHeader() : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      `Cannot reach the events service at ${BACKEND_URL}. Is the backend running?`,
      503
    );
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const { error, ...details } = payload ?? {};
    throw new ApiError(
      error ?? `Request failed (${response.status}).`,
      response.status,
      scrub(details)
    );
  }

  return { response, data: scrub(payload) };
}

export async function apiGet(path) {
  const { data } = await apiRequest(path);
  return data;
}

export async function apiPost(path, body) {
  const { data } = await apiRequest(path, { method: 'POST', body });
  return data;
}

export async function apiPatch(path, body) {
  const { data } = await apiRequest(path, { method: 'PATCH', body });
  return data;
}

export async function apiPut(path, body) {
  const { data } = await apiRequest(path, { method: 'PUT', body });
  return data;
}

export async function apiDelete(path) {
  const { data } = await apiRequest(path, { method: 'DELETE' });
  return data;
}

/**
 * Read that answers `null` instead of throwing when the caller lacks the
 * backend permission for it. Admin routes are gated per area via
 * `admin_permissions`, so one missing area should blank a panel, not break
 * the page.
 */
export async function apiGetAllowed(path) {
  try {
    return await apiGet(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return null;
    throw error;
  }
}
