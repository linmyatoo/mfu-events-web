import Link from 'next/link';
import { notFound } from 'next/navigation';

import EventPoster from '../../../../components/cards/EventPoster';
import Icon from '../../../../components/common/Icon';
import BookingPanel from '../../../../components/events/BookingPanel';
import QuestionsSection from '../../../../components/events/QuestionsSection';
import ReviewsSection from '../../../../components/events/ReviewsSection';
import { ApiError, apiGet } from '../../../../lib/api';
import { requireUser } from '../../../../lib/session';
import {
  ORGANIZER_ROLE_LABELS,
  audienceLabel,
  eventStatusMeta,
  formatEventWhen,
  initialsOf,
  venueName,
} from '../../../../lib/events';

/** GET /api/user/events/:id — feed row + isPast + questions[] + reviews[]. */
async function loadEvent(id) {
  try {
    return await apiGet(`/api/user/events/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const event = await loadEvent(id);
  return { title: event ? `${event.title} · MFU-Events` : 'Event · MFU-Events' };
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const [user, event, settings] = await Promise.all([
    requireUser(),
    loadEvent(id),
    apiGet('/api/user/settings'),
  ]);

  if (!event) notFound();

  const status = eventStatusMeta(event.status);

  return (
    <div className="page-container">
      <Link href="/" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        All events
      </Link>

      {/* Poster banner then title block — the Flutter detail page's carousel
          followed by the badge, title and location rows. */}
      <header className="event-detail__header">
        <EventPoster
          src={event.poster_image_url}
          initials={initialsOf(event.title)}
          size="banner"
        />

        <div className="event-detail__intro">
          <div className="event-detail__tags">
            <span className="chip">{audienceLabel(event)}</span>
            <span className={`badge badge--${status.variant}`}>{status.label}</span>
            {event.is_point_event ? (
              <span className="badge badge--info">Point event</span>
            ) : null}
            {event.isPast ? (
              <span className="badge badge--neutral">Past event</span>
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
          </p>
        </div>
      </header>

      <div className="event-detail__layout">
        <div className="event-detail__main">
          <section className="page-section">
            <h2 className="section-title">About this event</h2>
            <p>{event.description}</p>
            {event.requirements ? (
              <p className="text-muted">Requirements: {event.requirements}</p>
            ) : null}
          </section>

          <section className="page-section">
            <h2 className="section-title">Organizers</h2>
            {/* `organizer` is the Organizer entity that owns the event;
                `organizers` is the per-event team from EventOrganizer. */}
            {event.organizer ? (
              <p className="event-detail__meta">
                <Icon name="user" size={16} />
                Hosted by {event.organizer.name}
              </p>
            ) : null}
            {event.organizers.length === 0 ? (
              <p className="text-muted">No organizing team listed yet.</p>
            ) : (
              <ul className="organizer-list">
                {event.organizers.map((organizer) => (
                  <li className="organizer" key={`${organizer.name}-${organizer.role}`}>
                    <span className="organizer__avatar" aria-hidden="true">
                      {initialsOf(organizer.name)}
                    </span>
                    <span>
                      <span className="organizer__name">{organizer.name}</span>
                      <span className="organizer__role text-muted">
                        {ORGANIZER_ROLE_LABELS[organizer.role] ?? organizer.role}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <QuestionsSection event={event} user={user} />

          {/* The API only returns reviews once the event has started. */}
          {event.isPast ? (
            <ReviewsSection
              event={event}
              user={user}
              reviewEditWindowDays={settings.review_edit_window_days}
            />
          ) : null}
        </div>

        <BookingPanel event={event} user={user} />
      </div>
    </div>
  );
}
