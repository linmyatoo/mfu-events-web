'use client';

import Link from 'next/link';

import { initialsOf } from '../../lib/events';
import Icon from '../common/Icon';
import SearchBar from '../forms/SearchBar';

/**
 * Top bar: brand, event search, points balance and the signed-in student.
 * The menu button only appears on tablet/mobile, where it opens the drawer.
 *
 * There is no notification entity in the backend, so no bell here.
 */
export default function Header({ user, pointsBalance, onOpenMenu }) {
  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__menu-button"
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
      >
        <Icon name="menu" />
      </button>

      <Link href="/" className="app-header__brand">
        <span className="app-header__logo">
          <Icon name="calendar" size={20} />
        </span>
        <span>TripNest</span>
      </Link>

      <div className="app-header__search">
        <SearchBar id="header-search" placeholder="Search events by title" />
      </div>

      <div className="app-header__actions">
        <Link href="/points" className="app-header__points">
          <Icon name="sparkle" size={16} />
          <span>{pointsBalance} pts</span>
        </Link>

        <Link href="/profile" className="app-header__user">
          <span className="app-header__avatar" aria-hidden="true">
            {initialsOf(user.name)}
          </span>
          <span className="app-header__user-name">{user.name}</span>
        </Link>
      </div>
    </header>
  );
}
