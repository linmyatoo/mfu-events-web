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

// --- Event Requests -----------------------------------------------------------

/**
 * POST /api/admin/event-requests/:id/approve|reject|needs-info.
 *
 * `approve` takes no body and answers `{ request, event }` — the draft event
 * created from the request (`source_request_id` set, requester appointed
 * `main_organizer`). `reject`/`needs-info` carry `{ feedback }`, which the
 * requester reads, so it's required (same pattern as `adminEventAction`'s
 * `reject`/`request-changes` branch).
 */
export async function eventRequestDecisionAction(requestId, step, feedback) {
  if (!['approve', 'reject', 'needs-info'].includes(step)) {
    return { error: `Unknown action "${step}".` };
  }

  const needsFeedback = step === 'reject' || step === 'needs-info';
  if (needsFeedback && !String(feedback ?? '').trim()) {
    return { error: 'Explain what needs to change — the requester sees this note.' };
  }

  let result;
  try {
    result = await apiPost(
      `/api/admin/event-requests/${requestId}/${step}`,
      needsFeedback ? { feedback } : undefined
    );
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/admin/event-requests');
  revalidatePath(`/admin/event-requests/${requestId}`);
  if (step === 'approve') revalidatePath('/admin');
  return { ok: true, event: result?.event };
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

// --- Organizers (Organization entity + membership) ----------------------------

/**
 * POST /api/admin/organizers — alias of POST /api/admin/organizations that
 * creates the org in 'active' status immediately (admin-direct), instead of
 * the normal 'pending' default. Kept so admin-created orgs are usable right
 * away without a separate activation step.
 */
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

/** step: 'activate' | 'deactivate'. Status flow is pending → active, no approve/reject. */
export async function organizerDecisionAction(orgId, step) {
  if (!['activate', 'deactivate'].includes(step)) return { error: `Unknown action "${step}".` };
  try {
    await apiPost(`/api/admin/organizations/${orgId}/${step}`);
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
    // Backend reads `user_id`, not `userId`, from the body.
    await apiPost(`/api/admin/organizations/${orgId}/members`, { user_id: userId, role });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/admin/organizers/${orgId}`);
  return { ok: true, message: 'Member added.' };
}

export async function updateOrganizerMemberAction(orgId, userId, role) {
  try {
    await apiPatch(`/api/admin/organizations/${orgId}/members/${userId}`, { role });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/admin/organizers/${orgId}`);
  return { ok: true };
}

export async function removeOrganizerMemberAction(orgId, userId) {
  try {
    await apiDelete(`/api/admin/organizations/${orgId}/members/${userId}`);
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

// --- Flags -------------------------------------------------------------------

/** action: dismiss | warn | restrict | deactivate */
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

// --- Platform settings ---------------------------------------------------------

/**
 * PATCH /api/admin/settings. Body shape mirrors `DEFAULT_SETTINGS` in
 * MFU-Events/backend/lib/constants.js exactly — the backend stores settings
 * as `{key, value}` rows and merges whatever is posted onto the current
 * values (`{ ...current, ...req.body }`), so a full object is safe to send.
 * The three `_tiers` fields are comma-separated ascending point thresholds.
 */
function parseTierList(raw, fieldLabel) {
  const pieces = String(raw ?? '')
    .split(',')
    .map((piece) => piece.trim())
    .filter(Boolean);
  const numbers = pieces.map(Number);
  if (numbers.length === 0 || numbers.some((n) => !Number.isFinite(n))) {
    throw new Error(`${fieldLabel} must be a comma-separated list of numbers.`);
  }
  return numbers;
}

function parseRequiredNumber(formData, field, label) {
  const value = Number(formData.get(field));
  if (!Number.isFinite(value)) throw new Error(`${label} must be a number.`);
  return value;
}

export async function updateSettingsAction(_prevState, formData) {
  let body;
  try {
    body = {
      negative_rating_cutoff: parseRequiredNumber(formData, 'negative_rating_cutoff', 'Negative rating cutoff'),
      sentiment_negative_threshold: parseRequiredNumber(
        formData,
        'sentiment_negative_threshold',
        'Sentiment negative threshold'
      ),
      negative_ratio_threshold: parseRequiredNumber(
        formData,
        'negative_ratio_threshold',
        'Negative ratio threshold'
      ),
      minimum_review_volume: parseRequiredNumber(formData, 'minimum_review_volume', 'Minimum review volume'),
      evaluation_window_days: parseRequiredNumber(formData, 'evaluation_window_days', 'Evaluation window (days)'),
      health_noshow_penalty: parseRequiredNumber(formData, 'health_noshow_penalty', 'No-show penalty'),
      health_review_reward: parseRequiredNumber(formData, 'health_review_reward', 'Review reward'),
      health_restriction_threshold: parseRequiredNumber(
        formData,
        'health_restriction_threshold',
        'Restriction threshold'
      ),
      health_starting_score: parseRequiredNumber(formData, 'health_starting_score', 'Starting health score'),
      checkin_window_grace_minutes: parseRequiredNumber(
        formData,
        'checkin_window_grace_minutes',
        'Check-in grace period (minutes)'
      ),
      review_edit_window_days: parseRequiredNumber(
        formData,
        'review_edit_window_days',
        'Review edit window (days)'
      ),
      sentiment_timeout_hours: parseRequiredNumber(
        formData,
        'sentiment_timeout_hours',
        'Sentiment timeout (hours)'
      ),
      attendee_tiers: parseTierList(formData.get('attendee_tiers'), 'Attendee tiers'),
      organizer_tiers: parseTierList(formData.get('organizer_tiers'), 'Organizer tiers'),
      contributor_tiers: parseTierList(formData.get('contributor_tiers'), 'Contributor tiers'),
    };
  } catch (error) {
    return { error: error.message };
  }

  try {
    await apiPatch('/api/admin/settings', body);
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/admin/settings');
  return { ok: true, message: 'Settings saved.' };
}
