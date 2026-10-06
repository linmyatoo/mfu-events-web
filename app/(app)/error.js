'use client';

import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import PageContainer from '../../components/layout/PageContainer';

/** Shown when the backend is unreachable or returns an unexpected error. */
export default function AppError({ error, reset }) {
  return (
    <PageContainer title="Something went wrong">
      <div className="card card--padded">
        <EmptyState
          icon="search"
          title="Could not load this page"
          message={error?.message ?? 'The events service did not respond.'}
          action={
            <Button variant="primary" onClick={reset}>
              Try again
            </Button>
          }
        />
      </div>
    </PageContainer>
  );
}
