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

import { ApiError, SESSION_COOKIE, apiDelete, apiPatch, apiPost, apiRequest } from '../lib/api';
import { fromLocalInput } from '../lib/events';

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

/**
 * POST /api/auth/register — creates a `status: "pending"` user and sends a
 * verification email. No session cookie comes back, so there is nothing to
 * log in yet; the form swaps to a "check your inbox" state instead.
 */
export async function registerAction(_prevState, formData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const school = String(formData.get('school') ?? '').trim();
  const year = String(formData.get('year') ?? '').trim();
  const consent = formData.get('consent') === 'on';

  if (!name || !email || !password) {
    return { error: 'Name, email, and password are required.' };
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }
  if (!consent) {
    return { error: 'You must agree to the PDPA consent notice to register.' };
  }

  try {
    const { data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name,
        email,
        password,
        school: school || undefined,
        year: year || undefined,
      },
      sendSession: false,
    });
    return { ok: true, message: data.message };
  } catch (error) {
    return failure(error);
  }
}

/**
 * POST /api/auth/forgot-password — always returns the same success message
 * regardless of outcome (mirrors the backend's anti-enumeration behaviour).
 */
export async function forgotPasswordAction(_prevState, formData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Email is required.' };

  const message = 'If that email is registered and active, a reset link has been sent.';
  try {
    await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
      sendSession: false,
    });
  } catch (error) {
    // Only a network/unexpected error surfaces; the backend itself never
    // reveals whether the email exists, and neither does this form.
    if (!(error instanceof ApiError)) throw error;
  }
  return { ok: true, message };
}

/** POST /api/auth/reset-password — redirects to /login on success. */
export async function resetPasswordAction(_prevState, formData) {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!token) return { error: 'Reset token is missing. Use the link from your email.' };
  if (!password) return { error: 'Password is required.' };
  if (password !== confirmPassword) return { error: 'Passwords do not match.' };

  try {
    await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      sendSession: false,
    });
  } catch (error) {
    return failure(error);
  }

  redirect('/login?reset=success');
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

/**
 * POST /api/user/checkin/self-scan — attendee scans the venue QR themselves
 * (`event.checkin_mode === 'self_scan'` only; `checkinService.selfCheckIn`
 * 400s otherwise). Mirrors the organizer-side `checkInByTokenAction` pattern
 * (plain text field, not a camera — the QR literally encodes this string).
 */
export async function selfCheckInAction(_prevState, formData) {
  const venueToken = String(formData.get('venueToken') ?? '').trim();
  if (!venueToken) return { error: 'Enter or scan the venue check-in code.' };

  try {
    const booking = await apiPost('/api/user/checkin/self-scan', { venueToken });
    if (booking?.event_id) revalidatePath(`/events/${booking.event_id}`);
    revalidatePath('/bookings');
    return { ok: true, message: "You're checked in. Attendance points awarded." };
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

/**
 * PATCH /api/user/reviews/:id — `reviewService.editReview` only allows this
 * within `settings.review_edit_window_days` (default 7) of `created_at` and
 * only for the review's own author; both are re-checked server-side even
 * though `ReviewsSection.jsx` also gates the controls client-side.
 */
export async function editReviewAction(_prevState, formData) {
  const reviewId = String(formData.get('reviewId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  const rating = Number(formData.get('rating'));
  const comment = String(formData.get('comment') ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be between 1 and 5.' };
  }

  try {
    await apiPatch(`/api/user/reviews/${reviewId}`, { rating, comment });
    if (eventId) revalidatePath(`/events/${eventId}`);
    revalidatePath('/health');
    return { ok: true, message: 'Review updated.' };
  } catch (error) {
    return failure(error);
  }
}

/** DELETE /api/user/reviews/:id — same author-and-window gate as the edit. */
export async function deleteReviewAction(reviewId, eventId) {
  try {
    await apiDelete(`/api/user/reviews/${reviewId}`);
  } catch (error) {
    return failure(error);
  }
  if (eventId) revalidatePath(`/events/${eventId}`);
  revalidatePath('/health');
  return { ok: true, message: 'Review deleted.' };
}

// --- Event Requests ----------------------------------------------------------

/**
 * The subset of EventRequest fields a user may set. `org_id` is handled by
 * the caller, not here, since it's required on create but must never be sent
 * on resubmit.
 */
function eventRequestFieldsFrom(formData) {
  const text = (name) => {
    const value = formData.get(name);
    return value == null || value === '' ? null : String(value).trim();
  };
  const number = (name) => {
    const value = formData.get(name);
    return value === null || value === '' ? null : Number(value);
  };

  return {
    title: text('title'),
    description: text('description') ?? '',
    agenda: text('agenda') ?? '',
    equipment_needs: text('equipment_needs') ?? '',
    contact_phone: text('contact_phone'),
    venue_preference: text('venue_preference'),
    start_time: fromLocalInput(text('start_time')),
    end_time: fromLocalInput(text('end_time')),
    capacity: number('capacity'),
    audience_type: text('audience_type') ?? 'open',
    target_school: text('target_school'),
    target_year: text('target_year'),
    points_value: number('points_value'),
    // 'staff_scan' (default) or 'self_scan' — see checkinService.selfCheckIn.
    checkin_mode: text('checkin_mode') ?? 'staff_scan',
  };
}

function validateEventRequest(fields) {
  if (!fields.title) return 'A title is required.';
  if (!fields.start_time || !fields.end_time) return 'Start and end times are required.';
  if (new Date(fields.end_time) <= new Date(fields.start_time)) {
    return 'The end time must be after the start time.';
  }
  if (fields.audience_type === 'school' && !fields.target_school) {
    return 'Choose the school this request is limited to.';
  }
  if (fields.audience_type === 'year' && !fields.target_year) {
    return 'Choose the year this request is limited to.';
  }
  return null;
}

/**
 * POST /api/user/event-requests — `org_id` is required for every role
 * (student, faculty, staff); the backend 403s if it's missing, the org isn't
 * active, or the caller isn't an active member. Checked locally first for a
 * faster, clearer error — the backend still re-checks it.
 */
export async function submitEventRequestAction(_prevState, formData) {
  const orgId = String(formData.get('org_id') ?? '');
  if (!orgId) {
    return { error: "Choose which organization you're requesting this event for." };
  }

  const fields = eventRequestFieldsFrom(formData);
  const invalid = validateEventRequest(fields);
  if (invalid) return { error: invalid };

  let created;
  try {
    created = await apiPost('/api/user/event-requests', { ...fields, org_id: orgId });
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/event-requests');
  redirect(`/event-requests/${created.id}`);
}

/**
 * POST /api/user/event-requests/:id/resubmit — only reachable from a
 * `needs_info` request. `org_id` is never included in the body: the backend
 * doesn't re-validate membership on resubmit, so this form gives no way to
 * silently swap the org (see Phase 12 notes in plan.md).
 */
export async function resubmitEventRequestAction(_prevState, formData) {
  const requestId = String(formData.get('requestId') ?? '');

  const fields = eventRequestFieldsFrom(formData);
  const invalid = validateEventRequest(fields);
  if (invalid) return { error: invalid };

  try {
    await apiPost(`/api/user/event-requests/${requestId}/resubmit`, fields);
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/event-requests');
  revalidatePath(`/event-requests/${requestId}`);
  redirect(`/event-requests/${requestId}`);
}

// --- Staff Calls ---------------------------------------------------------------

/**
 * POST /api/user/staff-calls/:id/claim — `open_call` method only, instant
 * join (staffService.claimOpenCall creates the EventOrganizer/EventContributor
 * row immediately). The backend 400s if the call is `application` method.
 */
export async function claimStaffCallAction(callId) {
  try {
    await apiPost(`/api/user/staff-calls/${callId}/claim`);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/staff-calls');
  revalidatePath(`/staff-calls/${callId}`);
  return { ok: true, message: "You're on the team — check the event page for details." };
}

/**
 * POST /api/user/staff-calls/:id/apply — `application` method only. `answers`
 * is a plain array built from the dynamically-rendered question fields, in
 * the same order as `call.questions`.
 */
export async function applyStaffCallAction(_prevState, formData) {
  const callId = String(formData.get('callId') ?? '');
  const answers = formData.getAll('answers').map((value) => String(value));

  try {
    await apiPost(`/api/user/staff-calls/${callId}/apply`, { answers });
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/staff-calls');
  revalidatePath(`/staff-calls/${callId}`);
  return { ok: true, message: 'Application submitted. The organizer will review it.' };
}
