/**
 * Display helpers for the backend's Event / Booking / Points shapes.
 *
 * Enum values mirror MFU-Events/backend/lib/constants.js — keep them in sync
 * with that file rather than inventing new strings in components.
 */

export const BOOKING_STATUS = {
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
  ATTENDED: 'attended',
  NO_SHOW: 'no_show',
};

export const EVENT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  VENUE_ASSIGNED: 'venue_assigned',
  PUBLISHED: 'published',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

/** bookingService.createBooking only accepts these two statuses. */
export const BOOKABLE_STATUSES = [
  EVENT_STATUS.PUBLISHED,
  EVENT_STATUS.REGISTRATION_OPEN,
];

export const AUDIENCE_TYPE = { OPEN: 'open', SCHOOL: 'school', YEAR: 'year' };

/** EventOrganizer.role — the per-event team. */
export const ORGANIZER_ROLE_LABELS = {
  main_organizer: 'Main organizer',
  co_organizer: 'Co-organizer',
  checkin_staff: 'Check-in staff',
};

/** OrganizerMember.role — membership of an Organizer entity. */
export const MEMBER_ROLE_LABELS = {
  owner: 'Owner',
  president: 'President',
  event_manager: 'Event manager',
  member: 'Member',
};

/** Roles within an Organizer that may create and manage events. */
export const EVENT_MANAGING_ROLES = ['owner', 'president', 'event_manager'];

export const ORGANIZER_TYPE_LABELS = {
  individual: 'Individual',
  student_club: 'Student club',
  university_org: 'University org',
  faculty: 'Faculty',
  department: 'Department',
};

/**
 * All times render in the university's zone rather than the visitor's.
 * A fixed zone also keeps the server and client output identical, so the
 * formatted strings never cause a hydration mismatch.
 */
const TIME_ZONE = 'Asia/Bangkok';

// `18 Aug 2026` — the format AppDate.dayMonthYear produces in the mobile app.
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: '2-digit',
});

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  month: 'short',
});

export function formatDate(iso) {
  return iso ? dateFormatter.format(new Date(iso)) : '';
}

export function formatTime(iso) {
  return iso ? timeFormatter.format(new Date(iso)) : '';
}

/** "18 Aug 2026 · 14:00–16:00" */
export function formatEventWhen(event) {
  const date = formatDate(event.start_time);
  const start = formatTime(event.start_time);
  const end = formatTime(event.end_time);
  return end ? `${date} · ${start}–${end}` : `${date} · ${start}`;
}

/** Day + month for the small date block on booking tiles. */
export function dateBlock(iso) {
  const value = new Date(iso);
  return { day: dayFormatter.format(value), month: monthFormatter.format(value) };
}

/**
 * Venue name for display.
 *
 * `Event.venue_id` is nullable and stays null until Admin assigns a room, so
 * the user-facing endpoints embed `venue` as an object or null — never a
 * string. Organizers can record a free-text preference before assignment.
 */
export function venueName(event) {
  if (event.venue?.name) return event.venue.name;
  if (event.venue_preference) return `${event.venue_preference} (preference)`;
  return 'Venue to be announced';
}

/** Who the event is open to — `audience_type` plus its target field. */
export function audienceLabel(event) {
  if (event.audience_type === AUDIENCE_TYPE.SCHOOL) {
    return event.target_school ?? 'School only';
  }
  if (event.audience_type === AUDIENCE_TYPE.YEAR) {
    return event.target_year ?? 'Year only';
  }
  return 'Open to all';
}

const BOOKING_STATUS_META = {
  [BOOKING_STATUS.BOOKED]: { label: 'Booked', variant: 'info' },
  [BOOKING_STATUS.ATTENDED]: { label: 'Attended', variant: 'success' },
  [BOOKING_STATUS.CANCELLED]: { label: 'Cancelled', variant: 'neutral' },
  [BOOKING_STATUS.NO_SHOW]: { label: 'No-show', variant: 'danger' },
};

export function bookingStatusMeta(status) {
  return BOOKING_STATUS_META[status] ?? { label: status, variant: 'neutral' };
}

/** Every lifecycle state — the Organizer and Admin portals see all of them. */
const EVENT_STATUS_META = {
  [EVENT_STATUS.DRAFT]: { label: 'Draft', variant: 'neutral' },
  [EVENT_STATUS.SUBMITTED]: { label: 'Submitted', variant: 'warning' },
  [EVENT_STATUS.UNDER_REVIEW]: { label: 'Under review', variant: 'warning' },
  [EVENT_STATUS.APPROVED]: { label: 'Approved', variant: 'success' },
  [EVENT_STATUS.VENUE_ASSIGNED]: { label: 'Venue assigned', variant: 'success' },
  [EVENT_STATUS.PUBLISHED]: { label: 'Published', variant: 'info' },
  [EVENT_STATUS.REGISTRATION_OPEN]: { label: 'Registration open', variant: 'success' },
  [EVENT_STATUS.REGISTRATION_CLOSED]: { label: 'Registration closed', variant: 'neutral' },
  [EVENT_STATUS.COMPLETED]: { label: 'Completed', variant: 'neutral' },
  [EVENT_STATUS.REJECTED]: { label: 'Rejected', variant: 'danger' },
  [EVENT_STATUS.CANCELLED]: { label: 'Cancelled', variant: 'danger' },
};

/**
 * Backend-enforced transitions (`EVENT_TRANSITIONS` in constants.js).
 * Used to decide which lifecycle buttons to render; the server re-checks.
 */
export const EVENT_TRANSITIONS = {
  [EVENT_STATUS.DRAFT]: [EVENT_STATUS.SUBMITTED, EVENT_STATUS.CANCELLED],
  [EVENT_STATUS.SUBMITTED]: [EVENT_STATUS.UNDER_REVIEW],
  [EVENT_STATUS.UNDER_REVIEW]: [
    EVENT_STATUS.APPROVED,
    EVENT_STATUS.REJECTED,
    EVENT_STATUS.DRAFT,
  ],
  [EVENT_STATUS.APPROVED]: [EVENT_STATUS.VENUE_ASSIGNED, EVENT_STATUS.CANCELLED],
  [EVENT_STATUS.VENUE_ASSIGNED]: [
    EVENT_STATUS.PUBLISHED,
    EVENT_STATUS.REGISTRATION_OPEN,
    EVENT_STATUS.CANCELLED,
  ],
  [EVENT_STATUS.PUBLISHED]: [EVENT_STATUS.REGISTRATION_OPEN, EVENT_STATUS.CANCELLED],
  [EVENT_STATUS.REGISTRATION_OPEN]: [
    EVENT_STATUS.REGISTRATION_CLOSED,
    EVENT_STATUS.CANCELLED,
  ],
  [EVENT_STATUS.REGISTRATION_CLOSED]: [EVENT_STATUS.COMPLETED],
  [EVENT_STATUS.COMPLETED]: [],
  [EVENT_STATUS.REJECTED]: [],
  [EVENT_STATUS.CANCELLED]: [],
};

/**
 * Asia/Bangkok is UTC+7 with no daylight saving, so a fixed offset is exact.
 * `datetime-local` carries no zone, and the university's zone is the one the
 * organizer is thinking in — not the browser's or the server's.
 */
const TIME_ZONE_OFFSET = '+07:00';

export function canTransition(from, to) {
  return (EVENT_TRANSITIONS[from] ?? []).includes(to);
}

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in the university's zone. */
export function toLocalInput(iso) {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** Inverse of `toLocalInput` — a `datetime-local` value back to an ISO instant. */
export function fromLocalInput(value) {
  if (!value) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}${TIME_ZONE_OFFSET}`).toISOString();
}

export function eventStatusMeta(status) {
  return EVENT_STATUS_META[status] ?? { label: status, variant: 'neutral' };
}

/** The backend's `isPast`: it uses `end_time` and falls back to `start_time`. */
export function isPastEvent(event, now = new Date()) {
  return new Date(event.end_time || event.start_time) < now;
}

export function isRegistrationClosed(event, now = new Date()) {
  return !event.registration_deadline || new Date(event.registration_deadline) < now;
}

/**
 * The same rejections `bookingService.createBooking` raises, in the order it
 * checks them. Returns a human-readable reason, or null when booking is open.
 * Capacity is deliberately not checked here — the feed does not return a
 * booked count, so the server owns that one.
 */
export function bookingBlockedReason(event, user) {
  if (!BOOKABLE_STATUSES.includes(event.status)) {
    return event.status === EVENT_STATUS.CANCELLED
      ? 'This event was cancelled.'
      : 'This event is not open for booking.';
  }
  if (isRegistrationClosed(event)) return 'Registration has closed for this event.';
  if (user?.booking_restricted) {
    return 'Your account is currently restricted from booking new events.';
  }
  return null;
}

/** Bookings that still count as a live reservation. */
export function isActiveBooking(booking) {
  return (
    booking?.status === BOOKING_STATUS.BOOKED ||
    booking?.status === BOOKING_STATUS.ATTENDED
  );
}

/** Initials for the poster placeholder and the avatar circle. */
export function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * Health score band. Thresholds follow DEFAULT_SETTINGS in constants.js
 * (`health_restriction_threshold` is 40).
 */
export function healthBand(score) {
  if (score >= 70) return { label: 'Good standing', variant: 'success' };
  if (score >= 40) return { label: 'Watch', variant: 'warning' };
  return { label: 'At risk', variant: 'danger' };
}

/** `PointsTransaction.approval_status` — mirrors `APPROVAL_STATUS` in constants.js. */
export const APPROVAL_STATUS = {
  NA: 'n/a',
  PENDING: 'pending',
  APPROVED: 'approved',
  ADJUSTED: 'adjusted',
  REJECTED: 'rejected',
};

const APPROVAL_STATUS_META = {
  [APPROVAL_STATUS.NA]: { label: 'N/A', variant: 'neutral' },
  [APPROVAL_STATUS.PENDING]: { label: 'Pending', variant: 'warning' },
  [APPROVAL_STATUS.APPROVED]: { label: 'Approved', variant: 'success' },
  [APPROVAL_STATUS.ADJUSTED]: { label: 'Adjusted', variant: 'success' },
  [APPROVAL_STATUS.REJECTED]: { label: 'Rejected', variant: 'danger' },
};

export function pointsApprovalStatusMeta(status) {
  return APPROVAL_STATUS_META[status] ?? { label: status, variant: 'neutral' };
}
