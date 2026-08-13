import PageContainer from '../layout/PageContainer';
import EmptyState from './EmptyState';

/**
 * Placeholder for routes that exist in the navigation but whose screens are
 * built in a later phase. Replace the whole file usage per page as each
 * screen lands.
 */
export default function ComingSoon({ title, icon = 'compass', message }) {
  return (
    <PageContainer title={title}>
      <div className="card card--padded">
        <EmptyState
          icon={icon}
          title="Screen not built yet"
          message={message ?? 'This page is part of the next phase.'}
        />
      </div>
    </PageContainer>
  );
}
