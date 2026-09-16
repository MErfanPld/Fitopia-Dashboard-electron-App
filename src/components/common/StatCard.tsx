import React, { memo } from 'react';
import type { LucideIcon } from 'lucide-react';

type Accent = 'orange' | 'emerald' | 'blue' | 'purple' | 'primary' | 'success' | 'info' | 'warning' | 'danger';

const accentMap: Record<Accent, { iconBg: string; iconColor: string; ring: string }> = {
  orange: { iconBg: 'bg-primary-soft', iconColor: 'text-primary', ring: 'hover:border-primary/30' },
  primary: { iconBg: 'bg-primary-soft', iconColor: 'text-primary', ring: 'hover:border-primary/30' },
  emerald: { iconBg: 'bg-success-soft', iconColor: 'text-success-text', ring: 'hover:border-success/30' },
  success: { iconBg: 'bg-success-soft', iconColor: 'text-success-text', ring: 'hover:border-success/30' },
  blue: { iconBg: 'bg-info-soft', iconColor: 'text-info-text', ring: 'hover:border-info/30' },
  info: { iconBg: 'bg-info-soft', iconColor: 'text-info-text', ring: 'hover:border-info/30' },
  purple: { iconBg: 'bg-primary-soft', iconColor: 'text-primary', ring: 'hover:border-primary/30' },
  warning: { iconBg: 'bg-warning-soft', iconColor: 'text-warning-text', ring: 'hover:border-warning/30' },
  danger: { iconBg: 'bg-danger-soft', iconColor: 'text-danger-text', ring: 'hover:border-danger/30' },
};

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changePeriod?: string;
  icon: LucideIcon;
  accentColor?: Accent;
  accent?: Accent;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = memo(({
  title,
  value,
  change,
  changePeriod,
  icon: Icon,
  accentColor,
  accent,
  subtitle,
  onClick,
  className = '',
}) => {
  const key = accentColor || accent || 'primary';
  const a = accentMap[key] || accentMap.primary;
  const Wrapper: React.ElementType = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-surface border border-border rounded-2xl p-5 text-right w-full
        hover:bg-surface-hover hover:border-border-hover transition-all duration-200
        ${a.ring} ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30' : ''} ${className}`}
      style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted mb-1.5 truncate">{title}</p>
          <p className="text-2xl font-extrabold text-ink tracking-tight truncate tabular-nums">{value}</p>
          {subtitle && <p className="text-[11px] text-muted mt-1 truncate">{subtitle}</p>}
          {change != null && (
            <p className={`text-[11px] mt-1.5 font-semibold ${change >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}٪
              {changePeriod && <span className="text-muted font-normal mr-1">{changePeriod}</span>}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${a.iconBg}`}>
          <Icon className={`w-5 h-5 ${a.iconColor}`} aria-hidden />
        </div>
      </div>
    </Wrapper>
  );
});

StatCard.displayName = 'StatCard';
export default StatCard;
