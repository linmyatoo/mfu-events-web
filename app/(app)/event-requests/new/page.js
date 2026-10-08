import Link from 'next/link';

import Icon from '../../../../components/common/Icon';
import EventRequestForm from '../../../../components/events/EventRequestForm';
import { getMyOrganizers } from '../../../../lib/session';
import { submitEventRequestAction } from '../../../actions';

export const metadata = { title: 'New event request · MFU-Events' };

/**
 * POST /api/user/event-requests — `org_id` is required for every role
 * (student, faculty, staff), same active-membership sourcing/blocking rule
 * as `/organizer/events/new` (Phase 2's EventForm correction).
 *
 * `getMyOrganizers()` doesn't require the organizer-portal guard
 * (`requireOrganizer()`) — just a signed-in user, which `app/(app)/layout.js`
 * already enforces — so it's called directly here.
 */
export default async function NewEventRequestPage() {
  const memberships = await getMyOrganizers();
  // Membership being active doesn't guarantee the org itself is — same rule
  // as Phase 2's event-creation form.
  const eligible = memberships.filter((membership) => membership.org?.status === 'active');

  return (
    <div className="page-container">
      <Link href="/event-requests" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        Event Requests
      </Link>

      <div className="page-header">
        <h1 className="page-header__title">New event request</h1>
        <p className="page-header__subtitle">
          An admin reviews this before it becomes a draft event.
        </p>
      </div>

      {eligible.length === 0 ? (
        <div className="card card--padded">
          <p>
            You need to be an active member of an active organization to
            submit an event request. Contact your organization&apos;s manager
            or an admin to be added.
          </p>
        </div>
      ) : (
        <EventRequestForm
          action={submitEventRequestAction}
          organizers={eligible}
          submitLabel="Submit request"
        />
      )}
    </div>
  );
}
