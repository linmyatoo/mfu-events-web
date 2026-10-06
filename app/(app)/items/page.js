import EmptyState from '../../../components/common/EmptyState';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGet } from '../../../lib/api';

export const metadata = { title: 'Equipment · TripNest' };

/**
 * GET /api/user/items — the active equipment catalogue.
 *
 * Read-only for a user: `itemService` is admin-managed and organizers request
 * items per event. It is listed here so attendees can see what an event may
 * have been allocated.
 */
export default async function ItemsPage() {
  const items = await apiGet('/api/user/items');

  return (
    <PageContainer
      title="Equipment"
      subtitle="Resources organizers can request for an event."
    >
      {items.length === 0 ? (
        <div className="card card--padded">
          <EmptyState
            icon="search"
            title="No equipment listed"
            message="The university has not published an equipment catalogue yet."
          />
        </div>
      ) : (
        <ul className="stack">
          {items.map((item) => (
            <li className="card card--padded" key={item.id}>
              <div className="event-card__heading">
                <h3 className="event-card__title">{item.name}</h3>
                <span
                  className={`badge badge--${
                    item.available_quantity > 0 ? 'success' : 'neutral'
                  }`}
                >
                  {item.available_quantity} of {item.total_quantity} free
                </span>
              </div>
              {item.description ? (
                <p className="event-card__meta">{item.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
