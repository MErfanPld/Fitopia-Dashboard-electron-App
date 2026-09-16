import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Shield, Sun, Moon, RefreshCw } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { FormField } from '../../components/common/FormField';
import { ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import gymService from '../../services/gyms/gymService';
import { ROLE_LABELS, type StaffRole, type GymUpdatePayload } from '../../types/api';

const emptyForm = (): GymUpdatePayload => ({
  description: '', phone: '', whatsapp: '', telegram: '', instagram: '', website: '', rules: '', working_hours: '',
});

export const SettingsPage: React.FC = () => {
  const { user, currentGym, gymId } = useAuth();
  const { showToast } = useUI();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [form, setForm] = useState<GymUpdatePayload>(emptyForm());
  const [gymName, setGymName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const roleLabel =
    currentGym?.role && ROLE_LABELS[currentGym.role as StaffRole]
      ? ROLE_LABELS[currentGym.role as StaffRole]
      : currentGym?.role
        ? String(currentGym.role)
        : '—';

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const g = await gymService.getDetail(gymId);
      setGymName(g.name || currentGym?.gym_name || '');
      setForm({
        description: g.description || '',
        phone: g.phone || '',
        whatsapp: g.whatsapp || '',
        telegram: g.telegram || '',
        instagram: g.instagram || '',
        website: g.website || '',
        rules: g.rules || '',
        working_hours: g.working_hours || '',
      });
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'خطا در بارگذاری اطلاعات باشگاه');
    } finally {
      setLoading(false);
    }
  }, [gymId, currentGym?.gym_name]);

  useEffect(() => {
    if (gymId) void load();
  }, [gymId, load]);

  const saveGym = async () => {
    if (!gymId) return;
    setSaving(true);
    try {
      await gymService.update(gymId, form);
      showToast('اطلاعات باشگاه با موفقیت ذخیره شد', 'success');
      await load();
    } catch (e: unknown) {
      showToast(
        e instanceof Error
          ? e.message
          : 'خطا در ذخیره. لینک‌های اینستاگرام/تلگرام/وب‌سایت باید آدرس معتبر باشند (مثلاً https://...).',
        'danger',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!gymId) {
    return (
      <div className="space-y-4">
        <Header title="تنظیمات" subtitle="اطلاعات باشگاه و حساب کاربری" />
        <NoGymSelected />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="تنظیمات"
        subtitle="اطلاعات باشگاه، حساب کاربری و ظاهر پنل"
        actions={
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-secondary hover:bg-surface-hover">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        }
      />

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Shield className="w-4 h-4 text-primary" />
          حساب کاربری
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <p className="text-[11px] text-muted">نام کاربری</p>
            <p className="font-medium text-ink mt-0.5">{user?.full_name || user?.username || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <p className="text-[11px] text-muted">شماره تماس</p>
            <p className="font-medium text-ink mt-0.5 tabular-nums">{user?.phone || user?.phone_number || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <p className="text-[11px] text-muted">باشگاه فعال</p>
            <p className="font-medium text-ink mt-0.5">{gymName || currentGym?.gym_name || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <p className="text-[11px] text-muted">نقش شما</p>
            <p className="font-medium text-primary mt-0.5">{roleLabel}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-ink font-semibold">
          {resolvedTheme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
          ظاهر پنل
        </div>
        <div className="flex flex-wrap gap-2">
          {([{ value: 'light', label: 'روشن' }, { value: 'dark', label: 'تاریک' }, { value: 'system', label: 'سیستم' }] as const).map((opt) => (
            <button key={opt.value} type="button" onClick={() => setTheme(opt.value)} className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
              theme === opt.value ? 'bg-primary-soft border-primary text-primary font-semibold' : 'border-border text-muted hover:bg-surface-hover'
            }`}>{opt.label}</button>
          ))}
          <button type="button" onClick={toggleTheme} className="px-4 py-2 rounded-xl text-sm border border-border text-muted hover:bg-surface-hover">تعویض سریع</button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-ink font-semibold">
          <Building2 className="w-4 h-4 text-primary" />
          اطلاعات قابل ویرایش باشگاه
        </div>
        <p className="text-[11px] text-muted">
          نام و آدرس باشگاه از این صفحه قابل تغییر نیست؛ برای آن‌ها از «تیکت‌ها → درخواست ویرایش» استفاده کنید.
          لینک اینستاگرام، تلگرام و وب‌سایت باید با https:// شروع شوند.
        </p>

        {loadError && <ErrorBlock message={loadError} onRetry={load} />}
        {loading && !form.description && !form.phone ? (
          <LoadingBlock />
        ) : (
          <>
            <FormField label="توضیحات" isTextarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="تلفن" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <FormField label="واتساپ" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              <FormField label="تلگرام (لینک)" value={form.telegram || ''} placeholder="https://t.me/..." onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
              <FormField label="اینستاگرام (لینک)" value={form.instagram || ''} placeholder="https://instagram.com/..." onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              <FormField label="وب‌سایت" value={form.website || ''} placeholder="https://..." onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <FormField label="ساعات کاری" value={form.working_hours || ''} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} />
            </div>
            <FormField label="قوانین باشگاه" isTextarea value={form.rules || ''} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
            <div className="flex justify-end">
              <button type="button" disabled={saving || loading} onClick={saveGym} className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-fg font-bold disabled:opacity-50">
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default SettingsPage;
