import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'https://fitopiaapi.pythonanywhere.com/api';
const ACCESS_KEY = 'fitopia_access_token';
const REFRESH_KEY = 'fitopia_refresh_token';

export const tokenStorage = {
  getAccess(): string | null {
    const t = localStorage.getItem(ACCESS_KEY) || localStorage.getItem('fitopia_auth_token');
    if (!t || t === 'null' || t === 'undefined') return null;
    return t.trim().replace(/^["']|["']$/g, '');
  },
  getRefresh(): string | null {
    const t = localStorage.getItem(REFRESH_KEY);
    if (!t || t === 'null' || t === 'undefined') return null;
    return t.trim().replace(/^["']|["']$/g, '');
  },
  setTokens(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem('fitopia_auth_token', access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    [ACCESS_KEY, REFRESH_KEY, 'fitopia_auth_token', 'fitopia_gym_access', 'fitopia_current_gym', 'fitopia_user'].forEach((k) =>
      localStorage.removeItem(k)
    );
  },
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

let isRedirecting = false;
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuth =
      url.includes('/auth/login') ||
      url.includes('/accounts/login') ||
      url.includes('/accounts/logout');
    if (status === 401 && !isAuth && !isRedirecting) {
      isRedirecting = true;
      tokenStorage.clear();
      const hashPath = (window.location.hash || '').replace(/^#/, '') || '/';
      const path = hashPath.split('?')[0] || window.location.pathname;
      if (path !== '/login' && path !== '/welcome') {
        localStorage.setItem('fitopia_return_to', path);
        if (window.location.protocol === 'file:' || (window.location.hash || '').startsWith('#/')) {
          window.location.hash = '#/login';
        } else {
          window.location.assign('/login');
        }
      }
      setTimeout(() => {
        isRedirecting = false;
      }, 2000);
    }
    return Promise.reject(error);
  }
);

export default api;

export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.results)) return o.results as T[];
    if (Array.isArray(o.data)) return o.data as T[];
  }
  return [];
}

const FIELD_LABELS: Record<string, string> = {
  full_name: 'نام',
  phone: 'موبایل',
  join_date: 'تاریخ عضویت',
  sport: 'رشته',
  coach: 'مربی',
  sessions_total: 'تعداد جلسات',
  sessions_remaining: 'جلسات باقی‌مانده',
  sessions_used: 'جلسات مصرف‌شده',
  price_paid: 'مبلغ',
  membership_status: 'وضعیت عضویت',
  membership_type: 'نوع عضویت',
  source: 'منبع',
  notes: 'یادداشت',
  non_field_errors: 'خطا',
};

export function getErrorMessage(error: unknown, fallback = 'خطایی رخ داد.'): string {
  if (!error || typeof error !== 'object') return fallback;
  const err = error as AxiosError<Record<string, unknown>>;
  const data = err.response?.data;
  if (!data) {
    if (err.request && !err.response) return 'ارتباط با سرور برقرار نشد.';
    return err.message || fallback;
  }
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return String(data.non_field_errors[0]);
  }
  for (const k of Object.keys(data)) {
    const v = data[k];
    const label = FIELD_LABELS[k] || k;
    if (Array.isArray(v) && v[0]) return `${label}: ${v[0]}`;
    if (typeof v === 'string') return `${label}: ${v}`;
  }
  if (err.response?.status === 403) return 'شما دسترسی انجام این عملیات را ندارید.';
  if (err.response?.status === 404) return 'مورد درخواستی یافت نشد.';
  if (err.response?.status === 401) return 'نشست شما منقضی شده است. دوباره وارد شوید.';
  if (err.response?.status === 400) return 'اطلاعات ارسالی نامعتبر است.';
  return fallback;
}
