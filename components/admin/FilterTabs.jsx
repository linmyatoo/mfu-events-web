'use client';

import Link from 'next/link';

/** Status filters rendered as the existing pill toggle. */
export default function FilterTabs({ options, active, basePath, param = 'status' }) {
  return (
    <div className="pill-toggle" role="tablist" aria-label="Filter">
      {options.map((option) => {
        const selected = (active ?? '') === option.value;
        const href = option.value ? `${basePath}?${param}=${option.value}` : basePath;
        return (
          <Link
            key={option.value || 'all'}
            href={href}
            role="tab"
            aria-selected={selected}
            className={`pill-toggle__item${selected ? ' pill-toggle__item--active' : ''}`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
