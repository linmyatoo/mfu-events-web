import Link from 'next/link';
import { notFound } from 'next/navigation';

import EventRequestReview from '../../../../components/admin/EventRequestReview';
import RequesterHealthPanel from '../../../../components/admin/RequesterHealthPanel';
import Icon from '../../../../components/common/Icon';
import { ApiError, apiGet, apiGetAllowed } from '../../../../lib/api';
import { audienceLabel, eventRequestStatusMeta, formatEventWhen } from '../../../../lib/events';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const request = await apiGet(`/api/admin/event-requests/${id}`);
    return { title: `${request.title} · Event Requests · Admin · MFU-Events` };
  } catch {
    return { title: 'Event Request · Admin · MFU-Events' };
  }
}

/**
 * GET /api/admin/event-requests/:id — the raw `EventRequest` row plus
 * `requester` and `eligibility` (backend/routes/admin.js,
 * eventRequestService.eligibilitySnapshot). No embedded `org` — every
 * request now always carries an `org_id` (see list page comment), resolved
 * here via `GET /api/admin/organizations/:id` (Phase 6's route).
 */
export default async function AdminEventRequestDetailPage({ params }) {
  const { id } = await params;

  let request;
  try {
    request = await apiGet(`/api/admin/event-requests/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const org = request.org_id ? await apiGetAllowed(`/api/admin/organizations/${request.org_id}`) : null;

  const status = eventRequestStatusMeta(request.status);

  return (
    <div className="page-container">
      <Link href="/admin/event-requests" className="back-link">
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
          Requesting org: {org?.name ?? request.org_id ?? '—'}
        </p>
        <p className="event-detail__meta">
          <Icon name="user" size={16} />
          Requested by {request.requester?.name ?? request.requested_by}
        </p>
      </header>

      <div className="event-detail__layout">
        <div className="event-detail__main">
          <section className="page-section">
            <h2 className="section-title">Description</h2>
            <p>{request.description || 'No description.'}</p>
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

          <RequesterHealthPanel snapshot={request.eligibility} heading="Requester health" />

          {request.admin_feedback ? (
            <section className="page-section">
              <h2 className="section-title">Previous note to the requester</h2>
              <p className="notice notice--info">{request.admin_feedback}</p>
            </section>
          ) : null}
        </div>

        <EventRequestReview request={request} />
      </div>
    </div>
  );
}
