import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export type SearchableOption = {
  value: string;
  label: string;
  subtitle?: string;
  meta?: string;
  disabled?: boolean;
};

export interface SearchableSelectProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  error?: string;
  disabled?: boolean;
  /** When true, shows a clear (X) control */
  clearable?: boolean;
}

/**
 * Combobox-style select with in-list search (AJAX-friendly: pass filtered options from parent).
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = 'انتخاب کنید',
  searchPlaceholder = 'جستجو...',
  emptyText = 'موردی یافت نشد',
  error,
  disabled,
  clearable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)) ||
        (o.meta && o.meta.toLowerCase().includes(q)),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  return (
    <div className="relative w-full space-y-1.5" ref={rootRef}>
      {label && (
        <label className="block text-xs font-semibold text-secondary">
          {label}
          {required && <span className="text-primary mr-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-input px-3 py-2.5 text-sm text-right
          transition-colors duration-200 min-h-[42px] touch-manipulation
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger/50' : open ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-border-hover'}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-ink' : 'text-disabled'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded text-muted hover:text-ink"
              aria-label="پاک کردن"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 top-full mt-1.5 w-full rounded-xl border border-border bg-surface shadow-xl overflow-hidden"
          style={{ boxShadow: 'var(--fitopia-shadow)' }}
          role="listbox"
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-border bg-input pr-8 pl-2.5 py-2 text-sm text-ink
                  placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-muted text-center">{emptyText}</li>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      disabled={o.disabled}
                      onClick={() => {
                        if (o.disabled) return;
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2.5 text-sm transition-colors
                        ${active ? 'bg-primary-soft text-primary font-semibold' : 'text-ink hover:bg-surface-hover'}
                        ${o.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <span className="block truncate">{o.label}</span>
                      {(o.subtitle || o.meta) && (
                        <span className="block text-[11px] text-muted mt-0.5 truncate">
                          {[o.subtitle, o.meta].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
      {error && <p className="text-[11px] text-danger-text">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
