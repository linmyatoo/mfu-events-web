# Phase 6 — Auth + misc pages pass

Status: not started
Depends on: Phase 1, Phase 2

## Scope

`app/login/page.js`, `app/register/page.js`, `app/forgot-password/page.js`,
`app/reset-password/page.js`, `app/verify-email/page.js` — these render a
`.page-header` inline (not through `PageContainer.jsx`, per the grep in
`research/existing-code.md` §4) with just `title`+`subtitle`, no `actions`.

Also: `app/(app)/health/page.js`, `app/error.js`/`app/(app)/error.js`/
`app/admin/error.js`/`app/organizer/error.js`, `app/loading.js`.

## Approach

Since none of these pass `actions`, Phase 1's header-actions bug doesn't
apply to them directly — but they DO inherit the `.page-header` flex-column
conversion, so confirm title→subtitle spacing still looks right after Phase 1
(should be unchanged, since that gap was already working via
`page-header__title`'s `margin-bottom`, now via the parent `gap` instead —
verify the chosen gap value matches the old `--space-1` visually, adjust if
Phase 1's flex-column introduced a different title→subtitle gap than before).

## Verification

Visual check of all 5 auth pages at 2 breakpoints (768px drawer/mobile-nav
breakpoint doesn't apply to auth pages — they're likely centered single-column
regardless; confirm) + light/dark.
