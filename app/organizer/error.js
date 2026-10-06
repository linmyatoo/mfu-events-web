'use client';

import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import PageContainer from '../../components/layout/PageContainer';

export default function OrganizerError({ error, reset }) {
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
