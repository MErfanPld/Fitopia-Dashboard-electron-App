import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ToastType = 'success' | 'danger' | 'info' | 'warning';
interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}
interface UIContextType {
  toast: ToastMessage | null;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ id: Date.now(), message, type });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const clearToast = useCallback(() => setToast(null), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((v) => !v), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <UIContext.Provider
      value={{
        toast,
        showToast,
        clearToast,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
