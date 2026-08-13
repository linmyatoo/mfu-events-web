'use client';

import { useState } from 'react';

import { BOOKING_STATUS, formatDate } from '../../lib/events';
import Button from '../common/Button';
import StarRating from '../common/StarRating';

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
 * Post-event reviews.
 *
 * reviewService.submitReview only accepts a review from someone with an
 * `attended` booking, and only one per event — both gates are reflected here.
 * UI-only: the submitted review is added to local state.
 */
export default function ReviewsSection({ event, user }) {
  const [reviews, setReviews] = useState(event.reviews);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);

  const attended = event.myBooking?.status === BOOKING_STATUS.ATTENDED;
  const alreadyReviewed = reviews.some((review) => review.user_id === user.id);
  const average = averageRating(reviews);

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5.');
      return;
    }

    setReviews((current) => [
      {
        id: `local-r-${current.length + 1}`,
        event_id: event.id,
        user_id: user.id,
        rating,
        comment: comment.trim(),
        sentiment_label: null,
        sentiment_score: null,
        sentiment_status: 'pending_external',
        sentiment_analyzed_at: null,
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
    setRating(0);
    setComment('');
    setError(null);
  }

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
              {review.user_id === user.id ? (
                <p className="text-muted">Your review</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {attended && !alreadyReviewed ? (
        <form className="card card--padded review-form" onSubmit={handleSubmit}>
          <h3>Write a review</h3>

          <div className="field">
            <span className="field__label">Rating</span>
            <StarRating value={rating} onChange={setRating} size={26} />
            {error ? <p className="field__error">{error}</p> : null}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="review-comment">
              Comment
            </label>
            <textarea
              id="review-comment"
              className="textarea"
              value={comment}
              onChange={(changeEvent) => setComment(changeEvent.target.value)}
              placeholder="How was it?"
            />
            <p className="field__hint">
              Comments are analysed for sentiment by an external service, so the
              result may take a moment to appear.
            </p>
          </div>

          <Button variant="primary" type="submit">
            Submit review
          </Button>
        </form>
      ) : attended && alreadyReviewed ? (
        <p className="text-muted">You have already reviewed this event.</p>
      ) : (
        <p className="text-muted">
          Only students who attended can review this event.
        </p>
      )}
    </section>
  );
}
