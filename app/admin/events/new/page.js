import Link from 'next/link';

import Icon from '../../../../components/common/Icon';
import PermissionNotice from '../../../../components/admin/PermissionNotice';
import PointEventForm from '../../../../components/admin/PointEventForm';
import { apiGetAllowed } from '../../../../lib/api';

export const metadata = { title: 'New point event · Admin · MFU-Events' };

/**
 * POST /api/admin/events — only Admin may create a point event (the backend
 * enforces this in eventService.createEvent, not just the UI), which is the
 * structural fix for organizers being unable to award points to themselves
 * (design doc Section 9).
 */
export default async function NewPointEventPage() {
  const allUsers = await apiGetAllowed('/api/admin/users');

  return (
    <div className="page-container">
      <Link href="/admin" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        All events
      </Link>

      <div className="page-header">
        <h1 className="page-header__title">New point event</h1>
        <p className="page-header__subtitle">
          Saved as a draft. It still goes through the usual review, venue, and
          publish steps — only the organizer-points fields are set here.
        </p>
      </div>

      {allUsers === null ? (
        <PermissionNotice area="users" />
      ) : (
        <PointEventForm users={allUsers.filter((u) => u.role !== 'admin')} />
      )}
    </div>
  );
}
