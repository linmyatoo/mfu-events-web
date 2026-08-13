/**
 * UI-only mock data for the **User** role.
 *
 * Shapes are copied verbatim from the backend contract so this file can be
 * replaced by real responses without touching any component:
 *   MFU-Events/docs/DATA_MODEL.md
 *   MFU-Events/frontend-mocks/user/*.json
 *
 * Endpoint → export:
 *   GET  /api/user/me            → mockUser
 *   GET  /api/user/events        → mockEvents        (each row: Event + organizers[] + myBooking)
 *   GET  /api/user/events/:id    → getEventDetail(id) (+ isPast, questions[], reviews[])
 *   GET  /api/user/bookings      → mockBookings      (each row: Booking + event)
 *   GET  /api/user/me/points     → mockPoints        ({ balance, history })
 *   GET  /api/user/me/health     → mockHealth        ({ score, bookingRestricted, openFlag, history })
 *
 * Field names stay snake_case on purpose — they are the API's names.
 */

export const mockUser = {
  id: 'u7',
  university_id: 'stu-1001',
  name: 'Aye Chan Moe',
  email: 'aye.chan.moe@mfu.edu',
  role: 'user',
  school: 'School of Computing',
  year: 'Year 3',
  status: 'active',
  health_score: 78,
  booking_restricted: false,
  organization: null,
  created_at: '2025-03-31T05:00:00.000Z',
};

/** GET /api/user/events — published events matching the user's school/year. */
export const mockEvents = [
  {
    id: 'e11',
    created_by: 'u1',
    is_point_event: true,
    organizer_points_base: 20,
    title: 'Charity Fun Run',
    description:
      '5K campus fun run raising funds for the regional children’s hospital.',
    poster_image_url: null,
    venue: 'Athletics Track',
    start_time: '2026-07-14T00:00:00.000Z',
    end_time: '2026-07-14T03:00:00.000Z',
    capacity: 120,
    registration_deadline: '2026-07-13T05:00:00.000Z',
    status: 'published',
    audience_type: 'open',
    target_school: null,
    target_year: null,
    points_value: 5,
    created_at: '2026-06-24T05:00:00.000Z',
    organizers: [
      { name: 'Kyaw Thura', role: 'main_organizer' },
      { name: 'Thiri Aung', role: 'co_organizer' },
    ],
    myBooking: null,
  },
  {
    id: 'e6',
    created_by: 'u4',
    is_point_event: false,
    organizer_points_base: null,
    title: 'Study Skills Seminar',
    description:
      'A workshop on exam prep, time management, and note-taking strategies for the upcoming term.',
    poster_image_url: null,
    venue: 'Room A-204',
    start_time: '2026-07-24T06:00:00.000Z',
    end_time: '2026-07-24T07:30:00.000Z',
    capacity: 40,
    registration_deadline: '2026-07-23T05:00:00.000Z',
    status: 'published',
    audience_type: 'year',
    target_school: null,
    target_year: 'Year 3',
    points_value: 0,
    created_at: '2026-07-09T05:00:00.000Z',
    organizers: [{ name: 'Zaw Min Htet', role: 'main_organizer' }],
    myBooking: {
      id: 'b18',
      event_id: 'e6',
      user_id: 'u7',
      status: 'attended',
      qr_token: 'EVMFU-B18-E6-U7',
      booked_at: '2026-07-19T05:00:00.000Z',
      cancelled_at: null,
      checked_in_at: '2026-07-24T06:05:00.000Z',
    },
  },
  {
    id: 'e8',
    created_by: 'u1',
    is_point_event: true,
    organizer_points_base: 30,
    title: 'Freshers Career Fair 2026',
    description:
      'Employers and student organizations host booths for the new intake.',
    poster_image_url: null,
    venue: 'Main Gymnasium',
    start_time: '2026-08-10T07:00:00.000Z',
    end_time: '2026-08-10T11:00:00.000Z',
    capacity: 400,
    registration_deadline: '2026-08-09T05:00:00.000Z',
    status: 'published',
    audience_type: 'open',
    target_school: null,
    target_year: null,
    points_value: 25,
    created_at: '2026-07-26T05:00:00.000Z',
    organizers: [
      { name: 'Su Myat Noe', role: 'main_organizer' },
      { name: 'Kyaw Thura', role: 'co_organizer' },
    ],
    myBooking: {
      id: 'b24',
      event_id: 'e8',
      user_id: 'u7',
      status: 'attended',
      qr_token: 'EVMFU-B24-E8-U7',
      booked_at: '2026-08-03T05:00:00.000Z',
      cancelled_at: null,
      checked_in_at: '2026-08-10T07:30:00.000Z',
    },
  },
  {
    id: 'e3',
    created_by: 'u6',
    is_point_event: false,
    organizer_points_base: null,
    title: 'Year 3 Capstone Kickoff',
    description:
      'Mandatory kickoff session for all Year 3 students starting their capstone project this term.',
    poster_image_url: null,
    venue: 'Engineering Auditorium',
    start_time: '2026-08-16T05:00:00.000Z',
    end_time: '2026-08-16T06:30:00.000Z',
    capacity: 150,
    registration_deadline: '2026-08-15T05:00:00.000Z',
    status: 'published',
    audience_type: 'year',
    target_school: null,
    target_year: 'Year 3',
    points_value: 10,
    created_at: '2026-07-30T05:00:00.000Z',
    organizers: [{ name: 'Thiri Aung', role: 'main_organizer' }],
    myBooking: {
      id: 'b9',
      event_id: 'e3',
      user_id: 'u7',
      status: 'booked',
      qr_token: 'EVMFU-B9-E3-U7',
      booked_at: '2026-08-12T05:00:00.000Z',
      cancelled_at: null,
      checked_in_at: null,
    },
  },
  {
    id: 'e1',
    created_by: 'u2',
    is_point_event: false,
    organizer_points_base: null,
    title: 'Computing Career Talk',
    description:
      'Alumni from local tech companies share how they broke into the industry, followed by Q&A and networking.',
    poster_image_url: null,
    venue: 'Room CS-101',
    start_time: '2026-08-18T07:00:00.000Z',
    end_time: '2026-08-18T09:00:00.000Z',
    capacity: 80,
    registration_deadline: '2026-08-17T05:00:00.000Z',
    status: 'published',
    audience_type: 'school',
    target_school: 'School of Computing',
    target_year: null,
    points_value: 15,
    created_at: '2026-08-04T05:00:00.000Z',
    organizers: [{ name: 'Su Myat Noe', role: 'main_organizer' }],
    myBooking: {
      id: 'b1',
      event_id: 'e1',
      user_id: 'u7',
      status: 'booked',
      qr_token: 'EVMFU-B1-E1-U7',
      booked_at: '2026-08-10T05:00:00.000Z',
      cancelled_at: null,
      checked_in_at: null,
    },
  },
  {
    id: 'e4',
    created_by: 'u2',
    is_point_event: false,
    organizer_points_base: null,
    title: 'Freshers Welcome Fair',
    description:
      'Meet clubs, societies and fellow students at the start-of-term welcome fair. Free snacks and giveaways all afternoon.',
    poster_image_url: null,
    venue: 'Student Union Hall',
    start_time: '2026-08-20T03:00:00.000Z',
    end_time: '2026-08-20T08:00:00.000Z',
    capacity: 300,
    registration_deadline: '2026-08-19T05:00:00.000Z',
    status: 'published',
    audience_type: 'open',
    target_school: null,
    target_year: null,
    points_value: 20,
    created_at: '2026-07-24T05:00:00.000Z',
    organizers: [
      { name: 'Su Myat Noe', role: 'main_organizer' },
      { name: 'Thiri Aung', role: 'co_organizer' },
      { name: 'Kyaw Thura', role: 'checkin_staff' },
    ],
    myBooking: {
      id: 'b11',
      event_id: 'e4',
      user_id: 'u7',
      status: 'booked',
      qr_token: 'EVMFU-B11-E4-U7',
      booked_at: '2026-08-08T05:00:00.000Z',
      cancelled_at: null,
      checked_in_at: null,
    },
  },
];

/**
 * Detail-only payload per event, keyed by event id.
 *
 * `GET /api/user/events/:id` returns the feed row plus these fields.
 * The backend only fills `reviews` once `isPast` is true, and a review
 * requires an `attended` booking (reviewService.submitReview).
 */
const eventDetailExtras = {
  e1: {
    questions: [
      {
        id: 'q1',
        event_id: 'e1',
        user_id: 'u9',
        question_text: "Will this be recorded for those who can't attend?",
        answer_text:
          'Yes, a recording will be posted to the course page after the talk.',
        answered_by: 'u2',
        created_at: '2026-08-09T05:00:00.000Z',
        answered_at: '2026-08-10T05:00:00.000Z',
      },
      {
        id: 'q2',
        event_id: 'e1',
        user_id: 'u12',
        question_text: 'Is there a dress code?',
        answer_text: null,
        answered_by: null,
        created_at: '2026-08-11T05:00:00.000Z',
        answered_at: null,
      },
    ],
    reviews: [],
  },
  e8: {
    questions: [
      {
        id: 'q5',
        event_id: 'e8',
        user_id: 'u7',
        question_text: 'Which employers are confirmed so far?',
        answer_text:
          'The full booth list is pinned on the Student Union noticeboard.',
        answered_by: 'u1',
        created_at: '2026-08-06T05:00:00.000Z',
        answered_at: '2026-08-07T05:00:00.000Z',
      },
    ],
    // Reviews by other attendees; u7 has not reviewed, so the form shows.
    reviews: [
      {
        id: 'r4',
        event_id: 'e8',
        user_id: 'u9',
        rating: 5,
        comment: 'Loads of employers and the CV clinic was genuinely useful.',
        sentiment_label: 'positive',
        sentiment_score: 0.94,
        sentiment_status: 'received',
        sentiment_analyzed_at: '2026-08-11T05:00:00.000Z',
        created_at: '2026-08-11T05:00:00.000Z',
      },
      {
        id: 'r5',
        event_id: 'e8',
        user_id: 'u10',
        rating: 3,
        comment: 'Good but far too crowded in the first hour.',
        sentiment_label: null,
        sentiment_score: null,
        sentiment_status: 'pending_external',
        sentiment_analyzed_at: null,
        created_at: '2026-08-12T05:00:00.000Z',
      },
    ],
  },
  e6: {
    questions: [],
    // u7 already reviewed this one — the form is replaced by their review.
    reviews: [
      {
        id: 'r6',
        event_id: 'e6',
        user_id: 'u7',
        rating: 4,
        comment: 'Practical tips I actually used during revision week.',
        sentiment_label: 'positive',
        sentiment_score: 0.78,
        sentiment_status: 'received',
        sentiment_analyzed_at: '2026-07-26T05:00:00.000Z',
        created_at: '2026-07-25T05:00:00.000Z',
      },
    ],
  },
};

/**
 * GET /api/user/events/:id — feed row + isPast + questions[] + reviews[].
 * Returns null when the id is unknown, mirroring the API's 404.
 */
export function getEventDetail(eventId, now = new Date()) {
  const event = mockEvents.find((row) => row.id === eventId);
  if (!event) return null;

  const extras = eventDetailExtras[eventId] ?? { questions: [], reviews: [] };
  const isPast = new Date(event.start_time) < now;

  return {
    ...event,
    isPast,
    questions: extras.questions,
    reviews: isPast ? extras.reviews : [],
  };
}

/** GET /api/user/bookings — Booking rows with their event embedded. */
export const mockBookings = mockEvents
  .filter((event) => event.myBooking)
  .map((event) => {
    const { organizers, myBooking, ...eventFields } = event;
    return { ...myBooking, event: eventFields };
  });

/** GET /api/user/me/points */
export const mockPoints = {
  balance: 50,
  history: [
    {
      id: 'pt5',
      subject_type: 'user',
      subject_id: 'u7',
      event_id: 'e8',
      booking_id: 'b24',
      category: 'attendance',
      organizer_role_at_award: null,
      points: 25,
      reason: 'Attended: Freshers Career Fair 2026',
      approval_status: 'n/a',
      approved_by: null,
      approved_at: null,
      created_at: '2026-08-10T05:00:00.000Z',
      sync_status: 'unsynced',
      synced_at: null,
    },
    {
      id: 'pt2',
      subject_type: 'user',
      subject_id: 'u7',
      event_id: 'e2',
      booking_id: 'b4',
      category: 'attendance',
      organizer_role_at_award: null,
      points: 15,
      reason: 'Attended: AI & Society Panel',
      approval_status: 'n/a',
      approved_by: null,
      approved_at: null,
      created_at: '2026-08-05T05:00:00.000Z',
      sync_status: 'unsynced',
      synced_at: null,
    },
    {
      id: 'pt9',
      subject_type: 'user',
      subject_id: 'u7',
      event_id: 'e9',
      booking_id: 'b30',
      category: 'attendance',
      organizer_role_at_award: null,
      points: 10,
      reason: 'Attended: Blood Donation Drive',
      approval_status: 'n/a',
      approved_by: null,
      approved_at: null,
      created_at: '2026-07-24T05:00:00.000Z',
      sync_status: 'synced',
      synced_at: '2026-07-25T05:00:00.000Z',
    },
  ],
};

/** GET /api/user/me/health */
export const mockHealth = {
  score: 78,
  bookingRestricted: false,
  openFlag: null,
  history: [
    {
      id: 'ht3',
      user_id: 'u7',
      booking_id: 'b18',
      delta: 5,
      reason: 'Reviewed: Study Skills Seminar',
      created_at: '2026-07-25T05:00:00.000Z',
    },
    {
      id: 'ht1',
      user_id: 'u7',
      booking_id: 'b7',
      delta: -20,
      reason: 'No-show: Library Skills Workshop',
      created_at: '2026-07-02T05:00:00.000Z',
    },
  ],
};
