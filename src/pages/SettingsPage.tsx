import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { FormField } from '../components/common/FormField';
import { Settings, Shield, Bell, Palette, Database, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { showToast } = useApp();

  const [generalSettings, setGeneralSettings] = useState({
    appName: 'فیتوپیا | شبکه مدیریت باشگاه‌ها',
    supportEmail: 'support@fitopia.ir',
    calendarType: 'shamsi',
    smsGateway: 'کاوه‌نگار (Kavenegar)',
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    sessionTimeout: '60',
    maxLoginAttempts: '5',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    smsAlerts: true,
    emailInvoices: true,
    urgentTicketSms: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('تنظیمات جدید سامانه با موفقیت ذخیره شد.', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header title="تنظیمات جامع سامانه" subtitle="پیکربندی امنیت، درگاه‌های ارتباطی، رنگ‌بندی و پارامترها" />

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. General Network Settings */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#262626]">
            <Settings className="w-5 h-5 text-[#FF7A1A]" />
            <h3 className="text-base font-bold text-white">تنظیمات عمومی سامانه</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="عنوان رسمی شبکه"
              value={generalSettings.appName}
              onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
            />
            <FormField
              label="ایمیل مرکزی پشتیبانی"
              type="email"
              value={generalSettings.supportEmail}
              onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="نوع تقویم و زمان‌بندی"
              isSelect
              value={generalSettings.calendarType}
              onChange={(e) => setGeneralSettings({ ...generalSettings, calendarType: e.target.value })}
              options={[
                { value: 'shamsi', label: 'تقویم هجری شمسی (ایران)' },
                { value: 'gregorian', label: 'تقویم میلادی' },
              ]}
            />
            <FormField
              label="وب‌سرویس پیامکی فعال"
              isSelect
              value={generalSettings.smsGateway}
              onChange={(e) => setGeneralSettings({ ...generalSettings, smsGateway: e.target.value })}
              options={[
                { value: 'kavenegar', label: 'کاوه‌نگار (Kavenegar API)' },
                { value: 'ippanel', label: 'آی‌پنل (IPPanel)' },
                { value: 'farazsms', label: 'فراز اس‌ام‌اس' },
              ]}
            />
          </div>
        </div>

        {/* 2. Security & Access Settings */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#262626]">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">امنیتی و احراز هویت</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-[#141414] rounded-xl border border-[#262626]">
              <div>
                <span className="text-xs font-bold text-white block">احراز هویت دو مرحله‌ای</span>
                <span className="text-[11px] text-slate-400">الزامی برای ورود تمامی مدیران ارشد</span>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.twoFactorAuth}
                onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                className="w-4 h-4 accent-[#FF7A1A] cursor-pointer"
              />
            </div>

            <FormField
              label="مدت زمان انقضای جلسه (دقیقه)"
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
            />
          </div>
        </div>

        {/* 3. Notification Triggers */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#262626]">
            <Bell className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">اعلان‌ها و هشدارهای خودکار</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3.5 bg-[#141414] rounded-xl border border-[#242424] text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.smsAlerts}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, smsAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#FF7A1A]"
              />
              <span>ارسال پیامک یادآوری تمدید اشتراک باشگاه به مدیران (۷ روز قبل از انقضا)</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-[#141414] rounded-xl border border-[#242424] text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailInvoices}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailInvoices: e.target.checked })}
                className="w-4 h-4 accent-[#FF7A1A]"
              />
              <span>ارسال ایمیل فاکتور رسمی بلافاصه پس از واریز آنلاین</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-[#141414] rounded-xl border border-[#242424] text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.urgentTicketSms}
                onChange={(e) =>
                  setNotificationSettings({ ...notificationSettings, urgentTicketSms: e.target.checked })
                }
                className="w-4 h-4 accent-[#FF7A1A]"
              />
              <span>هشدار سریع پیامکی به پشتیبانان هنگام ثبت تیکت‌های با اولویت فوری</span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-sm shadow-xl shadow-[#FF7A1A]/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تغییرات تنظیمات</span>
          </button>
        </div>
      </form>
    </div>
  );
};
