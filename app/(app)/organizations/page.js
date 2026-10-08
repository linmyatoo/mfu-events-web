import Link from 'next/link';

import EmptyState from '../../../components/common/EmptyState';
import OrgApplyForm from '../../../components/events/OrgApplyForm';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';
import {
  ORGANIZER_TYPE_LABELS,
  ORG_APPLICATION_STATUS,
  formatDate,
  orgApplicationStatusMeta,
} from '../../../lib/events';

export const metadata = { title: 'Organizations · MFU-Events' };

const TABS = [
  { value: 'discover', label: 'Discover' },
  { value: 'mine', label: 'Mine' },
];

/**
 * Self-serve org discovery + join requests (`MFU-Events/backend` commit
 * `1d4a639`). Both lists are fetched unconditionally regardless of the
 * active tab — the Discover tab cross-references `my-applications` so an
 * org the user already has a pending/approved application to shows a status
 * badge instead of inviting a duplicate 409.
 *
 *   GET /api/user/organizations                 — open orgs (active + application_open)
 *   GET /api/user/organizations/my-applications  — every application this user has submitted
 *
 * No GET /api/user/organizations/:id route exists (see Phase 22 notes in
 * plan.md) — there is intentionally no per-org detail page here.
 */
export default async function OrganizationsPage({ searchParams }) {
  const { view = 'discover' } = await searchParams;
  const activeView = view === 'mine' ? 'mine' : 'discover';

  const [orgs, applications] = await Promise.all([
    apiGet('/api/user/organizations'),
    apiGet('/api/user/organizations/my-applications'),
  ]);

  const applicationByOrgId = new Map();
  for (const application of applications) {
    const existing = applicationByOrgId.get(application.org_id);
    // A rejected application doesn't block re-applying, so only remember a
    // pending/approved one as the "blocking" application for the Discover tab.
    if (
      !existing &&
      (application.status === ORG_APPLICATION_STATUS.PENDING ||
        application.status === ORG_APPLICATION_STATUS.APPROVED)
    ) {
      applicationByOrgId.set(application.org_id, application);
    }
  }

  return (
    <PageContainer
      title="Organizations"
      subtitle="Discover organizations open for applications and track your own requests."
    >
      <nav className="pill-toggle" aria-label="Filter">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/organizations?view=${tab.value}`}
            aria-current={activeView === tab.value ? 'page' : undefined}
            className={`pill-toggle__item${
              activeView === tab.value ? ' pill-toggle__item--active' : ''
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeView === 'discover' ? (
        orgs.length === 0 ? (
          <div className="card card--padded">
            <EmptyState
              icon="place"
              title="No organizations are open for applications"
              message="Check back later — organizations can open and close applications at any time."
            />
          </div>
        ) : (
          <ul className="stack">
            {orgs.map((org) => {
              const existing = applicationByOrgId.get(org.id);
              const statusMeta = existing ? orgApplicationStatusMeta(existing.status) : null;

              return (
                <li className="card card--padded" key={org.id}>
                  <div className="event-card__heading">
                    <h3 className="event-card__title">{org.name}</h3>
                    {statusMeta ? (
                      <span className={`badge badge--${statusMeta.variant}`}>
                        {statusMeta.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted">
                    {ORGANIZER_TYPE_LABELS[org.type] ?? org.type}
                  </p>
                  {org.description ? <p>{org.description}</p> : null}

                  {existing ? null : <OrgApplyForm orgId={org.id} />}
                </li>
              );
            })}
          </ul>
        )
      ) : applications.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="calendar"
            title="No applications yet"
            message="Apply to an organization from the Discover tab to see it here."
          />
        </div>
      ) : (
        <ul className="stack">
          {applications.map((application) => {
            const meta = orgApplicationStatusMeta(application.status);
            return (
              <li className="card card--padded" key={application.id}>
                <div className="event-card__heading">
                  <h3 className="event-card__title">
                    {application.org?.name ?? application.org_id}
                  </h3>
                  <span className={`badge badge--${meta.variant}`}>{meta.label}</span>
                </div>
                <p className="text-muted">Applied {formatDate(application.created_at)}</p>
                {application.message ? <p>{application.message}</p> : null}
                {application.status === ORG_APPLICATION_STATUS.REJECTED &&
                application.feedback ? (
                  <p className="notice notice--danger" role="status">
                    {application.feedback}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
