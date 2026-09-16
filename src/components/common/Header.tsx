import React from 'react';
import { Menu, RefreshCw, Sun, Moon } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onQuickAction,
  quickActionLabel,
  actions,
}) => {
  const { toggleMobileMenu } = useUI();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden p-2.5 -mr-1 rounded-xl text-muted hover:text-ink hover:bg-surface-hover shrink-0 mt-0.5 touch-manipulation"
          aria-label="باز کردن منو"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-ink leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs md:text-sm text-muted mt-0.5 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-start sm:justify-end">
        <NotificationBell />
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-muted hover:text-ink hover:bg-surface-hover transition-colors touch-manipulation"
          aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
          title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {actions}
        {onQuickAction && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onQuickAction}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {quickActionLabel || 'بروزرسانی'}
          </Button>
        )}
      </div>
    </div>
  );
};
