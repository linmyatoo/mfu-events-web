'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Icon from '../common/Icon';
import { isActiveRoute } from './navItems';

/** Vertical list of nav links, shared by the sidebar and the mobile drawer. */
export default function NavList({ items, onNavigate }) {
  const pathname = usePathname();

  return (
    <ul>
      {items.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`nav-item${active ? ' nav-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="nav-item__badge">{item.badge}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
