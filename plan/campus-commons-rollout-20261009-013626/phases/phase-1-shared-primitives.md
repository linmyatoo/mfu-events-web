# Phase 1 — Shared primitive fixes

Status: done

## Why first

Both confirmed root-cause bugs live in shared primitives consumed by 28+32
files respectively. Fixing them here fixes the organizer screenshot bug and
its systemic twin everywhere at once, with the smallest possible diff.

## Edits

### 1. `styles/layout.css` — give `.page-header` a real gap

Current (lines 247-259):
```css
.page-header {
  margin-bottom: var(--space-6);
}

.page-header__title {
  margin-bottom: var(--space-1);
  font-family: var(--font-family-display);
}

.page-header__subtitle {
  color: var(--muted-text-color);
  margin: 0;
}
```

Problem: `.page-header` is a plain block container. `title`/`subtitle`/
`actions` stack as block-level (or anonymous-block-wrapped inline) boxes with
no margin between the last text node and the actions slot → 0px gap.

Fix direction: make `.page-header` a flex column with a gap, and stop relying
on margin collapsing between arbitrary children:

```css
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.page-header__title {
  font-family: var(--font-family-display);
}

.page-header__subtitle {
  color: var(--muted-text-color);
  margin: 0;
}

.page-header__actions {
  margin-top: var(--space-2);
}
```

Note: dropped `margin-bottom: var(--space-1)` from `.page-header__title` since
the parent `gap` now owns inter-block spacing — keep title/subtitle tighter
than title/actions by using a nested wrapper if the two gaps need to differ
(title→subtitle tighter, subtitle→actions looser is reasonable: consider
wrapping title+subtitle in a `.page-header__text` div with `gap: var(--space-1)`
and leaving the outer `.page-header` gap at `var(--space-3)` or `var(--space-4)`
between the text block and actions). Confirm exact values visually in Phase 2
rather than guessing further here — the important part is "non-zero and
deliberate," not the precise px.

### 2. `components/layout/PageContainer.jsx` — wrap actions

Current:
```jsx
<div className="page-header">
  <h1 className="page-header__title">{title}</h1>
  {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
  {actions}
</div>
```

Fix:
```jsx
<div className="page-header">
  <h1 className="page-header__title">{title}</h1>
  {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
  {actions ? <div className="page-header__actions">{actions}</div> : null}
</div>
```

This gives Phase 1's CSS something concrete to target without guessing at
sibling selectors, and doesn't change rendering for the 24 pages that pass no
`actions` (the ternary renders nothing, same as today).

### 3. `styles/components.css` — icon/text gap 4px → 8px

Three selectors, each currently `gap: var(--space-1)`:
- `.event-card__meta` (~line 250)
- `.event-hero__meta` (~line 311)
- `.back-link` (~line 658)

Change each to `gap: var(--space-2)`. Leave `margin: var(--space-1) 0 0` on
`.event-card__meta` (that's vertical spacing from the title above it, a
different concern) untouched.

Double check `.event-detail__meta` (~line 698, already `gap: var(--space-2)`)
stays as-is — it's already correct; do not reduce it to match the others.

## Out of scope for this phase

- Any off-scale padding values flagged in `research/existing-code.md` §3 —
  leave alone unless Phase 2's screenshot pass flags one as visually broken.
- Any JSX structure changes beyond the one `PageContainer` wrapper div.
- `Icon.jsx` viewBoxes — confirmed not the bug, don't touch.

## Verification

1. `npm run lint` — no new errors.
2. `npm run build` — confirm no JSX/CSS syntax errors from the wrapper change.
3. Manual: visit `/organizer`, `/event-requests`, `/admin`, `/admin/points` —
   confirm a visible gap now exists between the subtitle and the action
   button/component (the only 4 pages that currently pass `actions`).
4. Manual: visit `/` and `/organizer` — confirm the calendar/place icon next
   to date/venue text in event rows now has a visibly larger, consistent gap
   matching the gap inside buttons.
5. Spot check a page with no `actions` (e.g. `/bookings`) still renders with
   the same title→subtitle spacing as before (no regression from the flex
   conversion).

## Verification log (2026-10-09)

- `npm run lint` — passed, no new errors (no output from eslint).
- `npm run build` — passed, `next build` compiled successfully and generated
  all 42 routes with no JSX/CSS syntax errors.
- Steps 3-5 (manual/visual) — **not performed**, no browser tooling available
  in this session. Still need a human/browser pass on `/organizer`,
  `/event-requests`, `/admin`, `/admin/points`, `/`, and `/bookings` to
  confirm the gap renders as expected and no regression on pages without
  `actions`.

## Rollback

Single-commit, two-file (+ one component) change — revert the commit if any
page's header layout breaks unexpectedly (e.g. a page relying on `actions`
being inline next to the title rather than below it — grep confirmed none do,
but verify visually).
