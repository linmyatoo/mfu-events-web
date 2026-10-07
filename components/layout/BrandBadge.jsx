import Image from 'next/image';

/** Fixed ADT badge shown bottom-right on every page. */
export default function BrandBadge() {
  return (
    <div className="brand-badge" aria-hidden="true">
      <Image src="/adt-logo.png" alt="" width={72} height={72} />
    </div>
  );
}
