import Icon from '../../../components/common/Icon';
import LogoutButton from '../../../components/auth/LogoutButton';
import PageContainer from '../../../components/layout/PageContainer';
import { ApiError, apiGet } from '../../../lib/api';
import { requireUser } from '../../../lib/session';
import { healthBand, initialsOf } from '../../../lib/events';

export const metadata = { title: 'Profile · TripNest' };

const TILES = [
  { href: '/bookings', label: 'My bookings', icon: 'ticket' },
  { href: '/points', label: 'Points', icon: 'sparkle' },
  { href: '/health', label: 'Account health', icon: 'heart' },
  { href: '/items', label: 'Equipment catalogue', icon: 'search' },
];

function Row({ label, value }) {
  return (
    <div className="booking-panel__row">
      <span className="text-muted">{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  );
}

/**
 * GET /api/user/me plus the organizer memberships from
 * GET /api/user/me/organizers — a user can belong to an Organizer entity
 * without that changing their role here (organizer is an entity, not a role).
 */
export default async function ProfilePage() {
  const user = await requireUser();

  let organizers = [];
  try {
    organizers = await apiGet('/api/user/me/organizers');
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }

  const band = user.health_score == null ? null : healthBand(user.health_score);

  return (
    <PageContainer title="Profile">
      <section className="page-section">
        {/* `.stack`, not `.booking-panel` — the latter is the sticky detail rail. */}
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
            label="Account status"
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
        </div>
      </section>

      {organizers.length > 0 ? (
        <section className="page-section">
          <h2 className="section-title">Organizer memberships</h2>
          <ul className="stack">
            {organizers.map((membership) => (
              <li
                className="card card--padded"
                key={membership.id ?? membership.organizer_id}
              >
                <div className="event-card__heading">
                  <h3 className="event-card__title">
                    {membership.organizer?.name ?? 'Organizer'}
                  </h3>
                  <span className="badge badge--info">
                    {(membership.role ?? '').replace('_', ' ')}
                  </span>
                </div>
                <p className="event-card__meta">
                  Event management happens in the organizer app.
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="page-section">
        <h2 className="section-title">Shortcuts</h2>
        <div className="stack">
          {TILES.map((tile) => (
            <a className="settings-tile" href={tile.href} key={tile.href}>
              <span className="settings-tile__icon">
                <Icon name={tile.icon} size={18} />
              </span>
              <span>{tile.label}</span>
              <Icon
                name="chevronRight"
                size={18}
                className="settings-tile__chevron"
              />
            </a>
          ))}
        </div>
      </section>

      <section className="page-section">
        <LogoutButton />
      </section>
    </PageContainer>
  );
}
