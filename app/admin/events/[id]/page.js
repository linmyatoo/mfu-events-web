import Link from 'next/link';
import { notFound } from 'next/navigation';

import Icon from '../../../../components/common/Icon';
import EventReview from '../../../../components/admin/EventReview';
import RequesterHealthPanel from '../../../../components/admin/RequesterHealthPanel';
import VenueAssigner from '../../../../components/admin/VenueAssigner';
import { ApiError, apiGet, apiGetAllowed } from '../../../../lib/api';
import {
  EVENT_STATUS,
  ORGANIZER_ROLE_LABELS,
  audienceLabel,
  eventStatusMeta,
  formatDate,
  formatEventWhen,
  initialsOf,
  venueName,
} from '../../../../lib/events';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const event = await apiGet(`/api/admin/events/${id}`);
    return { title: `${event.title} · Admin · MFU-Events` };
  } catch {
    return { title: 'Event · Admin · MFU-Events' };
  }
}

/** Venue assignment is only meaningful once an event is approved. */
const VENUE_STAGES = [EVENT_STATUS.APPROVED, EVENT_STATUS.VENUE_ASSIGNED];

export default async function AdminEventPage({ params }) {
  const { id } = await params;

  let event;
  try {
    event = await apiGet(`/api/admin/events/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const venues = VENUE_STAGES.includes(event.status)
    ? await apiGetAllowed(`/api/admin/venues/for-event/${id}`)
    : null;

  const status = eventStatusMeta(event.status);

  return (
    <div className="page-container">
      <Link href="/admin" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        All events
      </Link>

      <header className="event-detail__intro">
        <div className="event-detail__tags">
          <span className={`badge badge--${status.variant}`}>{status.label}</span>
          <span className="chip">{audienceLabel(event)}</span>
          {event.is_point_event ? (
            <span className="badge badge--info">
              Point event · base {event.organizer_points_base ?? 0}
            </span>
          ) : null}
        </div>

        <h1>{event.title}</h1>

        <p className="event-detail__meta">
          <Icon name="calendar" size={16} />
          {formatEventWhen(event)}
        </p>
        <p className="event-detail__meta">
          <Icon name="place" size={16} />
          {venueName(event)}
        </p>
        <p className="event-detail__meta">
          <Icon name="user" size={16} />
          Capacity {event.capacity}
          {event.expected_participants
            ? ` · expects ${event.expected_participants}`
            : ''}{' '}
          · registration closes {formatDate(event.registration_deadline)}
        </p>
        <p className="event-detail__meta">
          <Icon name="user" size={16} />
          {event.requester_snapshot
            ? `Requested by ${event.requester_snapshot.name}`
            : 'Created directly by the organizing team'}
        </p>
      </header>

      <div className="event-detail__layout">
        <div className="event-detail__main">
          <section className="page-section">
            <h2 className="section-title">Description</h2>
            <p>{event.description || 'No description.'}</p>
            {event.requirements ? (
              <p className="text-muted">Requirements: {event.requirements}</p>
            ) : null}
          </section>

          <RequesterHealthPanel snapshot={event.requester_snapshot} />

          <section className="page-section">
            <h2 className="section-title">Event team</h2>
            {(event.team ?? []).length === 0 ? (
              <p className="text-muted">Nobody is on this event&apos;s team.</p>
            ) : (
              <ul className="organizer-list">
                {event.team.map((member) => (
                  <li className="organizer" key={member.id}>
                    <span className="organizer__avatar" aria-hidden="true">
                      {initialsOf(member.user?.name ?? '')}
                    </span>
                    <span>
                      <span className="organizer__name">
                        {member.user?.name ?? 'Unknown'}
                      </span>
                      <span className="organizer__role text-muted">
                        {ORGANIZER_ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="page-section" aria-labelledby="contributors-heading">
            <h2 className="section-title" id="contributors-heading">
              Contributors ({(event.contributors ?? []).length})
            </h2>
            {(event.contributors ?? []).length === 0 ? (
              <p className="text-muted">No contributors on this event.</p>
            ) : (
              <ul className="organizer-list">
                {event.contributors.map((contributor) => (
                  <li className="organizer" key={contributor.id}>
                    <span className="organizer__avatar" aria-hidden="true">
                      {initialsOf(contributor.user?.name ?? '')}
                    </span>
                    <span>
                      <span className="organizer__name">
                        {contributor.user?.name ?? 'Unknown'}
                      </span>
                      <span className="organizer__role text-muted">
                        {contributor.position_title}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {venues ? <VenueAssigner event={event} venues={venues} /> : null}
        </div>

        <EventReview event={event} />
      </div>
    </div>
  );
}
