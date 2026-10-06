import CheckInScanner from '../../../components/organizer/CheckInScanner';
import EmptyState from '../../../components/common/EmptyState';
import Icon from '../../../components/common/Icon';
import Link from 'next/link';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';
import {
  EVENT_MANAGING_ROLES,
  eventStatusMeta,
  formatEventWhen,
  isPastEvent,
} from '../../../lib/events';
import { requireOrganizer } from '../../../lib/session';

export const metadata = { title: 'Check-in · TripNest' };

/**
 * Door check-in.
 *
 * The scanner resolves the event from the token itself, so it works for any
 * event the account is on the team for. The list below is a shortcut to the
 * attendee roster of events happening around now.
 */
export default async function CheckInPage() {
  const { memberships } = await requireOrganizer();
  const managing = memberships.filter((membership) =>
    EVENT_MANAGING_ROLES.includes(membership.role)
  );

  const lists = await Promise.all(
    managing.map((membership) =>
      apiGet(`/api/organizer/organizers/${membership.organizer_id}/events`)
    )
  );

  const now = new Date();
  const running = lists
    .flat()
    .filter(
      (event) =>
        ['published', 'registration_open', 'registration_closed'].includes(
          event.status
        ) && !isPastEvent(event, now)
    )
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <PageContainer
      title="Check-in"
      subtitle="Scan an attendee's token, or open an event to work through its list."
    >
      <section className="page-section">
        <CheckInScanner />
      </section>

      <section className="page-section">
        <h2 className="section-title">Upcoming events</h2>

        {running.length === 0 ? (
          <div className="card card--padded">
            <EmptyState
              icon="calendar"
              title="Nothing to run right now"
              message="Events appear here once they are published and still ahead."
            />
          </div>
        ) : (
          <ul className="stack">
            {running.map((event) => {
              const status = eventStatusMeta(event.status);
              return (
                <li className="card" key={event.id}>
                  <Link href={`/organizer/events/${event.id}`} className="event-card">
                    <div className="event-card__body">
                      <div className="event-card__heading">
                        <h3 className="event-card__title">{event.title}</h3>
                        <span className={`badge badge--${status.variant}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="event-card__meta">
                        <Icon name="calendar" size={16} />
                        {formatEventWhen(event)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
