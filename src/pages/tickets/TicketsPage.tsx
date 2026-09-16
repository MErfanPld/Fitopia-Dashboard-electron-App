import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Eye, MessageSquare, Ticket } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { FilterPopover } from '../../components/common/FilterPopover';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import ticketsService from '../../services/tickets/ticketsService';
import sportsService from '../../services/sports/sportsService';
import type { GymChangeRequest, TicketMessage, SportCategory } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  field_edit: 'ویرایش اطلاعات باشگاه',
  new_sport: 'پیشنهاد رشته ورزشی',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار بررسی',
  approved: 'تایید شده',
  rejected: 'رد شده',
};

const SENDER_LABELS: Record<string, string> = {
  gym: 'باشگاه',
  admin: 'پشتیبانی فیتوپیا',
  staff: 'پشتیبانی',
  system: 'سیستم',
};

function typeLabel(t?: string | null) {
  if (!t) return '—';
  return REQUEST_TYPE_LABELS[t] || t;
}

function statusLabel(s?: string | null) {
  if (!s) return '—';
  return STATUS_LABELS[String(s).toLowerCase()] || s;
}

function senderLabel(r?: string | null) {
  if (!r) return '—';
  return SENDER_LABELS[String(r).toLowerCase()] || r;
}

function statusClass(s?: string | null) {
  const v = String(s || '').toLowerCase();
  if (v === 'approved') return 'bg-success-soft text-success-text border-success/20';
  if (v === 'rejected') return 'bg-danger-soft text-danger-text border-danger/20';
  return 'bg-warning-soft text-warning-text border-warning/20';
}

function parsePayload(p: GymChangeRequest['payload']): Record<string, unknown> | null {
  if (!p) return null;
  if (typeof p === 'object') return p as Record<string, unknown>;
  if (typeof p === 'string') {
    try {
      const parsed = JSON.parse(p);
      return typeof parsed === 'object' && parsed ? parsed : { value: p };
    } catch {
      return { raw: p };
    }
  }
  return null;
}

function payloadSummary(t: GymChangeRequest): string {
  const obj = parsePayload(t.payload);
  if (!obj) return '—';
  if (t.request_type === 'new_sport') {
    const name = obj.name ?? obj.sport_name ?? obj.title;
    return name != null ? String(name) : '—';
  }
  const parts: string[] = [];
  if (obj.name) parts.push(`نام: ${obj.name}`);
  if (obj.address) parts.push(`آدرس: ${obj.address}`);
  if (obj.latitude != null || obj.longitude != null) {
    parts.push(`موقعیت: ${obj.latitude ?? '—'}, ${obj.longitude ?? '—'}`);
  }
  return parts.length ? parts.join(' | ') : '—';
}

type CreateMode = 'field_edit' | 'new_sport';

export const TicketsPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const { showToast } = useUI();

  const [items, setItems] = useState<GymChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);
  const clearFilters = () => { setStatusFilter('all'); setTypeFilter('all'); };

  const [detail, setDetail] = useState<GymChangeRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('field_edit');
  const [fieldName, setFieldName] = useState('');
  const [fieldAddress, setFieldAddress] = useState('');
  const [fieldLat, setFieldLat] = useState('');
  const [fieldLng, setFieldLng] = useState('');
  const [sportName, setSportName] = useState('');
  const [sportCategory, setSportCategory] = useState('');
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await ticketsService.list(gymId);
      setItems((list || []).filter((x) => x && x.id != null));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت تیکت‌ها');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym) load();
  }, [hasGym, load]);

  const filtered = useMemo(() => {
    let rows = items;
    if (statusFilter !== 'all') rows = rows.filter((r) => String(r.status).toLowerCase() === statusFilter);
    if (typeFilter !== 'all') rows = rows.filter((r) => r.request_type === typeFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          typeLabel(r.request_type).toLowerCase().includes(q) ||
          statusLabel(r.status).toLowerCase().includes(q) ||
          payloadSummary(r).toLowerCase().includes(q) ||
          String(r.admin_note || '').toLowerCase().includes(q),
      );
    }
    return rows;
  }, [items, search, statusFilter, typeFilter]);

  const openDetail = async (t: GymChangeRequest) => {
    setDetail(t);
    setReply('');
    if (!gymId) return;
    setDetailLoading(true);
    try {
      setDetail(await ticketsService.get(gymId, t.id));
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در دریافت جزئیات', 'danger');
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreate = async (mode: CreateMode = 'field_edit') => {
    setCreateMode(mode);
    setFieldName('');
    setFieldAddress('');
    setFieldLat('');
    setFieldLng('');
    setSportName('');
    setSportCategory('');
    setCreateOpen(true);
    if (mode === 'new_sport') {
      try {
        const cats = await sportsService.listCategories();
        setCategories(cats || []);
        if (cats[0]) setSportCategory(String(cats[0].id));
      } catch {
        setCategories([]);
      }
    }
  };

  const handleCreate = async () => {
    if (!gymId) return;
    setSaving(true);
    try {
      if (createMode === 'field_edit') {
        await ticketsService.createFieldEdit(gymId, {
          name: fieldName || undefined,
          address: fieldAddress || undefined,
          latitude: fieldLat !== '' ? Number(fieldLat) : null,
          longitude: fieldLng !== '' ? Number(fieldLng) : null,
        });
        showToast('درخواست ویرایش ثبت شد', 'success');
      } else {
        if (!sportName.trim() || !sportCategory) {
          showToast('نام رشته و دسته‌بندی الزامی است', 'warning');
          setSaving(false);
          return;
        }
        await ticketsService.suggestSport(gymId, {
          name: sportName.trim(),
          category_id: Number(sportCategory),
        });
        showToast('پیشنهاد رشته ارسال شد', 'success');
      }
      setCreateOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'عملیات با خطا مواجه شد', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!gymId || !detail || !reply.trim()) return;
    setSending(true);
    try {
      await ticketsService.reply(gymId, detail.id, reply);
      showToast('پیام ارسال شد', 'success');
      setReply('');
      setDetail(await ticketsService.get(gymId, detail.id));
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ارسال پیام', 'danger');
    } finally {
      setSending(false);
    }
  };

  const columns: Column<GymChangeRequest>[] = [
    {
      key: 'request_type',
      header: 'نوع',
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-soft border border-border flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-ink truncate">{typeLabel(r.request_type)}</p>
            <p className="text-[11px] text-muted truncate">{payloadSummary(r)}</p>
          </div>
        </div>
      ),
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
      key: 'created_at',
      header: 'تاریخ ثبت',
      render: (r) => (
        <span className="text-xs text-muted tabular-nums">
          {r.created_at ? formatJalaliDateTime(r.created_at) : '—'}
        </span>
      ),
    },
    {
      key: 'reviewed_at',
      header: 'بررسی',
      render: (r) => (
        <span className="text-xs text-muted tabular-nums">
          {r.reviewed_at ? formatJalaliDateTime(r.reviewed_at) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-24',
      render: (r) => (
        <button type="button" onClick={() => openDetail(r)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover" aria-label="جزئیات و پیام‌ها" title="جزئیات">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (!hasGym) return <NoGymSelected />;

  return (
    <div className="space-y-4">
      <Header
        title="تیکت‌ها"
        subtitle="درخواست‌های ویرایش و پیشنهادها به تیم فیتوپیا"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
            <button type="button" onClick={() => openCreate('new_sport')} className="px-3 py-2 text-sm rounded-xl border border-border text-muted hover:text-ink hover:bg-surface-hover">
              پیشنهاد رشته
            </button>
            <button type="button" onClick={() => openCreate('field_edit')} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
              <Plus className="w-4 h-4" />
              درخواست ویرایش
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 items-center">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو در نوع، وضعیت یا جزئیات..." className="flex-1 min-w-[180px] rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        <FilterPopover
          activeCount={activeFilterCount}
          onClear={clearFilters}
          fields={[
            {
              key: 'type',
              label: 'نوع درخواست',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'all', label: 'همه انواع' },
              { value: 'field_edit', label: 'ویرایش اطلاعات باشگاه' },
              { value: 'new_sport', label: 'پیشنهاد رشته ورزشی' },
              ],
            },
            {
              key: 'status',
              label: 'وضعیت',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'pending', label: 'در انتظار بررسی' },
              { value: 'approved', label: 'تایید شده' },
              { value: 'rejected', label: 'رد شده' },
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
          title="تیکتی وجود ندارد"
          description={items.length ? 'با فیلتر فعلی نتیجه‌ای نیست.' : 'هنوز درخواستی ثبت نکرده‌اید.'}
          action={
            !items.length ? (
              <button type="button" onClick={() => openCreate('field_edit')} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
                <Plus className="w-4 h-4" />
                ثبت اولین درخواست
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="جزئیات تیکت" size="lg">
        {detailLoading && <LoadingBlock />}
        {detail && !detailLoading && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <p className="text-[11px] text-muted">نوع</p>
                <p className="font-medium text-ink">{typeLabel(detail.request_type)}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <p className="text-[11px] text-muted">وضعیت</p>
                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border ${statusClass(detail.status)}`}>
                  {statusLabel(detail.status)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <p className="text-[11px] text-muted">تاریخ ثبت</p>
                <p className="text-ink tabular-nums">{detail.created_at ? formatJalaliDateTime(detail.created_at) : '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <p className="text-[11px] text-muted">تاریخ بررسی</p>
                <p className="text-ink tabular-nums">{detail.reviewed_at ? formatJalaliDateTime(detail.reviewed_at) : '—'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface-elevated">
              <p className="text-[11px] text-muted mb-1">جزئیات درخواست</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{payloadSummary(detail)}</p>
            </div>

            {detail.admin_note ? (
              <div className="p-3 rounded-xl border border-border bg-primary-soft/30">
                <p className="text-[11px] text-muted mb-1">یادداشت ادمین</p>
                <p className="text-sm text-ink">{detail.admin_note}</p>
              </div>
            ) : null}

            <div>
              <p className="text-sm font-semibold text-ink mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary" />
                تاریخچه پیام‌ها
              </p>
              {(detail.messages || []).length === 0 ? (
                <p className="text-xs text-muted py-4 text-center border border-dashed border-border rounded-xl">هنوز پیامی ثبت نشده است.</p>
              ) : (
                <ul className="space-y-2">
                  {(detail.messages || []).map((m: TicketMessage) => (
                    <li key={m.id} className={`p-3 rounded-xl border text-sm ${
                      String(m.sender_role).toLowerCase() === 'gym'
                        ? 'border-primary/30 bg-primary-soft/20'
                        : 'border-border bg-surface-elevated'
                    }`}>
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="text-[11px] font-medium text-primary">{senderLabel(m.sender_role)}</span>
                        <span className="text-[10px] text-muted tabular-nums">{m.created_at ? formatJalaliDateTime(m.created_at) : ''}</span>
                      </div>
                      <p className="text-ink whitespace-pre-wrap">{m.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {String(detail.status).toLowerCase() === 'pending' ? (
              <div className="space-y-2 border-t border-border pt-3">
                <FormField label="پاسخ شما" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="پیام خود را بنویسید..." />
                <div className="flex justify-end">
                  <button type="button" disabled={sending || !reply.trim()} onClick={handleReply} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">
                    {sending ? 'در حال ارسال...' : 'ارسال پیام'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted text-center">این تیکت بسته شده و فقط قابل مشاهده است.</p>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={createMode === 'field_edit' ? 'درخواست ویرایش اطلاعات باشگاه' : 'پیشنهاد رشته ورزشی'}>
        <div className="space-y-3">
          <div className="flex gap-2 mb-1">
            <button type="button" onClick={() => openCreate('field_edit')} className={`flex-1 px-3 py-2 text-xs rounded-xl border ${createMode === 'field_edit' ? 'bg-primary-soft border-primary text-primary font-semibold' : 'border-border text-muted'}`}>ویرایش اطلاعات</button>
            <button type="button" onClick={() => openCreate('new_sport')} className={`flex-1 px-3 py-2 text-xs rounded-xl border ${createMode === 'new_sport' ? 'bg-primary-soft border-primary text-primary font-semibold' : 'border-border text-muted'}`}>پیشنهاد رشته</button>
          </div>

          {createMode === 'field_edit' ? (
            <>
              <p className="text-[11px] text-muted">فقط فیلدهایی که نیاز به تغییر دارند را پر کنید. پس از تایید پشتیبانی اعمال می‌شود.</p>
              <FormField label="نام باشگاه" value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
              <FormField label="آدرس" value={fieldAddress} onChange={(e) => setFieldAddress(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="عرض جغرافیایی" type="number" value={fieldLat} onChange={(e) => setFieldLat(e.target.value)} />
                <FormField label="طول جغرافیایی" type="number" value={fieldLng} onChange={(e) => setFieldLng(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <FormField label="نام رشته" required value={sportName} onChange={(e) => setSportName(e.target.value)} />
              <FormField label="دسته‌بندی" required isSelect value={sportCategory} options={[{ value: '', label: categories.length ? 'انتخاب دسته' : 'در حال بارگذاری...' }, ...categories.map((c) => ({ value: String(c.id), label: c.title || c.name }))]} onChange={(e) => setSportCategory(e.target.value)} />
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={handleCreate} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'ثبت درخواست'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TicketsPage;
