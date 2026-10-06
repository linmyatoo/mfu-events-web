import NavList from '../navigation/NavList';
import { userNavItems } from '../navigation/navItems';

/** Desktop sidebar. Hidden below 1024px, where the drawer takes over. */
export default function Sidebar({ user, navItems = userNavItems, note }) {
  // `school` and `year` are only set on student/faculty rows.
  const audience = [user.school, user.year].filter(Boolean).join(' and ');

  return (
    <aside className="app-sidebar" aria-label="Sidebar">
      <div className="app-sidebar__group">
        <p className="app-sidebar__label">Menu</p>
        <NavList items={navItems} />
      </div>

      <div className="app-sidebar__cta">
        <h3>{note?.title ?? 'Your feed'}</h3>
        <p>
          {note?.body ??
            (audience
              ? `Showing events open to everyone, plus ${audience}.`
              : 'Showing events open to everyone.')}
        </p>
      </div>
    </aside>
  );
}
