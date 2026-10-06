'use client';

import { useActionState, useState } from 'react';

import { submitReviewAction } from '../../app/actions';
import { BOOKING_STATUS, formatDate } from '../../lib/events';
import Button from '../common/Button';
import StarRating from '../common/StarRating';

const initialState = { error: null, message: null };

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
 * reviewService.submitReview only accepts a review from someone with an
 * `attended` booking, and only one per event — both gates are reflected here.
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

  const reviews = event.reviews ?? [];
  const attended = event.myBooking?.status === BOOKING_STATUS.ATTENDED;
  const alreadyReviewed = !readOnly && reviews.some((review) => review.user_id === user?.id);
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
          {reviews.map((review) => (
            <li className="card card--padded review" key={review.id}>
              <div className="review__head">
                <StarRating value={review.rating} />
                <span className="text-muted">{formatDate(review.created_at)}</span>
                <SentimentTag review={review} />
              </div>
              {review.comment ? <p>{review.comment}</p> : null}
              {!readOnly && review.user_id === user?.id ? (
                <p className="text-muted">
                  Your review{review.is_anonymous ? ' · posted anonymously' : ''}
                </p>
              ) : review.is_anonymous ? (
                <p className="text-muted">Posted anonymously</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {readOnly ? null : attended && !alreadyReviewed ? (
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
