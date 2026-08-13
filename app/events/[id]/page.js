import Link from 'next/link';
import { notFound } from 'next/navigation';

import EventPoster from '../../../components/cards/EventPoster';
import Icon from '../../../components/common/Icon';
import BookingPanel from '../../../components/events/BookingPanel';
import QuestionsSection from '../../../components/events/QuestionsSection';
import ReviewsSection from '../../../components/events/ReviewsSection';
import { getEventDetail, mockUser } from '../../../data/mockData';
import {
  ORGANIZER_ROLE_LABELS,
  audienceLabel,
  formatEventWhen,
  initialsOf,
} from '../../../lib/events';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const event = getEventDetail(id);
  return { title: event ? `${event.title} · TripNest` : 'Event · TripNest' };
}

/** Detail view for one event — the shape of `GET /api/user/events/:id`. */
export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const event = getEventDetail(id);

  if (!event) notFound();

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
            {event.venue}
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
          </section>

          <section className="page-section">
            <h2 className="section-title">Organizers</h2>
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
          </section>

          <QuestionsSection event={event} user={mockUser} />

          {/* The API only returns reviews once the event has started. */}
          {event.isPast ? <ReviewsSection event={event} user={mockUser} /> : null}
        </div>

        <BookingPanel event={event} user={mockUser} />
      </div>
    </div>
  );
}
