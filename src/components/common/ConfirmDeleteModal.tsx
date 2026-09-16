import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  loading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأیید حذف',
  itemName,
  loading,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-danger-soft flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-danger-text" />
        </div>
        <div>
          <p className="text-sm text-ink font-medium">آیا از حذف مطمئن هستید؟</p>
          {itemName && (
            <p className="text-xs text-muted mt-1">
              مورد: <span className="text-ink font-semibold">{itemName}</span>
            </p>
          )}
          <p className="text-xs text-muted mt-2">این عمل قابل بازگشت نیست.</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-border text-muted hover:bg-surface-hover hover:text-ink text-xs font-bold transition-colors duration-200"
        >
          انصراف
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className="px-4 py-2.5 rounded-xl bg-danger-soft text-danger-text border border-danger/20 text-xs font-bold hover:bg-danger/20 disabled:opacity-50 transition-colors duration-200"
        >
          {loading ? '...' : 'حذف'}
        </button>
      </div>
    </div>
  </Modal>
);
