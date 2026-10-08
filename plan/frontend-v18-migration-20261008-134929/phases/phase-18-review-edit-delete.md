# Phase 18 — Review edit/delete (user app)

**Status: Complete (2026-10-08).** Implemented as planned, with one
deviation from the exact step text: the inline edit form could not use
`useActionState` bound via `<form action={editFormAction}>` as literally
written in Step 1/2, because closing the form on a successful save requires
calling `setEditingId(null)` after the async action resolves, and the
repo's lint config (`react-hooks/set-state-in-effect`) forbids the
`useEffect(() => { if (editState?.ok) setEditingId(null); }, [editState])`
pattern that would otherwise do that. `editReviewAction` keeps the exact
`(_prevState, formData)` signature and `PATCH` body the phase file
specifies, but `ReviewsSection.jsx` invokes it directly inside
`useTransition` (same `run()`-via-transition shape as `TeamManager.jsx`)
rather than binding it through `useActionState`, so the success/`error`
branch can close the form synchronously. `deleteReviewAction` uses the
plan's `useTransition` + `Modal` confirm pattern unchanged.

Backend source confirmed (`MFU-Events/backend/lib/services/reviewService.js`,
`editReview`/`deleteReview`): author-only, window = `settings.review_edit_window_days
|| 7`, checked server-side on every PATCH/DELETE regardless of what the
client sends. `GET/PATCH /api/admin/settings` (`backend/routes/admin.js`) is
mounted with `requireAdmin` on the whole router — confirmed no user-facing
way to read the real setting value — so `REVIEW_EDIT_WINDOW_DAYS = 7` is a
hardcoded client-side constant exactly as the phase file's Risk note
anticipated, with a `TODO(Phase 19)` comment in `ReviewsSection.jsx` pointing
at threading the real value down once the settings page exists.

**Spec section:** "Review Edit & Delete — User App".
**Depends on:** Phase 10 (same component, `ReviewsSection.jsx`) — do this phase after Phase 10 to avoid two separate diffs touching the same gating logic.
**Risk:** Low-medium — needs the platform's `review_edit_window_days` setting, which only exists via `GET /api/admin/settings` (Phase 19). Until Phase 19 ships, use the doc's stated default of 7 days as a hardcoded client-side constant, matching how `lib/events.js` already hardcodes the `health_restriction_threshold` of 40 in `healthBand()`'s comment (line 281-283) as a "mirrors DEFAULT_SETTINGS" pattern.
**Independently shippable:** Yes, with the hardcoded-default caveat above.

## Steps

1. `app/actions.js` — add:
   - `editReviewAction(_prevState, formData)` → `PATCH /api/user/reviews/:id`, body `{ rating?, comment? }`.
   - `deleteReviewAction(reviewId, eventId)` → `DELETE /api/user/reviews/:id`.
2. `components/events/ReviewsSection.jsx`:
   - Add a `REVIEW_EDIT_WINDOW_DAYS = 7` constant (or thread it down as a prop once Phase 19's settings page exists — track this as a TODO comment pointing at Phase 19).
   - Compute `canEdit = !readOnly && review.user_id === user?.id && daysSince(review.created_at) <= REVIEW_EDIT_WINDOW_DAYS` per review, and render Edit/Delete controls conditionally (doc's exact gating expression).
   - Edit: toggle the existing review card into an inline edit form (reuse `StarRating` + textarea from the submit form, prefilled).
   - Delete: a confirm-then-call pattern, matching `TeamManager.jsx`'s remove-with-`useTransition` style (no existing delete-confirmation modal pattern in this codebase beyond `Modal.jsx` used in `EventReview.jsx` — reuse `Modal` for a "Delete this review?" confirmation).

## Files

- `app/actions.js`
- `components/events/ReviewsSection.jsx`

## Verification

- `npm run lint`
- `npm run build`
- Manual: submit a review, confirm Edit/Delete controls appear immediately (within window), edit it and confirm the change persists, then delete it.
- Manual: find/simulate a review older than 7 days (or temporarily lower the constant for a local test) and confirm controls disappear.
