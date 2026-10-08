import Link from 'next/link';

import EmptyState from '../../../../components/common/EmptyState';
import Icon from '../../../../components/common/Icon';
import PermissionNotice from '../../../../components/admin/PermissionNotice';
import PageContainer from '../../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../../lib/api';
import { eventStatusMeta, formatEventWhen } from '../../../../lib/events';

export const metadata = { title: 'Venue schedule · Admin · MFU-Events' };

/**
 * GET /api/admin/venues/schedule — every venue with the events currently
 * holding it. "Holding" means a status in `BLOCKING_STATUSES`: approved,
 * venue_assigned, published, registration_open or registration_closed.
 */
export default async function VenueSchedulePage() {
  const schedule = await apiGetAllowed('/api/admin/venues/schedule');
  if (schedule === null) return <PermissionNotice area="venues" />;

  return (
    <PageContainer
      title="Venue schedule"
      subtitle="What each room is holding, and when."
    >
      <Link href="/admin/venues" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        All venues
      </Link>

      {schedule.map((venue) => (
        <section className="page-section" key={venue.id}>
          <h2 className="section-title">
            {venue.name}
            <span className="text-muted"> · capacity {venue.capacity}</span>
          </h2>

          {venue.events.length === 0 ? (
            <div className="card card--padded">
              <EmptyState icon="calendar" title="Nothing booked" />
            </div>
          ) : (
            <ul className="stack">
              {venue.events.map((event) => {
                const status = eventStatusMeta(event.status);
                return (
                  <li className="card" key={event.id}>
                    <Link href={`/admin/events/${event.id}`} className="event-card">
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
      ))}
    </PageContainer>
  );
}
