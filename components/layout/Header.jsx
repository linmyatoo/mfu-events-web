'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { initialsOf } from '../../lib/events';
import Icon from '../common/Icon';
import SearchBar from '../forms/SearchBar';

/**
 * Top bar: brand, event search, points balance and the signed-in student.
 * The menu button only appears on tablet/mobile, where it opens the drawer.
 *
 * There is no notification entity in the backend, so no bell here.
 */
export default function Header({
  user,
  pointsBalance,
  portals = [],
  portal = 'user',
  onOpenMenu,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') ?? '');

  // Submitting runs the search server-side via eventService.feedForUser's
  // `?search=` (title match), rather than filtering only what is on screen.
  function runSearch(value) {
    const trimmed = value.trim();
    router.push(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : '/');
  }

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
          <Image src="/mfu-logo.png" alt="" width={44} height={44} />
        </span>
        <span>MFU-Events</span>
      </Link>

      {portal === 'user' ? (
        <div className="app-header__search">
          <SearchBar
            id="header-search"
            value={query}
            onChange={setQuery}
            onSubmit={runSearch}
            placeholder="Search events by title"
          />
        </div>
      ) : (
        <span className="app-header__search" />
      )}

      <div className="app-header__actions">
        {/* Only rendered when the account can reach more than one portal. */}
        {portals.length > 1 ? (
          <nav className="portal-switch" aria-label="Portal">
            {portals.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`portal-switch__item${
                  item.id === portal ? ' portal-switch__item--active' : ''
                }`}
                aria-current={item.id === portal ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {portal === 'user' ? (
          <Link href="/points" className="app-header__points">
            <Icon name="sparkle" size={16} />
            <span>{pointsBalance} pts</span>
          </Link>
        ) : null}

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
