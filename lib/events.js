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

export const AUDIENCE_TYPE = { OPEN: 'open', SCHOOL: 'school', YEAR: 'year' };

export const ORGANIZER_ROLE_LABELS = {
  main_organizer: 'Main organizer',
  co_organizer: 'Co-organizer',
  checkin_staff: 'Check-in staff',
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

/** The backend's `isPast`: an event is past once it has started. */
export function isPastEvent(event, now = new Date()) {
  return new Date(event.start_time) < now;
}

export function isRegistrationClosed(event, now = new Date()) {
  return new Date(event.registration_deadline) < now;
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
