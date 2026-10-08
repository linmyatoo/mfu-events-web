'use client';

import { useActionState, useState, useTransition } from 'react';

import { applyStaffCallAction, claimStaffCallAction } from '../../app/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/**
 * Join a staff call — POST /api/user/staff-calls/:id/claim for `open_call`
 * (instant join, staffService.claimOpenCall) or POST
 * /api/user/staff-calls/:id/apply for `application` (reviewed by the
 * organizer). `call.questions` is a free-text array; answers submit in the
 * same order as `answers[i]` (staffService.applyToCall stores them as-is).
 */
export default function StaffCallApplyForm({ call }) {
  const [applyState, applyAction, applying] = useActionState(applyStaffCallAction, initialState);
  const [claimNotice, setClaimNotice] = useState(null);
  const [pending, startTransition] = useTransition();

  if (call.status !== 'open') {
    return (
      <section className="page-section card card--padded">
        <p className="notice notice--info" role="status">
          This staff call is closed.
        </p>
      </section>
    );
  }

  if (call.method === 'open_call') {
    const handleClaim = () => {
      setClaimNotice(null);
      startTransition(async () => {
        const result = await claimStaffCallAction(call.id);
        setClaimNotice(
          result.error
            ? { tone: 'danger', text: result.error }
            : { tone: 'success', text: result.message }
        );
      });
    };

    return (
      <section className="page-section card card--padded">
        <h2 className="section-title">Join this call</h2>
        <p className="text-muted">
          This call joins the team instantly — no application needed.
        </p>

        {claimNotice ? (
          <p className={`notice notice--${claimNotice.tone}`} role="status">
            {claimNotice.text}
          </p>
        ) : null}

        <Button variant="primary" onClick={handleClaim} disabled={pending}>
          {pending ? 'Joining…' : 'Claim this slot'}
        </Button>
      </section>
    );
  }

  const questions = call.questions ?? [];

  return (
    <section className="page-section card card--padded">
      <h2 className="section-title">Apply for this call</h2>

      <form className="stack" action={applyAction}>
        <input type="hidden" name="callId" value={call.id} />

        {questions.length === 0 ? (
          <p className="text-muted">No application questions — just submit to apply.</p>
        ) : (
          questions.map((question, index) => (
            <div className="field" key={index}>
              <label className="field__label" htmlFor={`staff-call-answer-${index}`}>
                {question}
              </label>
              <textarea
                id={`staff-call-answer-${index}`}
                name="answers"
                className="textarea"
                required
              />
            </div>
          ))
        )}

        {applyState?.error ? <p className="field__error">{applyState.error}</p> : null}
        {applyState?.message ? (
          <p className="notice notice--success" role="status">
            {applyState.message}
          </p>
        ) : null}

        <Button variant="primary" type="submit" disabled={applying}>
          {applying ? 'Submitting…' : 'Submit application'}
        </Button>
      </form>
    </section>
  );
}
