import Link from 'next/link';

import EmptyState from '../../../components/common/EmptyState';
import FilterTabs from '../../../components/admin/FilterTabs';
import NewOrganizerForm from '../../../components/admin/NewOrganizerForm';
import PermissionNotice from '../../../components/admin/PermissionNotice';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';
import { ORGANIZER_TYPE_LABELS } from '../../../lib/events';

export const metadata = { title: 'Organizers · Admin · MFU-Events' };

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const STATUS_VARIANT = {
  active: 'success',
  pending: 'warning',
  inactive: 'neutral',
};

/**
 * GET /api/admin/organizations — optional affiliations a user can join.
 * Status flow is pending → active (activate/deactivate), not approve/reject.
 */
export default async function AdminOrganizersPage({ searchParams }) {
  const { status = '' } = await searchParams;
  const organizers = await apiGetAllowed(
    `/api/admin/organizations${status ? `?status=${encodeURIComponent(status)}` : ''}`
  );

  if (organizers === null) return <PermissionNotice area="organizers" />;

  return (
    <PageContainer
      title="Organizers"
      subtitle="Clubs, departments and offices that can run events."
    >
      <FilterTabs options={FILTERS} active={status} basePath="/admin/organizers" />

      {organizers.length === 0 ? (
        <div className="card card--padded">
          <EmptyState icon="home" title="No organizers match this filter" />
        </div>
      ) : (
        <ul className="stack">
          {organizers.map((organizer) => (
            <li className="card" key={organizer.id}>
              <Link
                href={`/admin/organizers/${organizer.id}`}
                className="event-card"
              >
                <div className="event-card__body">
                  <div className="event-card__heading">
                    <h3 className="event-card__title">{organizer.name}</h3>
                    <span
                      className={`badge badge--${STATUS_VARIANT[organizer.status] ?? 'neutral'}`}
                    >
                      {organizer.status}
                    </span>
                  </div>

                  <p className="event-card__meta">
                    {ORGANIZER_TYPE_LABELS[organizer.type] ?? organizer.type}
                  </p>

                  <div className="event-card__footer">
                    <span className="event-card__meta event-card__venue">
                      {organizer.description || 'No description'}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="page-section">
        <h2 className="section-title">Create an organizer</h2>
        <NewOrganizerForm />
      </section>
    </PageContainer>
  );
}
