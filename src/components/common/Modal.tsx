import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 fitopia-modal-overlay"
      style={{ background: 'var(--fitopia-overlay)' }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`
          fitopia-modal-panel w-full ${sizeClass[size]}
          bg-surface border border-border
          rounded-t-2xl sm:rounded-2xl
          shadow-2xl
          max-h-[min(92dvh,100%)] sm:max-h-[90vh]
          flex flex-col
          mb-0 sm:mb-0
        `}
        style={{ boxShadow: 'var(--fitopia-shadow)' }}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border shrink-0">
          <h2 className="text-sm sm:text-base font-bold text-ink truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-hover transition-colors touch-manipulation shrink-0"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 sm:px-5 py-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
          {children}
        </div>
        {footer && (
          <div className="px-4 sm:px-5 py-3 border-t border-border shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
