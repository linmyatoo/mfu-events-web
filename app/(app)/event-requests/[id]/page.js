import Link from 'next/link';
import { notFound } from 'next/navigation';

import Icon from '../../../../components/common/Icon';
import EventRequestForm from '../../../../components/events/EventRequestForm';
import { ApiError, apiGet } from '../../../../lib/api';
import {
  EVENT_REQUEST_STATUS,
  audienceLabel,
  eventRequestStatusMeta,
  formatEventWhen,
} from '../../../../lib/events';
import { getMyOrganizers } from '../../../../lib/session';
import { resubmitEventRequestAction } from '../../../actions';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const request = await apiGet(`/api/user/event-requests/${id}`);
    return { title: `${request.title} · Event Requests · MFU-Events` };
  } catch {
    return { title: 'Event Request · MFU-Events' };
  }
}

/**
 * GET /api/user/event-requests/:id — the raw `EventRequest` row (no
 * embedded `org`), scoped to the requester or an admin — 403 for anyone
 * else (backend/routes/user.js). The org name is resolved the same way as
 * the list page: cross-referenced against this account's own memberships.
 */
export default async function EventRequestDetailPage({ params }) {
  const { id } = await params;

  let request;
  let memberships;
  try {
    [request, memberships] = await Promise.all([
      apiGet(`/api/user/event-requests/${id}`),
      getMyOrganizers(),
    ]);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) notFound();
    throw error;
  }

  const status = eventRequestStatusMeta(request.status);
  const orgName =
    memberships.find((membership) => membership.org_id === request.org_id)?.org?.name ??
    request.org_id;

  return (
    <div className="page-container">
      <Link href="/event-requests" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        Event Requests
      </Link>

      <header className="event-detail__intro">
        <div className="event-detail__tags">
          <span className={`badge badge--${status.variant}`}>{status.label}</span>
          <span className="chip">{audienceLabel(request)}</span>
        </div>

        <h1>{request.title}</h1>

        <p className="event-detail__meta">
          <Icon name="calendar" size={16} />
          {formatEventWhen(request)}
        </p>
        <p className="event-detail__meta">
          <Icon name="place" size={16} />
          Requested for: {orgName}
        </p>
      </header>

      <section className="page-section">
        <h2 className="section-title">Description</h2>
        <p>{request.description || 'No description yet.'}</p>
        {request.agenda ? <p className="text-muted">Agenda: {request.agenda}</p> : null}
        {request.equipment_needs ? (
          <p className="text-muted">Equipment needs: {request.equipment_needs}</p>
        ) : null}
        {request.contact_phone ? (
          <p className="text-muted">Contact phone: {request.contact_phone}</p>
        ) : null}
        {request.venue_preference ? (
          <p className="text-muted">Venue preference: {request.venue_preference}</p>
        ) : null}
      </section>

      {request.status === EVENT_REQUEST_STATUS.NEEDS_INFO ? (
        <section className="page-section">
          <h2 className="section-title">Admin feedback</h2>
          <p className="notice notice--danger" role="alert">
            {request.admin_feedback ||
              'An admin asked for changes but left no additional notes.'}
          </p>

          <EventRequestForm
            action={resubmitEventRequestAction}
            request={request}
            orgName={orgName}
            submitLabel="Resubmit request"
          />
        </section>
      ) : request.status === EVENT_REQUEST_STATUS.REJECTED && request.admin_feedback ? (
        <section className="page-section">
          <h2 className="section-title">Admin feedback</h2>
          <p className="notice notice--danger" role="alert">
            {request.admin_feedback}
          </p>
        </section>
      ) : null}
    </div>
  );
}
