'use client';

import { useState } from 'react';

import { formatDate } from '../../lib/events';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

/**
 * Public per-event Q&A (EventQuestion).
 *
 * Anyone signed in can ask; only a Main or Co-Organizer can answer, so a new
 * question always starts unanswered. UI-only — this stands in for
 * POST /api/user/events/:id/questions.
 */
export default function QuestionsSection({ event, user }) {
  const [questions, setQuestions] = useState(event.questions);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();

    // Same guard as qaService.askQuestion.
    if (!text.trim()) {
      setError('Question text is required.');
      return;
    }

    setQuestions((current) => [
      ...current,
      {
        id: `local-q-${current.length + 1}`,
        event_id: event.id,
        user_id: user.id,
        question_text: text.trim(),
        answer_text: null,
        answered_by: null,
        created_at: new Date().toISOString(),
        answered_at: null,
      },
    ]);
    setText('');
    setError(null);
    setSubmitted(true);
  }

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

      <form className="card card--padded qa-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="question-text">
            Ask the organizers
          </label>
          <textarea
            id="question-text"
            className="textarea"
            value={text}
            onChange={(changeEvent) => {
              setText(changeEvent.target.value);
              setError(null);
              setSubmitted(false);
            }}
            placeholder="What would you like to know about this event?"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'question-error' : undefined}
          />
          {error ? (
            <p className="field__error" id="question-error">
              {error}
            </p>
          ) : null}
          {submitted ? (
            <p className="notice notice--success" role="status">
              Question posted. An organizer will answer it here.
            </p>
          ) : null}
        </div>

        <Button variant="primary" type="submit">
          Post question
        </Button>
      </form>
    </section>
  );
}
