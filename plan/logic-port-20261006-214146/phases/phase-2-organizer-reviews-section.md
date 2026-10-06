# Phase 2 — Reviews section on organizer event detail page (D2)

Status: done (2026-10-06). Implemented and manually verified against a live
backend.

## What changed

- `components/events/ReviewsSection.jsx`: added a `readOnly` prop (default
  `false`). When `true`, skips the submit-form / "already reviewed" /
  "only attendees can review" branches and the success-message banner, and
  guards the two `review.user_id === user?.id` comparisons against a `null`
  `user` (organizers pass `user={null}`). List/average/sentiment markup is
  unchanged and unconditionally rendered as before.
- `app/organizer/events/[id]/page.js`: imported `ReviewsSection`, added
  `const reviews = event.reviews ?? [];`, and rendered
  `<ReviewsSection event={event} user={null} readOnly />` right after the
  Questions section, gated on `canEdit && reviews.length > 0` — equivalent
  to reference's `canSeeContent && event.reviews?.length > 0` gate since
  `backend/routes/organizer.js:112-113` already blanks `reviews` to `[]`
  for `checkin_staff`/non-past events, and `canEdit` (`isMain ||
  co_organizer`) is the same boolean as `canSeeContent` for this event's
  3-role team model (`backend/lib/constants.js:58-60`).
- `app/(app)/events/[id]/page.js` unchanged — `readOnly` defaults to
  `false` there, so existing behavior (submit form, success message,
  "your review" byline) is unaffected.

## What's broken

See `plan.md` D2 and `research/01-organizer-portal.md`. The backend already
returns `event.reviews` to
`GET /api/organizer/events/:id` (`backend/routes/organizer.js:106-114`) once
`canSeeContent && isPast`. `app/organizer/events/[id]/page.js` never renders
them, even though reference shows this exact data
(`frontend/src/pages/creator/EventDetail.jsx:258-277`), including the
"reviewer identity is hidden" callout and sentiment badges.

## Fix

1. Reuse `components/events/ReviewsSection.jsx` (already battle-tested on
   `app/(app)/events/[id]/page.js:133`). It currently assumes a `user` prop
   with a real booking (`event.myBooking`) to decide whether to show the
   submit form. On the organizer page there is no booking, so the organizer
   must never see a submit form — only the list of existing reviews.
   - Minimal-diff approach: give `ReviewsSection` a `readOnly` prop (default
     `false`) that, when `true`, skips the `attended`/`alreadyReviewed`
     submit-form branch entirely and only renders the list + average +
     sentiment tags. This is a logic branch inside an existing component,
     not new markup — the list markup already exists and is unconditionally
     rendered today.
   - Call it from `app/organizer/events/[id]/page.js` as
     `<ReviewsSection event={event} user={null} readOnly />` (or pass the
     organizer's own user object if later needed for "is this my own
     anonymous review" parity — not required here since organizers never
     author attendee reviews).
2. Gate rendering exactly like reference: only when
   `canSeeContent && event.reviews?.length > 0` (mirror
   `frontend/src/pages/creator/EventDetail.jsx:258`), placed after the
   Questions section, consistent with reference's ordering and with the
   target's own `app/(app)/events/[id]/page.js:130-133` ordering
   (Questions, then Reviews).

## Verification

1. `npm run lint && npm run build` (confirm exact script names in
   `package.json` first).
2. As an organizer whose event is past (`registration_closed`/`completed`)
   and has reviews, open `/organizer/events/:id` and confirm a Reviews
   section renders with the same content shape as the user-facing page, no
   submit form, no console errors.
3. As a `checkin_staff` team member (where `canSeeContent` is false),
   confirm the Reviews section does not render at all — matches reference's
   `canSeeContent` gate and the backend's own `canSeeContent` blanking of
   `reviews: []` for that role.
4. Confirm the existing user-facing event page
   (`app/(app)/events/[id]/page.js`) is visually and functionally unchanged
   (no prop regressions from adding `readOnly` with a default of `false`).
