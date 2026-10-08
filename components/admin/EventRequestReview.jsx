'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { eventRequestDecisionAction } from '../../app/admin/actions';
import { EVENT_REQUEST_STATUS } from '../../lib/events';
import Button from '../common/Button';
import Modal from '../common/Modal';

/**
 * Admin's decision on a pending request — modeled on `EventReview.jsx`.
 * `approve` has no feedback step; `reject`/`needs-info` reuse the same
 * Modal + feedback-textarea structure as `EventReview.jsx` (line 122-162).
 */
export default function EventRequestReview({ request }) {
  const [notice, setNotice] = useState(null);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [pending, startTransition] = useTransition();

  function run(step, note) {
    setNotice(null);
    startTransition(async () => {
      const result = await eventRequestDecisionAction(request.id, step, note);
      if (result?.error) {
        setNotice({ tone: 'info', text: result.error });
      } else if (step === 'approve') {
        setNotice({
          tone: 'success',
          text: 'Approved — draft event created.',
          eventId: result?.event?.id,
        });
      } else {
        setNotice({ tone: 'success', text: 'Done.' });
      }
    });
  }

  if (request.status !== EVENT_REQUEST_STATUS.PENDING) {
    return (
      <aside className="booking-panel card card--padded" aria-label="Review">
        <div className="booking-panel__row">
          <span className="text-muted">Review</span>
        </div>
        <p className="text-muted">
          This request is already {request.status.replace('_', ' ')} — no further action is
          available.
        </p>
        {request.status === EVENT_REQUEST_STATUS.APPROVED && request.resulting_event_id ? (
          <Link
            href={`/admin/events/${request.resulting_event_id}`}
            className="btn btn--primary btn--block"
          >
            View event
          </Link>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="booking-panel card card--padded" aria-label="Review">
      <div className="booking-panel__row">
        <span className="text-muted">Review</span>
      </div>

      {notice ? (
        <p className={`notice notice--${notice.tone}`} role="status">
          {notice.text}{' '}
          {notice.eventId ? <Link href={`/admin/events/${notice.eventId}`}>View event</Link> : null}
        </p>
      ) : null}

      <div className="booking-panel__actions">
        <Button variant="primary" block disabled={pending} onClick={() => run('approve')}>
          Approve
        </Button>

        <Button
          variant="outline"
          block
          disabled={pending}
          onClick={() => setFeedbackFor('needs-info')}
        >
          Needs info
        </Button>

        <Button
          variant="danger"
          block
          disabled={pending}
          onClick={() => setFeedbackFor('reject')}
        >
          Reject
        </Button>
      </div>

      <Modal
        open={Boolean(feedbackFor)}
        title={feedbackFor === 'reject' ? 'Reject this request?' : 'Ask for more info'}
        onClose={() => setFeedbackFor(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setFeedbackFor(null)}>
              Back
            </Button>
            <Button
              variant={feedbackFor === 'reject' ? 'danger' : 'primary'}
              onClick={() => {
                const step = feedbackFor;
                setFeedbackFor(null);
                run(step, feedback);
                setFeedback('');
              }}
            >
              {feedbackFor === 'reject' ? 'Reject' : 'Send back'}
            </Button>
          </>
        }
      >
        <div className="field">
          <label className="field__label" htmlFor="admin-request-feedback">
            Note to the requester
          </label>
          <textarea
            id="admin-request-feedback"
            className="textarea"
            value={feedback}
            onChange={(changeEvent) => setFeedback(changeEvent.target.value)}
            placeholder="What needs to change, and why?"
          />
          <p className="field__hint">
            {feedbackFor === 'reject'
              ? 'Rejection is final — the requester cannot resubmit.'
              : 'The request returns to the requester so they can edit and resubmit.'}
          </p>
        </div>
      </Modal>
    </aside>
  );
}
