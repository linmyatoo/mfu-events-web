import Icon from '../../../components/common/Icon';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';

export const metadata = { title: 'Recognition · MFU-Events' };

const CATEGORIES = [
  {
    key: 'attended',
    icon: 'ticket',
    label: 'Attendance',
    description: 'Events you attended and checked in to.',
  },
  {
    key: 'organized',
    icon: 'calendar',
    label: 'Organizing',
    description: 'Events you ran as the main organizer.',
  },
  {
    key: 'contributed',
    icon: 'user',
    label: 'Contributing',
    description: 'Events you helped out on as a contributor.',
  },
];

/**
 * GET /api/user/me/recognition —
 * `{ attended, organized, contributed }`, each `{ count, tier, title }`.
 *
 * Tiers/titles are live-computed from attendance, organizing, and
 * contributor history (see `recognitionService.recognitionForUser` in the
 * backend) — `title` is `null` until the account's tier has an assigned
 * title.
 */
export default async function RecognitionPage() {
  const recognition = await apiGet('/api/user/me/recognition');

  return (
    <PageContainer
      title="Recognition"
      subtitle="Tiers and titles earned from attending, organizing, and contributing to events."
    >
      <section className="page-section">
        <div className="stack">
          {CATEGORIES.map((category) => {
            const stat = recognition[category.key] || { count: 0, tier: 0, title: null };
            return (
              <div className="card card--padded stack" key={category.key}>
                <div className="booking-panel__row">
                  <div className="organizer">
                    <span className="organizer__avatar" aria-hidden="true">
                      <Icon name={category.icon} size={18} />
                    </span>
                    <span>
                      <span className="organizer__name">{category.label}</span>
                      <span className="organizer__role text-muted">
                        {category.description}
                      </span>
                    </span>
                  </div>
                  <span className="badge badge--info">Tier {stat.tier}</span>
                </div>

                <div className="booking-panel__row">
                  <div>
                    <p className="text-muted">Count</p>
                    <h2>{stat.count}</h2>
                  </div>
                  <span
                    className={`badge ${stat.title ? 'badge--success' : 'badge--neutral'}`}
                  >
                    {stat.title ?? 'Not yet earned'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PageContainer>
  );
}
