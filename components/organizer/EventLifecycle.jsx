'use client';

import { useState, useTransition } from 'react';

import {
  cloneEventAction,
  eventLifecycleAction,
} from '../../app/organizer/actions';
import { EVENT_STATUS } from '../../lib/events';
import Button from '../common/Button';
import Modal from '../common/Modal';

/**
 * The lifecycle steps an organizer owns.
 *
 * Admin owns review, approval, venue assignment, publishing and completion —
 * see EVENT_TRANSITIONS in the backend's constants.js. Buttons appear only
 * for transitions the current status allows, and the server re-checks anyway.
 */
export default function EventLifecycle({ event, isMainOrganizer, canEdit }) {
  const [notice, setNotice] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setNotice({ tone: 'info', text: result.error });
    });
  }

  const { status } = event;
  const canSubmit = status === EVENT_STATUS.DRAFT && isMainOrganizer;
  // requestChanges sends an event back to DRAFT with the admin's note attached.
  const canResubmit = status === EVENT_STATUS.DRAFT && isMainOrganizer && event.admin_feedback;
  const canOpen =
    canEdit &&
    [EVENT_STATUS.VENUE_ASSIGNED, EVENT_STATUS.PUBLISHED].includes(status);
  const canClose = canEdit && status === EVENT_STATUS.REGISTRATION_OPEN;
  const canCancel =
    isMainOrganizer &&
    [
      EVENT_STATUS.DRAFT,
      EVENT_STATUS.APPROVED,
      EVENT_STATUS.VENUE_ASSIGNED,
      EVENT_STATUS.PUBLISHED,
      EVENT_STATUS.REGISTRATION_OPEN,
    ].includes(status);

  return (
    <aside className="booking-panel card card--padded" aria-label="Event actions">
      <div className="booking-panel__row">
        <span className="text-muted">Actions</span>
      </div>

      {event.admin_feedback ? (
        <p className="notice notice--info">
          <strong>Admin feedback:</strong> {event.admin_feedback}
        </p>
      ) : null}

      {notice ? (
        <p className={`notice notice--${notice.tone}`} role="status">
          {notice.text}
        </p>
      ) : null}

      <div className="booking-panel__actions">
        {status === EVENT_STATUS.DRAFT && canEdit ? (
          <Button variant="outline" block href={`/organizer/events/${event.id}/edit`}>
            Edit draft
          </Button>
        ) : null}

        {canResubmit ? (
          <Button
            variant="primary"
            block
            disabled={pending}
            onClick={() => run(() => eventLifecycleAction(event.id, 'resubmit'))}
          >
            {pending ? 'Working…' : 'Resubmit for review'}
          </Button>
        ) : canSubmit ? (
          <Button
            variant="primary"
            block
            disabled={pending}
            onClick={() => run(() => eventLifecycleAction(event.id, 'submit'))}
          >
            {pending ? 'Working…' : 'Submit for review'}
          </Button>
        ) : null}

        {canOpen ? (
          <Button
            variant="primary"
            block
            disabled={pending}
            onClick={() => run(() => eventLifecycleAction(event.id, 'open-registration'))}
          >
            {pending ? 'Working…' : 'Open registration'}
          </Button>
        ) : null}

        {canClose ? (
          <Button
            variant="outline"
            block
            disabled={pending}
            onClick={() => run(() => eventLifecycleAction(event.id, 'close-registration'))}
          >
            {pending ? 'Working…' : 'Close registration'}
          </Button>
        ) : null}

        <Button
          variant="outline"
          block
          disabled={pending}
          onClick={() => run(() => cloneEventAction(event.id))}
        >
          Duplicate as draft
        </Button>

        {canCancel ? (
          <Button
            variant="danger"
            block
            disabled={pending}
            onClick={() => setConfirmCancel(true)}
          >
            Cancel event
          </Button>
        ) : null}
      </div>

      <Modal
        open={confirmCancel}
        title="Cancel this event?"
        onClose={() => setConfirmCancel(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmCancel(false);
                run(() => eventLifecycleAction(event.id, 'cancel'));
              }}
            >
              Cancel event
            </Button>
          </>
        }
      >
        <p>
          <strong>{event.title}</strong> will show as cancelled to everyone who
          booked it. This cannot be undone — `cancelled` is a terminal state.
        </p>
      </Modal>
    </aside>
  );
}
