'use client';

import { useEffect } from 'react';

import Icon from './Icon';

/** Centred dialog. Escape and the backdrop both close it. */
export default function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal">
      <button
        type="button"
        className="modal__backdrop"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="modal__panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button
            type="button"
            className="app-header__icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
