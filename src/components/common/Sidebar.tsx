import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, Dumbbell, Layers, BookOpen, Tag,
  ClipboardCheck, Clock, Wallet, ArrowLeftRight, RotateCcw, BarChart3,
  TicketCheck, ScrollText, Settings, LogOut, X, Zap, Building2, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ROLE_LABELS, type StaffRole, type PermissionCode } from '../../types/api';

interface Item {
  path: string;
  label: string;
  icon: React.ElementType;
  perm?: PermissionCode;
}

const groups: { title: string; items: Item[] }[] = [
  {
    title: 'نمای کلی',
    items: [{ path: '/dashboard', label: 'داشبورد', icon: LayoutDashboard }],
  },
  {
    title: 'مدیریت باشگاه',
    items: [
      { path: '/members', label: 'اعضا', icon: Users, perm: 'customer.view' },
      { path: '/coaches', label: 'مربیان', icon: Dumbbell },
      { path: '/employees', label: 'کارکنان', icon: UserCog, perm: 'employee.view' },
      { path: '/offerings', label: 'خدمات و رشته‌ها', icon: Layers, perm: 'offering.manage' },
      { path: '/prices', label: 'قیمت‌ها', icon: Tag },
      { path: '/courses', label: 'دوره‌ها', icon: BookOpen, perm: 'course.view' },
    ],
  },
  {
    title: 'عملیات',
    items: [
      { path: '/attendance', label: 'حضور و غیاب', icon: ClipboardCheck, perm: 'attendance.view' },
      { path: '/sessions', label: 'جلسات تکی', icon: Clock, perm: 'finance.create' },
    ],
  },
  {
    title: 'مالی',
    items: [
      { path: '/finance', label: 'گزارش مالی', icon: BarChart3, perm: 'finance.report' },
      { path: '/finance/transactions', label: 'تراکنش‌ها', icon: ArrowLeftRight, perm: 'finance.view' },
      { path: '/finance/payments', label: 'پرداخت‌ها', icon: Wallet, perm: 'finance.view' },
      { path: '/finance/refunds', label: 'استردادها', icon: RotateCcw, perm: 'finance.refund' },
    ],
  },
  {
    title: 'پشتیبانی و سیستم',
    items: [
      { path: '/tickets', label: 'تیکت‌ها', icon: TicketCheck },
      { path: '/audit', label: 'گزارش فعالیت', icon: ScrollText },
      { path: '/settings', label: 'تنظیمات', icon: Settings },
      { path: '/guide', label: 'راهنما', icon: HelpCircle },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { logout, currentGym, gymAccessList, setCurrentGym, user, can } = useAuth();
  const { isMobileMenuOpen, closeMobileMenu } = useUI();
  const navigate = useNavigate();

  const roleLabel =
    currentGym?.role && ROLE_LABELS[currentGym.role as StaffRole]
      ? ROLE_LABELS[currentGym.role as StaffRole]
      : currentGym?.role || '';

  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          items: g.items.filter((item) => !item.perm || can(item.perm)),
        }))
        .filter((g) => g.items.length > 0),
    [can],
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'var(--fitopia-overlay)' }}
          aria-hidden
        />
      )}
      <aside
        className={`fixed right-0 top-0 bottom-0 w-72 lg:w-64 bg-sidebar border-l border-border flex flex-col z-50
          transition-transform duration-200
          ${isMobileMenuOpen ? 'translate-x-0' : 'max-lg:translate-x-full'}`}
        style={{ boxShadow: 'var(--fitopia-shadow)' }}
        aria-label="منوی اصلی"
      >
        <div className="h-16 px-5 border-b border-border flex items-center justify-between shrink-0">
          <NavLink to="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-lg text-ink block leading-tight truncate">فیتوپیا</span>
              <span className="text-[11px] text-muted">پنل مدیریت باشگاه</span>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="lg:hidden text-muted hover:text-primary p-2 hover:bg-surface-hover rounded-lg transition-colors"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-3 border-b border-border">
          <label className="text-[10px] text-muted font-semibold mb-1.5 block px-1">باشگاه فعال</label>
          {gymAccessList.length === 0 ? (
            <div className="text-xs text-muted px-2 py-2 rounded-lg bg-surface">دسترسی به باشگاهی ندارید</div>
          ) : (
            <div className="relative">
              <Building2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <select
                value={currentGym?.gym ?? ''}
                onChange={(e) => {
                  const g = gymAccessList.find((x) => String(x.gym) === e.target.value);
                  if (g) setCurrentGym(g);
                }}
                className="w-full appearance-none bg-input border border-border text-sm text-ink rounded-lg pr-8 pl-3 py-2
                  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                aria-label="انتخاب باشگاه"
              >
                {gymAccessList.map((g) => (
                  <option key={g.gym} value={g.gym}>
                    {g.gym_name || `باشگاه ${g.gym}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {roleLabel && (
            <p className="text-[10px] text-primary mt-1.5 px-1 font-medium">{roleLabel}</p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[10px] font-bold tracking-wide text-muted/80 uppercase">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/finance' || item.path === '/dashboard'}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150
                          ${
                            isActive
                              ? 'bg-primary-soft text-primary border border-primary/20'
                              : 'text-secondary hover:bg-surface-hover hover:text-ink border border-transparent'
                          }`
                        }
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-surface/60 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {(user?.full_name || user?.phone || 'ک').charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">{user?.full_name || 'کاربر'}</p>
              <p className="text-[11px] text-muted truncate" dir="ltr">
                {user?.phone || ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium
              text-danger-text hover:bg-danger-soft border border-transparent hover:border-danger/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            خروج از حساب
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
