import Link from 'next/link';
import { redirect } from 'next/navigation';

import Icon from '../../../../components/common/Icon';
import EventForm from '../../../../components/organizer/EventForm';
import { apiGet } from '../../../../lib/api';
import { EVENT_MANAGING_ROLES } from '../../../../lib/events';
import { requireOrganizer } from '../../../../lib/session';
import { createEventAction } from '../../actions';

export const metadata = { title: 'New event · TripNest' };

/** POST /api/organizer/organizers/:orgId/events — always creates a DRAFT. */
export default async function NewEventPage() {
  const { memberships } = await requireOrganizer();
  const managing = memberships.filter((membership) =>
    EVENT_MANAGING_ROLES.includes(membership.role)
  );

  if (managing.length === 0) redirect('/organizer');

  // No start/end time chosen yet, so every active venue reads as available —
  // same GET /api/organizer/venues used by the read-only venues page.
  const venues = await apiGet('/api/organizer/venues');

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

      <EventForm
        action={createEventAction}
        organizers={managing}
        venues={venues}
        submitLabel="Create draft"
      />
    </div>
  );
}
