import { healthBand } from '../../lib/events';

function Row({ label, value }) {
  return (
    <div className="booking-panel__row">
      <span className="text-muted">{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  );
}

/**
 * Requester health snapshot — shared shape between `event.requester_snapshot`
 * (`app/admin/events/[id]/page.js`, created-events path) and `eligibility`
 * (`app/admin/event-requests/[id]/page.js`, pre-approval path). The two
 * backend shapes overlap almost completely but don't share a field name for
 * the organizer-events count (`organizer_events_count` vs `events_organized`),
 * so both are read here.
 */
export default function RequesterHealthPanel({ snapshot, heading = 'Requester health' }) {
  if (!snapshot) return null;

  const eventsOrganized = snapshot.events_organized ?? snapshot.organizer_events_count ?? 0;

  return (
    <section className="page-section" aria-labelledby="requester-health-heading">
      <h2 className="section-title" id="requester-health-heading">
        {heading}
      </h2>
      <div className="card card--padded stack">
        <Row label="Requester" value={snapshot.name} />
        <Row
          label="Health score"
          value={
            snapshot.health_score == null ? (
              '—'
            ) : (
              <span className={`badge badge--${healthBand(snapshot.health_score).variant}`}>
                {snapshot.health_score} · {healthBand(snapshot.health_score).label}
              </span>
            )
          }
        />
        <Row
          label="Organizer status"
          value={
            snapshot.organizer_restricted ? (
              <span className="badge badge--danger">Restricted</span>
            ) : (
              <span className="badge badge--success">In good standing</span>
            )
          }
        />
        <Row label="Events organized" value={eventsOrganized} />
        <Row label="Open health flags" value={snapshot.open_health_flags} />
        <Row label="Open organizer flags" value={snapshot.open_organizer_flags} />
      </div>
    </section>
  );
}
