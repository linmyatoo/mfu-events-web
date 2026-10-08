import Link from 'next/link';

import Icon from '../../../../components/common/Icon';
import EventForm from '../../../../components/organizer/EventForm';
import { apiGet } from '../../../../lib/api';
import { requireOrganizer } from '../../../../lib/session';
import { createEventAction } from '../../actions';

export const metadata = { title: 'New event · MFU-Events' };

/** POST /api/organizer/events — always creates a DRAFT; `org_id` is required. */
export default async function NewEventPage() {
  const { memberships } = await requireOrganizer();
  // The backend only checks active membership in an active org (`isMember()`
  // has no role condition) — not restricted to EVENT_MANAGING_ROLES.
  const eligible = memberships.filter((membership) => membership.org?.status === 'active');

  // No start/end time chosen yet, so every active venue reads as available —
  // same GET /api/organizer/venues used by the read-only venues page. Only
  // fetched when there's a form to show it in.
  const venues = eligible.length > 0 ? await apiGet('/api/organizer/venues') : [];

  return (
    <div className="page-container">
      <Link href="/organizer" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        My events
      </Link>

      <div className="page-header">
        <h1 className="page-header__title">New event</h1>
        <p className="page-header__subtitle">
          Saved as a draft. Nothing is visible to students until you submit it
          and an admin approves it.
        </p>
      </div>

      {eligible.length === 0 ? (
        <div className="card card--padded">
          <p>
            You need to be an active member of an active organization to
            create events. Contact your organization&apos;s manager or an
            admin to be added.
          </p>
        </div>
      ) : (
        <EventForm
          action={createEventAction}
          organizers={eligible}
          venues={venues}
          submitLabel="Create draft"
        />
      )}
    </div>
  );
}
