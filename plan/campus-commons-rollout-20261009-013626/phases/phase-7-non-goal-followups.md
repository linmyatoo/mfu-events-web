# Phase 7 — Non-goal follow-ups (write-up only, no implementation)

Status: done

## Purpose

Earlier discarded mockups showed category-color pills and "N people going"
social proof on event cards. Confirmed in research (`research/existing-code.md`
§6) that neither field exists on the live `Event` model (`lib/events.js`,
backend `~/Desktop/MFU-Events/backend/lib/seed.js`). This phase is a written
note, not code: document two gaps as durable backend feature requests.

## Backend follow-up items

### 1. Event.category — category-color pills (optional future feature)

**What's needed:**
Add a `category` field to the `Event` model (backend `~/Desktop/MFU-Events/backend/lib/seed.js` and client `lib/events.js`). Type can be a string (free-form) or a predefined enum (e.g. `ACADEMIC`, `SOCIAL`, `SPORTS`, `CULTURAL`, etc.) — team decides.

Expose this field in both the event-detail endpoint (`GET /api/.../events/:id`) and the feed/list endpoint so the frontend can render category labels on event cards.

**Why:**
Mockups during earlier design work showed category-color pills on event cards to help users scan event types. Currently there is no way to distinguish event types visually on feeds or event lists.

**Hard constraint to respect:**
Category pills must render **within the existing two-blue system only** — do NOT add a third hue. Category colors can use varying opacity/weight of the same two blues (e.g. lighter tint of primary blue, darker secondary blue, mixed opacity overlays, etc.), but the design must remain locked to `#1A3FC4` and `#0F2A8C` (+ their dark-theme `#5B7FFF` lift and neutral scales). This is per the rollout's core constraint: finish the two-blue direction without introducing new hues.

**Out of scope here:** client-side rendering logic. This is backend data design only.

### 2. Attendee/going count — "N people going" social proof

**What's needed:**
Expose an attendee/going count on events via one of two approaches (team chooses based on usage patterns):

**Option A — Materialized column:**
Add an `attendee_count` (or `going_count`) column to the `Event` table. Update it via a trigger on `Booking` rows (increment on create, decrement on delete) or refresh it periodically during off-peak hours. Expose this in both event-detail and feed/list endpoints.

**Option B — Derived count:**
Compute the count on read via `SELECT COUNT(*) FROM Booking WHERE event_id = ? AND status = 'confirmed'` (or relevant status) and include it in the event-detail and feed/list endpoint responses. No new table column needed, but adds a query per event in list views (test for N+1 risk if the list endpoint doesn't already batch).

**Why:**
Mockups showed "N people going" badges on event cards to show social proof and help users gauge event popularity/engagement. Currently there is no way to see how many people have booked/are attending an event without opening the event detail page.

**Trade-offs:**
Option A is faster at read time but requires schema migration and trigger maintenance. Option B is simpler at deploy time but may need query optimization (e.g. a separate `event_stats` denormalized table if list endpoints are N+1-prone). Team should pick based on current API query patterns and traffic.

**Out of scope here:** client-side rendering logic or UI design. This is backend data/API design only.

## Verification

N/A — this phase produces a document, not code. "Done" means the follow-ups are
written down in a durable, actionable format (this file) so they can be
triaged/scheduled as backend work without being re-debated in a future redesign round.
