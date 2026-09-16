import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import auditService from '../../services/audit/auditService';
import type { AuditLog } from '../../types/api';
import { formatJalaliDateTime } from '../../utils/jalaliUtils';

const ACTION_LABELS: Record<string, string> = {
  'customer.create': 'ایجاد عضو',
  'customer.update': 'ویرایش عضو',
  'customer.delete': 'حذف عضو',
  'course.create': 'ایجاد دوره',
  'course.update': 'ویرایش دوره',
  'course.delete': 'حذف دوره',
  'course.enroll': 'ثبت‌نام در دوره',
  'offering.create': 'ایجاد خدمت',
  'offering.update': 'ویرایش خدمت',
  'offering.delete': 'حذف خدمت',
  'employee.create': 'افزودن کارمند',
  'employee.update': 'ویرایش کارمند',
  'employee.delete': 'حذف کارمند',
  'coach.create': 'افزودن مربی',
  'coach.update': 'ویرایش مربی',
  'coach.delete': 'حذف مربی',
  'price.create': 'ثبت قیمت',
  'price.update': 'ویرایش قیمت',
  'price.delete': 'حذف قیمت',
  'attendance.create': 'ثبت حضور',
  'attendance.update': 'ویرایش حضور',
  'attendance.check_in': 'ثبت ورود',
  'attendance.check_out': 'ثبت خروج',
  'finance.create': 'ثبت مالی',
  'finance.update': 'ویرایش مالی',
  'finance.refund': 'استرداد',
  'transaction.create': 'ثبت تراکنش',
  'transaction.update': 'ویرایش تراکنش',
  'transaction.delete': 'حذف تراکنش',
  'payment.create': 'ثبت پرداخت',
  'payment.update': 'ویرایش پرداخت',
  'refund.create': 'ثبت استرداد',
  'single_session.create': 'ثبت جلسه تکی',
  'single_session.update': 'ویرایش جلسه تکی',
  'single_session.delete': 'حذف جلسه تکی',
  'single_session.purchase': 'خرید جلسه تکی',
  'singlesession.create': 'ثبت جلسه تکی',
  'singlesession.update': 'ویرایش جلسه تکی',
  'singlesession.delete': 'حذف جلسه تکی',
  'singlesession.purchase': 'خرید جلسه تکی',
  'session.create': 'ثبت جلسه',
  'session.update': 'ویرایش جلسه',
  'session.delete': 'حذف جلسه',
  'ticket.create': 'ثبت تیکت',
  'ticket.update': 'ویرایش تیکت',
  'ticket.reply': 'پاسخ تیکت',
  'gym.update': 'ویرایش باشگاه',
  'settings.update': 'ویرایش تنظیمات',
  // plain / spaced variants that sometimes come from backend
  'single session': 'جلسه تکی',
  'single_session': 'جلسه تکی',
  singlesession: 'جلسه تکی',
  'create single session': 'ثبت جلسه تکی',
  'create_single_session': 'ثبت جلسه تکی',
  login: 'ورود',
  logout: 'خروج',
};

const ENTITY_LABELS: Record<string, string> = {
  customer: 'عضو',
  member: 'عضو',
  course: 'دوره',
  offering: 'خدمت',
  employee: 'کارمند',
  coach: 'مربی',
  price: 'قیمت',
  attendance: 'حضور',
  finance: 'مالی',
  transaction: 'تراکنش',
  payment: 'پرداخت',
  refund: 'استرداد',
  single_session: 'جلسه تکی',
  singlesession: 'جلسه تکی',
  session: 'جلسه',
  ticket: 'تیکت',
  gym: 'باشگاه',
  user: 'کاربر',
  settings: 'تنظیمات',
};

const OBJECT_TYPE_LABELS: Record<string, string> = {
  Course: 'دوره',
  CourseEnrollment: 'ثبت‌نام دوره',
  GymOffering: 'خدمت / رشته',
  Offering: 'خدمت / رشته',
  GymStaffAccess: 'دسترسی کارمند',
  StaffAccess: 'دسترسی کارمند',
  GymCustomer: 'عضو',
  GymMember: 'عضو',
  Customer: 'عضو',
  Member: 'عضو',
  GymCoach: 'مربی',
  Coach: 'مربی',
  GymPrice: 'قیمت',
  Price: 'قیمت',
  GymVisit: 'حضور',
  Visit: 'حضور',
  Attendance: 'حضور',
  FinanceTransaction: 'تراکنش مالی',
  Transaction: 'تراکنش مالی',
  CustomerPayment: 'پرداخت',
  Payment: 'پرداخت',
  Refund: 'استرداد',
  SingleSession: 'جلسه تکی',
  SingleSessionPurchase: 'جلسه تکی',
  Session: 'جلسه',
  GymChangeRequest: 'تیکت',
  Ticket: 'تیکت',
  Gym: 'باشگاه',
  User: 'کاربر',
};

function actionLabel(action?: string | null) {
  if (!action) return '—';
  const raw = String(action).trim();
  // normalize: spaces/dashes → underscore, lower
  const normalized = raw.replace(/-/g, '_').replace(/\s+/g, '_').toLowerCase();
  if (ACTION_LABELS[raw]) return ACTION_LABELS[raw];
  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized];
  // also try original lowercased with spaces kept as key
  const spacedKey = raw.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  if (ACTION_LABELS[spacedKey]) return ACTION_LABELS[spacedKey];

  // e.g. single_session.create or single.session.create
  const verbs: Record<string, string> = {
    create: 'ایجاد',
    update: 'ویرایش',
    delete: 'حذف',
    enroll: 'ثبت‌نام',
    view: 'مشاهده',
    check_in: 'ثبت ورود',
    check_out: 'ثبت خروج',
    reply: 'پاسخ',
    refund: 'استرداد',
    purchase: 'خرید',
  };

  if (normalized.includes('.')) {
    const parts = normalized.split('.');
    const verb = parts[parts.length - 1];
    const entity = parts.slice(0, -1).join('_');
    const entityFa = ENTITY_LABELS[entity] || ENTITY_LABELS[parts[0]] || entity.replace(/_/g, ' ');
    const verbFa = verbs[verb] || verb;
    // Prefer natural order: verb + entity for create/update/delete
    if (verbs[verb]) return `${verbFa} ${entityFa}`;
    return `${entityFa} ${verbFa}`;
  }

  // e.g. single_session_create
  for (const [v, vFa] of Object.entries(verbs)) {
    if (normalized.endsWith('_' + v) || normalized.endsWith(v)) {
      const entity = normalized.replace(new RegExp('_?' + v + '$'), '');
      const entityFa = ENTITY_LABELS[entity] || entity.replace(/_/g, ' ');
      return `${vFa} ${entityFa}`;
    }
  }

  // plain entity tokens
  if (ENTITY_LABELS[normalized]) return ENTITY_LABELS[normalized];

  // last resort: replace known English phrases inside the string
  let pretty = raw;
  const phraseMap: [RegExp, string][] = [
    [/single[\s_-]*session/gi, 'جلسه تکی'],
    [/\bcreate\b/gi, 'ایجاد'],
    [/\bupdate\b/gi, 'ویرایش'],
    [/\bdelete\b/gi, 'حذف'],
    [/\bpurchase\b/gi, 'خرید'],
    [/\brefund\b/gi, 'استرداد'],
    [/\battendance\b/gi, 'حضور'],
    [/\btransaction\b/gi, 'تراکنش'],
    [/\bpayment\b/gi, 'پرداخت'],
    [/\bcustomer\b/gi, 'عضو'],
    [/\bmember\b/gi, 'عضو'],
    [/\bcoach\b/gi, 'مربی'],
    [/\bemployee\b/gi, 'کارمند'],
  ];
  for (const [re, fa] of phraseMap) {
    pretty = pretty.replace(re, fa);
  }
  if (pretty !== raw) return pretty.trim();

  return raw;
}

function objectTypeLabel(t?: string | null) {
  if (!t) return '—';
  if (OBJECT_TYPE_LABELS[t]) return OBJECT_TYPE_LABELS[t];
  // try PascalCase from snake_case: single_session -> SingleSession
  const pascal = String(t)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  if (OBJECT_TYPE_LABELS[pascal]) return OBJECT_TYPE_LABELS[pascal];
  const lower = String(t).toLowerCase().replace(/-/g, '_');
  if (ENTITY_LABELS[lower]) return ENTITY_LABELS[lower];
  return t;
}

function objectLabel(r: AuditLog) {
  if (r.object_repr) return r.object_repr;
  return objectTypeLabel(r.object_type);
}

export const AuditLogsPage: React.FC = () => {
  const { gymId, hasGym } = useGymScoped();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await auditService.list(gymId);
      setItems((list || []).filter((x) => x && x.id != null));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت گزارش فعالیت');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (hasGym) load();
  }, [hasGym, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const a = actionLabel(r.action).toLowerCase();
      const o = objectTypeLabel(r.object_type).toLowerCase();
      const u = (r.user_name || 'سیستم').toLowerCase();
      const repr = String(r.object_repr || '').toLowerCase();
      return a.includes(q) || o.includes(q) || u.includes(q) || repr.includes(q) || String(r.action || '').toLowerCase().includes(q);
    });
  }, [items, search]);

  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'عملیات', render: (r) => <span className="text-ink text-sm font-medium">{actionLabel(r.action)}</span> },
    { key: 'user_name', header: 'کاربر', render: (r) => <span className="text-secondary text-sm">{r.user_name || 'سیستم'}</span> },
    { key: 'object_type', header: 'نوع', render: (r) => <span className="text-secondary text-sm">{objectTypeLabel(r.object_type)}</span> },
    { key: 'object_id', header: 'مورد', render: (r) => <span className="text-muted text-xs">{objectLabel(r)}</span> },
    {
      key: 'created_at',
      header: 'زمان',
      render: (r) => (
        <span className="text-muted text-xs tabular-nums">{r.created_at ? formatJalaliDateTime(r.created_at) : '—'}</span>
      ),
    },
  ];

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="گزارش فعالیت" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header title="گزارش فعالیت" subtitle="سابقه عملیات انجام‌شده در باشگاه" onQuickAction={load} quickActionLabel="بروزرسانی" />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجو در عملیات، کاربر یا نوع..."
        className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
      {loading && !items.length && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="رکوردی یافت نشد" description={items.length ? 'با جستجوی فعلی نتیجه‌ای نیست.' : 'هنوز فعالیتی ثبت نشده است.'} />
      )}
      {!error && filtered.length > 0 && (
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading} />
      )}
    </div>
  );
};

export default AuditLogsPage;
