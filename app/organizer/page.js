import Link from 'next/link';

import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';
import PageContainer from '../../components/layout/PageContainer';
import { apiGet } from '../../lib/api';
import {
  EVENT_MANAGING_ROLES,
  MEMBER_ROLE_LABELS,
  ORGANIZER_ROLE_LABELS,
  eventStatusMeta,
  formatEventWhen,
} from '../../lib/events';
import { requireOrganizer } from '../../lib/session';

export const metadata = { title: 'My Events · MFU-Events' };

/**
 * Events for every Organizer entity this account manages.
 *
 *   GET /api/organizer/my-organizers
 *   GET /api/organizer/organizers/:orgId/events
 *
 * Only owner / president / event_manager may manage events, so a plain
 * `member` membership is listed but not queried — the backend would 403.
 */
export default async function OrganizerEventsPage() {
  const { memberships } = await requireOrganizer();

  const managing = memberships.filter((membership) =>
    EVENT_MANAGING_ROLES.includes(membership.role)
  );

  const groups = await Promise.all(
    managing.map(async (membership) => ({
      membership,
      events: await apiGet(
        `/api/organizer/organizers/${membership.organizer_id}/events`
      ),
    }))
  );

  const canCreate = managing.length > 0;

  return (
    <PageContainer
      title="My Events"
      subtitle="Everything hosted by the organizers you belong to."
      actions={
        canCreate ? (
          <Button variant="primary" href="/organizer/events/new">
            <Icon name="calendar" size={18} />
            New event
          </Button>
        ) : null
      }
    >
      {!canCreate ? (
        <div className="card card--padded">
          <EmptyState
            icon="user"
            title="You are a member, not an event manager"
            message={
              'Creating and managing events needs the owner, president or ' +
              'event manager role in an organizer. An admin can change that.'
            }
          />
        </div>
      ) : null}

      {groups.map(({ membership, events }) => (
        <section className="page-section" key={membership.id}>
          <h2 className="section-title">
            {membership.organizer?.name ?? 'Organizer'}
            <span className="text-muted">
              {' '}
              · you are {MEMBER_ROLE_LABELS[membership.role] ?? membership.role}
            </span>
          </h2>

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
        </section>
      ))}
    </PageContainer>
  );
}
