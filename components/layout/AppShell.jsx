'use client';

import { useEffect, useState } from 'react';

import Icon from '../common/Icon';
import MobileNav from '../navigation/MobileNav';
import NavList from '../navigation/NavList';
import { primaryNavItems } from '../navigation/navItems';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Application chrome shared by every page: header, sidebar, mobile drawer and
 * bottom navigation.
 *
 * `user` and `pointsBalance` are passed in so they can later come from
 * `GET /api/user/me` and `GET /api/user/me/points` without touching layout.
 */
export default function AppShell({ children, user, pointsBalance = 0 }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  // Escape closes the drawer, and the page must not scroll behind it.
  useEffect(() => {
    if (!drawerOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') setDrawerOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="app-shell">
      <Header
        user={user}
        pointsBalance={pointsBalance}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      <div className="app-body">
        <Sidebar user={user} />
        <main className="app-main">{children}</main>
      </div>

      <button
        type="button"
        className={`drawer-overlay${drawerOpen ? ' drawer-overlay--visible' : ''}`}
        onClick={closeDrawer}
        aria-label="Close navigation menu"
        tabIndex={drawerOpen ? 0 : -1}
      />

      <div
        className={`drawer${drawerOpen ? ' drawer--open' : ''}`}
        aria-hidden={!drawerOpen}
      >
        <div className="drawer__head">
          <span className="app-header__brand">
            <span className="app-header__logo">
              <Icon name="calendar" size={20} />
            </span>
            <span>TripNest</span>
          </span>
          <button
            type="button"
            className="app-header__icon-button"
            onClick={closeDrawer}
            aria-label="Close navigation menu"
            tabIndex={drawerOpen ? 0 : -1}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="app-sidebar__group">
          <p className="app-sidebar__label">Menu</p>
          <NavList items={primaryNavItems} onNavigate={closeDrawer} />
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
