/**
 * Attendance points, derived from `GET /api/user/bookings`.
 *
 * The backend has no user-facing points endpoint: `pointsService` writes the
 * ledger, but only `/api/organizer` reads it back, and that route reports
 * `subject_type: 'creator'` (organizer rewards), not a user's attendance
 * points. Rather than add a route, this recomputes the same figure from data
 * the User API already returns.
 *
 * It mirrors `pointsService.awardAttendancePoints`: one row per booking the
 * moment it is marked `attended`, worth exactly `event.points_value`. Those
 * rows are written with `approval_status: 'n/a'`, so they always count toward
 * `balanceFor` — nothing here can drift from the server's own total.
 *
 * What it deliberately cannot show: organizer-earned points, admin
 * adjustments, and `sync_status`. None of those reach the User API.
 */

import { BOOKING_STATUS } from './events';

export function derivePoints(bookings = []) {
  const history = bookings
    .filter(
      (booking) =>
        booking.status === BOOKING_STATUS.ATTENDED &&
        booking.event?.points_value > 0
    )
    .map((booking) => ({
      id: `pt-${booking.id}`,
      booking_id: booking.id,
      event_id: booking.event_id,
      points: booking.event.points_value,
      reason: `Attended: ${booking.event.title}`,
      created_at: booking.checked_in_at ?? booking.booked_at,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return {
    balance: history.reduce((total, row) => total + row.points, 0),
    history,
  };
}
