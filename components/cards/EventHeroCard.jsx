import Link from 'next/link';

import {
  audienceLabel,
  formatDate,
  initialsOf,
  venueName,
} from '../../lib/events';
import Icon from '../common/Icon';
import EventPoster from './EventPoster';

/**
 * Tall card for the horizontal rail.
 *
 * Mirrors the `_heroCard` in the Flutter home page: 280px wide, a 132px
 * image capped with an 18px radius, then title, location line and the
 * gradient pill aligned right.
 */
export default function EventHeroCard({ event }) {
  return (
    <Link href={`/events/${event.id}`} className="event-hero">
      <EventPoster
        src={event.poster_image_url}
        initials={initialsOf(event.title)}
        size="cover"
      />

      <div className="event-hero__body">
        <h3 className="event-hero__title">{event.title}</h3>

        <p className="event-hero__meta">
          <Icon name="place" size={16} />
          {venueName(event)}
        </p>

        <p className="event-hero__meta">
          <Icon name="calendar" size={16} />
          {formatDate(event.start_time)}
        </p>

        <div className="event-hero__footer">
          <span className="chip">{audienceLabel(event)}</span>
          {event.points_value > 0 ? (
            <span className="points-pill">+{event.points_value} pts</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
