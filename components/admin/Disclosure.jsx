'use client';

import { useState } from 'react';

import Button from '../common/Button';

/** Collapsible block — keeps long edit forms out of the way until needed. */
export default function Disclosure({ label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Close' : label}
      </Button>
      {open ? children : null}
    </>
  );
}
