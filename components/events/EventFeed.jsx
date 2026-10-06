'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import EventCard from '../cards/EventCard';
import EventHeroCard from '../cards/EventHeroCard';
import EmptyState from '../common/EmptyState';
import SearchBar from '../forms/SearchBar';
import { isPastEvent } from '../../lib/events';

/**
 * Event feed with the mobile home screen's shape: a search box, a horizontal
 * rail of highlighted events, then the vertical list.
 *
 * Typing filters what is already loaded; submitting re-runs the query on the
 * server through `?search=`. Both match on title only, exactly as
 * `eventService.feedForUser` does, so the two never disagree.
 */
export default function EventFeed({ events, query: initialQuery = '' }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const { earning, upcoming, past } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? events.filter((event) => event.title.toLowerCase().includes(q))
      : events;

    const now = new Date();
    const future = matched.filter((event) => !isPastEvent(event, now));

    return {
      // The rail highlights what a student actually gains from attending.
      // `is_point_event` is an Admin/organizer-side distinction and would
      // leave this empty whenever no point event is upcoming.
      earning: future.filter((event) => event.points_value > 0),
      upcoming: future,
      past: matched.filter((event) => isPastEvent(event, now)),
    };
  }, [events, query]);

  const noResults = upcoming.length === 0 && past.length === 0;

  return (
    <>
      <div className="feed-search">
        <SearchBar
          id="feed-search"
          value={query}
          onChange={setQuery}
          onSubmit={(value) => {
            const trimmed = value.trim();
            router.push(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : '/');
          }}
          placeholder="Search your events"
        />
      </div>

      {noResults ? (
        <div className="card card--padded">
          <EmptyState
            icon="search"
            title="No events found"
            message={
              query
                ? `Nothing matches “${query}”.`
                : 'Nothing matches your school and year right now.'
            }
          />
        </div>
      ) : null}

      {earning.length > 0 ? (
        <section className="page-section">
          <h2 className="section-title">Earn points</h2>
          <div className="rail">
            {earning.map((event) => (
              <EventHeroCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="page-section">
          <h2 className="section-title">Upcoming events</h2>
          <div className="stack">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="page-section">
          <h2 className="section-title">Past events</h2>
          <div className="stack">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
