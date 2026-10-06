'use server';

/**
 * Server Actions for MFU-Events/backend/routes/admin.js.
 *
 * Every route needs role `admin` plus the matching entry in the account's
 * `admin_permissions`, so a 403 here means "this admin does not hold that
 * area" and is surfaced as text rather than treated as a crash.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError, apiDelete, apiPatch, apiPost } from '../../lib/api';
import { fromLocalInput } from '../../lib/events';

function failure(error) {
  if (error instanceof ApiError) return { error: error.message, details: error.details };
  throw error;
}

// --- Events ------------------------------------------------------------------

/**
 * Lifecycle steps Admin owns. Organizers own submit / open- and
 * close-registration / cancel — see EVENT_TRANSITIONS in constants.js.
 */
const EVENT_STEPS = [
  'start-review',
  'approve',
  'reject',
  'request-changes',
  'publish',
  'complete',
  'cancel',
];

export async function adminEventAction(eventId, step, feedback) {
  if (!EVENT_STEPS.includes(step)) return { error: `Unknown action "${step}".` };

  // reject and request-changes carry the note the organizer will read.
  const needsFeedback = step === 'reject' || step === 'request-changes';
  if (needsFeedback && !String(feedback ?? '').trim()) {
    return { error: 'Explain what needs to change — the organizer sees this note.' };
  }

  try {
    await apiPost(
      `/api/admin/events/${eventId}/${step}`,
      needsFeedback ? { feedback } : undefined
    );
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath('/');
  return { ok: true };
}

/**
 * POST /api/admin/events/:id/assign-venue.
 *
 * Answers 409 with a `conflicts` array when the room is already held for that
 * window, and 400 when its capacity is below `expected_participants`.
 */
export async function assignVenueAction(eventId, venueId) {
  try {
    await apiPost(`/api/admin/events/${eventId}/assign-venue`, { venueId });
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin');
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

/**
 * POST /api/admin/events — the only path that can set `is_point_event` /
 * `organizer_points_base` (eventService.createEvent enforces Admin-only for
 * both). Saved as a normal DRAFT; it still goes through the usual
 * review/venue/publish lifecycle from here.
 */
export async function createPointEventAction(_prevState, formData) {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const startTime = String(formData.get('start_time') ?? '');
  const endTime = String(formData.get('end_time') ?? '');
  const capacity = Number(formData.get('capacity'));
  const organizerPointsBase = Number(formData.get('organizer_points_base'));
  const userIds = formData.getAll('organizer_user_id').map((v) => String(v).trim());
  const roles = formData.getAll('organizer_role').map((v) => String(v).trim());

  if (!title) return { error: 'A title is required.' };
  if (!startTime || !endTime) return { error: 'Start and end times are required.' };
  if (fromLocalInput(endTime) <= fromLocalInput(startTime)) {
    return { error: 'The end time must be after the start time.' };
  }
  if (!Number.isFinite(organizerPointsBase) || organizerPointsBase < 0) {
    return { error: 'Organizer points pool (base) must be 0 or more.' };
  }

  const organizers = userIds
    .map((userId, i) => ({ user_id: userId, role: roles[i] || 'co_organizer' }))
    .filter((o) => o.user_id);
  if (organizers.length === 0) {
    return { error: 'Add at least one organizer to the team.' };
  }

  let created;
  try {
    created = await apiPost('/api/admin/events', {
      title,
      description,
      start_time: fromLocalInput(startTime),
      end_time: fromLocalInput(endTime),
      capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 50,
      is_point_event: true,
      organizer_points_base: organizerPointsBase,
      organizers,
    });
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/admin');
  redirect(`/admin/events/${created.id}`);
}

// --- Users -------------------------------------------------------------------

export async function userStatusAction(userId, step) {
  if (!['suspend', 'reinstate', 'deactivate'].includes(step)) {
    return { error: `Unknown action "${step}".` };
  }
  try {
    await apiPost(`/api/admin/users/${userId}/${step}`);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

// --- Organizers --------------------------------------------------------------

export async function createOrganizerAction(_prevState, formData) {
  const name = String(formData.get('name') ?? '').trim();
  const type = String(formData.get('type') ?? '');
  const description = String(formData.get('description') ?? '').trim();

  if (!name) return { error: 'A name is required.' };
  if (!type) return { error: 'Choose an organizer type.' };

  let organizer;
  try {
    organizer = await apiPost('/api/admin/organizers', { name, type, description });
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin/organizers');
  redirect(`/admin/organizers/${organizer.id}`);
}

export async function organizerDecisionAction(orgId, step) {
  if (!['approve', 'reject'].includes(step)) return { error: `Unknown action "${step}".` };
  try {
    await apiPost(`/api/admin/organizers/${orgId}/${step}`);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin/organizers');
  revalidatePath(`/admin/organizers/${orgId}`);
  return { ok: true };
}

export async function addOrganizerMemberAction(_prevState, formData) {
  const orgId = String(formData.get('orgId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');

  if (!userId) return { error: 'Pick a person to add.' };

  try {
    await apiPost(`/api/admin/organizers/${orgId}/members`, { userId, role });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/admin/organizers/${orgId}`);
  return { ok: true, message: 'Member added.' };
}

export async function updateOrganizerMemberAction(orgId, userId, role) {
  try {
    await apiPatch(`/api/admin/organizers/${orgId}/members/${userId}`, { role });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/admin/organizers/${orgId}`);
  return { ok: true };
}

export async function removeOrganizerMemberAction(orgId, userId) {
  try {
    await apiDelete(`/api/admin/organizers/${orgId}/members/${userId}`);
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/admin/organizers/${orgId}`);
  return { ok: true };
}

// --- Venues ------------------------------------------------------------------

export async function saveVenueAction(_prevState, formData) {
  const venueId = String(formData.get('venueId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const capacity = Number(formData.get('capacity'));

  if (!name) return { error: 'A name is required.' };
  if (!Number.isFinite(capacity) || capacity < 1) {
    return { error: 'Capacity must be at least 1.' };
  }

  const body = {
    name,
    capacity,
    building: String(formData.get('building') ?? '').trim() || null,
    location: String(formData.get('location') ?? '').trim() || null,
    equipment: String(formData.get('equipment') ?? '')
      .split(',')
      .map((piece) => piece.trim())
      .filter(Boolean),
  };

  try {
    if (venueId) {
      // `status` is only editable on an existing row.
      body.status = String(formData.get('status') ?? 'active');
      await apiPatch(`/api/admin/venues/${venueId}`, body);
    } else {
      await apiPost('/api/admin/venues', body);
    }
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/admin/venues');
  return { ok: true, message: venueId ? 'Venue updated.' : 'Venue created.' };
}

// --- Items -------------------------------------------------------------------

export async function saveItemAction(_prevState, formData) {
  const itemId = String(formData.get('itemId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const totalQuantity = Number(formData.get('total_quantity'));

  if (!name) return { error: 'A name is required.' };
  if (!Number.isFinite(totalQuantity) || totalQuantity < 1) {
    return { error: 'Total quantity must be at least 1.' };
  }

  const body = {
    name,
    description: String(formData.get('description') ?? '').trim(),
    total_quantity: totalQuantity,
  };

  try {
    if (itemId) {
      // `available_quantity` is derived — itemService strips it from a patch.
      body.status = String(formData.get('status') ?? 'active');
      await apiPatch(`/api/admin/items/${itemId}`, body);
    } else {
      await apiPost('/api/admin/items', body);
    }
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/admin/items');
  return { ok: true, message: itemId ? 'Item updated.' : 'Item created.' };
}

export async function resolveItemRequestAction(requestId, step, quantity, eventId) {
  if (!['approve', 'reject'].includes(step)) return { error: `Unknown action "${step}".` };

  try {
    await apiPost(
      `/api/admin/item-requests/${requestId}/${step}`,
      step === 'approve' ? { quantity } : undefined
    );
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin/items');
  if (eventId) revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

// --- Flags -------------------------------------------------------------------

/** action: dismiss | warn | suspend | deactivate */
export async function resolveOrganizerFlagAction(flagId, action) {
  try {
    await apiPost(`/api/admin/flags/organizers/${flagId}/resolve`, { action });
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin/flags');
  return { ok: true };
}

/** action: dismiss | warn | restrict */
export async function resolveHealthFlagAction(flagId, action) {
  try {
    await apiPost(`/api/admin/flags/health/${flagId}/resolve`, { action });
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin/flags');
  return { ok: true };
}

// --- Points (organizer-points approval queue) --------------------------------

/**
 * POST /api/admin/points/:id/resolve. action: 'approve' | 'adjust' | 'reject'.
 * `adjustedAmount` is required (and only read) when action is 'adjust'.
 */
export async function resolvePointsAction(transactionId, action, adjustedAmount) {
  try {
    await apiPost(`/api/admin/points/${transactionId}/resolve`, {
      action,
      adjustedAmount: action === 'adjust' ? adjustedAmount : undefined,
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin/points');
  return { ok: true };
}

/** POST /api/admin/points/sync — stub for the university points API. */
export async function runPointsSyncAction() {
  let result;
  try {
    result = await apiPost('/api/admin/points/sync');
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/admin/points');
  return { ok: true, synced_count: result.synced_count };
}
