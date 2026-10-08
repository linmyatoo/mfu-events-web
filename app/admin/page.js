import Link from 'next/link';

import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import FilterTabs from '../../components/admin/FilterTabs';
import PermissionNotice from '../../components/admin/PermissionNotice';
import PageContainer from '../../components/layout/PageContainer';
import { apiGetAllowed } from '../../lib/api';
import { eventStatusMeta, formatEventWhen, venueName } from '../../lib/events';

export const metadata = { title: 'Events · Admin · MFU-Events' };

/**
 * GET /api/admin/events — every event in every state, newest first.
 *
 * The filters mirror the lifecycle an admin actually works through:
 * submitted and under_review are the inbox, approved is waiting for a venue.
 */
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Needs venue' },
  { value: 'venue_assigned', label: 'Ready to publish' },
  { value: 'registration_closed', label: 'To complete' },
];

/** `GET /api/admin/events` embeds `team` (per-event organizers), not `organizer`. */
function mainOrganizerName(event) {
  return event.team?.find((member) => member.role === 'main_organizer')?.user?.name ?? null;
}

export default async function AdminEventsPage({ searchParams }) {
  const { status = '' } = await searchParams;
  const events = await apiGetAllowed(
    `/api/admin/events${status ? `?status=${encodeURIComponent(status)}` : ''}`
  );

  if (events === null) return <PermissionNotice area="events" />;

  return (
    <PageContainer
      title="Events"
      subtitle="Every event across the university, in every lifecycle state."
      actions={<Button href="/admin/events/new">+ New point event</Button>}
    >
      <FilterTabs options={FILTERS} active={status} basePath="/admin" />

      {events.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="calendar"
            title="Nothing here"
            message="No events match this filter."
          />
        </div>
      ) : (
        <ul className="stack">
          {events.map((event) => {
            const meta = eventStatusMeta(event.status);
            return (
              <li className="card" key={event.id}>
                <Link href={`/admin/events/${event.id}`} className="event-card">
                  <div className="event-card__body">
                    <div className="event-card__heading">
                      <h3 className="event-card__title">{event.title}</h3>
                      <span className={`badge badge--${meta.variant}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="event-card__meta">
                      <Icon name="calendar" size={16} />
                      {formatEventWhen(event)}
                    </p>

                    <div className="event-card__footer">
                      <span className="event-card__meta event-card__venue">
                        <Icon name="place" size={16} />
                        {venueName(event)}
                      </span>
                      <span className="chip">
                        {mainOrganizerName(event) ?? 'No organizer'}
                      </span>
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
