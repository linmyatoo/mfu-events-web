'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import Icon from '../common/Icon';
import MobileNav from '../navigation/MobileNav';
import NavList from '../navigation/NavList';
import { userNavItems } from '../navigation/navItems';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Application chrome shared by every page: header, sidebar, mobile drawer and
 * bottom navigation.
 *
 * `user` and `pointsBalance` come from `GET /api/user/me` and the derived
 * points balance (see lib/points.js).
 *
 * `navItems` and `portals` are supplied per portal by its layout, so the same
 * chrome serves the User, Organizer and Admin sections.
 */
export default function AppShell({
  children,
  user,
  pointsBalance = 0,
  navItems = userNavItems,
  portals = [],
  portal = 'user',
  sidebarNote,
}) {
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
        portals={portals}
        portal={portal}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      <div className="app-body">
        <Sidebar user={user} navItems={navItems} note={sidebarNote} />
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
              <Image src="/mfu-logo.png" alt="" width={44} height={44} />
            </span>
            <span>MFU-Events</span>
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
          <NavList items={navItems} onNavigate={closeDrawer} />
        </div>

        {/* The header switcher is hidden below 1024px, so it lives here too. */}
        {portals.length > 1 ? (
          <div className="app-sidebar__group">
            <p className="app-sidebar__label">Portal</p>
            <NavList
              items={portals.map((item) => ({
                href: item.href,
                label: item.label,
                icon: item.id === 'admin' ? 'user' : item.id === 'organizer' ? 'calendar' : 'home',
              }))}
              onNavigate={closeDrawer}
            />
          </div>
        ) : null}
      </div>

      <MobileNav items={navItems} />
    </div>
  );
}
