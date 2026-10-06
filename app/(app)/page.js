import EventFeed from '../../components/events/EventFeed';
import PageContainer from '../../components/layout/PageContainer';
import { apiGet } from '../../lib/api';
import { requireUser } from '../../lib/session';

/**
 * Event feed — `GET /api/user/events`.
 *
 * `eventService.feedForUser` filters to the statuses a user may see, matches
 * `audience_type` against their school/year, applies `?search=` (title match)
 * and sorts by `start_time`. Grouping into rails happens in EventFeed.
 */
export default async function EventsFeedPage({ searchParams }) {
  const { search = '' } = await searchParams;
  const query = search.trim();
  const path = query
    ? `/api/user/events?search=${encodeURIComponent(query)}`
    : '/api/user/events';

  const [user, events] = await Promise.all([requireUser(), apiGet(path)]);

  const audience = [user.school, user.year].filter(Boolean).join(' and ');

  return (
    <PageContainer
      title={`Hello, ${user.name.split(' ')[0]}`}
      subtitle={
        audience
          ? `Events open to everyone, plus ${audience}.`
          : 'Events open to everyone.'
      }
    >
      <EventFeed events={events} query={query} />
    </PageContainer>
  );
}
