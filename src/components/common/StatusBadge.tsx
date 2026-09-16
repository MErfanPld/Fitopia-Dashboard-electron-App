import React from 'react';
import { Badge } from '../ui/Badge';

const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'orange' | 'neutral'; label: string }> = {
  active: { variant: 'success', label: 'فعال' },
  inactive: { variant: 'neutral', label: 'غیرفعال' },
  pending: { variant: 'warning', label: 'در انتظار' },
  completed: { variant: 'success', label: 'تکمیل‌شده' },
  cancelled: { variant: 'danger', label: 'لغوشده' },
  refunded: { variant: 'info', label: 'مسترد' },
  open: { variant: 'info', label: 'باز' },
  closed: { variant: 'neutral', label: 'بسته' },
  expired: { variant: 'danger', label: 'منقضی' },
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const key = (status || '').toLowerCase();
  const mapped = statusMap[key] || { variant: 'neutral' as const, label: status || '—' };
  return <Badge variant={mapped.variant}>{mapped.label}</Badge>;
};
