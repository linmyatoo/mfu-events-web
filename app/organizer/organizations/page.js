import Link from 'next/link';

import EmptyState from '../../../components/common/EmptyState';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';
import { ORGANIZER_TYPE_LABELS } from '../../../lib/events';
import { requireOrganizer } from '../../../lib/session';

export const metadata = { title: 'My Organizations · Organizer · MFU-Events' };

/**
 * Orgs where the signed-in user is `org_manager`.
 *
 *   GET /api/org/my-orgs — returns org objects directly (not membership rows),
 *   `[]` for a user who is not an org_manager anywhere (not an error — see
 *   Phase 23 notes in plan.md). This is the real authorization boundary for
 *   the applications queue, so it's called directly rather than re-deriving
 *   org_manager-ness from `getMyOrganizers()`.
 */
export default async function OrganizerOrganizationsPage() {
  await requireOrganizer();

  const orgs = await apiGet('/api/org/my-orgs');

  return (
    <PageContainer
      title="My Organizations"
      subtitle="Organizations you manage — review join requests and control who can apply."
    >
      {orgs.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="home"
            title="You are not an org_manager of any organization"
            message="Ask an existing manager or an admin to promote you."
          />
        </div>
      ) : (
        <ul className="stack">
          {orgs.map((org) => (
            <li className="card" key={org.id}>
              <Link href={`/organizer/organizations/${org.id}`} className="event-card">
                <div className="event-card__body">
                  <div className="event-card__heading">
                    <h3 className="event-card__title">{org.name}</h3>
                    <span
                      className={`badge badge--${org.application_open ? 'success' : 'neutral'}`}
                    >
                      {org.application_open ? 'Open for applications' : 'Closed'}
                    </span>
                  </div>
                  <p className="event-card__meta">
                    {ORGANIZER_TYPE_LABELS[org.type] ?? org.type}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
