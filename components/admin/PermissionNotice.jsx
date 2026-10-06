import EmptyState from '../common/EmptyState';

/**
 * Admin routes are gated per area by `admin_permissions`. An account without
 * the area gets a 403, which is a fact about this account rather than a
 * failure — so it reads as a message, not an error page.
 */
export default function PermissionNotice({ area }) {
  return (
    <div className="card card--padded">
      <EmptyState
        icon="user"
        title={`No "${area}" permission`}
        message={`This admin account does not hold the "${area}" area. Another admin can grant it.`}
      />
    </div>
  );
}
