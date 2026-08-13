'use client';

import Icon from './Icon';

/**
 * 1–5 star rating (Review.rating). Read-only by default; pass `onChange`
 * to render it as a radio group the user can pick from.
 */
export default function StarRating({
  value = 0,
  onChange,
  size = 18,
  name = 'rating',
  label = 'Rating',
}) {
  const stars = [1, 2, 3, 4, 5];

  if (!onChange) {
    return (
      <span className="stars" role="img" aria-label={`${value} out of 5`}>
        {stars.map((star) => (
          <Icon
            key={star}
            name="star"
            size={size}
            className={star <= value ? 'stars__on' : 'stars__off'}
          />
        ))}
      </span>
    );
  }

  return (
    <fieldset className="stars stars--input">
      <legend className="visually-hidden">{label}</legend>
      {stars.map((star) => (
        <label key={star} className="stars__option">
          <input
            type="radio"
            name={name}
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
            className="visually-hidden"
          />
          <span className="visually-hidden">{star} stars</span>
          <Icon
            name="star"
            size={size}
            className={star <= value ? 'stars__on' : 'stars__off'}
          />
        </label>
      ))}
    </fieldset>
  );
}
