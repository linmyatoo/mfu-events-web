import Link from 'next/link';
import { notFound } from 'next/navigation';

import Icon from '../../../../components/common/Icon';
import AnswerForm from '../../../../components/organizer/AnswerForm';
import AttendeeList from '../../../../components/organizer/AttendeeList';
import ContributorsManager from '../../../../components/organizer/ContributorsManager';
import EventLifecycle from '../../../../components/organizer/EventLifecycle';
import StaffCallsManager from '../../../../components/organizer/StaffCallsManager';
import TeamManager from '../../../../components/organizer/TeamManager';
import ReviewsSection from '../../../../components/events/ReviewsSection';
import { ApiError, apiGet, apiGetAllowed } from '../../../../lib/api';
import {
  ORGANIZER_ROLE_LABELS,
  audienceLabel,
  eventStatusMeta,
  formatDate,
  formatEventWhen,
  venueName,
} from '../../../../lib/events';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const event = await apiGet(`/api/organizer/events/${id}`);
    return { title: `${event.title} · Organizer · MFU-Events` };
  } catch {
    return { title: 'Event · Organizer · MFU-Events' };
  }
}

/**
 * One event, from the organizing team's side.
 *
 *   GET /api/organizer/events/:id  → + myRole, team, contributors,
 *                                     attendeeCount, questions, reviews
 *
 * No `organizer` (org entity) field is returned here — only `org_id` on the
 * event itself (backend/routes/organizer.js:115-126). There is no team-scoped
 * endpoint to resolve an org name from an id, so the org is not displayed on
 * this page.
 *
 * Check-in staff get attendance only: the backend already blanks `questions`
 * and `reviews` for that role, and the sections below follow the same rule.
 */
export default async function OrganizerEventPage({ params }) {
  const { id } = await params;

  let event;
  try {
    event = await apiGet(`/api/organizer/events/${id}`);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) notFound();
    throw error;
  }

  const isMain = event.myRole === 'main_organizer';
  const canEdit = isMain || event.myRole === 'co_organizer';

  const attendees = await apiGetAllowed(`/api/organizer/events/${id}/attendees`);
  const staffCalls = await apiGetAllowed(`/api/organizer/events/${id}/staff-calls`);
  const settings = await apiGet('/api/user/settings');

  const status = eventStatusMeta(event.status);
  const questions = event.questions ?? [];
  const reviews = event.reviews ?? [];

  return (
    <div className="page-container">
      <Link href="/organizer" className="back-link">
        <Icon name="chevronRight" size={18} className="back-link__icon" />
        My events
      </Link>

      <header className="event-detail__intro">
        <div className="event-detail__tags">
          <span className={`badge badge--${status.variant}`}>{status.label}</span>
          <span className="chip">{audienceLabel(event)}</span>
          <span className="chip">
            {ORGANIZER_ROLE_LABELS[event.myRole] ?? event.myRole}
          </span>
          {event.is_point_event ? (
            <span className="badge badge--info">Point event</span>
          ) : null}
        </div>

        <h1>{event.title}</h1>

        <p className="event-detail__meta">
          <Icon name="calendar" size={16} />
          {formatEventWhen(event)}
        </p>
        <p className="event-detail__meta">
          <Icon name="place" size={16} />
          {venueName(event)}
        </p>
        <p className="event-detail__meta">
          <Icon name="user" size={16} />
          {event.attendeeCount} booked of {event.capacity} · registration closes{' '}
          {formatDate(event.registration_deadline)}
        </p>
      </header>

      <div className="event-detail__layout">
        <div className="event-detail__main">
          <section className="page-section">
            <h2 className="section-title">Description</h2>
            <p>{event.description || 'No description yet.'}</p>
            {event.requirements ? (
              <p className="text-muted">Requirements: {event.requirements}</p>
            ) : null}
          </section>

          <TeamManager
            event={event}
            team={event.team ?? []}
            canManage={isMain}
          />

          <ContributorsManager
            event={event}
            contributors={event.contributors ?? []}
            canManage={isMain}
          />

          <StaffCallsManager
            event={event}
            calls={staffCalls ?? []}
            canManage={isMain}
          />

          {attendees ? <AttendeeList eventId={event.id} attendees={attendees} /> : null}

          {canEdit ? (
            <section className="page-section" aria-labelledby="qa-heading">
              <h2 className="section-title" id="qa-heading">
                Questions ({questions.length})
              </h2>

              {questions.length === 0 ? (
                <p className="text-muted">No questions from attendees yet.</p>
              ) : (
                <ul className="stack">
                  {questions.map((question) => (
                    <li className="card card--padded qa-item" key={question.id}>
                      <p className="qa-item__question">{question.question_text}</p>
                      <p className="qa-item__meta text-muted">
                        Asked {formatDate(question.created_at)}
                      </p>

                      {question.answer_text ? (
                        <div className="qa-item__answer">
                          <p>{question.answer_text}</p>
                          <p className="qa-item__meta text-muted">
                            Answered {formatDate(question.answered_at)}
                          </p>
                        </div>
                      ) : (
                        <AnswerForm eventId={event.id} questionId={question.id} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {/* Mirrors frontend/src/pages/creator/EventDetail.jsx:258 — canSeeContent
              is already baked into event.reviews by backend/routes/organizer.js:106-114
              (checkin_staff and non-past events get []), so gating on reviews.length
              here is equivalent; readOnly hides the submit form (organizers don't
              author attendee reviews). */}
          {canEdit && reviews.length > 0 ? (
            <ReviewsSection
              event={event}
              user={null}
              readOnly
              reviewEditWindowDays={settings.review_edit_window_days}
            />
          ) : null}
        </div>

        <EventLifecycle event={event} isMainOrganizer={isMain} canEdit={canEdit} />
      </div>
    </div>
  );
}
