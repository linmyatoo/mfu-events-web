'use client';

import { useActionState } from 'react';

import { updateSettingsAction } from '../../app/admin/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/**
 * PATCH /api/admin/settings. Edits every field in `DEFAULT_SETTINGS`
 * (MFU-Events/backend/lib/constants.js) — there is no create branch, the row
 * set is seeded once and only ever updated from here.
 */
export default function SettingsForm({ settings }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);

  return (
    <form className="card card--padded stack" action={formAction}>
      <section className="stack">
        <h2 className="section-title">Health flag thresholds</h2>
        <p className="field__hint">
          Drive `flagService`&apos;s negative-review and organizer health
          flags.
        </p>

        <div className="field">
          <label className="field__label" htmlFor="negative_rating_cutoff">
            Negative rating cutoff
          </label>
          <input
            id="negative_rating_cutoff"
            name="negative_rating_cutoff"
            type="number"
            min="1"
            max="5"
            className="input"
            defaultValue={settings.negative_rating_cutoff}
            required
          />
          <p className="field__hint">
            Star ratings at or below this count as a negative review.
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="sentiment_negative_threshold">
            Sentiment negative threshold
          </label>
          <input
            id="sentiment_negative_threshold"
            name="sentiment_negative_threshold"
            type="number"
            min="0"
            max="1"
            step="0.01"
            className="input"
            defaultValue={settings.sentiment_negative_threshold}
            required
          />
          <p className="field__hint">
            Share of sentiment-negative reviews (0–1) counted toward a flag.
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="negative_ratio_threshold">
            Negative ratio threshold
          </label>
          <input
            id="negative_ratio_threshold"
            name="negative_ratio_threshold"
            type="number"
            min="0"
            max="1"
            step="0.01"
            className="input"
            defaultValue={settings.negative_ratio_threshold}
            required
          />
          <p className="field__hint">
            Share of an organizer&apos;s reviews that must be negative (0–1)
            to raise a flag.
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="minimum_review_volume">
            Minimum review volume
          </label>
          <input
            id="minimum_review_volume"
            name="minimum_review_volume"
            type="number"
            min="0"
            className="input"
            defaultValue={settings.minimum_review_volume}
            required
          />
          <p className="field__hint">
            Reviews needed before a ratio flag can fire.
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="evaluation_window_days">
            Evaluation window (days)
          </label>
          <input
            id="evaluation_window_days"
            name="evaluation_window_days"
            type="number"
            min="1"
            className="input"
            defaultValue={settings.evaluation_window_days}
            required
          />
          <p className="field__hint">Rolling window the flag checks look back over.</p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="sentiment_timeout_hours">
            Sentiment timeout (hours)
          </label>
          <input
            id="sentiment_timeout_hours"
            name="sentiment_timeout_hours"
            type="number"
            min="1"
            className="input"
            defaultValue={settings.sentiment_timeout_hours}
            required
          />
          <p className="field__hint">
            How long to wait for the external sentiment service before a
            review is marked unavailable.
          </p>
        </div>
      </section>

      <section className="stack">
        <h2 className="section-title">Organizer health score</h2>

        <div className="field">
          <label className="field__label" htmlFor="health_starting_score">
            Starting score
          </label>
          <input
            id="health_starting_score"
            name="health_starting_score"
            type="number"
            className="input"
            defaultValue={settings.health_starting_score}
            required
          />
          <p className="field__hint">Score a brand-new organizer starts with.</p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="health_noshow_penalty">
            No-show penalty
          </label>
          <input
            id="health_noshow_penalty"
            name="health_noshow_penalty"
            type="number"
            className="input"
            defaultValue={settings.health_noshow_penalty}
            required
          />
          <p className="field__hint">
            Points applied per no-show — usually negative.
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="health_review_reward">
            Review reward
          </label>
          <input
            id="health_review_reward"
            name="health_review_reward"
            type="number"
            className="input"
            defaultValue={settings.health_review_reward}
            required
          />
          <p className="field__hint">Points applied per review received.</p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="health_restriction_threshold">
            Restriction threshold
          </label>
          <input
            id="health_restriction_threshold"
            name="health_restriction_threshold"
            type="number"
            className="input"
            defaultValue={settings.health_restriction_threshold}
            required
          />
          <p className="field__hint">
            Score below which an organizer is flagged as at-risk/restrictable.
          </p>
        </div>
      </section>

      <section className="stack">
        <h2 className="section-title">Check-in &amp; reviews</h2>

        <div className="field">
          <label className="field__label" htmlFor="checkin_window_grace_minutes">
            Check-in grace period (minutes)
          </label>
          <input
            id="checkin_window_grace_minutes"
            name="checkin_window_grace_minutes"
            type="number"
            min="0"
            className="input"
            defaultValue={settings.checkin_window_grace_minutes}
            required
          />
          <p className="field__hint">
            How long before/after an event window check-in is still allowed.
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="review_edit_window_days">
            Review edit window (days)
          </label>
          <input
            id="review_edit_window_days"
            name="review_edit_window_days"
            type="number"
            min="0"
            className="input"
            defaultValue={settings.review_edit_window_days}
            required
          />
          <p className="field__hint">
            Days after posting a review it can still be edited or deleted.
          </p>
        </div>
      </section>

      <section className="stack">
        <h2 className="section-title">Recognition tiers</h2>
        <p className="field__hint">Comma-separated, ascending point thresholds.</p>

        <div className="field">
          <label className="field__label" htmlFor="attendee_tiers">
            Attendee tiers
          </label>
          <input
            id="attendee_tiers"
            name="attendee_tiers"
            className="input"
            placeholder="5, 15, 30"
            defaultValue={(settings.attendee_tiers ?? []).join(', ')}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="organizer_tiers">
            Organizer tiers
          </label>
          <input
            id="organizer_tiers"
            name="organizer_tiers"
            className="input"
            placeholder="1, 3, 8, 15"
            defaultValue={(settings.organizer_tiers ?? []).join(', ')}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="contributor_tiers">
            Contributor tiers
          </label>
          <input
            id="contributor_tiers"
            name="contributor_tiers"
            className="input"
            placeholder="1, 5, 12"
            defaultValue={(settings.contributor_tiers ?? []).join(', ')}
            required
          />
        </div>
      </section>

      {state?.error ? (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? (
        <p className="notice notice--success" role="status">
          {state.message}
        </p>
      ) : null}

      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  );
}
