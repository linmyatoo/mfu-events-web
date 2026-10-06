import BookingsList from '../../../components/bookings/BookingsList';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';

export const metadata = { title: 'My Bookings · MFU-Events' };

/**
 * GET /api/user/bookings — Booking rows with their Event embedded.
 *
 * The embedded event is the raw row (so `venue_id`, not a `venue` object);
 * the venue name lives on the event detail page.
 */
export default async function BookingsPage() {
  const bookings = await apiGet('/api/user/bookings');

  return (
    <PageContainer
      title="My Bookings"
      subtitle="Your reservations, check-in tokens and attendance history."
    >
      <BookingsList bookings={bookings.filter((booking) => booking.event)} />
    </PageContainer>
  );
}
