import EmptyState from '../../../components/common/EmptyState';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';
import { formatEventWhen } from '../../../lib/events';

export const metadata = { title: 'Venues · MFU-Events' };

/**
 * GET /api/organizer/venues?start_time&end_time.
 *
 * Read-only: organizers record a preference, an admin assigns the room. With
 * a time window the backend annotates each venue with `available` and the
 * `conflicts` that would block it.
 */
export default async function OrganizerVenuesPage({ searchParams }) {
  const { start_time: start = '', end_time: end = '' } = await searchParams;

  const query = new URLSearchParams();
  if (start) query.set('start_time', start);
  if (end) query.set('end_time', end);
  const suffix = query.toString() ? `?${query}` : '';

  const venues = await apiGet(`/api/organizer/venues${suffix}`);
  const windowed = Boolean(start && end);

  return (
    <PageContainer
      title="Venues"
      subtitle="Rooms an admin can assign. You express a preference on the event; the assignment is theirs."
    >
      <form className="card card--padded qa-form" method="get">
        <div className="field">
          <label className="field__label" htmlFor="start_time">
            Check availability from
          </label>
          <input
            id="start_time"
            name="start_time"
            type="datetime-local"
            className="input"
            defaultValue={start}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="end_time">
            until
          </label>
          <input
            id="end_time"
            name="end_time"
            type="datetime-local"
            className="input"
            defaultValue={end}
          />
        </div>
        <button className="btn btn--primary" type="submit">
          Check availability
        </button>
      </form>

      <section className="page-section">
        <h2 className="section-title">
          {windowed ? 'Availability in that window' : 'All active venues'}
        </h2>

        {venues.length === 0 ? (
          <div className="card card--padded">
            <EmptyState icon="place" title="No active venues" />
          </div>
        ) : (
          <ul className="stack">
            {venues.map((venue) => (
              <li className="card card--padded" key={venue.id}>
                <div className="event-card__heading">
                  <h3 className="event-card__title">{venue.name}</h3>
                  {windowed ? (
                    <span
                      className={`badge badge--${venue.available ? 'success' : 'danger'}`}
                    >
                      {venue.available ? 'Free' : 'Booked'}
                    </span>
                  ) : (
                    <span className="chip">Capacity {venue.capacity}</span>
                  )}
                </div>

                <p className="event-card__meta">
                  {[venue.building, venue.location].filter(Boolean).join(' · ')} ·
                  capacity {venue.capacity}
                </p>

                {venue.equipment?.length ? (
                  <div className="event-detail__tags">
                    {venue.equipment.map((piece) => (
                      <span className="chip" key={piece}>
                        {piece.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                ) : null}

                {venue.conflicts?.length ? (
                  <p className="text-muted">
                    Clashes with{' '}
                    {venue.conflicts
                      .map((clash) => `${clash.title} (${formatEventWhen(clash)})`)
                      .join('; ')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
