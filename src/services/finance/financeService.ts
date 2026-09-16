import api, { unwrapList, getErrorMessage } from '../apiClient';
import type {
  CustomerPayment,
  FinanceReport,
  FinanceTransaction,
  Refund,
} from '../../types/api';

export type TxInput = {
  type: 'income' | 'expense' | string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  payment_method?: string;
  reference_number?: string;
  customer?: number | null;
  employee?: number | null;
  course?: number | null;
  status?: string;
};

export type PaymentInput = {
  customer: number;
  total_price: number;
  amount_paid: number;
  discount?: number;
  description?: string;
  payment_method?: string;
  reference_number?: string;
  related_course?: number | null;
  related_transaction?: number | null;
};

export type RefundInput = {
  original_transaction: number;
  amount: number;
  reason?: string;
};

function normalizeReport(raw: unknown): FinanceReport {
  const empty = { income: 0, expense: 0, net: 0 };
  if (!raw || typeof raw !== 'object') {
    return { daily: empty, monthly: empty, income_by_category: [], outstanding_balances: [] };
  }
  const o = raw as Record<string, unknown>;
  const pick = (k: string) => {
    const v = o[k];
    if (!v || typeof v !== 'object') return empty;
    const x = v as Record<string, unknown>;
    return {
      income: Number(x.income) || 0,
      expense: Number(x.expense) || 0,
      net: Number(x.net) || 0,
    };
  };
  return {
    daily: pick('daily'),
    monthly: pick('monthly'),
    income_by_category: Array.isArray(o.income_by_category)
      ? (o.income_by_category as FinanceReport['income_by_category'])
      : [],
    outstanding_balances: Array.isArray(o.outstanding_balances)
      ? (o.outstanding_balances as FinanceReport['outstanding_balances'])
      : [],
  };
}

export const financeService = {
  async listTransactions(gymId: number): Promise<FinanceTransaction[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/finance/transactions/`);
      return unwrapList<FinanceTransaction>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت تراکنش‌ها'));
    }
  },

  async createTransaction(gymId: number, payload: TxInput): Promise<FinanceTransaction> {
    try {
      const body: Record<string, unknown> = {
        type: payload.type,
        category: payload.category,
        amount: Math.max(1, Math.floor(Number(payload.amount) || 0)),
        date: payload.date,
        description: payload.description || '',
        payment_method: payload.payment_method || 'cash',
        reference_number: payload.reference_number || '',
        status: payload.status || 'completed',
      };
      if (payload.customer != null && Number(payload.customer) > 0) body.customer = Number(payload.customer);
      if (payload.employee != null && Number(payload.employee) > 0) body.employee = Number(payload.employee);
      if (payload.course != null && Number(payload.course) > 0) body.course = Number(payload.course);
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/finance/transactions/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت تراکنش'));
    }
  },

  async listPayments(gymId: number): Promise<CustomerPayment[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/finance/payments/`);
      return unwrapList<CustomerPayment>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت پرداخت‌ها'));
    }
  },

  async createPayment(gymId: number, payload: PaymentInput): Promise<CustomerPayment> {
    try {
      const body: Record<string, unknown> = {
        customer: Number(payload.customer),
        total_price: Math.max(0, Math.floor(Number(payload.total_price) || 0)),
        amount_paid: Math.max(0, Math.floor(Number(payload.amount_paid) || 0)),
        discount: Math.max(0, Math.floor(Number(payload.discount) || 0)),
        description: payload.description || '',
        payment_method: payload.payment_method || 'cash',
        reference_number: payload.reference_number || '',
      };
      if (payload.related_course != null && Number(payload.related_course) > 0) {
        body.related_course = Number(payload.related_course);
      }
      if (payload.related_transaction != null && Number(payload.related_transaction) > 0) {
        body.related_transaction = Number(payload.related_transaction);
      }
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/finance/payments/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت پرداخت'));
    }
  },

  async createRefund(gymId: number, payload: RefundInput): Promise<Refund> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/finance/refunds/`, {
        original_transaction: Number(payload.original_transaction),
        amount: Math.max(1, Math.floor(Number(payload.amount) || 0)),
        reason: payload.reason || '',
      });
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت استرداد'));
    }
  },

  async report(gymId: number): Promise<FinanceReport> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/finance/reports/`);
      return normalizeReport(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت گزارش مالی'));
    }
  },

  /** Alias — بعضی نسخه‌های قدیمی getReport صدا می‌زدند */
  async getReport(gymId: number): Promise<FinanceReport> {
    return financeService.report(gymId);
  },
};

export default financeService;
