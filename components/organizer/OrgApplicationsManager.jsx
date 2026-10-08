'use client';

import { useActionState, useState, useTransition } from 'react';

import {
  approveOrgApplicationAction,
  rejectOrgApplicationAction,
  toggleOrgApplicationsAction,
} from '../../app/organizer/actions';
import { formatDate, initialsOf, orgApplicationStatusMeta } from '../../lib/events';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/**
 * Org manager's applications queue for one org — toggle `application_open`
 * and approve/reject pending applications
 * (`orgApplicationService.approveApplication`/`rejectApplication`,
 * `MFU-Events/backend` commit `1d4a639`). Approving always adds the
 * applicant as a plain `member` (promote to `org_manager` separately via
 * the existing admin `OrganizerMembers.jsx`).
 */
export default function OrgApplicationsManager({ org, applications }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState(null);

  function run(action) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section className="page-section stack">
      <div className="card card--padded booking-panel__row">
        <span>
          Applications are currently{' '}
          <strong>{org.application_open ? 'open' : 'closed'}</strong>.
        </span>
        <Button
          variant={org.application_open ? 'danger' : 'primary'}
          size="sm"
          disabled={pending}
          onClick={() => run(() => toggleOrgApplicationsAction(org.id, !org.application_open))}
        >
          {org.application_open ? 'Close applications' : 'Open applications'}
        </Button>
      </div>

      {error ? (
        <p className="notice notice--danger" role="status">
          {error}
        </p>
      ) : null}

      <h2 className="section-title">Applications ({applications.length})</h2>

      {applications.length === 0 ? (
        <p className="text-muted">No applications match this filter.</p>
      ) : (
        <ul className="stack">
          {applications.map((application) => {
            const meta = orgApplicationStatusMeta(application.status);
            const isRejecting = rejectingId === application.id;

            return (
              <li className="card card--padded" key={application.id}>
                <div className="organizer">
                  <span className="organizer__avatar" aria-hidden="true">
                    {initialsOf(application.user?.name ?? '')}
                  </span>
                  <span>
                    <span className="organizer__name">
                      {application.user?.name ?? 'Unknown'}
                    </span>
                    <span className="organizer__role text-muted">
                      {application.user?.email}
                    </span>
                  </span>
                  <span className={`badge badge--${meta.variant}`}>{meta.label}</span>
                </div>

                <p className="text-muted">Applied {formatDate(application.created_at)}</p>
                {application.message ? <p>{application.message}</p> : null}
                {application.status === 'rejected' && application.feedback ? (
                  <p className="text-muted">Feedback: {application.feedback}</p>
                ) : null}

                {application.status === 'pending' ? (
                  <div className="stack">
                    <div className="booking-panel__row">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(() => approveOrgApplicationAction(org.id, application.id))
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          setRejectingId(isRejecting ? null : application.id)
                        }
                      >
                        {isRejecting ? 'Cancel' : 'Reject'}
                      </Button>
                    </div>

                    {isRejecting ? (
                      <RejectForm orgId={org.id} appId={application.id} />
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function RejectForm({ orgId, appId }) {
  const [state, formAction, submitting] = useActionState(
    rejectOrgApplicationAction,
    initialState
  );

  return (
    <form className="card card--padded qa-form stack" action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="appId" value={appId} />

      <div className="field">
        <label className="field__label" htmlFor={`reject-feedback-${appId}`}>
          Feedback (optional)
        </label>
        <textarea
          id={`reject-feedback-${appId}`}
          name="feedback"
          className="textarea"
          placeholder="Let the applicant know why"
        />
      </div>

      {state?.error ? <p className="field__error">{state.error}</p> : null}

      <Button variant="danger" size="sm" type="submit" disabled={submitting}>
        {submitting ? 'Rejecting…' : 'Confirm reject'}
      </Button>
    </form>
  );
}
