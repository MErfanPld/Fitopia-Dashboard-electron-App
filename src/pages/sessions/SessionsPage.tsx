import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Ticket } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { FilterPopover } from '../../components/common/FilterPopover';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import sessionsService from '../../services/sessions/sessionsService';
import membersService from '../../services/members/membersService';
import sportsService from '../../services/sports/sportsService';
import type { GymMember, SingleSession, Sport } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

const STATUS_LABELS: Record<string, string> = {
  unused: 'استفاده‌نشده',
  used: 'استفاده‌شده',
  expired: 'منقضی',
  cancelled: 'لغو شده',
};

function statusLabel(s?: string | null) {
  if (!s) return '—';
  return STATUS_LABELS[s] || s;
}

function statusClass(s?: string | null) {
  switch (s) {
    case 'unused':
      return 'bg-success-soft text-success-text border-success/20';
    case 'used':
      return 'bg-info-soft text-info-text border-info/20';
    case 'expired':
      return 'bg-warning-soft text-warning-text border-warning/20';
    case 'cancelled':
      return 'bg-danger-soft text-danger-text border-danger/20';
    default:
      return 'bg-surface-elevated text-muted border-border';
  }
}

function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}

export const SessionsPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('finance.create');
  const canView = can('finance.view') || can('finance.create') || can('customer.view');
  const canCreate = can('finance.create');
  const { showToast } = useUI();

  const [items, setItems] = useState<SingleSession[]>([]);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const activeFilterCount = statusFilter !== 'all' ? 1 : 0;
  const clearFilters = () => setStatusFilter('all');

  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [sportId, setSportId] = useState('');
  const [price, setPrice] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const memberNameById = useMemo(() => {
    const m = new Map<number, string>();
    members.forEach((x) => m.set(x.id, x.full_name));
    return m;
  }, [members]);

  const sportNameById = useMemo(() => {
    const m = new Map<number, string>();
    sports.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [sports]);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, mem, sp] = await Promise.all([
        sessionsService.list(gymId),
        membersService.list(gymId).catch(() => [] as GymMember[]),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setItems((list || []).filter((x) => x && x.id != null));
      setMembers(mem || []);
      setSports(sp || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت جلسات تکی');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && canView) load();
  }, [hasGym, canView, load]);

  const filtered = useMemo(() => {
    let rows = items;
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => String(r.status || '') === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const name = (memberNameById.get(r.customer) || '').toLowerCase();
        const sport = (r.sport != null ? sportNameById.get(r.sport) || '' : '').toLowerCase();
        const st = statusLabel(r.status).toLowerCase();
        return name.includes(q) || sport.includes(q) || st.includes(q) || String(r.price).includes(q);
      });
    }
    return rows;
  }, [items, search, statusFilter, memberNameById, sportNameById]);

  const openCreate = async () => {
    setCustomerId('');
    setSportId('');
    setPrice('');
    setExpiresAt('');
    setOpen(true);
    if (!gymId) return;
    try {
      const [mem, sp] = await Promise.all([
        membersService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setMembers(mem || []);
      setSports(sp || []);
    } catch {
      /* keep */
    }
  };

  const submit = async () => {
    if (!gymId) return;
    if (!customerId) {
      showToast('عضو را انتخاب کنید', 'warning');
      return;
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 1) {
      showToast('مبلغ باید حداقل ۱ تومان باشد', 'warning');
      return;
    }
    setSaving(true);
    try {
      await sessionsService.create(gymId, {
        customer: Number(customerId),
        sport: sportId ? Number(sportId) : null,
        price: Math.floor(priceNum),
        status: 'unused',
        expires_at: expiresAt ? `${expiresAt}T23:59:59` : null,
      });
      showToast('جلسه تکی با موفقیت ثبت شد', 'success');
      setOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<SingleSession>[] = [
    {
      key: 'customer',
      header: 'عضو',
      render: (r) => (
        <span className="font-medium text-ink">{memberNameById.get(r.customer) || '—'}</span>
      ),
    },
    {
      key: 'sport',
      header: 'رشته',
      render: (r) => (
        <span className="text-sm text-muted">{r.sport != null ? sportNameById.get(r.sport) || '—' : '—'}</span>
      ),
    },
    {
      key: 'price',
      header: 'مبلغ',
      render: (r) => <span className="tabular-nums text-sm text-ink">{formatMoney(r.price)}</span>,
    },
    {
      key: 'status',
      header: 'وضعیت',
      render: (r) => (
        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium border ${statusClass(r.status)}`}>
          {statusLabel(r.status)}
        </span>
      ),
    },
    {
      key: 'purchased_at',
      header: 'تاریخ خرید',
      render: (r) => (
        <span className="text-xs text-muted tabular-nums">{r.purchased_at ? formatJalaliDateTime(r.purchased_at) : '—'}</span>
      ),
    },
    {
      key: 'expires_at',
      header: 'انقضا',
      render: (r) => (
        <span className="text-xs text-muted tabular-nums">{r.expires_at ? formatJalaliDateTime(r.expires_at) : '—'}</span>
      ),
    },
    {
      key: 'used_at',
      header: 'استفاده',
      render: (r) => (
        <span className="text-xs text-muted tabular-nums">{r.used_at ? formatJalaliDateTime(r.used_at) : '—'}</span>
      ),
    },
  ];

  if (!hasGym) return <NoGymSelected />;
  if (!canView) {
    return (
      <div className="space-y-4">
        <Header title="جلسات تکی" />
        <ErrorBlock message="شما دسترسی مشاهده این بخش را ندارید." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        title="جلسات تکی"
        subtitle="خرید و مدیریت جلسات یک‌نفره"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"
              >
                <Plus className="w-4 h-4" />
                ثبت جلسه تکی
              </button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو عضو، رشته یا وضعیت..."
          className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <FilterPopover
          activeCount={activeFilterCount}
          onClear={clearFilters}
          fields={[{
            key: 'status',
            label: 'وضعیت',
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as typeof statusFilter),
            options: [
              { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'unused', label: 'استفاده‌نشده' },
              { value: 'used', label: 'استفاده‌شده' },
              { value: 'expired', label: 'منقضی' },
              { value: 'cancelled', label: 'لغو شده' },
            ],
          }]}
        />
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !items.length ? (
        <LoadingBlock />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          title="جلسه‌ای ثبت نشده"
          description={items.length ? 'با فیلتر فعلی نتیجه‌ای نیست.' : 'اولین جلسه تکی را ثبت کنید.'}
          action={
            canCreate && !items.length ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"
              >
                <Ticket className="w-4 h-4" />
                ثبت جلسه تکی
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="ثبت جلسه تکی">
        <div className="space-y-3">
          <p className="text-[11px] text-muted">
            با ثبت جلسه تکی، یک تراکنش درآمدی در بخش مالی نیز ایجاد می‌شود.
          </p>
          <FormField
            label="عضو"
            required
            isSelect
            value={customerId}
            options={[
              { value: '', label: members.length ? 'انتخاب عضو' : 'عضوی یافت نشد' },
              ...members.map((m) => ({
                value: String(m.id),
                label: `${m.full_name}${m.phone ? ` — ${m.phone}` : ''}`,
              })),
            ]}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <FormField
            label="رشته ورزشی (اختیاری)"
            isSelect
            value={sportId}
            options={[
              { value: '', label: 'انتخاب رشته' },
              ...sports.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
            onChange={(e) => setSportId(e.target.value)}
          />
          <FormField
            label="مبلغ (تومان)"
            required
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <JalaliDatePicker
            label="تاریخ انقضا (اختیاری)"
            value={expiresAt}
            onChange={setExpiresAt}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted">
              انصراف
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50"
            >
              {saving ? '...' : 'ثبت'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SessionsPage;
