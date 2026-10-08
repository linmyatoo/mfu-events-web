import Link from 'next/link';

import EmptyState from '../../../components/common/EmptyState';
import Icon from '../../../components/common/Icon';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';
import {
  STAFF_CALL_METHOD_LABELS,
  formatEventWhen,
  staffCallStatusMeta,
  staffCallTargetLabel,
} from '../../../lib/events';

export const metadata = { title: 'Staff Calls · MFU-Events' };

/**
 * GET /api/user/staff-calls — every open call across every event, each with
 * its embedded `event` (raw row — backend/routes/user.js:129-132). Closed
 * calls never appear here; they're only reachable by direct link.
 */
export default async function StaffCallsPage() {
  const calls = await apiGet('/api/user/staff-calls');

  return (
    <PageContainer
      title="Staff Calls"
      subtitle="Volunteer or apply to help organizers run their events."
    >
      {calls.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="user"
            title="No open staff calls"
            message="Check back later — organizers post calls here when they need help running an event."
          />
        </div>
      ) : (
        <ul className="stack">
          {calls.map((call) => {
            const status = staffCallStatusMeta(call.status);
            return (
              <li className="card" key={call.id}>
                <Link href={`/staff-calls/${call.id}`} className="event-card">
                  <div className="event-card__body">
                    <div className="event-card__heading">
                      <h3 className="event-card__title">{staffCallTargetLabel(call)}</h3>
                      <span className={`badge badge--${status.variant}`}>{status.label}</span>
                    </div>

                    {call.event ? (
                      <p className="event-card__meta">
                        <Icon name="calendar" size={16} />
                        {call.event.title} · {formatEventWhen(call.event)}
                      </p>
                    ) : null}

                    <div className="event-card__footer">
                      <span className="event-card__meta event-card__venue">
                        <Icon name="user" size={16} />
                        {STAFF_CALL_METHOD_LABELS[call.method] ?? call.method}
                      </span>
                      <span className="text-muted">
                        {call.slots_filled} / {call.slots_total} filled
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
