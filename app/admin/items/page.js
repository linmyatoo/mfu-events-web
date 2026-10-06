import Disclosure from '../../../components/admin/Disclosure';
import EmptyState from '../../../components/common/EmptyState';
import ItemForm from '../../../components/admin/ItemForm';
import PermissionNotice from '../../../components/admin/PermissionNotice';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';

export const metadata = { title: 'Items · Admin · TripNest' };

/**
 * GET /api/admin/items/inventory — every item with `allocated_quantity` and
 * `pending_quantity` summed across all event requests.
 */
export default async function AdminItemsPage() {
  const inventory = await apiGetAllowed('/api/admin/items/inventory');
  if (inventory === null) return <PermissionNotice area="items" />;

  return (
    <PageContainer
      title="Items"
      subtitle="Equipment organizers can request. Allocation happens on each event."
    >
      <section className="page-section">
        <h2 className="section-title">Inventory ({inventory.length})</h2>

        {inventory.length === 0 ? (
          <div className="card card--padded">
            <EmptyState icon="sparkle" title="No items yet" />
          </div>
        ) : (
          <ul className="stack">
            {inventory.map((item) => (
              <li className="card card--padded" key={item.id}>
                <div className="event-card__heading">
                  <h3 className="event-card__title">{item.name}</h3>
                  <span
                    className={`badge badge--${item.status === 'active' ? 'success' : 'neutral'}`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="event-card__meta">{item.description}</p>

                <div className="event-detail__tags">
                  <span className="chip">{item.total_quantity} total</span>
                  <span className="chip">{item.allocated_quantity} allocated</span>
                  {item.pending_quantity > 0 ? (
                    <span className="badge badge--warning">
                      {item.pending_quantity} requested
                    </span>
                  ) : null}
                </div>

                <Disclosure label="Edit">
                  <ItemForm item={item} />
                </Disclosure>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="page-section">
        <h2 className="section-title">Add an item</h2>
        <ItemForm />
      </section>
    </PageContainer>
  );
}
