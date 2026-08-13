import Image from 'next/image';

/**
 * Event poster.
 *
 * `poster_image_url` is nullable on every Event (and null throughout the
 * current seed data), so the fallback is a branded initials tile rather than
 * a broken image or an unrelated stock photo.
 *
 * Sizes match the Flutter image boxes:
 *   md     92×72   EventCard thumbnail
 *   cover  132 tall, full width — hero card header
 *   banner 260 tall, full width — event detail carousel
 */
const DIMENSIONS = {
  md: { width: 92, height: 72 },
  cover: { width: 280, height: 132 },
  banner: { width: 1200, height: 260 },
};

export default function EventPoster({ src, initials, size = 'md' }) {
  const className = `event-poster event-poster--${size}`;
  const { width, height } = DIMENSIONS[size] ?? DIMENSIONS.md;

  if (!src) {
    return (
      <span className={`${className} event-poster--placeholder`} aria-hidden="true">
        {initials}
      </span>
    );
  }

  return (
    <Image
      className={className}
      src={src}
      alt=""
      width={width}
      height={height}
      unoptimized
    />
  );
}
