import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'orange' | 'neutral';

const styles: Record<BadgeVariant, string> = {
  success: 'bg-success-soft text-success-text border-success/20',
  warning: 'bg-warning-soft text-warning-text border-warning/20',
  danger: 'bg-danger-soft text-danger-text border-danger/20',
  info: 'bg-info-soft text-info-text border-info/20',
  orange: 'bg-primary-soft text-primary-hover border-primary/20',
  neutral: 'bg-surface-hover text-muted border-border',
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}> = ({ children, variant = 'neutral', className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles[variant]} ${className}`}
  >
    {children}
  </span>
);
