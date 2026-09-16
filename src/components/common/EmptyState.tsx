import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title = 'داده‌ای برای نمایش وجود ندارد', description, action, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary mb-4">
      {icon || <Inbox className="w-7 h-7" />}
    </div>
    <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
    {description && <p className="text-sm text-muted max-w-md mb-4">{description}</p>}
    {action}
  </div>
);

export const LoadingBlock: React.FC<{ label?: string }> = ({ label = 'در حال بارگذاری...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-muted">{label}</span>
  </div>
);

export const ErrorBlock: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="rounded-xl border border-danger/30 bg-danger-soft p-6 text-center">
    <p className="text-sm text-danger-text mb-3">{message || 'دریافت اطلاعات با خطا مواجه شد.'}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors duration-200"
      >
        تلاش مجدد
      </button>
    )}
  </div>
);

export const NoGymSelected: React.FC = () => (
  <EmptyState
    title="باشگاهی انتخاب نشده است"
    description="برای مشاهده این بخش، یک باشگاه از فهرست دسترسی‌ها انتخاب کنید."
  />
);
