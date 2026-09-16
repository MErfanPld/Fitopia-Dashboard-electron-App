import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { Search, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortValue?: (row: T) => string | number | null | undefined;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T) => string | number;
  emptyMessage?: string;
  searchKeys?: string[];
  actions?: (row: T) => React.ReactNode;
  searchPlaceholder?: string;
  pageSize?: number;
  showPageSizeSelector?: boolean;
  loading?: boolean;
  loadingRows?: number;
  onFilteredCountChange?: (count: number) => void;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function useDebouncedValue<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function toPersianDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

function DataTableInner<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'موردی یافت نشد',
  searchKeys,
  actions,
  searchPlaceholder = 'جستجو...',
  pageSize: pageSizeProp = 25,
  showPageSizeSelector,
  loading = false,
  loadingRows = 6,
  onFilteredCountChange,
  className = '',
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 220);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeProp > 0 ? pageSizeProp : 0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const enablePagination = pageSize > 0;
  const showSizeSel = showPageSizeSelector ?? enablePagination;

  const filtered = useMemo(() => {
    let rows = data;
    if (searchKeys?.length && debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((key) => {
          const val = (row as Record<string, unknown>)[key];
          return val != null && String(val).toLowerCase().includes(q);
        }),
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      const getter =
        col?.sortValue ??
        ((row: T) => {
          const v = (row as Record<string, unknown>)[sortKey];
          return v == null ? '' : (v as string | number);
        });
      rows = [...rows].sort((a, b) => {
        const av = getter(a);
        const bv = getter(b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        const as = String(av);
        const bs = String(bv);
        return sortDir === 'asc' ? as.localeCompare(bs, 'fa') : bs.localeCompare(as, 'fa');
      });
    }
    return rows;
  }, [data, debouncedQuery, searchKeys, sortKey, sortDir, columns]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortKey, sortDir, data, pageSize]);

  const totalPages = enablePagination ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    if (!enablePagination) return filtered;
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, enablePagination, safePage, pageSize]);

  const getKey = useCallback(
    (row: T, index: number) => {
      if (rowKey) return rowKey(row);
      const rec = row as Record<string, unknown>;
      if (rec && typeof rec === 'object' && rec.id != null) return String(rec.id);
      return index;
    },
    [rowKey],
  );

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const rangeLabel = useMemo(() => {
    if (!filtered.length) return null;
    if (!enablePagination) return `${toPersianDigits(filtered.length)} مورد`;
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(safePage * pageSize, filtered.length);
    return `${toPersianDigits(start)}–${toPersianDigits(end)} از ${toPersianDigits(filtered.length)}`;
  }, [filtered.length, enablePagination, safePage, pageSize]);

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-header border-b border-border">
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-xs font-bold text-muted whitespace-nowrap">
                      {col.header}
                    </th>
                  ))}
                  {actions && <th className="px-4 py-3 text-xs font-bold text-muted">عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 rounded bg-skeleton animate-pulse w-3/4" />
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3">
                        <div className="h-4 rounded bg-skeleton animate-pulse w-16" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {(searchKeys && searchKeys.length > 0) || rangeLabel ? (
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {searchKeys && searchKeys.length > 0 ? (
            <div className="relative max-w-sm w-full sm:w-auto flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full rounded-xl border border-border bg-input pr-10 pl-3 py-2.5 text-sm text-ink
                  placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-input-focus transition-colors duration-200"
              />
            </div>
          ) : (
            <div />
          )}
          {rangeLabel && <p className="text-xs text-muted tabular-nums shrink-0">{rangeLabel}</p>}
        </div>
      ) : null}

      {!filtered.length ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div
            className="bg-surface border border-border rounded-2xl overflow-hidden"
            style={{ boxShadow: 'var(--fitopia-shadow)' }}
          >
            <div className="overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto">
              <table className="w-full text-sm text-right">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-header border-b border-border">
                    {columns.map((col) => {
                      const sortable = Boolean(col.sortValue) || !col.render;
                      const active = sortKey === col.key;
                      return (
                        <th
                          key={col.key}
                          className={`px-4 py-3 text-xs font-bold text-muted whitespace-nowrap ${col.className || ''}`}
                        >
                          {sortable ? (
                            <button
                              type="button"
                              onClick={() => handleSort(col.key)}
                              className={`inline-flex items-center gap-1 hover:text-ink transition-colors ${
                                active ? 'text-primary' : ''
                              }`}
                              aria-label={`مرتب‌سازی بر اساس ${col.header}`}
                            >
                              {col.header}
                              {active && (
                                <span className="text-[10px] opacity-80" aria-hidden>
                                  {sortDir === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </button>
                          ) : (
                            col.header
                          )}
                        </th>
                      );
                    })}
                    {actions && (
                      <th className="px-4 py-3 text-xs font-bold text-muted whitespace-nowrap">عملیات</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) => (
                    <tr
                      key={getKey(row, index)}
                      className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors duration-150"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-ink whitespace-nowrap ${col.className || ''}`}
                        >
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? '—')}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">{actions(row)}</div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {enablePagination && filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {showSizeSel ? (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>تعداد در صفحه:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-lg border border-border bg-input px-2 py-1.5 text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="تعداد ردیف در صفحه"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {toPersianDigits(n)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-1">
                <PaginationBtn onClick={() => setPage(1)} disabled={safePage <= 1} label="صفحه اول">
                  <ChevronsRight className="w-4 h-4" />
                </PaginationBtn>
                <PaginationBtn
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  label="صفحه قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </PaginationBtn>
                <span className="px-3 text-xs text-muted tabular-nums min-w-[5.5rem] text-center">
                  {toPersianDigits(safePage)} / {toPersianDigits(totalPages)}
                </span>
                <PaginationBtn
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  label="صفحه بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </PaginationBtn>
                <PaginationBtn onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} label="صفحه آخر">
                  <ChevronsLeft className="w-4 h-4" />
                </PaginationBtn>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaginationBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="p-1.5 rounded-lg border border-border text-muted hover:text-ink hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner & { displayName?: string };
DataTable.displayName = 'DataTable';
export default DataTable;
