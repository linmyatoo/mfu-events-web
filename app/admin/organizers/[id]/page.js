import Link from 'next/link';
import { notFound } from 'next/navigation';

import Icon from '../../../../components/common/Icon';
import OrganizerMembers from '../../../../components/admin/OrganizerMembers';
import PageContainer from '../../../../components/layout/PageContainer';
import { ApiError, apiGet } from '../../../../lib/api';
import { ORGANIZER_TYPE_LABELS } from '../../../../lib/events';

export const metadata = { title: 'Organizer · Admin · MFU-Events' };

/**
 * GET /api/admin/organizations/:id — the organization record.
 * Members live on a separate endpoint: GET /api/admin/organizations/:id/members
 * (each entry is `{ ...membership, user }`).
 */
export default async function AdminOrganizerPage({ params }) {
  const { id } = await params;

  let organizer;
  let members;
  try {
    [organizer, members] = await Promise.all([
      apiGet(`/api/admin/organizations/${id}`),
      apiGet(`/api/admin/organizations/${id}/members`),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <PageContainer title={organizer.name}>
      <Link href="/admin/organizers" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        All organizers
      </Link>

      <section className="page-section">
        <div className="card card--padded stack">
          <div className="booking-panel__row">
            <span className="text-muted">Type</span>
            <span>{ORGANIZER_TYPE_LABELS[organizer.type] ?? organizer.type}</span>
          </div>
          <div className="booking-panel__row">
            <span className="text-muted">Status</span>
            <span className="badge badge--neutral">{organizer.status}</span>
          </div>
          <p>{organizer.description || 'No description.'}</p>
        </div>
      </section>

      <OrganizerMembers organizer={organizer} members={members ?? []} />
    </PageContainer>
  );
}
