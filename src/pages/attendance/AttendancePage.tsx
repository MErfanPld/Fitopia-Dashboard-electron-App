import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, RefreshCw, Users, UserCheck, CalendarDays, Activity } from 'lucide-react';
import { FilterPopover } from '../../components/common/FilterPopover';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import attendanceService from '../../services/attendance/attendanceService';
import membersService from '../../services/members/membersService';
import sportsService from '../../services/sports/sportsService';
import type { AttendanceStats, GymMember, GymVisit, Sport } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

const METHOD_LABELS: Record<string, string> = {
  qr: 'QR', token: 'توکن', manual: 'دستی', membership: 'عضویت',
};
const SOURCE_LABELS: Record<string, string> = {
  token: 'توکن فیتوپیا', direct: 'ثبت مستقیم', qr: 'QR', manual: 'دستی',
  membership: 'عضویت', single_session: 'جلسه تکی',
};
function methodLabel(m?: string | null) { return m ? METHOD_LABELS[m] || m : '—'; }
function sourceLabel(s?: string | null) { return s ? SOURCE_LABELS[s] || s : '—'; }
function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}
function visitPersonName(v: GymVisit): string {
  if (v.customer_name) return v.customer_name;
  if (v.guest_name) return v.guest_name;
  return '—';
}

export const AttendancePage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('attendance.view');
  const { showToast } = useUI();
  const canCreate = can('attendance.create');

  const [visits, setVisits] = useState<GymVisit[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openFilter, setOpenFilter] = useState<'all' | 'open' | 'closed'>('all');
  const activeFilterCount = openFilter !== 'all' ? 1 : 0;
  const clearFilters = () => setOpenFilter('all');

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [sportId, setSportId] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null);

  const sportNameById = useMemo(() => {
    const m = new Map<number, string>();
    sports.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [sports]);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try {
      const [v, s, sp] = await Promise.all([
        attendanceService.list(gymId),
        attendanceService.stats(gymId).catch(() => null),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setVisits((v || []).filter((x) => x && x.id != null));
      setStats(s);
      setSports(sp || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت حضور و غیاب');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('attendance.view')) load();
  }, [hasGym, load, can]);

  const filtered = useMemo(() => {
    let rows = visits;
    if (openFilter === 'open') rows = rows.filter((r) => r.is_open === true);
    if (openFilter === 'closed') rows = rows.filter((r) => r.is_open === false);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const name = visitPersonName(r).toLowerCase();
        const phone = String(r.guest_phone || '').toLowerCase();
        const method = methodLabel(r.method).toLowerCase();
        return name.includes(q) || phone.includes(q) || method.includes(q);
      });
    }
    return rows;
  }, [visits, search, openFilter]);

  const openCheckIn = async () => {
    setCustomerId(''); setSportId(''); setCheckInOpen(true);
    if (!gymId) return;
    try {
      const [m, sp] = await Promise.all([
        membersService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setMembers(m || []);
      setSports(sp || []);
    } catch { setMembers([]); }
  };

  const doCheckIn = async () => {
    if (!gymId) return;
    if (!customerId) { showToast('عضو را انتخاب کنید', 'warning'); return; }
    setBusy(true);
    try {
      await attendanceService.checkIn(gymId, {
        customer_id: Number(customerId),
        method: 'manual',
        sport_id: sportId ? Number(sportId) : null,
      });
      showToast('ورود با موفقیت ثبت شد', 'success');
      setCheckInOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally { setBusy(false); }
  };

  const doCheckOut = async (visit: GymVisit) => {
    if (!gymId) return;
    setCheckingOutId(visit.id);
    try {
      await attendanceService.checkOut(gymId, visit.id);
      showToast('خروج با موفقیت ثبت شد', 'success');
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally { setCheckingOutId(null); }
  };

  const columns: Column<GymVisit>[] = [
    {
      key: 'person', header: 'فرد',
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-ink truncate">{visitPersonName(r)}</p>
          {r.guest_phone ? <p className="text-[11px] text-muted tabular-nums">{r.guest_phone}</p>
            : r.customer != null ? <p className="text-[11px] text-muted">عضو باشگاه</p> : null}
        </div>
      ),
    },
    { key: 'sport', header: 'رشته', render: (r) => <span className="text-sm text-muted">{r.sport != null ? sportNameById.get(r.sport) || '—' : '—'}</span> },
    { key: 'check_in_at', header: 'ورود', render: (r) => <span className="text-xs text-muted tabular-nums">{r.check_in_at ? formatJalaliDateTime(r.check_in_at) : '—'}</span> },
    { key: 'check_out_at', header: 'خروج', render: (r) => <span className="text-xs text-muted tabular-nums">{r.check_out_at ? formatJalaliDateTime(r.check_out_at) : '—'}</span> },
    { key: 'method', header: 'روش', render: (r) => <span className="text-xs text-secondary">{methodLabel(r.method)}{r.source ? ` · ${sourceLabel(r.source)}` : ''}</span> },
    { key: 'price', header: 'مبلغ', render: (r) => <span className="text-sm tabular-nums text-muted">{formatMoney(r.price)}</span> },
    {
      key: 'is_open', header: 'وضعیت',
      render: (r) => (
        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium border ${
          r.is_open ? 'bg-success-soft text-success-text border-success/20' : 'bg-surface-elevated text-muted border-border'
        }`}>{r.is_open ? 'داخل باشگاه' : 'خارج‌شده'}</span>
      ),
    },
    {
      key: 'actions', header: 'عملیات', className: 'w-28',
      render: (r) =>
        r.is_open && canCreate ? (
          <button type="button" disabled={checkingOutId === r.id} onClick={() => doCheckOut(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-border text-secondary hover:bg-surface-hover disabled:opacity-50" aria-label="ثبت خروج">
            <LogOut className="w-3.5 h-3.5" />{checkingOutId === r.id ? '...' : 'خروج'}
          </button>
        ) : <span className="text-xs text-muted">—</span>,
    },
  ];

  if (!hasGym) return <NoGymSelected />;
  if (!can('attendance.view')) {
    return <div className="space-y-4"><Header title="حضور و غیاب" /><ErrorBlock message="شما دسترسی مشاهده حضور و غیاب را ندارید." /></div>;
  }

  return (
    <div className="space-y-4">
      <Header title="حضور و غیاب" subtitle="ثبت ورود و خروج اعضای باشگاه" actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> بروزرسانی
          </button>
          {canCreate && (
            <button type="button" onClick={openCheckIn} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
              <LogIn className="w-4 h-4" /> ثبت ورود
            </button>
          )}
        </div>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="امروز" value={String(stats?.today_visits ?? '—')} icon={CalendarDays} accent="primary" />
        <StatCard title="داخل باشگاه" value={String(stats?.currently_inside ?? '—')} icon={UserCheck} accent="success" />
        <StatCard title="این ماه" value={String(stats?.month_visits ?? '—')} icon={Activity} accent="info" />
        <StatCard title="کل مراجعات" value={String(stats?.total_visits ?? '—')} icon={Users} accent="warning" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو نام یا روش..."
          className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        <FilterPopover
          activeCount={activeFilterCount}
          onClear={clearFilters}
          fields={[{
            key: 'open',
            label: 'وضعیت حضور',
            value: openFilter,
            onChange: (v) => setOpenFilter(v as typeof openFilter),
            options: [
              { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'open', label: 'داخل باشگاه' },
              { value: 'closed', label: 'خارج‌شده' },
            ],
          }]}
        />
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !visits.length ? <LoadingBlock /> : !error && filtered.length === 0 ? (
        <EmptyState title="رکوردی یافت نشد" description={visits.length ? 'با فیلتر فعلی نتیجه‌ای نیست.' : 'هنوز ورود/خروجی ثبت نشده است.'}
          action={canCreate && !visits.length ? (
            <button type="button" onClick={openCheckIn} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
              <LogIn className="w-4 h-4" /> ثبت اولین ورود
            </button>
          ) : undefined} />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}

      <Modal isOpen={checkInOpen} onClose={() => setCheckInOpen(false)} title="ثبت ورود">
        <div className="space-y-3">
          <p className="text-[11px] text-muted">
            فقط اعضای ثبت‌شده قابل ورود هستند. اگر عضو از قبل داخل باشگاه باشد، ورود مجدد خطا می‌دهد — ابتدا خروج ثبت کنید.
          </p>
          <FormField label="عضو" required isSelect value={customerId}
            options={[{ value: '', label: members.length ? 'انتخاب عضو' : 'عضوی یافت نشد' }, ...members.map((m) => ({ value: String(m.id), label: `${m.full_name}${m.phone ? ` — ${m.phone}` : ''}` }))]}
            onChange={(e) => setCustomerId(e.target.value)} />
          <FormField label="رشته ورزشی (اختیاری)" isSelect value={sportId}
            options={[{ value: '', label: 'انتخاب رشته' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))]}
            onChange={(e) => setSportId(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCheckInOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={busy} onClick={doCheckIn} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{busy ? '...' : 'ثبت ورود'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendancePage;
