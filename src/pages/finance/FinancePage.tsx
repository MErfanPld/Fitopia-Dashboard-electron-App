import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Plus, RefreshCw } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import financeService from '../../services/finance/financeService';
import membersService from '../../services/members/membersService';
import type { CustomerPayment, FinanceReport, FinanceTransaction, GymMember } from '../../types/api';
import { formatJalaliDate, formatJalaliDateTime } from '../../utils/jalaliUtils';

type Section = 'report' | 'transactions' | 'payments' | 'refunds';

const TYPE_LABELS: Record<string, string> = { income: 'درآمد', expense: 'هزینه' };
const CATEGORY_LABELS: Record<string, string> = {
  membership: 'عضویت', course: 'دوره', single_session: 'جلسه تکی', other_income: 'سایر درآمد',
  rent: 'اجاره', utilities: 'قبوض', equipment: 'تجهیزات', salary: 'حقوق',
  coach_payment: 'پرداخت مربی', maintenance: 'نگهداری', marketing: 'بازاریابی', other_expense: 'سایر هزینه',
};
const METHOD_LABELS: Record<string, string> = {
  cash: 'نقد', card: 'کارت', transfer: 'کارت به کارت', online: 'آنلاین', other: 'سایر',
};
const STATUS_LABELS: Record<string, string> = {
  completed: 'تکمیل', pending: 'در انتظار', cancelled: 'لغو', refunded: 'مسترد',
};
const INCOME_CATS = ['membership', 'course', 'single_session', 'other_income'];
const EXPENSE_CATS = ['rent', 'utilities', 'equipment', 'salary', 'coach_payment', 'maintenance', 'marketing', 'other_expense'];

function money(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}
function todayIso() { return new Date().toISOString().slice(0, 10); }
function sectionFromPath(path: string): Section {
  if (path.includes('/transactions')) return 'transactions';
  if (path.includes('/payments')) return 'payments';
  if (path.includes('/refunds')) return 'refunds';
  return 'report';
}
const TABS: { key: Section; path: string; label: string }[] = [
  { key: 'report', path: '/finance/reports', label: 'گزارش' },
  { key: 'transactions', path: '/finance/transactions', label: 'تراکنش‌ها' },
  { key: 'payments', path: '/finance/payments', label: 'پرداخت‌ها' },
  { key: 'refunds', path: '/finance/refunds', label: 'استرداد' },
];

export const FinancePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const section = sectionFromPath(location.pathname);
  const { gymId, hasGym, can } = useGymScoped('finance.view');
  const { showToast } = useUI();

  const [txs, setTxs] = useState<FinanceTransaction[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [txOpen, setTxOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('membership');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(todayIso());
  const [txDesc, setTxDesc] = useState('');
  const [txMethod, setTxMethod] = useState('cash');
  const [txRef, setTxRef] = useState('');
  const [txCustomer, setTxCustomer] = useState('');
  const [payCustomer, setPayCustomer] = useState('');
  const [payTotal, setPayTotal] = useState('');
  const [payPaid, setPayPaid] = useState('');
  const [payDiscount, setPayDiscount] = useState('0');
  const [payDesc, setPayDesc] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payRef, setPayRef] = useState('');
  const [refundTx, setRefundTx] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const memberName = useMemo(() => {
    const m = new Map<number, string>();
    members.forEach((x) => m.set(x.id, x.full_name));
    return m;
  }, [members]);

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true); setError(null);
    try {
      const [txList, payList, rep, memList] = await Promise.all([
        financeService.listTransactions(gymId),
        financeService.listPayments(gymId),
        financeService.getReport(gymId).catch(() => null),
        membersService.list(gymId).catch(() => []),
      ]);
      setTxs((txList || []).filter((x) => x && x.id != null));
      setPayments((payList || []).filter((x) => x && x.id != null));
      setReport(rep);
      setMembers((memList || []).filter((x) => x && x.id != null));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت اطلاعات مالی');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => { if (hasGym) load(); }, [hasGym, load]);

  const incomeTxOptions = useMemo(() => txs
    .filter((t) => t.type === 'income' && t.status !== 'refunded' && t.status !== 'cancelled')
    .map((t) => {
      const cat = CATEGORY_LABELS[t.category || ''] || t.category || '—';
      const amt = money(t.amount);
      const who = t.customer != null ? (memberName.get(t.customer) || `عضو #${t.customer}`) : '';
      const desc = (t.description || '').trim();
      return {
        value: String(t.id),
        label: `#${t.id} · ${cat} · ${amt}`,
        subtitle: [who, desc].filter(Boolean).join(' — ') || undefined,
        meta: t.date || t.created_at || undefined,
      };
    }), [txs, memberName]);

  const filteredTxs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return txs;
    return txs.filter((t) => [TYPE_LABELS[t.type || ''], CATEGORY_LABELS[t.category || ''], t.description, METHOD_LABELS[t.payment_method || ''], STATUS_LABELS[t.status || ''], t.customer != null ? memberName.get(t.customer) : ''].join(' ').toLowerCase().includes(q));
  }, [txs, search, memberName]);

  const filteredPays = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => [memberName.get(p.customer), p.description, METHOD_LABELS[p.payment_method || '']].join(' ').toLowerCase().includes(q));
  }, [payments, search, memberName]);

  const openTx = () => {
    setTxType('income'); setTxCategory('membership'); setTxAmount(''); setTxDate(todayIso());
    setTxDesc(''); setTxMethod('cash'); setTxRef(''); setTxCustomer(''); setTxOpen(true);
  };
  const openPay = () => {
    setPayCustomer(''); setPayTotal(''); setPayPaid(''); setPayDiscount('0');
    setPayDesc(''); setPayMethod('cash'); setPayRef(''); setPayOpen(true);
  };
  const openRefund = () => {
    setRefundTx(''); setRefundAmount(''); setRefundReason(''); setRefundOpen(true);
  };

  const submitTx = async () => {
    if (!gymId) return;
    if (!txAmount || Number(txAmount) <= 0) { showToast('مبلغ معتبر وارد کنید', 'warning'); return; }
    setSaving(true);
    try {
      await financeService.createTransaction(gymId, {
        type: txType,
        category: txCategory,
        amount: Number(txAmount),
        date: txDate,
        description: txDesc || undefined,
        payment_method: txMethod,
        reference_number: txRef || undefined,
        customer: txCustomer ? Number(txCustomer) : undefined,
      });
      showToast('تراکنش ثبت شد', 'success'); setTxOpen(false); load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ثبت تراکنش', 'error');
    } finally { setSaving(false); }
  };

  const submitPay = async () => {
    if (!gymId) return;
    if (!payCustomer) { showToast('عضو را انتخاب کنید', 'warning'); return; }
    if (!payTotal || Number(payTotal) <= 0) { showToast('مبلغ کل معتبر وارد کنید', 'warning'); return; }
    setSaving(true);
    try {
      await financeService.createPayment(gymId, {
        customer: Number(payCustomer),
        total_amount: Number(payTotal),
        paid_amount: Number(payPaid || 0),
        discount: Number(payDiscount || 0),
        description: payDesc || undefined,
        payment_method: payMethod,
        reference_number: payRef || undefined,
      });
      showToast('پرداخت ثبت شد', 'success'); setPayOpen(false); load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ثبت پرداخت', 'error');
    } finally { setSaving(false); }
  };

  const submitRefund = async () => {
    if (!gymId) return;
    if (!refundTx) { showToast('تراکنش را انتخاب کنید', 'warning'); return; }
    if (!refundAmount || Number(refundAmount) <= 0) { showToast('مبلغ استرداد معتبر وارد کنید', 'warning'); return; }
    setSaving(true);
    try {
      await financeService.createRefund(gymId, { original_transaction: Number(refundTx), amount: Number(refundAmount), reason: refundReason });
      showToast('استرداد ثبت شد', 'success'); setRefundOpen(false); load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ثبت استرداد', 'error');
    } finally { setSaving(false); }
  };

  const memberOptions = useMemo(() => members.map((m) => ({
    value: String(m.id),
    label: m.full_name || `عضو #${m.id}`,
    subtitle: m.phone || undefined,
  })), [members]);

  const txColumns: Column<FinanceTransaction>[] = [
    { key: 'type', header: 'نوع', render: (r) => <span className="text-sm">{TYPE_LABELS[r.type || ''] || r.type}</span> },
    { key: 'category', header: 'دسته', render: (r) => <span className="text-sm">{CATEGORY_LABELS[r.category || ''] || r.category}</span> },
    { key: 'amount', header: 'مبلغ', render: (r) => <span className="text-sm tabular-nums font-medium">{money(r.amount)}</span> },
    { key: 'customer', header: 'عضو', render: (r) => <span className="text-sm text-secondary">{r.customer != null ? (memberName.get(r.customer) || `#${r.customer}`) : '—'}</span> },
    { key: 'payment_method', header: 'روش', render: (r) => <span className="text-xs text-muted">{METHOD_LABELS[r.payment_method || ''] || r.payment_method || '—'}</span> },
    { key: 'status', header: 'وضعیت', render: (r) => <span className="text-xs">{STATUS_LABELS[r.status || ''] || r.status || '—'}</span> },
    { key: 'date', header: 'تاریخ', render: (r) => <span className="text-xs text-muted tabular-nums">{r.date ? formatJalaliDate(r.date) : (r.created_at ? formatJalaliDateTime(r.created_at) : '—')}</span> },
  ];

  const payColumns: Column<CustomerPayment>[] = [
    { key: 'customer', header: 'عضو', render: (r) => <span className="text-sm">{memberName.get(r.customer) || `#${r.customer}`}</span> },
    { key: 'total_amount', header: 'مبلغ کل', render: (r) => <span className="text-sm tabular-nums">{money(r.total_amount)}</span> },
    { key: 'paid_amount', header: 'پرداخت‌شده', render: (r) => <span className="text-sm tabular-nums">{money(r.paid_amount)}</span> },
    { key: 'discount', header: 'تخفیف', render: (r) => <span className="text-sm tabular-nums text-muted">{money(r.discount)}</span> },
    { key: 'payment_method', header: 'روش', render: (r) => <span className="text-xs text-muted">{METHOD_LABELS[r.payment_method || ''] || '—'}</span> },
    { key: 'created_at', header: 'زمان', render: (r) => <span className="text-xs text-muted tabular-nums">{r.created_at ? formatJalaliDateTime(r.created_at) : '—'}</span> },
  ];

  if (!hasGym) {
    return (
      <div className="space-y-6">
        <Header title="مالی" />
        <NoGymSelected />
      </div>
    );
  }

  const titles: Record<Section, string> = { report: 'گزارش مالی', transactions: 'تراکنش‌ها', payments: 'پرداخت‌ها', refunds: 'استرداد' };

  return (
    <div className="space-y-4">
      <Header
        title={titles[section]}
        subtitle="مدیریت درآمد، هزینه، پرداخت و استرداد"
        onQuickAction={load}
        quickActionLabel="بروزرسانی"
        actions={
          can('finance.create') ? (
            <div className="flex flex-wrap gap-2">
              {section === 'transactions' && (
                <button type="button" onClick={openTx} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> تراکنش جدید</button>
              )}
              {section === 'payments' && (
                <button type="button" onClick={openPay} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> پرداخت جدید</button>
              )}
              {section === 'refunds' && (
                <button type="button" onClick={openRefund} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold"><Plus className="w-4 h-4" /> استرداد جدید</button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => navigate(t.path)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              section === t.key ? 'bg-primary text-primary-fg font-bold' : 'text-secondary hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !txs.length && !payments.length && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {section === 'report' && report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="کل درآمد" value={money(report.total_income)} icon={<TrendingUp className="w-5 h-5" />} />
          <StatCard title="کل هزینه" value={money(report.total_expense)} icon={<TrendingDown className="w-5 h-5" />} />
          <StatCard title="مانده" value={money((report.total_income || 0) - (report.total_expense || 0))} icon={<Wallet className="w-5 h-5" />} />
          <StatCard title="تعداد تراکنش" value={String(report.transaction_count ?? txs.length)} icon={<RefreshCw className="w-5 h-5" />} />
        </div>
      )}

      {(section === 'transactions' || section === 'report') && (
        <>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در تراکنش‌ها..."
            className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {!loading && !error && filteredTxs.length === 0 && (
            <EmptyState title="تراکنشی ثبت نشده" action={can('finance.create') ? <button type="button" onClick={openTx} className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">تراکنش جدید</button> : undefined} />
          )}
          {filteredTxs.length > 0 && (
            <DataTable columns={txColumns} data={filteredTxs} rowKey={(r) => r.id} loading={loading} />
          )}
        </>
      )}

      {section === 'payments' && (
        <>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در پرداخت‌ها..."
            className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {!loading && !error && filteredPays.length === 0 && (
            <EmptyState title="پرداختی ثبت نشده" action={can('finance.create') ? <button type="button" onClick={openPay} className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">پرداخت جدید</button> : undefined} />
          )}
          {filteredPays.length > 0 && (
            <DataTable columns={payColumns} data={filteredPays} rowKey={(r) => r.id} loading={loading} />
          )}
        </>
      )}

      {section === 'refunds' && (
        <div className="space-y-3">
          <p className="text-sm text-muted">استرداد روی تراکنش‌های درآمدی ثبت می‌شود. لیست جداگانه‌ای در API نیست.</p>
          {can('finance.create') && (
            <button type="button" onClick={openRefund} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold">
              <Plus className="w-4 h-4" /> استرداد جدید
            </button>
          )}
        </div>
      )}

      <Modal isOpen={txOpen} onClose={() => setTxOpen(false)} title="ثبت تراکنش">
        <div className="space-y-3">
          <FormField label="نوع" isSelect value={txType} options={[{ value: 'income', label: 'درآمد' }, { value: 'expense', label: 'هزینه' }]} onChange={(e) => { setTxType(e.target.value as 'income' | 'expense'); setTxCategory(e.target.value === 'income' ? 'membership' : 'rent'); }} />
          <FormField label="دسته" isSelect value={txCategory} options={(txType === 'income' ? INCOME_CATS : EXPENSE_CATS).map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c }))} onChange={(e) => setTxCategory(e.target.value)} />
          <FormField label="مبلغ (تومان)" required type="number" min={0} value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
          <JalaliDatePicker label="تاریخ" value={txDate} onChange={setTxDate} />
          <FormField label="روش پرداخت" isSelect value={txMethod} options={Object.entries(METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))} onChange={(e) => setTxMethod(e.target.value)} />
          <SearchableSelect label="عضو (اختیاری)" value={txCustomer} onChange={setTxCustomer} options={memberOptions} placeholder="انتخاب عضو..." searchPlaceholder="نام یا موبایل..." emptyText="عضوی یافت نشد" clearable />
          <FormField label="شماره پیگیری" value={txRef} onChange={(e) => setTxRef(e.target.value)} />
          <FormField label="توضیحات" isTextarea value={txDesc} onChange={(e) => setTxDesc(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setTxOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={submitTx} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'ثبت'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={payOpen} onClose={() => setPayOpen(false)} title="ثبت پرداخت">
        <div className="space-y-3">
          <SearchableSelect label="عضو" required value={payCustomer} onChange={setPayCustomer} options={memberOptions} placeholder="انتخاب عضو..." searchPlaceholder="نام یا موبایل..." emptyText="عضوی یافت نشد" />
          <FormField label="مبلغ کل (تومان)" required type="number" min={0} value={payTotal} onChange={(e) => setPayTotal(e.target.value)} />
          <FormField label="مبلغ پرداخت‌شده" required type="number" min={0} value={payPaid} onChange={(e) => setPayPaid(e.target.value)} />
          <FormField label="تخفیف" type="number" min={0} value={payDiscount} onChange={(e) => setPayDiscount(e.target.value)} />
          <FormField label="روش پرداخت" isSelect value={payMethod} options={Object.entries(METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))} onChange={(e) => setPayMethod(e.target.value)} />
          <FormField label="شماره پیگیری" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
          <FormField label="توضیحات" isTextarea value={payDesc} onChange={(e) => setPayDesc(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPayOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={submitPay} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'ثبت'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={refundOpen} onClose={() => setRefundOpen(false)} title="ثبت استرداد">
        <div className="space-y-3">
          <SearchableSelect
            label="تراکنش درآمدی"
            required
            value={refundTx}
            onChange={setRefundTx}
            options={incomeTxOptions}
            placeholder={incomeTxOptions.length ? 'جستجو و انتخاب تراکنش...' : 'تراکنش درآمدی موجود نیست'}
            searchPlaceholder="شناسه، دسته، مبلغ، عضو یا توضیحات..."
            emptyText="تراکنشی با این جستجو یافت نشد"
          />
          <FormField label="مبلغ استرداد (تومان)" required type="number" min={1} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          <FormField label="دلیل" isTextarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRefundOpen(false)} className="px-4 py-2 text-sm text-muted">انصراف</button>
            <button type="button" disabled={saving} onClick={submitRefund} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg font-bold disabled:opacity-50">{saving ? '...' : 'تایید استرداد'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FinancePage;
