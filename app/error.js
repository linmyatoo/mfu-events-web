'use client';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';

/**
 * Last-resort boundary. It also covers the `(app)` layout itself, which is
 * where the "backend is not running" failure surfaces.
 */
export default function RootError({ error, reset }) {
  return (
    <main className="app-main">
      <div className="page-container">
        <div className="card card--padded">
          <EmptyState
            icon="search"
            title="Could not load TripNest"
            message={error?.message ?? 'The events service did not respond.'}
            action={
              <Button variant="primary" onClick={reset}>
                Try again
              </Button>
            }
          />
        </div>
      </div>
    </main>
  );
}
