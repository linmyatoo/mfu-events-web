'use client';

import { useActionState } from 'react';

import { askQuestionAction } from '../../app/actions';
import { formatDate } from '../../lib/events';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

const initialState = { error: null, message: null };

/**
 * Public per-event Q&A (EventQuestion) — POST /api/user/events/:id/questions.
 *
 * Anyone signed in can ask; only a Main or Co-Organizer can answer, so a new
 * question always starts unanswered. The list re-renders from the server after
 * the action revalidates the route.
 */
export default function QuestionsSection({ event, user }) {
  const [state, formAction, pending] = useActionState(askQuestionAction, initialState);
  const questions = event.questions ?? [];

  return (
    <section className="page-section" aria-labelledby="qa-heading">
      <h2 className="section-title" id="qa-heading">
        Questions ({questions.length})
      </h2>

      {questions.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="search"
            title="No questions yet"
            message="Be the first to ask the organizers something."
          />
        </div>
      ) : (
        <ul className="stack">
          {questions.map((question) => (
            <li className="card card--padded qa-item" key={question.id}>
              <p className="qa-item__question">{question.question_text}</p>
              <p className="qa-item__meta text-muted">
                Asked {formatDate(question.created_at)}
                {question.user_id === user.id ? ' · by you' : ''}
              </p>

              {question.answer_text ? (
                <div className="qa-item__answer">
                  <p>{question.answer_text}</p>
                  <p className="qa-item__meta text-muted">
                    Answered by an organizer {formatDate(question.answered_at)}
                  </p>
                </div>
              ) : (
                <p className="badge badge--neutral">Awaiting an answer</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="card card--padded qa-form" action={formAction}>
        <input type="hidden" name="eventId" value={event.id} />

        <div className="field">
          <label className="field__label" htmlFor="question-text">
            Ask the organizers
          </label>
          <textarea
            id="question-text"
            name="text"
            className="textarea"
            placeholder="What would you like to know about this event?"
            aria-invalid={state?.error ? 'true' : undefined}
            aria-describedby={state?.error ? 'question-error' : undefined}
          />
          {state?.error ? (
            <p className="field__error" id="question-error">
              {state.error}
            </p>
          ) : null}
          {state?.message ? (
            <p className="notice notice--success" role="status">
              {state.message}
            </p>
          ) : null}
        </div>

        <Button variant="primary" type="submit" disabled={pending}>
          {pending ? 'Posting…' : 'Post question'}
        </Button>
      </form>
    </section>
  );
}
