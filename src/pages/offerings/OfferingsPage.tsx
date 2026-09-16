import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Edit3, Trash2, Eye, Clock, X } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { FilterPopover } from '../../components/common/FilterPopover';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import offeringsService from '../../services/offerings/offeringsService';
import sportsService from '../../services/sports/sportsService';
import coachesService from '../../services/coaches/coachesService';
import type {
  GymOffering,
  GymOfferingInput,
  OfferingSchedule,
  Sport,
  SportCategory,
  GymCoach,
  SkillLevel,
  GenderRestriction,
} from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

const DAY_LABELS: Record<number, string> = {
  0: 'شنبه', 1: 'یکشنبه', 2: 'دوشنبه', 3: 'سه‌شنبه', 4: 'چهارشنبه', 5: 'پنجشنبه', 6: 'جمعه',
};

const SKILL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'all', label: 'همه سطوح' },
  { value: 'beginner', label: 'مبتدی' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'پیشرفته' },
];

const GENDER_OPTIONS: { value: GenderRestriction; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'male', label: 'آقایان' },
  { value: 'female', label: 'بانوان' },
];

function skillLabel(v?: string | null) {
  return SKILL_OPTIONS.find((o) => o.value === v)?.label || v || '—';
}
function genderLabel(v?: string | null) {
  return GENDER_OPTIONS.find((o) => o.value === v)?.label || v || '—';
}
function dayLabel(d: number) {
  return DAY_LABELS[d] ?? `روز ${d}`;
}
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

type FormState = {
  sport: string;
  description: string;
  coaches: number[];
  capacity: string;
  single_session_price: string;
  course_price: string;
  monthly_price: string;
  duration_minutes: string;
  skill_level: SkillLevel | string;
  gender_restriction: GenderRestriction | string;
  min_age: string;
  max_age: string;
  is_active: boolean;
  schedules: OfferingSchedule[];
};

const emptyForm = (): FormState => ({
  sport: '',
  description: '',
  coaches: [],
  capacity: '',
  single_session_price: '',
  course_price: '',
  monthly_price: '',
  duration_minutes: '',
  skill_level: 'all',
  gender_restriction: 'all',
  min_age: '',
  max_age: '',
  is_active: true,
  schedules: [{ day_of_week: 0, start_time: '09:00', end_time: '10:00' }],
});

function offeringToForm(o: GymOffering): FormState {
  return {
    sport: o.sport != null ? String(o.sport) : '',
    description: o.description || '',
    coaches: Array.isArray(o.coaches) ? [...o.coaches] : [],
    capacity: o.capacity != null ? String(o.capacity) : '',
    single_session_price: o.single_session_price != null ? String(o.single_session_price) : '',
    course_price: o.course_price != null ? String(o.course_price) : '',
    monthly_price: o.monthly_price != null ? String(o.monthly_price) : '',
    duration_minutes: o.duration_minutes != null ? String(o.duration_minutes) : '',
    skill_level: o.skill_level || 'all',
    gender_restriction: o.gender_restriction || 'all',
    min_age: o.min_age != null ? String(o.min_age) : '',
    max_age: o.max_age != null ? String(o.max_age) : '',
    is_active: o.is_active !== false,
    schedules: (o.schedules || []).map((s) => ({
      id: s.id,
      day_of_week: Number(s.day_of_week),
      start_time: timeInputValue(s.start_time),
      end_time: timeInputValue(s.end_time),
    })),
  };
}

function formToPayload(form: FormState): GymOfferingInput {
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  return {
    sport: form.sport ? Number(form.sport) : null,
    description: form.description.trim(),
    coaches: form.coaches,
    capacity: num(form.capacity),
    single_session_price: num(form.single_session_price),
    course_price: num(form.course_price),
    monthly_price: num(form.monthly_price),
    duration_minutes: num(form.duration_minutes),
    skill_level: form.skill_level,
    gender_restriction: form.gender_restriction,
    min_age: num(form.min_age),
    max_age: num(form.max_age),
    is_active: form.is_active,
    schedules: form.schedules.map((s) => ({
      id: s.id,
      day_of_week: Number(s.day_of_week),
      start_time: s.start_time,
      end_time: s.end_time,
    })),
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

export const OfferingsPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped('offering.manage');
  const { showToast } = useUI();
  const canManage = can('offering.manage');

  const [items, setItems] = useState<GymOffering[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [coaches, setCoaches] = useState<GymCoach[]>([]);
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const activeFilterCount = (sportFilter !== 'all' ? 1 : 0) + (activeFilter !== 'all' ? 1 : 0);
  const clearFilters = () => { setSportFilter('all'); setActiveFilter('all'); };

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GymOffering | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymOffering | null>(null);
  const [detail, setDetail] = useState<GymOffering | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestCategory, setSuggestCategory] = useState('');

  const sportNameById = useMemo(() => {
    const m = new Map<number, string>();
    sports.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [sports]);

  const coachNameById = useMemo(() => {
    const m = new Map<number, string>();
    coaches.forEach((c) => m.set(c.id, c.full_name));
    return m;
  }, [coaches]);

  const resolveSport = (o: GymOffering) =>
    o.sport_name || (o.sport != null ? sportNameById.get(o.sport) : undefined) || '—';

  const resolveCoaches = (o: GymOffering) => {
    if (!o.coaches?.length) return '—';
    return o.coaches.map((id) => coachNameById.get(id) || 'مربی').join('، ');
  };

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sportList, coachList, cats] = await Promise.all([
        offeringsService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
        coachesService.list(gymId).catch(() => [] as GymCoach[]),
        sportsService.listCategories().catch(() => [] as SportCategory[]),
      ]);
      setItems((list || []).filter((x) => x && x.id != null));
      setSports(sportList || []);
      setCoaches(coachList || []);
      setCategories(cats || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت خدمات');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym && canManage) load();
  }, [hasGym, load, canManage]);

  const filtered = useMemo(() => {
    let rows = items;
    if (sportFilter !== 'all') rows = rows.filter((r) => r.sport === Number(sportFilter));
    if (activeFilter === 'active') rows = rows.filter((r) => r.is_active !== false);
    if (activeFilter === 'inactive') rows = rows.filter((r) => r.is_active === false);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          resolveSport(r).toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          resolveCoaches(r).toLowerCase().includes(q),
      );
    }
    return rows;
  }, [items, search, sportFilter, activeFilter, sportNameById, coachNameById]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = async (o: GymOffering) => {
    setEditing(o);
    setForm(offeringToForm(o));
    setFormErrors({});
    setFormOpen(true);
    if (!gymId) return;
    try {
      const fresh = await offeringsService.get(gymId, o.id);
      setEditing(fresh);
      setForm(offeringToForm(fresh));
    } catch {
      /* keep */
    }
  };

  const openDetail = async (o: GymOffering) => {
    setDetail(o);
    if (!gymId) return;
    setDetailLoading(true);
    try {
      setDetail(await offeringsService.get(gymId, o.id));
    } catch {
      /* keep */
    } finally {
      setDetailLoading(false);
    }
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.sport) errs.sport = 'رشته ورزشی را انتخاب کنید.';
    if (form.min_age && form.max_age && Number(form.min_age) > Number(form.max_age)) {
      errs.max_age = 'حداکثر سن نباید کمتر از حداقل باشد.';
    }
    for (let i = 0; i < form.schedules.length; i++) {
      const s = form.schedules[i];
      if (s.start_time && s.end_time && s.start_time >= s.end_time) {
        errs.schedules = `زمان‌بندی ردیف ${i + 1}: پایان باید بعد از شروع باشد.`;
        break;
      }
    }
    return errs;
  };

  const handleSave = async () => {
    if (!gymId) return;
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) {
      showToast(Object.values(errs)[0], 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editing) {
        await offeringsService.replace(gymId, editing.id, payload);
        showToast('خدمت با موفقیت ویرایش شد', 'success');
      } else {
        await offeringsService.create(gymId, payload);
        showToast('خدمت با موفقیت اضافه شد', 'success');
      }
      setFormOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    setSaving(true);
    try {
      await offeringsService.remove(gymId, deleting.id);
      showToast('خدمت با موفقیت حذف شد', 'success');
      setDeleting(null);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const addSchedule = () => {
    setForm((f) => ({
      ...f,
      schedules: [...f.schedules, { day_of_week: 0, start_time: '09:00', end_time: '10:00' }],
    }));
  };

  const updateSchedule = (idx: number, patch: Partial<OfferingSchedule>) => {
    setForm((f) => {
      const schedules = f.schedules.map((s, i) => (i === idx ? { ...s, ...patch } : s));
      return { ...f, schedules };
    });
  };

  const removeSchedule = (idx: number) => {
    setForm((f) => ({ ...f, schedules: f.schedules.filter((_, i) => i !== idx) }));
  };

  const toggleCoach = (id: number) => {
    setForm((f) => ({
      ...f,
      coaches: f.coaches.includes(id) ? f.coaches.filter((c) => c !== id) : [...f.coaches, id],
    }));
  };

  const columns: Column<GymOffering>[] = [
    {
      key: 'sport_name',
      header: 'رشته',
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-ink truncate">{resolveSport(r)}</p>
          {r.description ? <p className="text-[11px] text-muted truncate">{r.description}</p> : null}
        </div>
      ),
    },
    {
      key: 'coaches',
      header: 'مربیان',
      render: (r) => <span className="text-sm text-muted">{resolveCoaches(r)}</span>,
    },
    {
      key: 'monthly_price',
      header: 'قیمت ماهانه',
      render: (r) => <span className="text-sm tabular-nums">{formatMoney(r.monthly_price)}</span>,
    },
    {
      key: 'capacity',
      header: 'ظرفیت',
      render: (r) => <span className="text-sm text-muted">{r.capacity != null ? r.capacity : '—'}</span>,
    },
    {
      key: 'skill_level',
      header: 'سطح',
      render: (r) => <span className="text-xs text-secondary">{skillLabel(r.skill_level)}</span>,
    },
    {
      key: 'is_active',
      header: 'وضعیت',
      render: (r) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium border ${
            r.is_active !== false
              ? 'bg-success-soft text-success-text border-success/20'
              : 'bg-danger-soft text-danger-text border-danger/20'
          }`}
        >
          {r.is_active !== false ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-28',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover" aria-label="جزئیات" title="جزئیات">
            <Eye className="w-4 h-4" />
          </button>
          {canManage && (
            <>
              <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft" aria-label="ویرایش" title="ویرایش">
                <Edit3 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-danger-soft" aria-label="حذف" title="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!hasGym) return <NoGymSelected />;
  if (!canManage) {
    return (
      <div className="space-y-4">
        <Header title="خدمات و رشته‌ها" subtitle="مدیریت خدمات باشگاه" />
        <ErrorBlock message="شما دسترسی مدیریت خدمات را ندارید." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        title="خدمات و رشته‌ها"
        subtitle="تعریف خدمات، قیمت‌ها، مربیان و برنامه زمانی"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
            <button
              type="button"
              onClick={async () => {
                setSuggestName('');
                setSuggestOpen(true);
                try {
                  const cats = await sportsService.listCategories();
                  setCategories(cats || []);
                  setSuggestCategory(cats[0] ? String(cats[0].id) : '');
                } catch {
                  setSuggestCategory(categories[0] ? String(categories[0].id) : '');
                }
              }}
              className="px-3 py-2 text-sm rounded-xl border border-border text-muted hover:text-ink hover:bg-surface-hover"
            >
              پیشنهاد رشته
            </button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
              <Plus className="w-4 h-4" />
              خدمت جدید
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو رشته، توضیحات یا مربی..."
          className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <FilterPopover
          activeCount={activeFilterCount}
          onClear={clearFilters}
          fields={[
            {
              key: 'sport',
              label: 'رشته ورزشی',
              value: sportFilter,
              onChange: setSportFilter,
              options: [
                { value: 'all', label: 'همه رشته‌ها' },
                ...sports.map((s) => ({ value: String(s.id), label: s.name })),
              ],
            },
            {
              key: 'active',
              label: 'وضعیت',
              value: activeFilter,
              onChange: (v) => setActiveFilter(v as typeof activeFilter),
              options: [
                { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'active', label: 'فعال' },
              { value: 'inactive', label: 'غیرفعال' },
              ],
            },
          ]}
        />
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !items.length ? (
        <LoadingBlock />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          title="خدمتی یافت نشد"
          description={items.length ? 'با فیلترهای فعلی نتیجه‌ای نیست.' : 'هنوز خدمتی ثبت نشده است.'}
          action={
            !items.length ? (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
                <Plus className="w-4 h-4" />
                افزودن اولین خدمت
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'ویرایش خدمت' : 'خدمت جدید'} size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <FormField
            label="رشته ورزشی"
            required
            isSelect
            value={form.sport}
            error={formErrors.sport}
            options={[{ value: '', label: 'انتخاب رشته' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))]}
            onChange={(e) => setForm({ ...form, sport: e.target.value })}
          />
          <FormField label="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="توضیح کوتاه درباره این خدمت" />

          <div>
            <p className="text-[11px] font-medium text-muted mb-2">مربیان</p>
            {coaches.length === 0 ? (
              <p className="text-xs text-muted">مربی‌ای ثبت نشده است.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {coaches.map((c) => {
                  const on = form.coaches.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCoach(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                        on ? 'bg-primary-soft border-primary text-primary font-semibold' : 'border-border text-muted hover:bg-surface-hover'
                      }`}
                    >
                      {c.full_name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="قیمت تک‌جلسه (تومان)" type="number" min={0} value={form.single_session_price} onChange={(e) => setForm({ ...form, single_session_price: e.target.value })} />
            <FormField label="قیمت دوره (تومان)" type="number" min={0} value={form.course_price} onChange={(e) => setForm({ ...form, course_price: e.target.value })} />
            <FormField label="قیمت ماهانه (تومان)" type="number" min={0} value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="ظرفیت" type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            <FormField label="مدت جلسه (دقیقه)" type="number" min={0} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            <FormField label="سطح" isSelect value={String(form.skill_level)} options={SKILL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} onChange={(e) => setForm({ ...form, skill_level: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="محدودیت جنسیت" isSelect value={String(form.gender_restriction)} options={GENDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} onChange={(e) => setForm({ ...form, gender_restriction: e.target.value })} />
            <FormField label="حداقل سن" type="number" min={0} value={form.min_age} onChange={(e) => setForm({ ...form, min_age: e.target.value })} />
            <FormField label="حداکثر سن" type="number" min={0} value={form.max_age} error={formErrors.max_age} onChange={(e) => setForm({ ...form, max_age: e.target.value })} />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-border" />
            خدمت فعال است
          </label>

          <div className="space-y-3 border border-border rounded-xl p-3">
            <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              برنامه زمانی
            </p>
            {formErrors.schedules && <p className="text-[11px] text-danger-text">{formErrors.schedules}</p>}
            <div className="space-y-2">
              {form.schedules.map((s, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <div>
                    <label className="text-[11px] text-muted">روز</label>
                    <select className="w-full rounded-xl border border-border bg-input px-2 py-2 text-sm text-ink" value={s.day_of_week} onChange={(e) => updateSchedule(idx, { day_of_week: Number(e.target.value) })}>
                      {Object.entries(DAY_LABELS).map(([v, label]) => (
                        <option key={v} value={v}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted">شروع</label>
                    <input type="time" className="w-full rounded-xl border border-border bg-input px-2 py-2 text-sm text-ink" value={timeInputValue(s.start_time)} onChange={(e) => updateSchedule(idx, { start_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted">پایان</label>
                    <input type="time" className="w-full rounded-xl border border-border bg-input px-2 py-2 text-sm text-ink" value={timeInputValue(s.end_time)} onChange={(e) => updateSchedule(idx, { end_time: e.target.value })} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSchedule(idx)}
                    disabled={form.schedules.length <= 1}
                    className="p-2 text-muted hover:text-danger-text disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="حذف سانس"
                    title={form.schedules.length <= 1 ? 'حداقل یک سانس لازم است' : 'حذف سانس'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSchedule}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary-soft font-medium"
            >
              <Plus className="w-4 h-4" />
              افزودن روز / سانس
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات خدمت">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm">
            <DetailRow label="رشته" value={resolveSport(detail)} />
            <DetailRow label="توضیحات" value={detail.description || '—'} />
            <DetailRow label="مربیان" value={resolveCoaches(detail)} />
            <DetailRow label="ظرفیت" value={detail.capacity != null ? String(detail.capacity) : '—'} />
            <DetailRow label="تک‌جلسه" value={formatMoney(detail.single_session_price)} />
            <DetailRow label="دوره" value={formatMoney(detail.course_price)} />
            <DetailRow label="ماهانه" value={formatMoney(detail.monthly_price)} />
            <DetailRow label="مدت جلسه" value={detail.duration_minutes != null ? `${detail.duration_minutes} دقیقه` : '—'} />
            <DetailRow label="سطح" value={skillLabel(detail.skill_level)} />
            <DetailRow label="جنسیت" value={genderLabel(detail.gender_restriction)} />
            <DetailRow label="سن" value={detail.min_age != null || detail.max_age != null ? `${detail.min_age ?? '—'} تا ${detail.max_age ?? '—'}` : '—'} />
            <DetailRow label="وضعیت" value={detail.is_active !== false ? 'فعال' : 'غیرفعال'} />
            <div>
              <p className="text-muted mb-2">برنامه زمانی</p>
              {(detail.schedules || []).length === 0 ? (
                <p className="text-ink">—</p>
              ) : (
                <ul className="space-y-1">
                  {(detail.schedules || []).map((s, i) => (
                    <li key={s.id ?? i} className="text-ink text-sm">
                      {dayLabel(Number(s.day_of_week))} — {timeInputValue(s.start_time)} تا {timeInputValue(s.end_time)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DetailRow label="آخرین به‌روزرسانی" value={detail.updated_at ? formatJalaliDateTime(detail.updated_at) : '—'} />
          </div>
        )}
      </Modal>

      <Modal isOpen={suggestOpen} onClose={() => setSuggestOpen(false)} title="پیشنهاد رشته ورزشی">
        <div className="space-y-4">
          <FormField label="نام رشته" required value={suggestName} onChange={(e) => setSuggestName(e.target.value)} />
          <FormField
            label="دسته‌بندی"
            required
            isSelect
            value={suggestCategory}
            options={[
              { value: '', label: categories.length ? 'انتخاب دسته' : 'در حال بارگذاری...' },
              ...categories.map((c) => ({ value: String(c.id), label: c.title || c.name })),
            ]}
            onChange={(e) => setSuggestCategory(e.target.value)}
          />
          <p className="text-[11px] text-muted">پیشنهاد برای بررسی تیم فیتوپیا ارسال می‌شود.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSuggestOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button
              type="button"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-primary-fg font-bold rounded-lg disabled:opacity-50"
              onClick={async () => {
                if (!gymId || !suggestName.trim() || !suggestCategory) {
                  showToast('نام رشته و دسته‌بندی الزامی است.', 'warning');
                  return;
                }
                setSaving(true);
                try {
                  await offeringsService.suggestSport(gymId, {
                    name: suggestName.trim(),
                    category_id: Number(suggestCategory),
                  });
                  showToast('پیشنهاد ارسال شد', 'success');
                  setSuggestOpen(false);
                } catch (e: unknown) {
                  showToast(e instanceof Error ? e.message : 'خطا', 'danger');
                } finally {
                  setSaving(false);
                }
              }}
            >
              ارسال پیشنهاد
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="حذف خدمت"
        itemName={deleting ? resolveSport(deleting) : ''}
      />
    </div>
  );
};

export default OfferingsPage;
