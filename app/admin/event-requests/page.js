import Link from 'next/link';

import EmptyState from '../../../components/common/EmptyState';
import Icon from '../../../components/common/Icon';
import FilterTabs from '../../../components/admin/FilterTabs';
import PermissionNotice from '../../../components/admin/PermissionNotice';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';
import { eventRequestStatusMeta, formatEventWhen } from '../../../lib/events';

export const metadata = { title: 'Event Requests · Admin · MFU-Events' };

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'needs_info', label: 'Needs info' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

/**
 * GET /api/admin/event-requests — raw `EventRequest` rows with `requester`
 * embedded (backend/routes/admin.js), but no embedded `org`. Every request
 * now always carries an `org_id` (pre-existing seed requests `er1`/`er2`
 * are the only legitimate `null` case), so it's resolved here via a single
 * `GET /api/admin/organizations` fetch into a lookup map — admin has no
 * "my memberships" shortcut the way the user app's list page does.
 */
export default async function AdminEventRequestsPage({ searchParams }) {
  const { status = '' } = await searchParams;

  const [requests, organizations] = await Promise.all([
    apiGetAllowed(
      `/api/admin/event-requests${status ? `?status=${encodeURIComponent(status)}` : ''}`
    ),
    apiGetAllowed('/api/admin/organizations'),
  ]);

  if (requests === null) return <PermissionNotice area="event-requests" />;

  const orgNameById = Object.fromEntries(
    (organizations ?? []).map((org) => [org.id, org.name])
  );

  return (
    <PageContainer
      title="Event Requests"
      subtitle="Review requests submitted on behalf of an organization."
    >
      <FilterTabs options={FILTERS} active={status} basePath="/admin/event-requests" />

      {requests.length === 0 ? (
        <div className="card card--padded">
          <EmptyState icon="calendar" title="No requests match this filter" />
        </div>
      ) : (
        <ul className="stack">
          {requests.map((request) => {
            const meta = eventRequestStatusMeta(request.status);
            return (
              <li className="card" key={request.id}>
                <Link href={`/admin/event-requests/${request.id}`} className="event-card">
                  <div className="event-card__body">
                    <div className="event-card__heading">
                      <h3 className="event-card__title">{request.title}</h3>
                      <span className={`badge badge--${meta.variant}`}>{meta.label}</span>
                    </div>

                    <p className="event-card__meta">
                      <Icon name="calendar" size={16} />
                      {formatEventWhen(request)}
                    </p>

                    <div className="event-card__footer">
                      <span className="event-card__meta event-card__venue">
                        <Icon name="place" size={16} />
                        Requesting org: {orgNameById[request.org_id] ?? request.org_id ?? '—'}
                      </span>
                      <span className="event-card__meta">
                        Requested by {request.requester?.name ?? request.requested_by}
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
