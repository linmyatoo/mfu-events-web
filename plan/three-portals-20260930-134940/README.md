# Three-portal build

Extends `mfu-events-web` from the User portal alone to all three portals the
MFU-Events backend serves: **User**, **Organizer**, **Admin**.

- `plan.md` — goal, architecture decisions, phases, risks, verification
- `research/backend-surface.md` — every endpoint, grouped, with the shape it returns
- `phases/` — one file per phase, with status

Constraint set by the user: **the backend is not to be modified**, and the
existing `mfu-events-web` visual language is reused rather than replaced.
