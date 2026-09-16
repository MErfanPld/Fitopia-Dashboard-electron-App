import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hoverable?: boolean;
}> = ({ children, className = '', padding = true, hoverable = false }) => (
  <div
    className={`bg-surface border border-border rounded-2xl transition-colors duration-200 ${
      hoverable ? 'hover:bg-surface-hover hover:border-border-hover' : ''
    } ${padding ? 'p-5' : ''} ${className}`}
    style={{ boxShadow: 'var(--fitopia-shadow)' }}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);
