import Link from 'next/link';

import Disclosure from '../../../components/admin/Disclosure';
import EmptyState from '../../../components/common/EmptyState';
import PermissionNotice from '../../../components/admin/PermissionNotice';
import VenueForm from '../../../components/admin/VenueForm';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';

export const metadata = { title: 'Venues · Admin · MFU-Events' };

/** GET /api/admin/venues — university rooms. Only admins create or edit these. */
export default async function AdminVenuesPage() {
  const venues = await apiGetAllowed('/api/admin/venues');
  if (venues === null) return <PermissionNotice area="venues" />;

  return (
    <PageContainer
      title="Venues"
      subtitle="Rooms available for assignment. Organizers can only express a preference."
    >
      <Link href="/admin/venues/schedule" className="settings-tile">
        <span className="settings-tile__icon" aria-hidden="true">
          ▦
        </span>
        <span>See what is booked where</span>
      </Link>

      <section className="page-section">
        <h2 className="section-title">All venues ({venues.length})</h2>

        {venues.length === 0 ? (
          <div className="card card--padded">
            <EmptyState icon="place" title="No venues yet" />
          </div>
        ) : (
          <ul className="stack">
            {venues.map((venue) => (
              <li className="card card--padded" key={venue.id}>
                <div className="event-card__heading">
                  <h3 className="event-card__title">{venue.name}</h3>
                  <span
                    className={`badge badge--${venue.status === 'active' ? 'success' : 'neutral'}`}
                  >
                    {venue.status}
                  </span>
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

                <Disclosure label="Edit">
                  <VenueForm venue={venue} />
                </Disclosure>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="page-section">
        <h2 className="section-title">Add a venue</h2>
        <VenueForm />
      </section>
    </PageContainer>
  );
}
