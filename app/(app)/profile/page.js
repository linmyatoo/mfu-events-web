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

function Row({ label, value }) {
  return (
    <div className="booking-panel__row">
      <span className="text-muted">{label}</span>
      <span>{value ?? '—'}</span>
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
