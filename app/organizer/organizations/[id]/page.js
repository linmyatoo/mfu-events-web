import Link from 'next/link';
import { notFound } from 'next/navigation';

import Icon from '../../../../components/common/Icon';
import OrgApplicationsManager from '../../../../components/organizer/OrgApplicationsManager';
import { ApiError, apiGet } from '../../../../lib/api';
import { requireOrganizer } from '../../../../lib/session';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const org = await apiGet(`/api/org/${id}`);
    return { title: `${org.name} · Organizer · MFU-Events` };
  } catch {
    return { title: 'Organization · Organizer · MFU-Events' };
  }
}

/**
 * One org's applications queue, from its org_manager's side.
 *
 *   GET /api/org/:id               — any active member (org detail)
 *   GET /api/org/:id/applications  — org_manager only
 *
 * A non-manager who navigates here directly 403s on the `/applications`
 * call (both calls run in the same `Promise.all`), which routes to
 * `notFound()` — same shape as the organizer event-detail page's
 * access-control pattern.
 */
export default async function OrganizerOrganizationDetailPage({ params, searchParams }) {
  const { id } = await params;
  const { status = '' } = await searchParams;
  await requireOrganizer();

  let org;
  let applications;
  try {
    [org, applications] = await Promise.all([
      apiGet(`/api/org/${id}`),
      apiGet(`/api/org/${id}/applications${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    ]);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) notFound();
    throw error;
  }

  const filters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="page-container">
      <Link href="/organizer/organizations" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        My Organizations
      </Link>

      <div className="page-header">
        <h1 className="page-header__title">{org.name}</h1>
        {org.description ? <p className="page-header__subtitle">{org.description}</p> : null}
        {org.contact_email ? <p className="text-muted">{org.contact_email}</p> : null}
      </div>

      <nav className="pill-toggle" aria-label="Filter">
        {filters.map((filter) => {
          const selected = (status ?? '') === filter.value;
          const href = filter.value
            ? `/organizer/organizations/${id}?status=${filter.value}`
            : `/organizer/organizations/${id}`;
          return (
            <Link
              key={filter.value || 'all'}
              href={href}
              aria-current={selected ? 'page' : undefined}
              className={`pill-toggle__item${selected ? ' pill-toggle__item--active' : ''}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <OrgApplicationsManager org={org} applications={applications} />
    </div>
  );
}
