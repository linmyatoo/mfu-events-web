import Link from 'next/link';

import EmptyState from '../../../components/common/EmptyState';
import FilterTabs from '../../../components/admin/FilterTabs';
import PermissionNotice from '../../../components/admin/PermissionNotice';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';
import { healthBand, initialsOf } from '../../../lib/events';

export const metadata = { title: 'Users · Admin · TripNest' };

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
  { value: 'pending', label: 'Pending' },
];

const STATUS_VARIANT = {
  active: 'success',
  suspended: 'warning',
  deactivated: 'danger',
  pending: 'neutral',
};

/** GET /api/admin/users — `?role=` and `?status=` are both supported. */
export default async function AdminUsersPage({ searchParams }) {
  const { status = '' } = await searchParams;
  const users = await apiGetAllowed(
    `/api/admin/users${status ? `?status=${encodeURIComponent(status)}` : ''}`
  );

  if (users === null) return <PermissionNotice area="users" />;

  return (
    <PageContainer title="Users" subtitle="Every account on the platform.">
      <FilterTabs options={FILTERS} active={status} basePath="/admin/users" />

      {users.length === 0 ? (
        <div className="card card--padded">
          <EmptyState icon="user" title="No users match this filter" />
        </div>
      ) : (
        <ul className="stack">
          {users.map((user) => {
            const band = user.health_score == null ? null : healthBand(user.health_score);
            return (
              <li className="card" key={user.id}>
                <Link href={`/admin/users/${user.id}`} className="event-card">
                  <span className="organizer__avatar" aria-hidden="true">
                    {initialsOf(user.name)}
                  </span>

                  <div className="event-card__body">
                    <div className="event-card__heading">
                      <h3 className="event-card__title">{user.name}</h3>
                      <span
                        className={`badge badge--${STATUS_VARIANT[user.status] ?? 'neutral'}`}
                      >
                        {user.status}
                      </span>
                    </div>

                    <p className="event-card__meta">
                      {user.email} · {user.role}
                      {user.school ? ` · ${user.school}` : ''}
                      {user.year ? ` · ${user.year}` : ''}
                    </p>

                    <div className="event-card__footer">
                      <span className="event-card__meta event-card__venue">
                        {user.university_id}
                      </span>
                      <span className="event-detail__tags">
                        {band ? (
                          <span className={`badge badge--${band.variant}`}>
                            Health {user.health_score}
                          </span>
                        ) : null}
                        {user.booking_restricted ? (
                          <span className="badge badge--danger">Booking restricted</span>
                        ) : null}
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
