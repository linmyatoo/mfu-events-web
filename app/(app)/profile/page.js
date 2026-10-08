import Icon from '../../../components/common/Icon';
import LogoutButton from '../../../components/auth/LogoutButton';
import PageContainer from '../../../components/layout/PageContainer';
import { requireUser } from '../../../lib/session';
import { healthBand, initialsOf } from '../../../lib/events';

export const metadata = { title: 'Profile · MFU-Events' };

const TILES = [
  { href: '/bookings', label: 'My bookings', icon: 'ticket' },
  { href: '/points', label: 'Points', icon: 'sparkle' },
  { href: '/health', label: 'Account health', icon: 'heart' },
];

function Stat({ label, value }) {
  return (
    <div className="profile-stat">
      <span className="profile-stat__label">{label}</span>
      <span className="profile-stat__value">{value ?? '—'}</span>
    </div>
  );
}

/**
 * GET /api/user/me — organizer org memberships are no longer shown here;
 * see GET /api/organizer/my-organizers (lib/session.js's getMyOrganizers())
 * for membership data, used by the organizer/admin portals instead.
 */
export default async function ProfilePage() {
  const user = await requireUser();

  const band = user.health_score == null ? null : healthBand(user.health_score);

  return (
    <PageContainer title="Profile">
      <section className="page-section">
        <div className="card card--padded profile-hero">
          <span className="organizer__avatar profile-hero__avatar" aria-hidden="true">
            {initialsOf(user.name)}
          </span>
          <span className="profile-hero__info">
            <span className="profile-hero__name">{user.name}</span>
            <span className="profile-hero__email text-muted">{user.email}</span>
          </span>
          <span className="badge badge--info profile-hero__badge">{user.role}</span>
        </div>
      </section>

      <section className="page-section">
        <div className="profile-stats">
          <Stat label="University ID" value={user.university_id} />
          <Stat
            label="Account status"
            value={<span className="badge badge--neutral">{user.status}</span>}
          />
          <Stat label="School" value={user.school} />
          <Stat label="Year" value={user.year} />
          {band ? (
            <Stat
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

      <section className="page-section">
        <h2 className="section-title">Shortcuts</h2>
        <div className="profile-tiles">
          {TILES.map((tile) => (
            <a className="settings-tile" href={tile.href} key={tile.href}>
              <span className="settings-tile__icon">
                <Icon name={tile.icon} size={18} />
              </span>
              <span>{tile.label}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="page-section profile-signout">
        <LogoutButton />
      </section>
    </PageContainer>
  );
}
