import Link from 'next/link';
import { notFound } from 'next/navigation';

import Icon from '../../../../components/common/Icon';
import UserActions from '../../../../components/admin/UserActions';
import PageContainer from '../../../../components/layout/PageContainer';
import { ApiError, apiGet } from '../../../../lib/api';
import { healthBand, initialsOf } from '../../../../lib/events';

export const metadata = { title: 'User · Admin · TripNest' };

function Row({ label, value }) {
  return (
    <div className="booking-panel__row">
      <span className="text-muted">{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  );
}

/** GET /api/admin/users/:id — the row plus `organizerStats`, computed at read time. */
export default async function AdminUserPage({ params }) {
  const { id } = await params;

  let user;
  try {
    user = await apiGet(`/api/admin/users/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const band = user.health_score == null ? null : healthBand(user.health_score);
  const stats = user.organizerStats ?? {};

  return (
    <PageContainer title={user.name}>
      <Link href="/admin/users" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        All users
      </Link>

      <section className="page-section">
        <div className="card card--padded stack">
          <div className="organizer">
            <span className="organizer__avatar" aria-hidden="true">
              {initialsOf(user.name)}
            </span>
            <span>
              <span className="organizer__name">{user.name}</span>
              <span className="organizer__role text-muted">{user.email}</span>
            </span>
          </div>

          <Row label="University ID" value={user.university_id} />
          <Row label="Role" value={user.role} />
          <Row label="School" value={user.school} />
          <Row label="Year" value={user.year} />
          <Row
            label="Status"
            value={<span className="badge badge--neutral">{user.status}</span>}
          />
          {band ? (
            <Row
              label="Health score"
              value={
                <span className={`badge badge--${band.variant}`}>
                  {user.health_score} · {band.label}
                </span>
              }
            />
          ) : null}
          <Row
            label="Booking"
            value={user.booking_restricted ? 'Restricted' : 'Allowed'}
          />

          <UserActions user={user} />
        </div>
      </section>

      <section className="page-section">
        <h2 className="section-title">As an organizer</h2>
        <div className="card card--padded stack">
          <Row label="Events hosted" value={stats.eventsHosted ?? 0} />
          <Row label="Reviews received" value={stats.reviewCount ?? 0} />
          <Row
            label="Average rating"
            value={stats.avgRating == null ? '—' : stats.avgRating.toFixed(1)}
          />
          <Row label="Organizer points" value={stats.organizerPoints ?? 0} />
        </div>
      </section>
    </PageContainer>
  );
}
