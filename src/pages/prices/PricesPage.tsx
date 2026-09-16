import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, Eye, Tag } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { FilterPopover } from '../../components/common/FilterPopover';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import pricesService from '../../services/prices/pricesService';
import sportsService from '../../services/sports/sportsService';
import type { GymPrice, Sport, GymPriceInput } from '../../types/api';

function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-ink font-medium text-left tabular-nums">{value}</span>
    </div>
  );
}

type FormState = {
  sport: string;
  session_price: string;
  monthly_price: string;
  quarterly_price: string;
  yearly_price: string;
};

const emptyForm = (): FormState => ({
  sport: '',
  session_price: '',
  monthly_price: '',
  quarterly_price: '',
  yearly_price: '',
});

function priceToForm(p: GymPrice): FormState {
  return {
    sport: p.sport != null ? String(p.sport) : '',
    session_price: p.session_price != null ? String(p.session_price) : '',
    monthly_price: p.monthly_price != null ? String(p.monthly_price) : '',
    quarterly_price: p.quarterly_price != null ? String(p.quarterly_price) : '',
    yearly_price: p.yearly_price != null ? String(p.yearly_price) : '',
  };
}

function formToPayload(form: FormState): GymPriceInput {
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  return {
    sport: form.sport ? Number(form.sport) : 0,
    session_price: num(form.session_price),
    monthly_price: num(form.monthly_price) ?? 0,
    quarterly_price: num(form.quarterly_price),
    yearly_price: num(form.yearly_price) ?? 0,
  };
}

export const PricesPage: React.FC = () => {
  const { gymId } = useGymScoped();
  const { showToast } = useUI();

  const [items, setItems] = useState<GymPrice[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GymPrice | null>(null);
  const [detail, setDetail] = useState<GymPrice | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState<GymPrice | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sportFilter, setSportFilter] = useState('');

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const [prices, sportList] = await Promise.all([
        pricesService.list(gymId),
        sportsService.listSports(),
      ]);
      setItems(prices);
      setSports(sportList);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت داده‌ها');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    load();
  }, [load]);

  const resolveSport = (p: GymPrice) => {
    if (p.sport_name) return p.sport_name;
    const s = sports.find((x) => x.id === p.sport);
    return s?.name || (p.sport != null ? `#${p.sport}` : '—');
  };

  const filtered = useMemo(() => {
    if (!sportFilter) return items;
    return items.filter((p) => String(p.sport) === sportFilter);
  }, [items, sportFilter]);

  const availableSportsForCreate = useMemo(() => {
    const used = new Set(items.map((p) => p.sport));
    return sports.filter((s) => !used.has(s.id));
  }, [items, sports]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (r: GymPrice) => {
    setEditing(r);
    setForm(priceToForm(r));
    setFormErrors({});
    setOpen(true);
  };

  const openDetail = async (r: GymPrice) => {
    if (!gymId) return;
    setDetail(r);
    setDetailLoading(true);
    try {
      const full = await pricesService.retrieve(gymId, r.id);
      setDetail(full);
    } catch {
      /* keep list row */
    } finally {
      setDetailLoading(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!editing && !form.sport) errs.sport = 'انتخاب رشته الزامی است';
    if (form.monthly_price.trim() === '') errs.monthly_price = 'قیمت ماهانه الزامی است';
    if (form.yearly_price.trim() === '') errs.yearly_price = 'قیمت سالانه الزامی است';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!gymId || !validate()) return;
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editing) {
        await pricesService.update(gymId, editing.id, payload);
        showToast('قیمت با موفقیت ویرایش شد', 'success');
      } else {
        await pricesService.create(gymId, payload);
        showToast('قیمت با موفقیت ثبت شد', 'success');
      }
      setOpen(false);
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
      await pricesService.remove(gymId, deleting.id);
      showToast('قیمت با موفقیت حذف شد', 'success');
      setDeleting(null);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<GymPrice>[] = [
    {
      key: 'sport',
      header: 'رشته',
      render: (r) => <span className="font-medium text-ink">{resolveSport(r)}</span>,
    },
    {
      key: 'session_price',
      header: 'تک‌جلسه',
      render: (r) => formatMoney(r.session_price),
    },
    {
      key: 'monthly_price',
      header: 'ماهانه',
      render: (r) => formatMoney(r.monthly_price),
    },
    {
      key: 'quarterly_price',
      header: 'سه‌ماهه',
      render: (r) => formatMoney(r.quarterly_price),
    },
    {
      key: 'yearly_price',
      header: 'سالانه',
      render: (r) => formatMoney(r.yearly_price),
    },
    {
      key: 'actions',
      header: 'عملیات',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover" aria-label="جزئیات" title="جزئیات">
            <Eye className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft" aria-label="ویرایش" title="ویرایش">
            <Edit3 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-muted hover:text-danger-text hover:bg-danger-soft" aria-label="حذف" title="حذف">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (!gymId) {
    return (
      <div className="p-6">
        <Header title="قیمت‌ها" subtitle="تعرفه رشته‌های باشگاه" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Header
        title="قیمت‌ها"
        subtitle="تعرفه تک‌جلسه، ماهانه، سه‌ماهه و سالانه هر رشته"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-ink hover:bg-surface-hover text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              بروزرسانی
            </button>
            <button
              type="button"
              onClick={openCreate}
              disabled={!availableSportsForCreate.length}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-fg hover:opacity-90 text-sm font-medium disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              قیمت جدید
            </button>
          </div>
        }
      />

      {error && <ErrorBlock message={error} onRetry={load} />}

      <div className="flex flex-wrap items-center gap-3">
        <FilterPopover
          fields={[
            {
              key: 'sport',
              label: 'رشته',
              value: sportFilter,
              onChange: setSportFilter,
              options: [
                { value: '', label: 'همه' },
                ...sports.map((s) => ({ value: String(s.id), label: s.name })),
              ],
            },
          ]}
          activeCount={sportFilter ? 1 : 0}
          onClear={() => setSportFilter('')}
        />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-10 h-10" />}
          title="قیمتی ثبت نشده است"
          description={items.length ? 'با فیلتر فعلی نتیجه‌ای نیست.' : 'برای هر رشته یک تعرفه تعریف کنید.'}
          action={
            !items.length ? (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-fg text-sm">
                <Plus className="w-4 h-4" />
                ثبت اولین قیمت
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} loading={false} rowKey={(r) => r.id} />
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'ویرایش قیمت' : 'قیمت جدید'}>
        <div className="space-y-4">
          {editing ? (
            <FormField label="رشته" value={resolveSport(editing)} disabled />
          ) : (
            <FormField
              label="رشته"
              required
              as="select"
              value={form.sport}
              error={formErrors.sport}
              options={[
                { value: '', label: availableSportsForCreate.length ? 'انتخاب رشته' : 'همه رشته‌ها تعرفه دارند' },
                ...availableSportsForCreate.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
              onChange={(e) => setForm({ ...form, sport: e.target.value })}
              helpText={!availableSportsForCreate.length ? 'برای همه رشته‌های فعلی تعرفه ثبت شده است.' : undefined}
            />
          )}
          <FormField label="قیمت تک‌جلسه (تومان)" type="number" min={0} value={form.session_price} onChange={(e) => setForm({ ...form, session_price: e.target.value })} />
          <FormField label="قیمت ماهانه (تومان)" required type="number" min={0} value={form.monthly_price} error={formErrors.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} />
          <FormField label="قیمت سه‌ماهه (تومان)" type="number" min={0} value={form.quarterly_price} onChange={(e) => setForm({ ...form, quarterly_price: e.target.value })} />
          <FormField label="قیمت سالانه (تومان)" required type="number" min={0} value={form.yearly_price} error={formErrors.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={saving} onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg text-muted hover:bg-surface-hover">انصراف</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات تعرفه">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-3 text-sm">
            <DetailRow label="رشته" value={resolveSport(detail)} />
            <DetailRow label="تک‌جلسه" value={formatMoney(detail.session_price)} />
            <DetailRow label="ماهانه" value={formatMoney(detail.monthly_price)} />
            <DetailRow label="سه‌ماهه" value={formatMoney(detail.quarterly_price)} />
            <DetailRow label="سالانه" value={formatMoney(detail.yearly_price)} />
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="حذف قیمت"
        itemName={deleting ? resolveSport(deleting) : ''}
      />
    </div>
  );
};

export default PricesPage;
