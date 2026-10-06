import Link from 'next/link';

import EmptyState from '../../../components/common/EmptyState';
import FilterTabs from '../../../components/admin/FilterTabs';
import FlagResolver from '../../../components/admin/FlagResolver';
import PermissionNotice from '../../../components/admin/PermissionNotice';
import StarRating from '../../../components/common/StarRating';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';
import { formatDate, healthBand } from '../../../lib/events';

export const metadata = { title: 'Flags · Admin · TripNest' };

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'actioned', label: 'Actioned' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: '', label: 'All' },
];

/**
 * Two automatic flags, both advisory until an admin acts:
 *
 *  - organizer flags, raised when a Main Organizer's negative-review ratio
 *    crosses the threshold within the evaluation window;
 *  - health flags, raised when a user's score falls below the restriction
 *    threshold. Neither restricts anything on its own.
 */
export default async function AdminFlagsPage({ searchParams }) {
  const { status = 'open' } = await searchParams;
  const suffix = status ? `?status=${encodeURIComponent(status)}` : '';

  const [organizerFlags, healthFlags] = await Promise.all([
    apiGetAllowed(`/api/admin/flags/organizers${suffix}`),
    apiGetAllowed(`/api/admin/flags/health${suffix}`),
  ]);

  if (organizerFlags === null && healthFlags === null) {
    return <PermissionNotice area="flags" />;
  }

  const evidence = await Promise.all(
    (organizerFlags ?? [])
      .filter((flag) => flag.status === 'open')
      .map(async (flag) => [
        flag.id,
        await apiGetAllowed(`/api/admin/flags/organizers/${flag.id}/evidence`),
      ])
  );
  const evidenceById = Object.fromEntries(evidence);

  return (
    <PageContainer
      title="Flags"
      subtitle="Raised automatically. Nothing happens to an account until you decide."
    >
      <FilterTabs options={FILTERS} active={status} basePath="/admin/flags" />

      <section className="page-section">
        <h2 className="section-title">
          Organizer flags ({organizerFlags?.length ?? 0})
        </h2>

        {!organizerFlags?.length ? (
          <div className="card card--padded">
            <EmptyState
              icon="heart"
              title="No organizer flags"
              message="Raised when a main organizer's negative-review ratio crosses the threshold."
            />
          </div>
        ) : (
          <ul className="stack">
            {organizerFlags.map((flag) => {
              const samples = evidenceById[flag.id] ?? [];
              return (
                <li className="card card--padded" key={flag.id}>
                  <div className="event-card__heading">
                    <h3 className="event-card__title">
                      <Link href={`/admin/users/${flag.flagged_user_id}`}>
                        {flag.flagged_user_id}
                      </Link>
                    </h3>
                    <span
                      className={`badge badge--${flag.status === 'open' ? 'danger' : 'neutral'}`}
                    >
                      {flag.status}
                    </span>
                  </div>

                  <p className="event-card__meta">
                    {Math.round(flag.negative_ratio * 100)}% negative across{' '}
                    {flag.review_count} reviews · raised {formatDate(flag.created_at)}
                    {flag.resolution_action ? ` · ${flag.resolution_action}` : ''}
                  </p>

                  {samples.length > 0 ? (
                    <ul className="stack">
                      {samples.map((review) => (
                        <li className="card card--padded review" key={review.id}>
                          <div className="review__head">
                            <StarRating value={review.rating} />
                            <span className="text-muted">
                              {formatDate(review.created_at)}
                            </span>
                            {review.sentiment_label ? (
                              <span className="badge badge--neutral">
                                {review.sentiment_label}
                              </span>
                            ) : null}
                          </div>
                          <p>{review.comment}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {flag.status === 'open' ? (
                    <FlagResolver flagId={flag.id} kind="organizer" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="page-section">
        <h2 className="section-title">Health flags ({healthFlags?.length ?? 0})</h2>

        {!healthFlags?.length ? (
          <div className="card card--padded">
            <EmptyState
              icon="heart"
              title="No health flags"
              message="Raised when an account's health score falls below the restriction threshold."
            />
          </div>
        ) : (
          <ul className="stack">
            {healthFlags.map((flag) => {
              const band = healthBand(flag.health_score_at_flag);
              return (
                <li className="card card--padded" key={flag.id}>
                  <div className="event-card__heading">
                    <h3 className="event-card__title">
                      <Link href={`/admin/users/${flag.user_id}`}>{flag.user_id}</Link>
                    </h3>
                    <span className={`badge badge--${band.variant}`}>
                      Score {flag.health_score_at_flag}
                    </span>
                  </div>

                  <p className="event-card__meta">
                    Raised {formatDate(flag.created_at)} · {flag.status}
                    {flag.resolution_action ? ` · ${flag.resolution_action}` : ''}
                  </p>

                  {flag.status === 'open' ? (
                    <FlagResolver flagId={flag.id} kind="health" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
