import Link from 'next/link';

import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import Icon from '../../../components/common/Icon';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';
import { eventRequestStatusMeta, formatEventWhen } from '../../../lib/events';
import { getMyOrganizers } from '../../../lib/session';

export const metadata = { title: 'Event Requests · MFU-Events' };

/**
 * GET /api/user/me/event-requests — this account's own requests, newest
 * first. Rows are the raw `EventRequest` record (no embedded `org`), so the
 * org name is resolved from this account's own memberships instead — a
 * request can only exist for an org this account belongs (or belonged) to.
 */
export default async function EventRequestsPage() {
  const [requests, memberships] = await Promise.all([
    apiGet('/api/user/me/event-requests'),
    getMyOrganizers(),
  ]);

  const orgName = (orgId) =>
    memberships.find((membership) => membership.org_id === orgId)?.org?.name;

  return (
    <PageContainer
      title="Event Requests"
      subtitle="Ask an admin to turn an idea into a draft event."
      actions={
        <Button variant="primary" href="/event-requests/new">
          <Icon name="calendar" size={18} />
          New request
        </Button>
      }
    >
      {requests.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="calendar"
            title="No requests yet"
            message="Submit a request on behalf of an organization you belong to."
            action={
              <Button variant="primary" href="/event-requests/new">
                New request
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="stack">
          {requests.map((request) => {
            const status = eventRequestStatusMeta(request.status);
            return (
              <li className="card" key={request.id}>
                <Link href={`/event-requests/${request.id}`} className="event-card">
                  <div className="event-card__body">
                    <div className="event-card__heading">
                      <h3 className="event-card__title">{request.title}</h3>
                      <span className={`badge badge--${status.variant}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="event-card__meta">
                      <Icon name="calendar" size={16} />
                      {formatEventWhen(request)}
                    </p>

                    <div className="event-card__footer">
                      <span className="event-card__meta event-card__venue">
                        <Icon name="place" size={16} />
                        Requested for: {orgName(request.org_id) ?? request.org_id}
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
