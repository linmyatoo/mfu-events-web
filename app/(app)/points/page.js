import EmptyState from '../../../components/common/EmptyState';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';
import { formatDate } from '../../../lib/events';
import { derivePoints } from '../../../lib/points';

export const metadata = { title: 'Points · TripNest' };

/**
 * Attendance points.
 *
 * Computed from `GET /api/user/bookings` — see lib/points.js for why the
 * ledger is derived rather than fetched.
 */
export default async function PointsPage() {
  const bookings = await apiGet('/api/user/bookings');
  const { balance, history } = derivePoints(bookings);

  return (
    <PageContainer
      title="Points"
      subtitle="Points you earned by attending events, and how they were awarded."
    >
      <section className="page-section">
        <div className="card card--padded booking-panel__row">
          <div>
            <p className="text-muted">Current balance</p>
            <h2>{balance} pts</h2>
          </div>
          <span className="points-pill">{history.length} entries</span>
        </div>
      </section>

      <section className="page-section">
        <h2 className="section-title">Ledger</h2>

        {history.length === 0 ? (
          <div className="card card--padded">
            <EmptyState
              icon="sparkle"
              title="No points yet"
              message="Attend a point-earning event and the award shows up here."
            />
          </div>
        ) : (
          <ul className="stack">
            {history.map((entry) => (
              <li className="card card--padded" key={entry.id}>
                <div className="event-card__heading">
                  <h3 className="event-card__title">{entry.reason}</h3>
                  <span className="points-pill">+{entry.points} pts</span>
                </div>
                <p className="event-card__meta">{formatDate(entry.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
