import Link from 'next/link';

import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';
import PageContainer from '../../components/layout/PageContainer';
import { apiGet } from '../../lib/api';
import {
  ORGANIZER_ROLE_LABELS,
  eventStatusMeta,
  formatEventWhen,
} from '../../lib/events';
import { requireOrganizer } from '../../lib/session';

export const metadata = { title: 'My Events · MFU-Events' };

/**
 * Events this account is on the team for (any role).
 *
 *   GET /api/organizer/events
 *
 * Any authenticated user can create an event (subject to active org
 * membership, enforced on the create form), so "New event" is always
 * available here.
 */
export default async function OrganizerEventsPage() {
  await requireOrganizer();

  const events = await apiGet('/api/organizer/events');

  return (
    <PageContainer
      title="My Events"
      subtitle="Everything you organize or help run."
      actions={
        <Button variant="primary" href="/organizer/events/new">
          <Icon name="calendar" size={18} />
          New event
        </Button>
      }
    >
      {events.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="calendar"
            title="No events yet"
            message="Create a draft and submit it for university review."
            action={
              <Button variant="primary" href="/organizer/events/new">
                New event
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="stack">
          {events.map((event) => {
            const status = eventStatusMeta(event.status);
            return (
              <li className="card" key={event.id}>
                <Link
                  href={`/organizer/events/${event.id}`}
                  className="event-card"
                >
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

                    <div className="event-card__footer">
                      <span className="event-card__meta event-card__venue">
                        <Icon name="user" size={16} />
                        {event.myRole
                          ? (ORGANIZER_ROLE_LABELS[event.myRole] ?? event.myRole)
                          : 'Not on the event team'}
                      </span>
                      <span className="chip">Capacity {event.capacity}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
