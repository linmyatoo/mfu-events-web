'use server';

/**
 * Server Actions for MFU-Events/backend/routes/organizer.js.
 *
 * Authorization is per-organizer, not a global role — the backend checks it
 * inline on every request, so these deliberately do not pre-judge it beyond
 * what the UI needs to render.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  ApiError,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from '../../lib/api';
import { fromLocalInput } from '../../lib/events';

function failure(error) {
  if (error instanceof ApiError) return { error: error.message, details: error.details };
  throw error;
}

function refresh(eventId) {
  revalidatePath('/organizer');
  if (eventId) revalidatePath(`/organizer/events/${eventId}`);
}

/** The subset of Event fields an organizer may set. */
function eventFieldsFrom(formData) {
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
    category: text('category'),
    start_time: fromLocalInput(text('start_time')),
    end_time: fromLocalInput(text('end_time')),
    registration_deadline: fromLocalInput(text('registration_deadline')),
    capacity: number('capacity'),
    expected_participants: number('expected_participants'),
    audience_type: text('audience_type') ?? 'open',
    target_school: text('target_school'),
    target_year: text('target_year'),
    venue_preference: text('venue_preference'),
    // Structured venue request — see eventService.js:105-106 (create) /
    // updateEvent's safePatch (update); backend stores it as-is, null clears it.
    requested_venue_id: text('requested_venue_id'),
    requirements: text('requirements'),
  };
}

function validate(fields) {
  if (!fields.title) return 'A title is required.';
  if (!fields.start_time || !fields.end_time) return 'Start and end times are required.';
  if (new Date(fields.end_time) <= new Date(fields.start_time)) {
    return 'The end time must be after the start time.';
  }
  if (fields.audience_type === 'school' && !fields.target_school) {
    return 'Choose the school this event is limited to.';
  }
  if (fields.audience_type === 'year' && !fields.target_year) {
    return 'Choose the year this event is limited to.';
  }
  return null;
}

/** POST /api/organizer/organizers/:orgId/events — creates a DRAFT. */
export async function createEventAction(_prevState, formData) {
  const orgId = String(formData.get('organizerId') ?? '');
  if (!orgId) return { error: 'Choose which organizer is hosting this event.' };

  const fields = eventFieldsFrom(formData);
  const invalid = validate(fields);
  if (invalid) return { error: invalid };

  let created;
  try {
    created = await apiPost(`/api/organizer/organizers/${orgId}/events`, fields);
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/organizer');
  redirect(`/organizer/events/${created.id}`);
}

/** PATCH /api/organizer/events/:id — DRAFT only, enforced server-side. */
export async function updateEventAction(_prevState, formData) {
  const eventId = String(formData.get('eventId') ?? '');
  const fields = eventFieldsFrom(formData);
  const invalid = validate(fields);
  if (invalid) return { error: invalid };

  try {
    await apiPatch(`/api/organizer/events/${eventId}`, fields);
  } catch (error) {
    return failure(error);
  }

  refresh(eventId);
  redirect(`/organizer/events/${eventId}`);
}

/**
 * Lifecycle steps the organizer owns. Admin owns the rest — see
 * EVENT_TRANSITIONS in the backend's constants.js.
 */
const EVENT_ACTIONS = {
  submit: 'submit',
  resubmit: 'resubmit',
  'open-registration': 'open-registration',
  'close-registration': 'close-registration',
  cancel: 'cancel',
};

export async function eventLifecycleAction(eventId, action) {
  const path = EVENT_ACTIONS[action];
  if (!path) return { error: `Unknown action "${action}".` };

  try {
    await apiPost(`/api/organizer/events/${eventId}/${path}`);
  } catch (error) {
    return failure(error);
  }

  refresh(eventId);
  revalidatePath('/');
  return { ok: true };
}

/** POST /api/organizer/events/:id/clone — a new DRAFT copy. */
export async function cloneEventAction(eventId) {
  let copy;
  try {
    copy = await apiPost(`/api/organizer/events/${eventId}/clone`);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/organizer');
  redirect(`/organizer/events/${copy.id}`);
}

// --- Event team --------------------------------------------------------------

/**
 * GET /api/organizer/users/search — reachable from the browser only through
 * this action, since `lib/api.js` holds the session cookie server-side.
 * The backend returns nothing below two characters.
 */
export async function searchUsersAction(query) {
  const q = String(query ?? '').trim();
  if (q.length < 2) return { ok: true, users: [] };

  try {
    const users = await apiGet(`/api/organizer/users/search?q=${encodeURIComponent(q)}`);
    return { ok: true, users };
  } catch (error) {
    return failure(error);
  }
}

export async function addTeamMemberAction(_prevState, formData) {
  const eventId = String(formData.get('eventId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');

  if (!userId) return { error: 'Pick a person to add.' };

  try {
    await apiPost(`/api/organizer/events/${eventId}/team`, { userId, role });
  } catch (error) {
    return failure(error);
  }
  refresh(eventId);
  return { ok: true, message: 'Added to the team.' };
}

export async function changeTeamRoleAction(eventId, userId, role) {
  try {
    await apiPatch(`/api/organizer/events/${eventId}/team/${userId}`, { role });
  } catch (error) {
    return failure(error);
  }
  refresh(eventId);
  return { ok: true };
}

export async function removeTeamMemberAction(eventId, userId) {
  try {
    await apiDelete(`/api/organizer/events/${eventId}/team/${userId}`);
  } catch (error) {
    return failure(error);
  }
  refresh(eventId);
  return { ok: true };
}

// --- Attendance --------------------------------------------------------------

/** POST /api/organizer/checkin/scan — `{ qrToken }` from the booking's QR. */
export async function checkInByTokenAction(_prevState, formData) {
  const qrToken = String(formData.get('qrToken') ?? '').trim();
  if (!qrToken) return { error: 'Enter or scan a check-in token.' };

  try {
    const booking = await apiPost('/api/organizer/checkin/scan', { qrToken });
    revalidatePath('/organizer');
    if (booking?.event_id) revalidatePath(`/organizer/events/${booking.event_id}`);
    return { ok: true, message: 'Checked in. Attendance points awarded.' };
  } catch (error) {
    return failure(error);
  }
}

export async function checkInBookingAction(bookingId, eventId) {
  try {
    await apiPost(`/api/organizer/bookings/${bookingId}/checkin`);
  } catch (error) {
    return failure(error);
  }
  refresh(eventId);
  return { ok: true };
}

export async function markNoShowAction(bookingId, eventId) {
  try {
    await apiPost(`/api/organizer/bookings/${bookingId}/noshow`);
  } catch (error) {
    return failure(error);
  }
  refresh(eventId);
  return { ok: true };
}

// --- Q&A and item requests ---------------------------------------------------

export async function answerQuestionAction(_prevState, formData) {
  const eventId = String(formData.get('eventId') ?? '');
  const questionId = String(formData.get('questionId') ?? '');
  const text = String(formData.get('text') ?? '').trim();

  if (!text) return { error: 'An answer is required.' };

  try {
    await apiPost(`/api/organizer/events/${eventId}/questions/${questionId}/answer`, { text });
  } catch (error) {
    return failure(error);
  }
  refresh(eventId);
  revalidatePath(`/events/${eventId}`);
  return { ok: true, message: 'Answer posted.' };
}

/**
 * PUT /api/organizer/events/:id/item-requests — replaces every pending row,
 * so the form always submits the complete list.
 */
export async function saveItemRequestsAction(_prevState, formData) {
  const eventId = String(formData.get('eventId') ?? '');
  const requests = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('qty:')) continue;
    const quantity = Number(value);
    if (quantity > 0) requests.push({ item_id: key.slice(4), quantity });
  }

  try {
    await apiPut(`/api/organizer/events/${eventId}/item-requests`, { requests });
  } catch (error) {
    return failure(error);
  }
  refresh(eventId);
  return { ok: true, message: 'Item requests saved and sent for admin approval.' };
}
