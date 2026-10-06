'use client';

import { useState, useTransition } from 'react';

import { adminEventAction } from '../../app/admin/actions';
import { EVENT_STATUS, canTransition } from '../../lib/events';
import Button from '../common/Button';
import Modal from '../common/Modal';

/**
 * The approval lifecycle Admin owns.
 *
 * Buttons are derived from `EVENT_TRANSITIONS`, so an event only ever offers
 * the steps its current status actually permits; the backend re-checks each
 * one and answers 400 otherwise.
 */
export default function EventReview({ event }) {
  const [notice, setNotice] = useState(null);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [pending, startTransition] = useTransition();

  function run(step, note) {
    setNotice(null);
    startTransition(async () => {
      const result = await adminEventAction(event.id, step, note);
      setNotice(
        result?.error
          ? { tone: 'info', text: result.error }
          : { tone: 'success', text: 'Done.' }
      );
    });
  }

  const { status } = event;
  const to = (next) => canTransition(status, next);

  return (
    <aside className="booking-panel card card--padded" aria-label="Review">
      <div className="booking-panel__row">
        <span className="text-muted">Review</span>
      </div>

      {event.admin_feedback ? (
        <p className="notice notice--info">
          <strong>Your note to the organizer:</strong> {event.admin_feedback}
        </p>
      ) : null}

      {notice ? (
        <p className={`notice notice--${notice.tone}`} role="status">
          {notice.text}
        </p>
      ) : null}

      <div className="booking-panel__actions">
        {to(EVENT_STATUS.UNDER_REVIEW) ? (
          <Button
            variant="primary"
            block
            disabled={pending}
            onClick={() => run('start-review')}
          >
            Start review
          </Button>
        ) : null}

        {to(EVENT_STATUS.APPROVED) ? (
          <Button variant="primary" block disabled={pending} onClick={() => run('approve')}>
            Approve
          </Button>
        ) : null}

        {/* request-changes sends it back to DRAFT with the note attached. */}
        {to(EVENT_STATUS.DRAFT) ? (
          <Button
            variant="outline"
            block
            disabled={pending}
            onClick={() => setFeedbackFor('request-changes')}
          >
            Request changes
          </Button>
        ) : null}

        {to(EVENT_STATUS.REJECTED) ? (
          <Button
            variant="danger"
            block
            disabled={pending}
            onClick={() => setFeedbackFor('reject')}
          >
            Reject
          </Button>
        ) : null}

        {to(EVENT_STATUS.PUBLISHED) ? (
          <Button variant="primary" block disabled={pending} onClick={() => run('publish')}>
            Publish
          </Button>
        ) : null}

        {to(EVENT_STATUS.COMPLETED) ? (
          <Button variant="primary" block disabled={pending} onClick={() => run('complete')}>
            Mark completed
          </Button>
        ) : null}

        {to(EVENT_STATUS.CANCELLED) ? (
          <Button variant="danger" block disabled={pending} onClick={() => run('cancel')}>
            Cancel event
          </Button>
        ) : null}

        {status === EVENT_STATUS.APPROVED || status === EVENT_STATUS.VENUE_ASSIGNED ? (
          <p className="field__hint">
            Assign a venue below to move this on.
          </p>
        ) : null}
      </div>

      <Modal
        open={Boolean(feedbackFor)}
        title={feedbackFor === 'reject' ? 'Reject this event?' : 'Request changes'}
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
          <label className="field__label" htmlFor="admin-feedback">
            Note to the organizer
          </label>
          <textarea
            id="admin-feedback"
            className="textarea"
            value={feedback}
            onChange={(changeEvent) => setFeedback(changeEvent.target.value)}
            placeholder="What needs to change, and why?"
          />
          <p className="field__hint">
            {feedbackFor === 'reject'
              ? 'Rejection is final — the event cannot move out of that state.'
              : 'The event returns to draft so the organizer can fix and resubmit.'}
          </p>
        </div>
      </Modal>
    </aside>
  );
}
