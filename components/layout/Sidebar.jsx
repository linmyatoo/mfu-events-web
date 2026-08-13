import NavList from '../navigation/NavList';
import { primaryNavItems } from '../navigation/navItems';

/** Desktop sidebar. Hidden below 1024px, where the drawer takes over. */
export default function Sidebar({ user }) {
  return (
    <aside className="app-sidebar" aria-label="Sidebar">
      <div className="app-sidebar__group">
        <p className="app-sidebar__label">Menu</p>
        <NavList items={primaryNavItems} />
      </div>

      <div className="app-sidebar__cta">
        <h3>Your feed</h3>
        <p>
          Showing events open to everyone, plus {user.school} and {user.year}.
        </p>
      </div>
    </aside>
  );
}
