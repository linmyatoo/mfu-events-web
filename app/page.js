import EventFeed from '../components/events/EventFeed';
import PageContainer from '../components/layout/PageContainer';
import { mockEvents, mockUser } from '../data/mockData';

/**
 * Event feed — the shape of `GET /api/user/events`.
 *
 * The backend already filters by audience and sorts by `start_time`; the
 * grouping and title search happen in EventFeed.
 */
export default function EventsFeedPage() {
  return (
    <PageContainer
      title={`Hello, ${mockUser.name.split(' ')[0]}`}
      subtitle={`Events open to everyone, plus ${mockUser.school} and ${mockUser.year}.`}
    >
      <EventFeed events={mockEvents} />
    </PageContainer>
  );
}
