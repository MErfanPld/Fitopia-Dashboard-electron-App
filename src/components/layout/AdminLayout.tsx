import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Toast } from '../common/Toast';

/** Auth is enforced by ProtectedRoute — do not re-check here. */
export const AdminLayout: React.FC = () => (
  <div
    className="min-h-dvh bg-background text-ink flex font-sans transition-colors duration-200 overflow-x-hidden"
    dir="rtl"
  >
    <Sidebar />
    <div className="flex-1 lg:mr-64 mr-0 flex flex-col min-w-0 min-h-dvh w-full max-w-[100vw]">
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 py-3 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
      <footer className="px-3 sm:px-6 lg:px-8 py-3 border-t border-border text-[11px] sm:text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-2 bg-header/80 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <span className="text-center sm:text-start">فیتوپیا — پنل مدیریت باشگاه</span>
        <div className="flex gap-4 text-[11px]">
          <Link to="/guide" className="hover:text-primary transition-colors py-1">
            راهنما
          </Link>
          <Link to="/privacy" className="hover:text-primary transition-colors py-1">
            حریم خصوصی
          </Link>
        </div>
      </footer>
    </div>
    <Toast />
  </div>
);
