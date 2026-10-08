import Link from 'next/link';
import { notFound } from 'next/navigation';

import Icon from '../../../../components/common/Icon';
import StaffCallApplyForm from '../../../../components/events/StaffCallApplyForm';
import { ApiError, apiGet } from '../../../../lib/api';
import {
  STAFF_CALL_METHOD_LABELS,
  formatEventWhen,
  staffCallStatusMeta,
  staffCallTargetLabel,
  venueName,
} from '../../../../lib/events';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const call = await apiGet(`/api/user/staff-calls/${id}`);
    return { title: `${staffCallTargetLabel(call)} · Staff Calls · MFU-Events` };
  } catch {
    return { title: 'Staff Call · MFU-Events' };
  }
}

/**
 * GET /api/user/staff-calls/:id — the raw StaffCall row with its embedded
 * `event` (backend/routes/user.js:134-138). No ownership check on this
 * route — any signed-in user may view any call, open or closed.
 */
export default async function StaffCallDetailPage({ params }) {
  const { id } = await params;

  let call;
  try {
    call = await apiGet(`/api/user/staff-calls/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const status = staffCallStatusMeta(call.status);

  return (
    <div className="page-container">
      <Link href="/staff-calls" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        Staff Calls
      </Link>

      <header className="event-detail__intro">
        <div className="event-detail__tags">
          <span className={`badge badge--${status.variant}`}>{status.label}</span>
          <span className="chip">{STAFF_CALL_METHOD_LABELS[call.method] ?? call.method}</span>
        </div>

        <h1>{staffCallTargetLabel(call)}</h1>

        {call.event ? (
          <>
            <p className="event-detail__meta">
              <Icon name="calendar" size={16} />
              {call.event.title} · {formatEventWhen(call.event)}
            </p>
            <p className="event-detail__meta">
              <Icon name="place" size={16} />
              {venueName(call.event)}
            </p>
          </>
        ) : null}

        <p className="event-detail__meta">
          <Icon name="user" size={16} />
          {call.slots_filled} of {call.slots_total} slots filled
        </p>
      </header>

      <StaffCallApplyForm call={call} />
    </div>
  );
}
