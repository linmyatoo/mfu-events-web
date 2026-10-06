import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import Icon from '../../../../../components/common/Icon';
import EventForm from '../../../../../components/organizer/EventForm';
import { ApiError, apiGet } from '../../../../../lib/api';
import { EVENT_STATUS } from '../../../../../lib/events';
import { updateEventAction } from '../../../actions';

export const metadata = { title: 'Edit event · MFU-Events' };

/**
 * PATCH /api/organizer/events/:id.
 *
 * `eventService.updateEvent` refuses anything but DRAFT for a non-admin, so a
 * submitted event bounces back to its detail page rather than showing a form
 * whose every submit would fail.
 */
export default async function EditEventPage({ params }) {
  const { id } = await params;

  let event;
  try {
    event = await apiGet(`/api/organizer/events/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  if (event.status !== EVENT_STATUS.DRAFT) {
    redirect(`/organizer/events/${id}`);
  }

  // Annotated with this event's own window so its current venue_id (if any)
  // doesn't block itself — mirrors GET /api/organizer/venues?...&event_id=.
  const venues = await apiGet(
    `/api/organizer/venues?start_time=${encodeURIComponent(event.start_time)}&end_time=${encodeURIComponent(event.end_time)}&event_id=${event.id}`
  );

  return (
    <div className="page-container">
      <Link href={`/organizer/events/${id}`} className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        {event.title}
      </Link>

      <div className="page-header">
        <h1 className="page-header__title">Edit draft</h1>
        <p className="page-header__subtitle">
          A draft can be edited freely. Once submitted, only an admin can send
          it back for changes.
        </p>
      </div>

      <EventForm
        action={updateEventAction}
        event={event}
        venues={venues}
        submitLabel="Save draft"
      />
    </div>
  );
}
