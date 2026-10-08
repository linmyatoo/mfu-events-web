'use client';

import { useActionState, useState, useTransition } from 'react';

import { deleteReviewAction, editReviewAction, submitReviewAction } from '../../app/actions';
import { BOOKING_STATUS, formatDate, isPastEvent } from '../../lib/events';
import Button from '../common/Button';
import Modal from '../common/Modal';
import StarRating from '../common/StarRating';

const initialState = { error: null, message: null };

/**
 * Edit/delete window for a review, in days since `created_at`. Mirrors the
 * backend's `settings.review_edit_window_days` (default 7 — see
 * reviewService.editReview in MFU-Events/backend). There is no user-facing
 * way to read the real setting: `GET /api/admin/settings` is admin-only (role
 * `admin`, no other route exposes it — confirmed against
 * MFU-Events/backend/routes/{admin,user,organizer}.js), and this component
 * only ever renders inside the User and Organizer portals
 * (`app/(app)/events/[id]/page.js`, `app/organizer/events/[id]/page.js`) —
 * never the Admin one. Phase 19 (`app/admin/settings/page.js`) shipped the
 * admin-only settings editor, but that doesn't change this: there is still no
 * endpoint a non-admin session can call to read the real value, so this
 * keeps hardcoding the documented default, same as `healthBand()` hardcodes
 * `health_restriction_threshold` in lib/events.js. The backend re-checks the
 * real window on every PATCH/DELETE regardless of what this constant says.
 * Unblocking this needs a backend change (e.g. a non-admin-readable settings
 * subset, or embedding `review_edit_window_days` in the event/booking
 * payload) — out of scope for this frontend plan.
 */
const REVIEW_EDIT_WINDOW_DAYS = 7;

function daysSince(iso) {
  return (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
}

/** Average of the ratings that exist, to one decimal. */
function averageRating(reviews) {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}

/**
 * Sentiment arrives from an external service and may never arrive at all,
 * so `pending_external` and `unavailable` are normal states, not errors.
 */
function SentimentTag({ review }) {
  if (review.sentiment_status !== 'received' || !review.sentiment_label) {
    return <span className="badge badge--neutral">Sentiment pending</span>;
  }

  const variant =
    review.sentiment_label === 'positive'
      ? 'success'
      : review.sentiment_label === 'negative'
        ? 'danger'
        : 'neutral';

  return (
    <span className={`badge badge--${variant}`}>{review.sentiment_label}</span>
  );
}

/**
 * Post-event reviews — POST /api/user/events/:id/reviews.
 *
 * reviewService.submitReview only accepts a review once the event has ended
 * (`end_time` in the past — a 400 otherwise), from someone with an `attended`
 * booking, and only one per event — all three gates are reflected here.
 * Anonymous reviews come back with `user_id: null` for every reader except
 * their own author (see reviewPrivacy.js), which is what the byline uses.
 *
 * `readOnly` is for viewers who can never author a review (e.g. the
 * organizer team on `app/organizer/events/[id]/page.js` — mirrors the
 * `canSeeContent` read-only view in `frontend/src/pages/creator/EventDetail.jsx:258-277`).
 * It skips the submit-form branch entirely and only renders the list.
 */
export default function ReviewsSection({ event, user, readOnly = false }) {
  const [state, formAction, pending] = useActionState(submitReviewAction, initialState);
  const [rating, setRating] = useState(0);

  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editError, setEditError] = useState(null);
  const [editPending, startEditSave] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deletePending, startDelete] = useTransition();

  function startEdit(review) {
    setEditError(null);
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment ?? '');
  }

  function saveEdit(reviewId) {
    setEditError(null);
    startEditSave(async () => {
      const formData = new FormData();
      formData.set('reviewId', reviewId);
      formData.set('eventId', event.id);
      formData.set('rating', String(editRating));
      formData.set('comment', editComment);

      const result = await editReviewAction(null, formData);
      if (result?.error) {
        setEditError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function confirmDelete() {
    const reviewId = deleteTarget;
    setDeleteTarget(null);
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteReviewAction(reviewId, event.id);
      if (result?.error) setDeleteError(result.error);
    });
  }

  const reviews = event.reviews ?? [];
  const attended = event.myBooking?.status === BOOKING_STATUS.ATTENDED;
  const alreadyReviewed = !readOnly && reviews.some((review) => review.user_id === user?.id);
  const canReview = attended && !alreadyReviewed && isPastEvent(event);
  const average = averageRating(reviews);

  return (
    <section className="page-section" aria-labelledby="reviews-heading">
      <h2 className="section-title" id="reviews-heading">
        Reviews ({reviews.length})
        {average ? <span className="text-muted"> · {average} average</span> : null}
      </h2>

      {reviews.length === 0 ? (
        <p className="text-muted">No reviews yet.</p>
      ) : (
        <ul className="stack">
          {reviews.map((review) => {
            const isOwn = !readOnly && review.user_id === user?.id;
            const canEdit = isOwn && daysSince(review.created_at) <= REVIEW_EDIT_WINDOW_DAYS;
            const isEditing = editingId === review.id;

            return (
              <li className="card card--padded review" key={review.id}>
                {isEditing ? (
                  <form
                    className="stack"
                    onSubmit={(submitEvent) => {
                      submitEvent.preventDefault();
                      saveEdit(review.id);
                    }}
                  >
                    <div className="field">
                      <span className="field__label">Rating</span>
                      <StarRating value={editRating} onChange={setEditRating} size={22} />
                    </div>

                    <div className="field">
                      <label className="field__label" htmlFor={`edit-comment-${review.id}`}>
                        Comment
                      </label>
                      <textarea
                        id={`edit-comment-${review.id}`}
                        name="comment"
                        className="textarea"
                        value={editComment}
                        onChange={(changeEvent) => setEditComment(changeEvent.target.value)}
                      />
                    </div>

                    {editError ? <p className="field__error">{editError}</p> : null}

                    <div className="booking-panel__row">
                      <Button variant="primary" type="submit" disabled={editPending}>
                        {editPending ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        disabled={editPending}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="review__head">
                      <StarRating value={review.rating} />
                      <span className="text-muted">{formatDate(review.created_at)}</span>
                      <SentimentTag review={review} />
                    </div>
                    {review.comment ? <p>{review.comment}</p> : null}
                    {isOwn ? (
                      <p className="text-muted">
                        Your review{review.is_anonymous ? ' · posted anonymously' : ''}
                      </p>
                    ) : review.is_anonymous ? (
                      <p className="text-muted">Posted anonymously</p>
                    ) : null}

                    {canEdit ? (
                      <div className="booking-panel__row">
                        <Button variant="outline" size="sm" onClick={() => startEdit(review)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(review.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete this review?"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button
              variant="outline"
              disabled={deletePending}
              onClick={() => setDeleteTarget(null)}
            >
              Back
            </Button>
            <Button variant="danger" disabled={deletePending} onClick={confirmDelete}>
              {deletePending ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p>This can&rsquo;t be undone.</p>
        {deleteError ? <p className="field__error">{deleteError}</p> : null}
      </Modal>

      {readOnly ? null : canReview ? (
        <form className="card card--padded review-form" action={formAction}>
          <input type="hidden" name="eventId" value={event.id} />
          <h3>Write a review</h3>

          <div className="field">
            <span className="field__label">Rating</span>
            <StarRating value={rating} onChange={setRating} size={26} />
            {state?.error ? <p className="field__error">{state.error}</p> : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="review-comment">
              Comment
            </label>
            <textarea
              id="review-comment"
              name="comment"
              className="textarea"
              placeholder="How was it?"
            />
            <p className="field__hint">
              Comments are analysed for sentiment by an external service, so the
              result may take a moment to appear.
            </p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="review-anonymous">
              <input id="review-anonymous" name="isAnonymous" type="checkbox" />{' '}
              Post anonymously
            </label>
            <p className="field__hint">
              Your rating and comment stay visible; your name is hidden from
              everyone, including the organizers and admins.
            </p>
          </div>

          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? 'Submitting…' : 'Submit review'}
          </Button>
        </form>
      ) : attended && alreadyReviewed ? (
        <p className="text-muted">You have already reviewed this event.</p>
      ) : attended ? (
        <p className="text-muted">You can review once the event ends.</p>
      ) : (
        <p className="text-muted">
          Only students who attended can review this event.
        </p>
      )}

      {!readOnly && state?.message ? (
        <p className="notice notice--success" role="status">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
