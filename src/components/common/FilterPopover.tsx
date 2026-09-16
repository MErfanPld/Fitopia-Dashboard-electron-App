import React, { useEffect, useRef, useState } from 'react';
import { Filter, X } from 'lucide-react';

export type FilterOption = { value: string; label: string };

export type FilterField = {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
};

export interface FilterPopoverProps {
  fields: FilterField[];
  activeCount: number;
  onClear: () => void;
  /** Optional: format badge number (e.g. Persian digits) */
  formatCount?: (n: number) => string;
  title?: string;
}

/**
 * Unified filter button + popup used across dashboard list pages (same UX as Members).
 */
export const FilterPopover: React.FC<FilterPopoverProps> = ({
  fields,
  activeCount,
  onClear,
  formatCount,
  title = 'فیلترها',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  const badge = formatCount ? formatCount(activeCount) : String(activeCount);

  return (
    <div className="relative inline-flex w-full sm:w-auto" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors w-full sm:w-auto touch-manipulation ${
          activeCount > 0 || open
            ? 'border-primary bg-primary-soft text-primary'
            : 'border-border text-secondary hover:bg-surface-hover hover:text-ink'
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Filter className="w-4 h-4 shrink-0" />
        <span>فیلترها</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-fg text-[11px] font-bold tabular-nums">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={title}
          className="absolute top-full mt-2 z-50 end-0 start-auto w-[min(100vw-1.5rem,20rem)] min-w-[16rem] rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xl max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain"
          style={{ boxShadow: 'var(--fitopia-shadow)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-ink">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover touch-manipulation"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label htmlFor={`filter-${field.key}`} className="text-xs font-semibold text-secondary">
                {field.label}
              </label>
              <select
                id={`filter-${field.key}`}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {field.options.map((o) => (
                  <option key={`${field.key}-${o.value}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => {
                onClear();
              }}
              disabled={activeCount === 0}
              className="text-xs text-muted hover:text-ink disabled:opacity-40 disabled:pointer-events-none py-1.5"
            >
              پاک کردن فیلترها
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-fg font-bold hover:opacity-90"
            >
              اعمال
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPopover;
