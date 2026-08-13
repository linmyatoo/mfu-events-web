import Link from 'next/link';

/**
 * Button / link with the shared visual styles.
 * Pass `href` to render a Next.js link that still looks like a button.
 */
export default function Button({
  children,
  variant = 'primary',
  size,
  block = false,
  href,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
