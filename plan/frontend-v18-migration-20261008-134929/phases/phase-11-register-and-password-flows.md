# Phase 11 — Register, email verification, forgot/reset password

**Spec section:** "Auth — New Routes", "Register Page".
**Depends on:** None (auth is a standalone surface).
**Risk:** Medium — net-new unauthenticated routes; must not require a session (`sendSession: false` pattern already exists for login, reuse it).
**Independently shippable:** Yes.

## Steps

1. `app/actions.js` — add alongside `loginAction`/`logoutAction`:
   - `registerAction(_prevState, formData)` → `POST /api/auth/register` with `sendSession: false` (same pattern as `loginAction`, line 44-48), body `{ name, email, password, university_id?, school?, year?, consentVersion? }`. On success (201), return `{ ok: true, message: "A verification link has been sent to ..." }` rather than redirecting — the doc's success response has no session cookie, so there's nothing to log in yet.
   - `forgotPasswordAction(_prevState, formData)` → `POST /api/auth/forgot-password`, body `{ email }`, `sendSession: false`. Always return the same success message regardless of outcome (mirror the backend's anti-enumeration behavior in the UI copy too — don't reveal via the UI whether the email existed).
   - `resetPasswordAction(_prevState, formData)` → `POST /api/auth/reset-password`, body `{ token, password }`, `sendSession: false`. On success, redirect to `/login` with a success query param or flash message.
2. New pages (mirror `app/login/page.js` structure: `getSession()` redirect-if-signed-in guard, `page-container`/`page-header` markup):
   - `app/register/page.js` + `components/auth/RegisterForm.jsx` (mirror `components/auth/LoginForm.jsx`) — fields: name, email, password, confirm-password (client-side match check before submit), school (optional), year (optional), PDPA consent checkbox (required). On success, swap to a "Check your inbox" state instead of redirecting (same component, local `useState` toggle after `state.ok`).
   - `app/forgot-password/page.js` + a small form component — single email field, always shows the same generic success message.
   - `app/reset-password/page.js` — reads `token` from `searchParams`, form with password + confirm fields, submits to `resetPasswordAction`.
   - Email verification needs no dedicated frontend page — `GET /api/auth/verify-email?token=` is a backend-rendered or redirect-based link clicked from the email itself; confirm with backend whether it redirects to a frontend route on completion, and if so add a minimal `app/verify-email/page.js` that just shows a success/error message based on a query param the backend redirects with.
3. `app/login/page.js` — add a "Don't have an account? Register" link pointing to `/register`, and a "Forgot password?" link pointing to `/forgot-password`, next to the existing `<LoginForm />`.

## Files

- `app/actions.js`
- `app/register/page.js` (new)
- `app/forgot-password/page.js` (new)
- `app/reset-password/page.js` (new)
- `app/verify-email/page.js` (new, pending confirmation of backend redirect behavior)
- `components/auth/RegisterForm.jsx` (new)
- `components/auth/ForgotPasswordForm.jsx` (new)
- `components/auth/ResetPasswordForm.jsx` (new)
- `app/login/page.js`

## Risks / unknowns

- Confirm whether `@mfu.ac.th` email validation (doc: "Only `@mfu.ac.th` addresses are accepted") should be client-side pre-validated too, for a faster error, or left to the backend's 400 response. Recommend a lightweight client-side check for UX, with the backend as the actual enforcement point (standard defense-in-depth, matches existing validation style in `createEventAction`/`validate()`).
- Confirm the exact redirect/query-param contract for `GET /api/auth/verify-email` before building `app/verify-email/page.js` — this is the one sub-step genuinely blocked on a question to the backend dev, not just reading the doc.

## Verification

- `npm run lint`
- `npm run build`
- Manual: register a new `@mfu.ac.th` account, confirm "check your inbox" state shows, use the dev shortcut `GET /api/auth/dev/force-verify?email=...` (non-production) to verify, then log in.
- Manual: forgot-password → reset-password happy path end to end against a dev backend.

## Outcome

Implemented as specified. Verified exact request/response shapes directly
against `MFU-Events/backend/routes/auth.js` (not just the doc) before
writing any code — no drift found beyond the two unknowns the phase file
itself already flagged as open questions:

- **Register body:** confirmed `{ name, email, password, university_id?, school?, year?, consentVersion? }`, 201 response `{ message, userId }`, no session cookie — matches the doc exactly. The form (per the doc's "Register Page" spec) only collects `name`/`email`/`password`/`confirmPassword`/`school`/`year`/consent, so `university_id` and `consentVersion` are omitted from the submitted body entirely (both optional server-side; the backend defaults `consentVersion` to `CONSENT_VERSION` env var when absent).
- **Forgot/reset-password:** confirmed `{ email }` → generic message always, and `{ token, password }` → `{ message }`, 400 on invalid/expired token. Implemented `forgotPasswordAction` to swallow any `ApiError` and always return the same success copy (defense-in-depth on top of the backend's own anti-enumeration behavior — the doc explicitly asked for this).
- **Resolved the phase file's one genuine unknown** (email-verification redirect contract): read `backend/lib/notificationService.js:78-86` directly. The verification email's link is `${APP_URL}/verify-email?token=<tok>` — i.e. it points straight at this *frontend's* own route, not at the backend API, and `GET /api/auth/verify-email` itself just returns a JSON `{ message }` (or 400 `{ error }`) with no redirect involved. So `app/verify-email/page.js` is a server component that calls `apiGet` itself using the `token` query param and renders the resulting success/error message — no backend-redirect dance needed, resolving the "blocked on a backend question" risk noted in the phase file without needing to ask anyone.

**Files created:**
- `app/register/page.js`
- `app/forgot-password/page.js`
- `app/reset-password/page.js`
- `app/verify-email/page.js`
- `components/auth/RegisterForm.jsx`
- `components/auth/ForgotPasswordForm.jsx`
- `components/auth/ResetPasswordForm.jsx`

**Files changed:**
- `app/actions.js` — added `registerAction`, `forgotPasswordAction`, `resetPasswordAction`, all following the existing `loginAction`/`failure()`/`sendSession: false` pattern.
- `app/login/page.js` — added "Don't have an account? Register" and "Forgot password?" links below `<LoginForm />`.

All new unauthenticated pages (`register`, `forgot-password`, `reset-password`) mirror `app/login/page.js`'s `getSession()` redirect-if-signed-in guard and `page-container`/`page-header` markup, per the phase file's step 2. `verify-email` intentionally has no such guard (it's an informational confirmation page, not a sign-in-adjacent form) and no mention of one was in the phase file's step 2 list. Forms reuse existing `.card`/`.field`/`.input`/`.select`/`.notice--success`/`.field__error`/`.field__hint` classes and the `Button` component verbatim — no new CSS was added. The register/reset-password forms do a client-side password-confirmation check (per the phase file's "client-side match check before submit" instruction) in addition to the server action re-checking it.

- `npm run lint` — clean, no errors/warnings.
- `npm run build` — compiled successfully; `/register`, `/forgot-password`, `/reset-password`, `/verify-email` all listed as dynamic (`ƒ`) routes alongside the existing `/login`.
