'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Icon from '../common/Icon';
import { isActiveRoute, primaryNavItems } from './navItems';

/** Bottom tab bar shown below 768px. */
export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Primary">
      <ul className="mobile-nav__list">
        {primaryNavItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);

          return (
            <li className="mobile-nav__item" key={item.href}>
              <Link
                href={item.href}
                className={`mobile-nav__link${
                  active ? ' mobile-nav__link--active' : ''
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="mobile-nav__icon">
                  <Icon name={item.icon} size={20} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
