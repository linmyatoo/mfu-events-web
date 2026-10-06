import EmptyState from '../../../components/common/EmptyState';
import FilterTabs from '../../../components/admin/FilterTabs';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';
import { formatDate, formatTime } from '../../../lib/events';

export const metadata = { title: 'Activity · Admin · MFU-Events' };

/**
 * GET /api/admin/logs — `?type=` matches the prefix before the first dot in
 * `action_type` (`event.create`, `admin.approve_event`, …).
 *
 * Anonymous reviews are logged with a null actor on purpose, so the log
 * cannot be used to work out who wrote one.
 */
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'event', label: 'Events' },
  { value: 'booking', label: 'Bookings' },
  { value: 'checkin', label: 'Check-in' },
  { value: 'review', label: 'Reviews' },
  { value: 'flag', label: 'Flags' },
];

export default async function AdminLogsPage({ searchParams }) {
  const { status: type = '' } = await searchParams;
  const logs = await apiGetAllowed(
    `/api/admin/logs?limit=200${type ? `&type=${encodeURIComponent(type)}` : ''}`
  );

  if (logs === null) {
    return (
      <PageContainer title="Activity">
        <div className="card card--padded">
          <EmptyState icon="search" title="Activity log unavailable" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Activity"
      subtitle="What happened across the platform, newest first."
    >
      <FilterTabs options={FILTERS} active={type} basePath="/admin/logs" />

      {logs.length === 0 ? (
        <div className="card card--padded">
          <EmptyState icon="search" title="Nothing logged for this filter" />
        </div>
      ) : (
        <ul className="stack">
          {logs.map((entry) => (
            <li className="card card--padded" key={entry.id}>
              <div className="event-card__heading">
                <h3 className="event-card__title">{entry.action_type}</h3>
                <span className="chip">
                  {formatDate(entry.created_at)} {formatTime(entry.created_at)}
                </span>
              </div>

              <p className="event-card__meta">
                {entry.actor_id ?? 'system / anonymous'} → {entry.target_type}
                {entry.target_id ? ` ${entry.target_id}` : ''}
              </p>

              {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                <p className="text-muted">
                  {Object.entries(entry.metadata)
                    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                    .join(' · ')}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
