'use client';

import { useActionState } from 'react';

import { answerQuestionAction } from '../../app/organizer/actions';
import Button from '../common/Button';

const initialState = { error: null, message: null };

/** POST /api/organizer/events/:id/questions/:qid/answer — Main or Co only. */
export default function AnswerForm({ eventId, questionId }) {
  const [state, formAction, pending] = useActionState(answerQuestionAction, initialState);

  return (
    <form className="qa-form" action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="questionId" value={questionId} />

      <div className="field">
        <label className="field__label" htmlFor={`answer-${questionId}`}>
          Answer
        </label>
        <textarea
          id={`answer-${questionId}`}
          name="text"
          className="textarea"
          placeholder="Reply to this question"
        />
        {state?.error ? <p className="field__error">{state.error}</p> : null}
        {state?.message ? (
          <p className="notice notice--success" role="status">
            {state.message}
          </p>
        ) : null}
      </div>

      <Button variant="primary" size="sm" type="submit" disabled={pending}>
        {pending ? 'Posting…' : 'Post answer'}
      </Button>
    </form>
  );
}
