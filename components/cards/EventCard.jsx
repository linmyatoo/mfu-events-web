import Link from 'next/link';

import {
  bookingStatusMeta,
  formatEventWhen,
  initialsOf,
} from '../../lib/events';
import Icon from '../common/Icon';
import EventPoster from './EventPoster';

/**
 * Event row for the vertical feed list.
 *
 * Layout follows the Flutter `EventCard` widget: flat white card, radius 16,
 * 12px padding, a 92×72 thumbnail on the left, then title / meta line /
 * footer row with the gradient pill pushed to the right.
 */
export default function EventCard({ event }) {
  const booking = event.myBooking;
  const status = booking ? bookingStatusMeta(booking.status) : null;

  return (
    <Link href={`/events/${event.id}`} className="event-card">
      <EventPoster
        src={event.poster_image_url}
        initials={initialsOf(event.title)}
      />

      <div className="event-card__body">
        <div className="event-card__heading">
          <h3 className="event-card__title">{event.title}</h3>
          {status ? (
            <span className={`badge badge--${status.variant}`}>{status.label}</span>
          ) : null}
        </div>

        <p className="event-card__meta">
          <Icon name="calendar" size={16} />
          {formatEventWhen(event)}
        </p>

        <div className="event-card__footer">
          <span className="event-card__meta event-card__venue">
            <Icon name="place" size={16} />
            {event.venue}
          </span>
          {event.points_value > 0 ? (
            <span className="points-pill">+{event.points_value} pts</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
