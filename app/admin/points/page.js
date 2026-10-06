import Link from 'next/link';

import EmptyState from '../../../components/common/EmptyState';
import PermissionNotice from '../../../components/admin/PermissionNotice';
import PointsResolver from '../../../components/admin/PointsResolver';
import PointsSyncButton from '../../../components/admin/PointsSyncButton';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';
import { formatDate, ORGANIZER_ROLE_LABELS } from '../../../lib/events';

export const metadata = { title: 'Points · Admin · MFU-Events' };

/**
 * GET /api/admin/points/pending — one `pointsTransactions` row per organizer
 * proposal, created when a point event is marked complete
 * (POST /api/admin/events/:id/complete). Nothing here credits automatically;
 * every row needs an explicit approve / adjust / reject (design doc Section 9).
 */
export default async function AdminPointsPage() {
  const pending = await apiGetAllowed('/api/admin/points/pending');

  if (pending === null) return <PermissionNotice area="events" />;

  return (
    <PageContainer
      title="Organizer points — approval queue"
      subtitle="Nothing here credits automatically — every proposal needs an explicit decision."
      actions={<PointsSyncButton />}
    >
      {pending.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="star"
            title="Nothing pending"
            message="All organizer-points proposals are resolved."
          />
        </div>
      ) : (
        <ul className="stack">
          {pending.map((tx) => (
            <li className="card card--padded" key={tx.id}>
              <div className="event-card__heading">
                <h3 className="event-card__title">{tx.reason}</h3>
                <span className="badge badge--warning">{tx.points} pts proposed</span>
              </div>

              <p className="event-card__meta">
                Organizer{' '}
                <Link href={`/admin/users/${tx.subject_id}`}>{tx.subject_id}</Link> ·{' '}
                {ORGANIZER_ROLE_LABELS[tx.organizer_role_at_award] ??
                  tx.organizer_role_at_award}{' '}
                · proposed {formatDate(tx.created_at)}
              </p>

              <PointsResolver transactionId={tx.id} defaultAmount={tx.points} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
