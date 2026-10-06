'use server';

/**
 * Server Actions for every user-role mutation in MFU-Events/backend/routes/user.js.
 *
 * They run on the Next server, so the session cookie stays httpOnly and the
 * backend is never called from the browser. Each one returns a plain
 * `{ ok }` / `{ error }` object that the form can render with `useActionState`.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { ApiError, SESSION_COOKIE, apiPost, apiRequest } from '../lib/api';

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // matches COOKIE_MAX_AGE in routes/auth.js

function failure(error) {
  if (error instanceof ApiError) return { error: error.message };
  throw error;
}

/** Pull `mfu_token` out of the backend's Set-Cookie header. */
function tokenFromResponse(response) {
  const cookieHeaders = response.headers.getSetCookie?.() ?? [];
  for (const header of cookieHeaders) {
    const match = header.match(new RegExp(`^${SESSION_COOKIE}=([^;]+)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export async function loginAction(_prevState, formData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  let token;
  try {
    const { response } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      sendSession: false,
    });
    token = tokenFromResponse(response);
  } catch (error) {
    return failure(error);
  }

  if (!token) {
    return { error: 'Sign-in succeeded but no session cookie was returned.' };
  }

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  redirect('/');
}

export async function logoutAction() {
  try {
    await apiPost('/api/auth/logout');
  } catch {
    // Clearing our own cookie is what actually signs the user out.
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}

/** POST /api/user/events/:id/book */
export async function bookEventAction(eventId) {
  try {
    const booking = await apiPost(`/api/user/events/${eventId}/book`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/bookings');
    revalidatePath('/');
    return { ok: true, booking };
  } catch (error) {
    return failure(error);
  }
}

/** POST /api/user/bookings/:id/cancel */
export async function cancelBookingAction(bookingId, eventId) {
  try {
    const booking = await apiPost(`/api/user/bookings/${bookingId}/cancel`);
    if (eventId) revalidatePath(`/events/${eventId}`);
    revalidatePath('/bookings');
    revalidatePath('/');
    return { ok: true, booking };
  } catch (error) {
    return failure(error);
  }
}

/** POST /api/user/events/:id/questions */
export async function askQuestionAction(_prevState, formData) {
  const eventId = String(formData.get('eventId') ?? '');
  const text = String(formData.get('text') ?? '').trim();

  // Same guard as qaService.askQuestion, so the error reads the same offline.
  if (!text) return { error: 'Question text is required.' };

  try {
    await apiPost(`/api/user/events/${eventId}/questions`, { text });
    revalidatePath(`/events/${eventId}`);
    return { ok: true, message: 'Question posted. An organizer will answer it here.' };
  } catch (error) {
    return failure(error);
  }
}

/** POST /api/user/events/:id/reviews */
export async function submitReviewAction(_prevState, formData) {
  const eventId = String(formData.get('eventId') ?? '');
  const rating = Number(formData.get('rating'));
  const comment = String(formData.get('comment') ?? '').trim();
  const isAnonymous = formData.get('isAnonymous') === 'on';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be between 1 and 5.' };
  }

  try {
    await apiPost(`/api/user/events/${eventId}/reviews`, { rating, comment, isAnonymous });
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/health');
    return { ok: true, message: 'Review submitted. Thanks for the feedback.' };
  } catch (error) {
    return failure(error);
  }
}
