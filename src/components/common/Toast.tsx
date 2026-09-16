import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useUI();
  if (!toast) return null;

  const styles = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-success-text shrink-0" />,
      border: 'border-success/30',
      bg: 'bg-success-soft',
    },
    danger: {
      icon: <AlertCircle className="w-5 h-5 text-danger-text shrink-0" />,
      border: 'border-danger/30',
      bg: 'bg-danger-soft',
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5 text-warning-text shrink-0" />,
      border: 'border-warning/30',
      bg: 'bg-warning-soft',
    },
    info: {
      icon: <Info className="w-5 h-5 text-info-text shrink-0" />,
      border: 'border-info/30',
      bg: 'bg-info-soft',
    },
  }[toast.type];

  return (
    <div className="fixed bottom-6 left-6 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-start gap-3 max-w-sm bg-surface border ${styles.border} rounded-2xl p-4 ${styles.bg}`}
        style={{ boxShadow: 'var(--fitopia-shadow)' }}
      >
        {styles.icon}
        <p className="text-sm text-ink flex-1 leading-relaxed font-medium">{toast.message}</p>
        <button type="button" onClick={clearToast} className="p-1 text-muted hover:text-ink rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
