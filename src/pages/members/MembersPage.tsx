import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Trash2, Eye, RefreshCw, UserPlus, User, Filter, X } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { ImageUpload } from '../../components/common/ImageUpload';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import membersService from '../../services/members/membersService';
import sportsService from '../../services/sports/sportsService';
import coachesService from '../../services/coaches/coachesService';
import type { GymMember, GymMemberInput, Sport, GymCoach } from '../../types/api';
import { formatJalaliNumeric, formatJalaliDateTime, toPersianDigits } from '../../utils/jalaliUtils';

type FitopiaFilter = 'all' | 'fitopia' | 'gym';
type SourceFilter = 'all' | 'manual' | 'token';
type StatusFilter = 'all' | 'active' | 'expired' | 'suspended' | 'inactive';

const MEMBERSHIP_STATUS_OPTIONS = [
  { value: 'active', label: 'فعال' },
  { value: 'expired', label: 'منقضی' },
  { value: 'suspended', label: 'معلق' },
  { value: 'inactive', label: 'غیرفعال' },
];

const MEMBERSHIP_TYPE_OPTIONS = [
  { value: 'session_pack', label: 'بسته جلسات' },
  { value: 'monthly', label: 'ماهانه' },
  { value: 'course', label: 'دوره' },
  { value: 'drop_in', label: 'تک‌جلسه' },
];

const emptyForm = (): GymMemberInput => ({
  full_name: '', phone: '', sport: null, coach: null, source: 'manual',
  sessions_total: null, sessions_remaining: null, sessions_used: null, price_paid: null,
  join_date: new Date().toISOString().slice(0, 10),
  membership_status: 'active', membership_type: 'session_pack',
  membership_start: null, membership_end: null, notes: '', is_active: true, photo: null,
});

function isFitopiaUser(m: GymMember): boolean {
  if (m.fitopia_user != null && m.fitopia_user !== 0) return true;
  const v = m.is_fitopia_user;
  return v === true || v === 'true' || v === 'True';
}
function sourceLabel(source?: string | null): string {
  if (source === 'token') return 'توکن فیتوپیا';
  if (source === 'manual') return 'ثبت دستی';
  return source || '—';
}
function statusLabel(status?: string | null): string {
  const map: Record<string, string> = { active: 'فعال', expired: 'منقضی', suspended: 'معلق', inactive: 'غیرفعال' };
  return status ? map[status] || status : '—';
}
function statusClass(status?: string | null): string {
  switch (status) {
    case 'active': return 'bg-success-soft text-success-text border-success/20';
    case 'expired': return 'bg-danger-soft text-danger-text border-danger/20';
    case 'suspended': return 'bg-warning-soft text-warning-text border-warning/20';
    case 'inactive': return 'bg-surface-elevated text-muted border-border';
    default: return 'bg-surface-elevated text-secondary border-border';
  }
}
function typeLabel(t?: string | null): string {
  const map: Record<string, string> = { session_pack: 'بسته جلسات', monthly: 'ماهانه', course: 'دوره', drop_in: 'تک‌جلسه' };
  return t ? map[t] || t : '—';
}
function moneyFa(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${toPersianDigits(n.toLocaleString('en-US'))} تومان`;
}
function numFa(n?: number | string | null): string {
  if (n == null || n === '') return '—';
  const num = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(num)) return toPersianDigits(String(n));
  return toPersianDigits(String(num));
}

function MemberAvatar({ name, photo }: { name: string; photo?: string | null }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('');
  return (
    <div className="flex items-center gap-3 min-w-0">
      {photo ? (
        <img src={photo} alt="" className="w-10 h-10 rounded-xl object-cover border border-border shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-primary-soft border border-border shrink-0 flex items-center justify-center">
          {initials ? <span className="text-xs font-bold text-primary">{initials}</span> : <User className="w-4 h-4 text-primary" />}
        </div>
      )}
      <span className="font-medium text-ink truncate">{name}</span>
    </div>
  );
}

function validateForm(form: GymMemberInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.full_name.trim()) errors.full_name = 'نام و نام خانوادگی الزامی است.';
  const phone = form.phone.trim().replace(/\s+/g, '');
  if (!phone) errors.phone = 'شماره موبایل الزامی است.';
  else if (!/^09\d{9}$/.test(phone) && !/^\+98\d{10}$/.test(phone) && !/^9\d{9}$/.test(phone)) {
    errors.phone = 'شماره موبایل معتبر نیست.';
  }
  if (!form.join_date) errors.join_date = 'تاریخ عضویت الزامی است.';
  if (form.sessions_total != null && (form.sessions_total < 0 || !Number.isInteger(form.sessions_total))) {
    errors.sessions_total = 'تعداد جلسات باید عدد صحیح و غیرمنفی باشد.';
  }
  if (form.sessions_remaining != null && form.sessions_remaining < 0) errors.sessions_remaining = 'جلسات باقی‌مانده نمی‌تواند منفی باشد.';
  if (form.sessions_used != null && form.sessions_used < 0) errors.sessions_used = 'جلسات مصرف‌شده نمی‌تواند منفی باشد.';
  if (form.price_paid != null && form.price_paid < 0) errors.price_paid = 'مبلغ پرداختی نمی‌تواند منفی باشد.';
  if (form.membership_start && form.membership_end && form.membership_start > form.membership_end) {
    errors.membership_end = 'تاریخ پایان نباید قبل از شروع باشد.';
  }
  return errors;
}

function DetailRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-ink font-medium text-left ${ltr ? 'dir-ltr font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export const MembersPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('customer.view');
  const { showToast } = useUI();
  const [items, setItems] = useState<GymMember[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [coaches, setCoaches] = useState<GymCoach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [fitopiaFilter, setFitopiaFilter] = useState<FitopiaFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GymMember | null>(null);
  const [form, setForm] = useState<GymMemberInput>(emptyForm());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymMember | null>(null);
  const [detail, setDetail] = useState<GymMember | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const isDropIn = form.membership_type === 'drop_in';
  const isMonthly = form.membership_type === 'monthly';
  const isCreate = !editing;

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sp, ch] = await Promise.all([
        membersService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
        coachesService.list(gymId).catch(() => [] as GymCoach[]),
      ]);
      setItems(list);
      setSports(sp);
      setCoaches(ch);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت اعضای باشگاه');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && can('customer.view')) load();
  }, [hasGym, load, can]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterOpen]);

  const sportNameById = useMemo(() => {
    const map = new Map<number, string>();
    sports.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sports]);
  const coachNameById = useMemo(() => {
    const map = new Map<number, string>();
    coaches.forEach((c) => map.set(c.id, c.full_name));
    return map;
  }, [coaches]);
  const resolveSportName = (m: GymMember) => m.sport_name || (m.sport != null ? sportNameById.get(m.sport) : undefined) || '—';
  const resolveCoachName = (m: GymMember) => m.coach_name || (m.coach != null ? coachNameById.get(m.coach) : undefined) || '—';

  const filtered = useMemo(() => {
    let rows = items;
    if (sportFilter !== 'all') rows = rows.filter((r) => r.sport === Number(sportFilter));
    if (sourceFilter !== 'all') rows = rows.filter((r) => (r.source || 'manual') === sourceFilter);
    if (statusFilter !== 'all') rows = rows.filter((r) => (r.membership_status || 'active') === statusFilter);
    if (fitopiaFilter === 'fitopia') rows = rows.filter((r) => isFitopiaUser(r));
    else if (fitopiaFilter === 'gym') rows = rows.filter((r) => !isFitopiaUser(r));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        r.full_name.toLowerCase().includes(q) || r.phone.includes(q) ||
        resolveSportName(r).toLowerCase().includes(q) || resolveCoachName(r).toLowerCase().includes(q),
      );
    }
    return rows;
  }, [items, sportFilter, sourceFilter, fitopiaFilter, statusFilter, search, sportNameById, coachNameById]);

  const sportOptions = useMemo(() => [{ value: '', label: 'انتخاب رشته (اختیاری)' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))], [sports]);
  const coachOptions = useMemo(() => [{ value: '', label: 'بدون مربی' }, ...coaches.map((c) => ({ value: String(c.id), label: c.full_name }))], [coaches]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (sportFilter !== 'all') n += 1;
    if (statusFilter !== 'all') n += 1;
    if (sourceFilter !== 'all') n += 1;
    if (fitopiaFilter !== 'all') n += 1;
    return n;
  }, [sportFilter, statusFilter, sourceFilter, fitopiaFilter]);

  const clearFilters = () => {
    setSportFilter('all');
    setStatusFilter('all');
    setSourceFilter('all');
    setFitopiaFilter('all');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setPhotoFile(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = async (m: GymMember) => {
    setEditing(m);
    setFormErrors({});
    setPhotoFile(null);
    const mapMember = (x: GymMember): GymMemberInput => ({
      full_name: x.full_name, phone: x.phone, sport: x.sport, coach: x.coach ?? null,
      source: 'manual', sessions_total: x.sessions_total ?? null,
      sessions_remaining: x.sessions_remaining ?? null, sessions_used: x.sessions_used ?? null,
      price_paid: x.price_paid ?? null, join_date: x.join_date || new Date().toISOString().slice(0, 10),
      membership_status: x.membership_status || 'active', membership_type: x.membership_type || 'session_pack',
      membership_start: x.membership_start || null, membership_end: x.membership_end || null,
      notes: x.notes || '', is_active: x.is_active !== false, fitopia_user: x.fitopia_user ?? null, photo: x.photo || null,
    });
    setForm(mapMember(m)); setModalOpen(true);
    if (gymId) {
      try { setForm(mapMember(await membersService.get(gymId, m.id))); } catch { /* keep */ }
    }
  };

  const openDetail = async (m: GymMember) => {
    setDetail(m);
    if (!gymId) return;
    setDetailLoading(true);
    try { setDetail(await membersService.get(gymId, m.id)); } catch { /* keep */ }
    finally { setDetailLoading(false); }
  };

  const handleSave = async () => {
    if (!gymId) return;
    const errs = validateForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length) { showToast(Object.values(errs)[0], 'warning'); return; }
    setSaving(true);
    try {
      const payload: GymMemberInput = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim().replace(/\s+/g, ''),
        sport: form.sport,
        coach: form.coach,
        source: 'manual',
        join_date: form.join_date,
        membership_status: isCreate ? 'active' : form.membership_status,
        membership_type: form.membership_type,
        notes: form.notes,
        is_active: form.is_active,
        photo: photoFile || undefined,
      };
      if (!isDropIn) {
        payload.sessions_total = form.sessions_total;
        payload.sessions_used = form.sessions_used;
        payload.price_paid = form.price_paid;
        payload.membership_start = form.membership_start;
        payload.membership_end = form.membership_end;
        if (!isCreate) {
          payload.sessions_remaining = form.sessions_remaining;
        } else if (!isMonthly) {
          payload.sessions_remaining = form.sessions_remaining ?? form.sessions_total;
        }
      }
      if (editing) { await membersService.update(gymId, editing.id, payload); showToast('عضو با موفقیت به‌روزرسانی شد.', 'success'); }
      else { await membersService.create(gymId, payload); showToast('عضو با موفقیت ثبت شد.', 'success'); }
      setModalOpen(false); await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ذخیره', 'danger');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    try {
      await membersService.remove(gymId, deleting.id);
      showToast('عضو با موفقیت حذف شد.', 'success');
      setDeleting(null); await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در حذف', 'danger');
    }
  };

  const columns: Column<GymMember>[] = [
    { key: 'full_name', header: 'عضو', render: (r) => <MemberAvatar name={r.full_name} photo={r.photo} /> },
    { key: 'phone', header: 'شماره تماس', render: (r) => <span className="text-muted text-sm dir-ltr font-mono">{r.phone}</span> },
    { key: 'sport_name', header: 'رشته', render: (r) => <span className="text-ink text-sm">{resolveSportName(r)}</span> },
    { key: 'coach', header: 'مربی', render: (r) => <span className="text-muted text-sm">{resolveCoachName(r)}</span> },
    { key: 'membership_status', header: 'وضعیت', render: (r) => (
      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium border ${statusClass(r.membership_status)}`}>{statusLabel(r.membership_status)}</span>
    )},
    { key: 'sessions_remaining', header: 'جلسات باقی‌مانده', render: (r) => (
      <span className="text-sm tabular-nums text-ink">{numFa(r.sessions_remaining_calc ?? r.sessions_remaining)}{r.sessions_total != null ? <span className="text-muted text-xs"> / {numFa(r.sessions_total)}</span> : null}</span>
    )},
    { key: 'source', header: 'منبع', render: (r) => (
      <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium bg-surface-elevated border border-border text-secondary">{sourceLabel(r.source)}</span>
    )},
    { key: 'actions', header: 'عملیات', className: 'w-28', render: (r) => (
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover" aria-label="مشاهده جزئیات" title="مشاهده"><Eye className="w-4 h-4" /></button>
        {can('customer.update') && <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft" aria-label="ویرایش عضو" title="ویرایش"><Edit3 className="w-4 h-4" /></button>}
        {can('customer.delete') && <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-danger-soft" aria-label="حذف عضو" title="حذف"><Trash2 className="w-4 h-4" /></button>}
      </div>
    )},
  ];

  if (!hasGym) return <NoGymSelected />;
  if (!can('customer.view')) {
    return (<div className="space-y-4"><Header title="اعضا" subtitle="مدیریت اعضای باشگاه" /><ErrorBlock message="شما دسترسی مشاهده اعضا را ندارید." /></div>);
  }

  return (
    <div className="space-y-4">
      <Header title="اعضا" subtitle="مدیریت اعضای باشگاه و وضعیت عضویت" actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> بروزرسانی
          </button>
          {can('customer.create') && (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
              <UserPlus className="w-4 h-4" /> عضو جدید
            </button>
          )}
        </div>
      } />

      <div className="flex flex-wrap gap-2 items-center">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو نام، موبایل، رشته یا مربی..." className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${
              activeFilterCount > 0
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border text-secondary hover:bg-surface-hover'
            }`}
            aria-expanded={filterOpen}
            aria-haspopup="dialog"
          >
            <Filter className="w-4 h-4" />
            فیلترها
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-fg text-[11px] font-bold">
                {toPersianDigits(String(activeFilterCount))}
              </span>
            )}
          </button>
          {filterOpen && (
            <div role="dialog" aria-label="فیلتر اعضا" className="absolute left-0 top-full mt-2 z-40 w-[min(100vw-2rem,20rem)] rounded-2xl border border-border bg-surface shadow-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">فیلترها</span>
                <button type="button" onClick={() => setFilterOpen(false)} className="p-1 rounded-lg text-muted hover:bg-surface-hover" aria-label="بستن">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">رشته</label>
                <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink">
                  <option value="all">همه رشته‌ها</option>
                  {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">وضعیت عضویت</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink">
                  <option value="all">همه وضعیت‌ها</option>
                  {MEMBERSHIP_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">منبع ثبت</label>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as SourceFilter)} className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink">
                  <option value="all">همه منابع</option>
                  <option value="manual">ثبت دستی</option>
                  <option value="token">توکن فیتوپیا</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">نوع کاربر</label>
                <select value={fitopiaFilter} onChange={(e) => setFitopiaFilter(e.target.value as FitopiaFilter)} className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink">
                  <option value="all">همه کاربران</option>
                  <option value="fitopia">کاربر فیتوپیا</option>
                  <option value="gym">فقط باشگاه</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button type="button" onClick={clearFilters} disabled={activeFilterCount === 0} className="text-xs text-muted hover:text-ink disabled:opacity-40">
                  پاک کردن فیلترها
                </button>
                <button type="button" onClick={() => setFilterOpen(false)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-fg font-bold">
                  اعمال
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sportFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-primary-soft text-primary border border-primary/20">
              رشته: {sports.find((s) => String(s.id) === sportFilter)?.name || sportFilter}
              <button type="button" onClick={() => setSportFilter('all')} aria-label="حذف فیلتر رشته"><X className="w-3 h-3" /></button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-primary-soft text-primary border border-primary/20">
              وضعیت: {statusLabel(statusFilter)}
              <button type="button" onClick={() => setStatusFilter('all')} aria-label="حذف فیلتر وضعیت"><X className="w-3 h-3" /></button>
            </span>
          )}
          {sourceFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-primary-soft text-primary border border-primary/20">
              منبع: {sourceLabel(sourceFilter)}
              <button type="button" onClick={() => setSourceFilter('all')} aria-label="حذف فیلتر منبع"><X className="w-3 h-3" /></button>
            </span>
          )}
          {fitopiaFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-primary-soft text-primary border border-primary/20">
              {fitopiaFilter === 'fitopia' ? 'کاربر فیتوپیا' : 'فقط باشگاه'}
              <button type="button" onClick={() => setFitopiaFilter('all')} aria-label="حذف فیلتر نوع کاربر"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !items.length ? <LoadingBlock /> : !error && filtered.length === 0 ? (
        <EmptyState title="عضوی یافت نشد" description={items.length ? 'با فیلترهای فعلی نتیجه‌ای نیست.' : 'هنوز عضوی ثبت نشده است.'}
          action={can('customer.create') && !items.length ? (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><UserPlus className="w-4 h-4" /> افزودن اولین عضو</button>
          ) : undefined} />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'ویرایش عضو' : 'عضو جدید'}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <ImageUpload
            label="تصویر عضو"
            mode="avatar"
            value={typeof form.photo === 'string' ? form.photo : null}
            file={photoFile}
            allowCamera
            onChange={(f) => {
              setPhotoFile(f);
              if (!f) setForm((prev) => ({ ...prev, photo: null }));
            }}
            onClearUrl={() => setForm((prev) => ({ ...prev, photo: null }))}
          />
          <FormField label="نام و نام خانوادگی" required value={form.full_name} error={formErrors.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <FormField label="شماره موبایل" required value={form.phone} error={formErrors.phone} placeholder="09xxxxxxxxx" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="رشته ورزشی" isSelect value={form.sport != null ? String(form.sport) : ''} error={formErrors.sport} options={sportOptions} onChange={(e) => setForm({ ...form, sport: e.target.value ? Number(e.target.value) : null })} />
            <FormField label="مربی" isSelect value={form.coach != null ? String(form.coach) : ''} options={coachOptions} onChange={(e) => setForm({ ...form, coach: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">منبع ثبت</span>
            <span className="text-sm text-ink font-medium">ثبت دستی</span>
          </div>
          {isCreate ? (
            <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">وضعیت عضویت</span>
              <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium border bg-success-soft text-success-text border-success/20">فعال</span>
            </div>
          ) : (
            <FormField label="وضعیت عضویت" isSelect value={form.membership_status || 'active'} options={MEMBERSHIP_STATUS_OPTIONS} onChange={(e) => setForm({ ...form, membership_status: e.target.value })} />
          )}
          <FormField label="نوع عضویت" isSelect value={form.membership_type || 'session_pack'} options={MEMBERSHIP_TYPE_OPTIONS} onChange={(e) => setForm({ ...form, membership_type: e.target.value })} />
          {!isDropIn && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="تعداد جلسات" type="number" min={0} value={form.sessions_total ?? ''} error={formErrors.sessions_total} onChange={(e) => setForm({ ...form, sessions_total: e.target.value === '' ? null : Number(e.target.value) })} />
                {(!isMonthly || !isCreate) && (
                  <FormField label="جلسات باقی‌مانده" type="number" min={0} value={form.sessions_remaining ?? ''} error={formErrors.sessions_remaining} onChange={(e) => setForm({ ...form, sessions_remaining: e.target.value === '' ? null : Number(e.target.value) })} />
                )}
                <FormField label="جلسات مصرف‌شده" type="number" min={0} value={form.sessions_used ?? ''} error={formErrors.sessions_used} onChange={(e) => setForm({ ...form, sessions_used: e.target.value === '' ? null : Number(e.target.value) })} />
              </div>
              <FormField label="مبلغ پرداختی (تومان)" type="number" min={0} value={form.price_paid ?? ''} error={formErrors.price_paid} onChange={(e) => setForm({ ...form, price_paid: e.target.value === '' ? null : Number(e.target.value) })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <JalaliDatePicker label="شروع عضویت" value={form.membership_start || ''} onChange={(v) => setForm({ ...form, membership_start: v || null })} />
                <div>
                  <JalaliDatePicker label="پایان عضویت" value={form.membership_end || ''} onChange={(v) => setForm({ ...form, membership_end: v || null })} />
                  {formErrors.membership_end && <p className="text-[11px] text-danger-text mt-1">{formErrors.membership_end}</p>}
                </div>
              </div>
            </>
          )}
          <JalaliDatePicker label="تاریخ عضویت" required value={form.join_date || ''} onChange={(v) => setForm({ ...form, join_date: v })} />
          {formErrors.join_date && <p className="text-[11px] text-danger-text -mt-2">{formErrors.join_date}</p>}
          <FormField label="یادداشت" isTextarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          {!isCreate && (
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-border" /> عضو فعال است
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-surface">
            <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? 'در حال ذخیره...' : 'ذخیره'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات عضو">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto">
            <DetailRow label="نام" value={detail.full_name} />
            <DetailRow label="موبایل" value={detail.phone} ltr />
            <DetailRow label="رشته" value={resolveSportName(detail)} />
            <DetailRow label="مربی" value={resolveCoachName(detail)} />
            <DetailRow label="وضعیت عضویت" value={statusLabel(detail.membership_status)} />
            <DetailRow label="نوع عضویت" value={typeLabel(detail.membership_type)} />
            <DetailRow label="منبع" value={sourceLabel(detail.source)} />
            <DetailRow label="ثبت‌کننده" value={detail.added_by_name || 'سیستم'} />
            <DetailRow label="جلسات کل" value={numFa(detail.sessions_total)} />
            <DetailRow label="جلسات باقی‌مانده" value={numFa(detail.sessions_remaining_calc ?? detail.sessions_remaining)} />
            <DetailRow label="جلسات مصرف‌شده" value={numFa(detail.sessions_used)} />
            <DetailRow label="مبلغ پرداختی" value={moneyFa(detail.price_paid)} />
            <DetailRow label="تاریخ عضویت" value={formatJalaliNumeric(detail.join_date)} />
            <DetailRow label="شروع عضویت" value={detail.membership_start ? formatJalaliNumeric(detail.membership_start) : '—'} />
            <DetailRow label="پایان عضویت" value={detail.membership_end ? formatJalaliNumeric(detail.membership_end) : '—'} />
            <DetailRow label="آخرین حضور" value={detail.last_visit_at ? formatJalaliDateTime(detail.last_visit_at) : '—'} />
            <DetailRow label="وضعیت Fitopia" value={isFitopiaUser(detail) ? 'کاربر Fitopia' : 'عضو باشگاه'} />
            <DetailRow label="فعال" value={detail.is_active === false ? 'خیر' : 'بله'} />
            <DetailRow label="یادداشت" value={detail.notes || '—'} />
            <DetailRow label="تاریخ ایجاد" value={detail.created_at ? formatJalaliDateTime(detail.created_at) : '—'} />
            <DetailRow label="آخرین بروزرسانی" value={detail.updated_at ? formatJalaliDateTime(detail.updated_at) : '—'} />
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="حذف عضو" itemName={deleting?.full_name || ''} />
    </div>
  );
};

export default MembersPage;
