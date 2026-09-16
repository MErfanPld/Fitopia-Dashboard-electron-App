import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Edit3, Trash2, Eye, UserPlus, BookOpen } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { FilterPopover } from '../../components/common/FilterPopover';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import coursesService from '../../services/courses/coursesService';
import sportsService from '../../services/sports/sportsService';
import coachesService from '../../services/coaches/coachesService';
import offeringsService from '../../services/offerings/offeringsService';
import membersService from '../../services/members/membersService';
import type { Course, CourseInput, CourseStatus, Sport, GymCoach, GymOffering, GymMember } from '../../types/api';
import { formatJalaliNumeric } from '../../utils/jalaliUtils';

const DAY_LABELS: Record<number, string> = { 0: 'شنبه', 1: 'یکشنبه', 2: 'دوشنبه', 3: 'سه‌شنبه', 4: 'چهارشنبه', 5: 'پنجشنبه', 6: 'جمعه' };
const STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
  { value: 'draft', label: 'پیش‌نویس' }, { value: 'open', label: 'باز' }, { value: 'full', label: 'تکمیل ظرفیت' },
  { value: 'closed', label: 'بسته' }, { value: 'cancelled', label: 'لغو شده' },
];
function statusLabel(s?: string | null) { return STATUS_OPTIONS.find((o) => o.value === s)?.label || s || '—'; }
function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}
function timeInputValue(t?: string | null) {
  if (!t) return '';
  let raw = String(t);
  if (raw.includes('T')) raw = raw.split('T')[1] || raw;
  raw = raw.replace('Z', '').split('.')[0];
  const parts = raw.split(':');
  return `${(parts[0] || '00').padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
}
function parseDays(raw?: string | null): number[] {
  if (!raw) return [];
  return String(raw).split(/[,;\s]+/).map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}
function formatDays(days: number[]): string { return days.slice().sort((a, b) => a - b).join(','); }
function daysLabel(raw?: string | null) {
  const days = parseDays(raw);
  if (!days.length) return '—';
  return days.map((d) => DAY_LABELS[d] || String(d)).join('، ');
}

type FormState = {
  title: string; description: string; sport: string; offering: string; coach: string;
  start_date: string; end_date: string; start_time: string; end_time: string;
  days: number[]; capacity: string; price: string; status: CourseStatus | string; is_active: boolean;
};
const emptyForm = (): FormState => ({
  title: '', description: '', sport: '', offering: '', coach: '', start_date: '', end_date: '',
  start_time: '09:00', end_time: '10:00', days: [], capacity: '', price: '', status: 'draft', is_active: true,
});
function courseToForm(c: Course): FormState {
  return {
    title: c.title || '', description: c.description || '',
    sport: c.sport != null ? String(c.sport) : '', offering: c.offering != null ? String(c.offering) : '',
    coach: c.coach != null ? String(c.coach) : '', start_date: c.start_date || '', end_date: c.end_date || '',
    start_time: timeInputValue(c.start_time) || '09:00', end_time: timeInputValue(c.end_time) || '10:00',
    days: parseDays(c.days_of_week), capacity: c.capacity != null ? String(c.capacity) : '',
    price: c.price != null ? String(c.price) : '', status: c.status || 'draft', is_active: c.is_active !== false,
  };
}
function formToPayload(form: FormState): CourseInput {
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  return {
    title: form.title.trim(), description: form.description.trim(),
    sport: form.sport ? Number(form.sport) : null, offering: form.offering ? Number(form.offering) : null,
    coach: form.coach ? Number(form.coach) : null, start_date: form.start_date || null, end_date: form.end_date || null,
    start_time: form.start_time || null, end_time: form.end_time || null, days_of_week: formatDays(form.days),
    capacity: num(form.capacity), price: num(form.price), status: form.status, is_active: form.is_active,
  };
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-ink font-medium text-left">{value}</span>
    </div>
  );
}

export const CoursesPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('course.view');
  const { showToast } = useUI();
  const canManage = can('course.create') || can('course.update');
  const canEnroll = can('course.enroll');

  const [items, setItems] = useState<Course[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [coaches, setCoaches] = useState<GymCoach[]>([]);
  const [offerings, setOfferings] = useState<GymOffering[]>([]);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const activeFilterCount = statusFilter !== 'all' ? 1 : 0;
  const clearFilters = () => setStatusFilter('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [detail, setDetail] = useState<Course | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<Course | null>(null);
  const [enrollMember, setEnrollMember] = useState('');
  const [enrollPrice, setEnrollPrice] = useState('');

  const sportNameById = useMemo(() => { const m = new Map<number, string>(); sports.forEach((s) => m.set(s.id, s.name)); return m; }, [sports]);
  const coachNameById = useMemo(() => { const m = new Map<number, string>(); coaches.forEach((c) => m.set(c.id, c.full_name)); return m; }, [coaches]);
  const offeringLabelById = useMemo(() => {
    const m = new Map<number, string>();
    offerings.forEach((o) => {
      const sport = o.sport_name || (o.sport != null ? sportNameById.get(o.sport) : '') || '';
      m.set(o.id, sport ? `${sport}${o.description ? ` — ${o.description}` : ''}` : `خدمت ${o.id}`);
    });
    return m;
  }, [offerings, sportNameById]);

  const resolveSport = (c: Course) => c.sport_name || (c.sport != null ? sportNameById.get(c.sport) : undefined) || '—';
  const resolveCoach = (c: Course) => (c.coach != null ? coachNameById.get(c.coach) || '—' : '—');

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try {
      const [list, sp, ch, off] = await Promise.all([
        coursesService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
        coachesService.list(gymId).catch(() => [] as GymCoach[]),
        offeringsService.list(gymId).catch(() => [] as GymOffering[]),
      ]);
      setItems((list || []).filter((x) => x && x.id != null));
      setSports(sp || []); setCoaches(ch || []); setOfferings(off || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت دوره‌ها');
    } finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => { if (hasGym && can('course.view')) load(); }, [hasGym, load, can]);

  const filtered = useMemo(() => {
    let rows = items;
    if (statusFilter !== 'all') rows = rows.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => (r.title || '').toLowerCase().includes(q) || resolveSport(r).toLowerCase().includes(q) || resolveCoach(r).toLowerCase().includes(q));
    return rows;
  }, [items, search, statusFilter, sportNameById, coachNameById]);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setFormErrors({}); setFormOpen(true); };
  const openEdit = async (c: Course) => {
    setEditing(c); setForm(courseToForm(c)); setFormErrors({}); setFormOpen(true);
    if (!gymId) return;
    try { const fresh = await coursesService.get(gymId, c.id); setEditing(fresh); setForm(courseToForm(fresh)); } catch { /* */ }
  };
  const openDetail = async (c: Course) => {
    setDetail(c); if (!gymId) return; setDetailLoading(true);
    try { setDetail(await coursesService.get(gymId, c.id)); } catch { /* */ } finally { setDetailLoading(false); }
  };
  const openEnroll = async (c: Course) => {
    setEnrollTarget(c); setEnrollMember(''); setEnrollPrice(c.price != null ? String(c.price) : '');
    if (!gymId) return;
    try { setMembers(await membersService.list(gymId)); } catch { setMembers([]); }
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'عنوان دوره الزامی است.';
    if (form.start_date && form.end_date && form.start_date > form.end_date) errs.end_date = 'تاریخ پایان نباید قبل از شروع باشد.';
    if (form.start_time && form.end_time && form.start_time >= form.end_time) errs.end_time = 'ساعت پایان باید بعد از شروع باشد.';
    return errs;
  };

  const handleSave = async () => {
    if (!gymId) return;
    const errs = validate(); setFormErrors(errs);
    if (Object.keys(errs).length) { showToast(Object.values(errs)[0], 'warning'); return; }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editing) { await coursesService.replace(gymId, editing.id, payload); showToast('دوره با موفقیت ویرایش شد', 'success'); }
      else { await coursesService.create(gymId, payload); showToast('دوره با موفقیت ایجاد شد', 'success'); }
      setFormOpen(false); await load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return; setSaving(true);
    try { await coursesService.remove(gymId, deleting.id); showToast('دوره با موفقیت حذف شد', 'success'); setDeleting(null); await load(); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger'); }
    finally { setSaving(false); }
  };

  const handleEnroll = async () => {
    if (!gymId || !enrollTarget) return;
    const customer = Number(enrollMember);
    if (!customer) { showToast('عضو را انتخاب کنید', 'warning'); return; }
    setSaving(true);
    try {
      await coursesService.enroll(gymId, enrollTarget.id, { customer, price_paid: enrollPrice ? Number(enrollPrice) : null });
      showToast('ثبت‌نام با موفقیت انجام شد', 'success'); setEnrollTarget(null); await load();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger'); }
    finally { setSaving(false); }
  };

  const toggleDay = (d: number) => setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));

  const columns: Column<Course>[] = [
    { key: 'title', header: 'دوره', render: (r) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary-soft border border-border flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-primary" /></div>
        <div className="min-w-0"><p className="font-medium text-ink truncate">{r.title}</p><p className="text-[11px] text-muted truncate">{resolveSport(r)}</p></div>
      </div>
    )},
    { key: 'coach', header: 'مربی', render: (r) => <span className="text-sm text-muted">{resolveCoach(r)}</span> },
    { key: 'dates', header: 'بازه', render: (r) => (
      <span className="text-xs text-muted tabular-nums">{r.start_date ? formatJalaliNumeric(r.start_date) : '—'} تا {r.end_date ? formatJalaliNumeric(r.end_date) : '—'}</span>
    )},
    { key: 'capacity', header: 'ظرفیت', render: (r) => <span className="text-sm text-muted tabular-nums">{r.enrollment_count ?? '—'} / {r.capacity ?? '—'}</span> },
    { key: 'price', header: 'قیمت', render: (r) => <span className="text-sm tabular-nums">{formatMoney(r.price)}</span> },
    { key: 'status', header: 'وضعیت', render: (r) => (
      <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium border border-border bg-surface-elevated text-secondary">{statusLabel(r.status)}</span>
    )},
    { key: 'actions', header: 'عملیات', className: 'w-36', render: (r) => (
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover" aria-label="جزئیات"><Eye className="w-4 h-4" /></button>
        {canEnroll && <button type="button" onClick={() => openEnroll(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft" aria-label="ثبت‌نام"><UserPlus className="w-4 h-4" /></button>}
        {canManage && (<>
          <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft" aria-label="ویرایش"><Edit3 className="w-4 h-4" /></button>
          <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-danger-soft" aria-label="حذف"><Trash2 className="w-4 h-4" /></button>
        </>)}
      </div>
    )},
  ];

  if (!hasGym) return <NoGymSelected />;
  if (!can('course.view')) return (<div className="space-y-4"><Header title="دوره‌ها" /><ErrorBlock message="شما دسترسی مشاهده دوره‌ها را ندارید." /></div>);

  return (
    <div className="space-y-4">
      <Header title="دوره‌ها" subtitle="ایجاد و مدیریت دوره‌ها، ظرفیت و ثبت‌نام" actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> بروزرسانی
          </button>
          {canManage && <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> دوره جدید</button>}
        </div>
      } />

      <div className="flex flex-wrap gap-2 items-center">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو عنوان، رشته یا مربی..." className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        <FilterPopover
          activeCount={activeFilterCount}
          onClear={clearFilters}
          fields={[{
            key: 'status',
            label: 'وضعیت',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'همه وضعیت‌ها' },
              ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ],
          }]}
        />
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !items.length ? <LoadingBlock /> : !error && filtered.length === 0 ? (
        <EmptyState title="دوره‌ای یافت نشد" description={items.length ? 'با فیلتر فعلی نتیجه‌ای نیست.' : 'هنوز دوره‌ای ثبت نشده است.'}
          action={canManage && !items.length ? <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> افزودن اولین دوره</button> : undefined} />
      ) : <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'ویرایش دوره' : 'دوره جدید'} size="lg">
        <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
          <FormField label="عنوان" required value={form.title} error={formErrors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <FormField label="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="رشته" isSelect value={form.sport} options={[{ value: '', label: 'انتخاب رشته' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))]} onChange={(e) => setForm({ ...form, sport: e.target.value })} />
            <FormField label="خدمت" isSelect value={form.offering} options={[{ value: '', label: 'بدون خدمت' }, ...offerings.map((o) => ({ value: String(o.id), label: offeringLabelById.get(o.id) || String(o.id) }))]} onChange={(e) => setForm({ ...form, offering: e.target.value })} />
            <FormField label="مربی" isSelect value={form.coach} options={[{ value: '', label: 'انتخاب مربی' }, ...coaches.map((c) => ({ value: String(c.id), label: c.full_name }))]} onChange={(e) => setForm({ ...form, coach: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <JalaliDatePicker label="تاریخ شروع" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
            <div>
              <JalaliDatePicker label="تاریخ پایان" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
              {formErrors.end_date && <p className="text-[11px] text-danger-text mt-1">{formErrors.end_date}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] text-muted">ساعت شروع</label><input type="time" className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
            <div><label className="text-[11px] text-muted">ساعت پایان</label><input type="time" className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />{formErrors.end_time && <p className="text-[11px] text-danger-text mt-1">{formErrors.end_time}</p>}</div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted mb-2">روزهای هفته</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DAY_LABELS).map(([v, label]) => {
                const d = Number(v); const on = form.days.includes(d);
                return <button key={v} type="button" onClick={() => toggleDay(d)} className={`px-3 py-1.5 rounded-xl text-xs border ${on ? 'bg-primary-soft border-primary text-primary font-semibold' : 'border-border text-muted hover:bg-surface-hover'}`}>{label}</button>;
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="ظرفیت" type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            <FormField label="قیمت (تومان)" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <FormField label="وضعیت" isSelect value={String(form.status)} options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-border" /> دوره فعال است</label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'ذخیره'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات دوره">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm">
            <DetailRow label="عنوان" value={detail.title} />
            <DetailRow label="رشته" value={resolveSport(detail)} />
            <DetailRow label="مربی" value={resolveCoach(detail)} />
            <DetailRow label="خدمت" value={detail.offering != null ? offeringLabelById.get(detail.offering) || '—' : '—'} />
            <DetailRow label="بازه" value={`${detail.start_date ? formatJalaliNumeric(detail.start_date) : '—'} تا ${detail.end_date ? formatJalaliNumeric(detail.end_date) : '—'}`} />
            <DetailRow label="ساعت" value={`${timeInputValue(detail.start_time) || '—'} تا ${timeInputValue(detail.end_time) || '—'}`} />
            <DetailRow label="روزها" value={daysLabel(detail.days_of_week)} />
            <DetailRow label="ظرفیت" value={`${detail.enrollment_count ?? '—'} / ${detail.capacity ?? '—'} (باقی: ${detail.remaining_capacity ?? '—'})`} />
            <DetailRow label="قیمت" value={formatMoney(detail.price)} />
            <DetailRow label="وضعیت" value={statusLabel(detail.status)} />
          </div>
        )}
      </Modal>

      <Modal isOpen={!!enrollTarget} onClose={() => setEnrollTarget(null)} title="ثبت‌نام عضو در دوره">
        <div className="space-y-3">
          <p className="text-sm text-muted">دوره: <span className="text-ink font-medium">{enrollTarget?.title}</span></p>
          <FormField label="عضو" required isSelect value={enrollMember} options={[{ value: '', label: members.length ? 'انتخاب عضو' : 'عضوی یافت نشد' }, ...members.map((m) => ({ value: String(m.id), label: `${m.full_name}${m.phone ? ` — ${m.phone}` : ''}` }))]} onChange={(e) => setEnrollMember(e.target.value)} />
          <FormField label="مبلغ پرداختی (تومان)" type="number" min={0} value={enrollPrice} onChange={(e) => setEnrollPrice(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEnrollTarget(null)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={handleEnroll} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'ثبت‌نام'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="حذف دوره" itemName={deleting?.title || ''} />
    </div>
  );
};

export default CoursesPage;
