import EmptyState from '../../../components/common/EmptyState';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';
import { formatDate, healthBand } from '../../../lib/events';

export const metadata = { title: 'Account Health · TripNest' };

/**
 * GET /api/user/me/health — `{ score, bookingRestricted, openFlag, history }`.
 *
 * Crossing the restriction threshold only raises a flag for Admin to review;
 * the account is never restricted automatically (healthService.maybeRaiseFlag),
 * so `openFlag` and `bookingRestricted` are shown as separate facts.
 */
function deltaVariant(delta) {
  if (delta > 0) return 'success';
  if (delta < 0) return 'danger';
  return 'neutral';
}

export default async function HealthPage() {
  const health = await apiGet('/api/user/me/health');
  const band = healthBand(health.score ?? 0);

  return (
    <PageContainer
      title="Account Health"
      subtitle="No-shows lower your score; reviewing events you attended raises it."
    >
      <section className="page-section">
        <div className="card card--padded booking-panel__row">
          <div>
            <p className="text-muted">Health score</p>
            <h2>{health.score ?? '—'}</h2>
          </div>
          <span className={`badge badge--${band.variant}`}>{band.label}</span>
        </div>
      </section>

      {health.bookingRestricted ? (
        <p className="notice notice--info" role="status">
          An admin has restricted this account from booking new events.
        </p>
      ) : null}

      {health.openFlag ? (
        <p className="notice notice--info" role="status">
          Your account was flagged for review on{' '}
          {formatDate(health.openFlag.created_at)} at a score of{' '}
          {health.openFlag.health_score_at_flag}. An admin decides what happens
          next — booking still works until they act.
        </p>
      ) : null}

      <section className="page-section">
        <h2 className="section-title">History</h2>

        {health.history.length === 0 ? (
          <div className="card card--padded">
            <EmptyState
              icon="heart"
              title="Nothing has changed your score"
              message="Your score only moves when you miss an event or review one you attended."
            />
          </div>
        ) : (
          <ul className="stack">
            {health.history.map((entry) => (
              <li className="card card--padded" key={entry.id}>
                <div className="event-card__heading">
                  <h3 className="event-card__title">{entry.reason}</h3>
                  <span className={`badge badge--${deltaVariant(entry.delta)}`}>
                    {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                  </span>
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
