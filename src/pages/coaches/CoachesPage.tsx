import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Trash2, Eye, RefreshCw, UserPlus, User, Filter, X } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { FormField } from '../../components/common/FormField';
import { ImageUpload } from '../../components/common/ImageUpload';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import coachesService from '../../services/coaches/coachesService';
import sportsService from '../../services/sports/sportsService';
import type { GymCoach, GymCoachInput, Sport } from '../../types/api';

const emptyForm = (): GymCoachInput => ({
  full_name: '',
  specialty: '',
  sports: [],
  image: null,
});

function CoachAvatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary-soft border border-border shrink-0 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : initials ? (
          <span className="text-xs font-bold text-primary">{initials}</span>
        ) : (
          <User className="w-4 h-4 text-primary" />
        )}
      </div>
      <span className="font-medium text-ink truncate">{name}</span>
    </div>
  );
}

function validateForm(form: GymCoachInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.full_name.trim()) errors.full_name = 'نام و نام خانوادگی الزامی است.';
  if (form.specialty != null && form.specialty.length > 120) {
    errors.specialty = 'تخصص نباید بیش از ۱۲۰ کاراکتر باشد.';
  }
  return errors;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-ink font-medium text-left">{value}</span>
    </div>
  );
}

export const CoachesPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const { showToast } = useUI();
  const [items, setItems] = useState<GymCoach[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = sportFilter !== 'all' ? 1 : 0;
  const clearFilters = () => setSportFilter('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GymCoach | null>(null);
  const [form, setForm] = useState<GymCoachInput>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GymCoach | null>(null);
  const [detail, setDetail] = useState<GymCoach | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const sportNameById = useMemo(() => {
    const map = new Map<number, string>();
    sports.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sports]);

  const resolveSportNames = useCallback(
    (ids?: number[] | null) => {
      if (!ids || !ids.length) return '—';
      return ids.map((id) => sportNameById.get(id) || '—').filter((n) => n !== '—').join('، ') || '—';
    },
    [sportNameById],
  );

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, sp] = await Promise.all([
        coachesService.list(gymId),
        sportsService.listSports().catch(() => [] as Sport[]),
      ]);
      setItems(list);
      setSports(sp);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت مربیان');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym) load();
  }, [hasGym, load]);
  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [filterOpen]);


  const filtered = useMemo(() => {
    let rows = items;
    if (sportFilter !== 'all') {
      const sid = Number(sportFilter);
      rows = rows.filter((r) => (r.sports || []).includes(sid));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          (r.specialty || '').toLowerCase().includes(q) ||
          resolveSportNames(r.sports).toLowerCase().includes(q),
      );
    }
    return rows;
  }, [items, search, sportFilter, resolveSportNames]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setExistingImageUrl(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = async (c: GymCoach) => {
    setEditing(c);
    setFormErrors({});
    setForm({
      full_name: c.full_name,
      specialty: c.specialty || '',
      sports: c.sports || [],
      image: null,
    });
    setExistingImageUrl(c.image || null);
    setModalOpen(true);
    if (!gymId) return;
    try {
      const fresh = await coachesService.get(gymId, c.id);
      setForm({
        full_name: fresh.full_name,
        specialty: fresh.specialty || '',
        sports: fresh.sports || [],
        image: null,
      });
      setExistingImageUrl(fresh.image || null);
    } catch {
      /* keep list row */
    }
  };

  const openDetail = async (c: GymCoach) => {
    setDetail(c);
    if (!gymId) return;
    setDetailLoading(true);
    try {
      setDetail(await coachesService.get(gymId, c.id));
    } catch {
      /* keep */
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleSport = (id: number) => {
    setForm((prev) => {
      const current = prev.sports || [];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...prev, sports: next };
    });
  };

  const handleSave = async () => {
    if (!gymId) return;
    const errs = validateForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length) {
      showToast(Object.values(errs)[0], 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload: GymCoachInput = {
        full_name: form.full_name.trim(),
        specialty: (form.specialty || '').trim(),
        sports: form.sports || [],
        image: form.image instanceof File ? form.image : null,
      };
      if (editing) {
        await coachesService.update(gymId, editing.id, payload);
        showToast('اطلاعات مربی با موفقیت ویرایش شد', 'success');
      } else {
        await coachesService.create(gymId, payload);
        showToast('مربی با موفقیت اضافه شد', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gymId || !deleting) return;
    try {
      await coachesService.remove(gymId, deleting.id);
      showToast('مربی با موفقیت حذف شد', 'success');
      setDeleting(null);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    }
  };

  const columns: Column<GymCoach>[] = [
    {
      key: 'full_name',
      header: 'مربی',
      render: (r) => <CoachAvatar name={r.full_name} image={r.image} />,
    },
    {
      key: 'specialty',
      header: 'تخصص',
      render: (r) => <span className="text-ink text-sm">{r.specialty || '—'}</span>,
    },
    {
      key: 'sports',
      header: 'رشته‌ها',
      render: (r) => (
        <span className="text-ink text-sm line-clamp-2">{resolveSportNames(r.sports)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-28',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover" aria-label="مشاهده جزئیات مربی" title="مشاهده">
            <Eye className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft" aria-label="ویرایش مربی" title="ویرایش">
            <Edit3 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-danger-soft" aria-label="حذف مربی" title="حذف">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (!hasGym) return <NoGymSelected />;

  return (
    <div className="space-y-4">
      <Header
        title="مربیان"
        subtitle="مدیریت مربیان باشگاه، تخصص و رشته‌ها"
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
              <UserPlus className="w-4 h-4" />
              مربی جدید
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو نام، تخصص یا رشته..."
          className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border ${
              activeFilterCount > 0
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border text-secondary hover:bg-surface-hover'
            }`}
            aria-expanded={filterOpen}
          >
            <Filter className="w-4 h-4" />
            فیلترها
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-fg text-[11px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          {filterOpen && (
            <div className="absolute top-full mt-2 left-0 z-30 w-72 rounded-2xl border border-border bg-surface shadow-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">فیلترها</span>
                <button type="button" onClick={() => setFilterOpen(false)} className="p-1 rounded-lg text-muted hover:bg-surface-hover" aria-label="بستن">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">رشته ورزشی</label>
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink"
                >
                  <option value="all">همه رشته‌ها</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} className="w-full text-xs text-primary font-medium py-1.5 hover:underline">
                  پاک کردن فیلترها
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {loading && !items.length ? (
        <LoadingBlock />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          title="مربی‌ای یافت نشد"
          description={items.length ? 'با فیلترهای فعلی نتیجه‌ای نیست.' : 'هنوز مربی‌ای ثبت نشده است.'}
          action={
            !items.length ? (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
                <UserPlus className="w-4 h-4" />
                افزودن اولین مربی
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'ویرایش مربی' : 'مربی جدید'}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <FormField label="نام و نام خانوادگی" required value={form.full_name} error={formErrors.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <FormField label="تخصص" value={form.specialty || ''} error={formErrors.specialty} placeholder="مثلاً بدنسازی، یوگا، شنا" onChange={(e) => setForm({ ...form, specialty: e.target.value })} />

          <ImageUpload
            label="تصویر مربی"
            mode="avatar"
            file={form.image instanceof File ? form.image : null}
            value={existingImageUrl}
            onChange={(file) => {
              setForm((prev) => ({ ...prev, image: file }));
              if (file) setExistingImageUrl(null);
            }}
            onClearUrl={() => {
              setForm((prev) => ({ ...prev, image: null }));
              setExistingImageUrl(null);
            }}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary">رشته‌های ورزشی</label>
            {sports.length === 0 ? (
              <p className="text-xs text-muted">کاتالوگ رشته‌ها در دسترس نیست.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 rounded-xl border border-border bg-surface-elevated">
                {sports.map((s) => {
                  const checked = (form.sports || []).includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'bg-primary-soft text-primary border border-primary/30'
                          : 'text-ink hover:bg-surface-hover border border-transparent'
                      }`}
                    >
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleSport(s.id)} />
                      <span
                        className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${
                          checked ? 'bg-primary border-primary' : 'border-border bg-input'
                        }`}
                        aria-hidden
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-primary-fg" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{s.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-muted">می‌توانید چند رشته را انتخاب کنید.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-surface">
            <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات مربی">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary-soft border border-border shrink-0 flex items-center justify-center">
                {detail.image ? (
                  <img src={detail.image} alt={detail.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink truncate">{detail.full_name}</p>
                <p className="text-muted text-xs mt-0.5">{detail.specialty || 'بدون تخصص'}</p>
              </div>
            </div>
            <DetailRow label="نام" value={detail.full_name} />
            <DetailRow label="تخصص" value={detail.specialty || '—'} />
            <DetailRow label="رشته‌ها" value={resolveSportNames(detail.sports)} />
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="حذف مربی"
        itemName={deleting?.full_name || ''}
      />
    </div>
  );
};

export default CoachesPage;
