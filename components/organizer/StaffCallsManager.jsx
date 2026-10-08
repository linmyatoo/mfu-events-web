'use client';

import { useActionState, useState, useTransition } from 'react';

import {
  closeStaffCallAction,
  getStaffCallApplicationsAction,
  postStaffCallAction,
  reviewApplicationAction,
} from '../../app/organizer/actions';
import {
  STAFF_CALL_METHOD_LABELS,
  formatDate,
  staffCallStatusMeta,
  staffCallTargetLabel,
} from '../../lib/events';
import Button from '../common/Button';

const initialState = { error: null, message: null };

const ORGANIZER_ROLE_OPTIONS = [
  { value: 'co_organizer', label: 'Co-organizer' },
  { value: 'checkin_staff', label: 'Check-in staff' },
];

const APPLICATION_STATUS_VARIANT = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

/**
 * Staff Calls (StaffCall / StaffApplication) — recruit team members via an
 * instant-join `open_call` or a reviewed `application`. Only a Main
 * Organizer may post/close calls or review applications (backend:
 * staffService.createCall/closeCall/reviewApplication all gate on
 * organizerService.isMainOrganizer — same tier as TeamManager's canManage).
 */
export default function StaffCallsManager({ event, calls, canManage }) {
  const [state, formAction, posting] = useActionState(postStaffCallAction, initialState);
  const [targetType, setTargetType] = useState('organizer_role');
  const [method, setMethod] = useState('open_call');
  const [questions, setQuestions] = useState(['']);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const [expandedCallId, setExpandedCallId] = useState(null);
  const [applicationsByCall, setApplicationsByCall] = useState({});
  const [loadingCallId, setLoadingCallId] = useState(null);

  function run(action) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  function loadApplications(callId) {
    setLoadingCallId(callId);
    startTransition(async () => {
      const result = await getStaffCallApplicationsAction(callId);
      if (result?.error) setError(result.error);
      setApplicationsByCall((current) => ({ ...current, [callId]: result.applications ?? [] }));
      setLoadingCallId(null);
    });
  }

  function toggleApplications(callId) {
    if (expandedCallId === callId) {
      setExpandedCallId(null);
      return;
    }
    setExpandedCallId(callId);
    loadApplications(callId);
  }

  function review(callId, appId, decision) {
    run(async () => {
      const result = await reviewApplicationAction(callId, appId, decision, event.id);
      if (!result?.error) loadApplications(callId);
      return result;
    });
  }

  function updateQuestion(index, value) {
    setQuestions((current) => current.map((q, i) => (i === index ? value : q)));
  }
  function addQuestion() {
    setQuestions((current) => [...current, '']);
  }
  function removeQuestion(index) {
    setQuestions((current) => current.filter((_, i) => i !== index));
  }

  return (
    <section className="page-section" aria-labelledby="staff-calls-heading">
      <h2 className="section-title" id="staff-calls-heading">
        Staff calls ({calls.length})
      </h2>

      {error ? (
        <p className="notice notice--danger" role="status">
          {error}
        </p>
      ) : null}

      {calls.length === 0 ? (
        <p className="text-muted">No staff calls posted yet.</p>
      ) : (
        <ul className="stack">
          {calls.map((call) => {
            const status = staffCallStatusMeta(call.status);
            const applications = applicationsByCall[call.id] ?? [];

            return (
              <li className="card card--padded" key={call.id}>
                <div className="booking-panel__row">
                  <span>
                    <strong>{staffCallTargetLabel(call)}</strong>
                    <span className="text-muted">
                      {' '}
                      · {STAFF_CALL_METHOD_LABELS[call.method] ?? call.method}
                    </span>
                  </span>
                  <span className={`badge badge--${status.variant}`}>{status.label}</span>
                </div>

                <p className="text-muted">
                  {call.slots_filled} of {call.slots_total} slots filled
                </p>

                {canManage ? (
                  <div className="booking-panel__row">
                    {call.method === 'application' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => toggleApplications(call.id)}
                      >
                        {expandedCallId === call.id ? 'Hide applications' : 'Review applications'}
                      </Button>
                    ) : null}

                    {call.status === 'open' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => closeStaffCallAction(call.id, event.id))}
                      >
                        Close call
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {expandedCallId === call.id ? (
                  <div className="stack">
                    {loadingCallId === call.id ? (
                      <p className="text-muted">Loading applications…</p>
                    ) : applications.length === 0 ? (
                      <p className="text-muted">No applications yet.</p>
                    ) : (
                      applications.map((application) => (
                        <div className="card card--padded" key={application.id}>
                          <div className="booking-panel__row">
                            <span className="text-muted">
                              Applied {formatDate(application.created_at)}
                            </span>
                            <span
                              className={`badge badge--${
                                APPLICATION_STATUS_VARIANT[application.status] ?? 'neutral'
                              }`}
                            >
                              {application.status}
                            </span>
                          </div>

                          {call.questions?.length > 0 ? (
                            <ul className="stack">
                              {call.questions.map((question, index) => (
                                <li key={index}>
                                  <p className="field__label">{question}</p>
                                  <p>{application.answers?.[index] || '—'}</p>
                                </li>
                              ))}
                            </ul>
                          ) : null}

                          {application.status === 'pending' ? (
                            <div className="booking-panel__row">
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={pending}
                                onClick={() => review(call.id, application.id, 'accept')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pending}
                                onClick={() => review(call.id, application.id, 'reject')}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canManage ? (
        <form className="card card--padded qa-form stack" action={formAction}>
          <input type="hidden" name="eventId" value={event.id} />

          <div className="field">
            <label className="field__label" htmlFor="staff-call-target">
              Recruiting for
            </label>
            <select
              id="staff-call-target"
              name="target_type"
              className="select"
              value={targetType}
              onChange={(changeEvent) => setTargetType(changeEvent.target.value)}
            >
              <option value="organizer_role">Organizer role</option>
              <option value="contributor_position">Contributor position</option>
            </select>
          </div>

          {targetType === 'organizer_role' ? (
            <div className="field">
              <label className="field__label" htmlFor="staff-call-role">
                Role
              </label>
              <select
                id="staff-call-role"
                name="organizer_role"
                className="select"
                defaultValue="co_organizer"
              >
                {ORGANIZER_ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field">
              <label className="field__label" htmlFor="staff-call-position">
                Position title
              </label>
              <input
                id="staff-call-position"
                name="position_title"
                className="input"
                placeholder="e.g. Stage Crew, Photographer"
              />
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="staff-call-method">
              How people join
            </label>
            <select
              id="staff-call-method"
              name="method"
              className="select"
              value={method}
              onChange={(changeEvent) => setMethod(changeEvent.target.value)}
            >
              <option value="open_call">Open call (instant join)</option>
              <option value="application">Application (review required)</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="staff-call-slots">
              Slots
            </label>
            <input
              id="staff-call-slots"
              name="slots_total"
              type="number"
              min="1"
              className="input"
              defaultValue="1"
            />
          </div>

          {method === 'application' ? (
            <fieldset className="field">
              <legend className="field__label">Application questions</legend>
              <div className="stack">
                {questions.map((question, index) => (
                  <div className="booking-panel__row" key={index}>
                    <label className="visually-hidden" htmlFor={`staff-call-question-${index}`}>
                      Question {index + 1}
                    </label>
                    <input
                      id={`staff-call-question-${index}`}
                      name="questions"
                      className="input"
                      value={question}
                      onChange={(changeEvent) => updateQuestion(index, changeEvent.target.value)}
                      placeholder={`Question ${index + 1}`}
                    />
                    {questions.length > 1 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => removeQuestion(index)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" type="button" onClick={addQuestion}>
                + Add question
              </Button>
            </fieldset>
          ) : null}

          {state?.error ? <p className="field__error">{state.error}</p> : null}
          {state?.message ? (
            <p className="notice notice--success" role="status">
              {state.message}
            </p>
          ) : null}

          <Button variant="primary" type="submit" disabled={posting}>
            {posting ? 'Posting…' : 'Post staff call'}
          </Button>
        </form>
      ) : (
        <p className="text-muted">Only a Main Organizer can post staff calls.</p>
      )}
    </section>
  );
}
