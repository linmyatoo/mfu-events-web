'use client';

import Icon from '../common/Icon';

/**
 * Rounded search input. Controlled when `value`/`onChange` are supplied,
 * otherwise it behaves as a plain uncontrolled field.
 */
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search your events',
  label = 'Search events',
  id = 'search-events',
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.(value ?? '');
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <span className="search-bar__icon">
        <Icon name="search" size={20} />
      </span>
      <input
        id={id}
        className="search-bar__input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </form>
  );
}
