import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, ClipboardCheck, Wallet, UserCheck, Dumbbell, BookOpen, Layers,
  UserPlus, Plus, CalendarCheck, CreditCard, ArrowLeft,
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { StatCard } from '../components/common/StatCard';
import { ErrorBlock, LoadingBlock, NoGymSelected } from '../components/common/EmptyState';
import { useGymScoped } from '../hooks/useGymScoped';
import { useAuth } from '../context/AuthContext';
import membersService from '../services/members/membersService';
import coachesService from '../services/coaches/coachesService';
import employeesService from '../services/employees/employeesService';
import attendanceService from '../services/attendance/attendanceService';
import financeService from '../services/finance/financeService';
import coursesService from '../services/courses/coursesService';
import offeringsService from '../services/offerings/offeringsService';
import type { AttendanceStats, FinanceReport } from '../types/api';

interface DashStats {
  members: number | null;
  coaches: number | null;
  employees: number | null;
  courses: number | null;
  offerings: number | null;
  attendance: AttendanceStats | null;
  finance: FinanceReport | null;
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('fa-IR');
}

function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Number(n).toLocaleString('fa-IR')} تومان`;
}

export const DashboardPage: React.FC = () => {
  const { gymId, hasGym, can } = useGymScoped();
  const { currentGym, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashStats>({
    members: null,
    coaches: null,
    employees: null,
    courses: null,
    offerings: null,
    attendance: null,
    finance: null,
  });

  const load = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    const next: DashStats = {
      members: null,
      coaches: null,
      employees: null,
      courses: null,
      offerings: null,
      attendance: null,
      finance: null,
    };
    const tasks: Promise<void>[] = [];
    if (can('customer.view')) {
      tasks.push(
        membersService
          .list(gymId)
          .then((l) => {
            next.members = l.length;
          })
          .catch(() => {}),
      );
    }
    tasks.push(
      coachesService
        .list(gymId)
        .then((l) => {
          next.coaches = l.length;
        })
        .catch(() => {}),
    );
    if (can('employee.view')) {
      tasks.push(
        employeesService
          .list(gymId)
          .then((l) => {
            next.employees = l.length;
          })
          .catch(() => {}),
      );
    }
    if (can('attendance.view')) {
      tasks.push(
        attendanceService
          .stats(gymId)
          .then((s) => {
            next.attendance = s;
          })
          .catch(() => {}),
      );
    }
    if (can('finance.report')) {
      tasks.push(
        financeService
          .report(gymId)
          .then((r) => {
            next.finance = r;
          })
          .catch(() => {}),
      );
    }
    if (can('course.view')) {
      tasks.push(
        coursesService
          .list(gymId)
          .then((l) => {
            next.courses = l.length;
          })
          .catch(() => {}),
      );
    }
    if (can('offering.manage')) {
      tasks.push(
        offeringsService
          .list(gymId)
          .then((l) => {
            next.offerings = l.length;
          })
          .catch(() => {}),
      );
    }
    try {
      await Promise.all(tasks);
      setStats(next);
    } catch {
      setError('خطا در بارگذاری داشبورد');
    } finally {
      setLoading(false);
    }
  }, [gymId, can]);

  useEffect(() => {
    if (hasGym) load();
    else setLoading(false);
  }, [hasGym, load]);

  if (!hasGym) return <NoGymSelected />;

  const gymName = currentGym?.gym_name || 'باشگاه شما';
  const firstName = (user?.full_name || '').split(' ')[0] || 'مدیر';

  const quickActions = [
    can('customer.create') && {
      to: '/members',
      label: 'افزودن عضو',
      icon: UserPlus,
      color: 'text-primary bg-primary-soft border-primary/20',
    },
    {
      to: '/coaches',
      label: 'افزودن مربی',
      icon: Plus,
      color: 'text-info-text bg-info-soft border-info/20',
    },
    can('attendance.create') && {
      to: '/attendance',
      label: 'ثبت حضور',
      icon: CalendarCheck,
      color: 'text-warning-text bg-warning-soft border-warning/20',
    },
    can('offering.manage') && {
      to: '/offerings',
      label: 'افزودن رشته',
      icon: Layers,
      color: 'text-primary bg-primary-soft border-primary/20',
    },
    can('finance.create') && {
      to: '/finance/payments',
      label: 'ثبت پرداخت',
      icon: CreditCard,
      color: 'text-success-text bg-success-soft border-success/20',
    },
  ].filter(Boolean) as { to: string; label: string; icon: React.ElementType; color: string }[];

  return (
    <div className="space-y-8">
      <Header
        title={`سلام، ${firstName}`}
        subtitle={gymName}
        onQuickAction={load}
        quickActionLabel="بروزرسانی"
      />

      {quickActions.length > 0 && (
        <section aria-label="عملیات سریع">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">عملیات سریع</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={qa.to + qa.label}
                  to={qa.to}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200
                    hover:scale-[1.02] hover:shadow-md ${qa.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold text-center leading-tight">{qa.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {loading && <LoadingBlock label="در حال بارگذاری آمار باشگاه..." />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <section aria-label="آمار کلیدی">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {can('customer.view') && (
                <StatCard
                  title="اعضا"
                  value={fmt(stats.members)}
                  icon={Users}
                  accent="primary"
                  onClick={() => navigate('/members')}
                />
              )}
              <StatCard
                title="مربیان"
                value={fmt(stats.coaches)}
                icon={Dumbbell}
                accent="info"
                onClick={() => navigate('/coaches')}
              />
              {can('employee.view') && (
                <StatCard
                  title="کارکنان"
                  value={fmt(stats.employees)}
                  icon={UserCheck}
                  accent="success"
                  onClick={() => navigate('/employees')}
                />
              )}
              {can('attendance.view') && (
                <StatCard
                  title="حضور امروز"
                  value={fmt(stats.attendance?.today_visits)}
                  icon={ClipboardCheck}
                  accent="warning"
                  subtitle={
                    stats.attendance?.currently_inside != null
                      ? `${fmt(stats.attendance.currently_inside)} نفر داخل باشگاه`
                      : undefined
                  }
                  onClick={() => navigate('/attendance')}
                />
              )}
              {can('course.view') && (
                <StatCard
                  title="دوره‌ها"
                  value={fmt(stats.courses)}
                  icon={BookOpen}
                  accent="info"
                  onClick={() => navigate('/courses')}
                />
              )}
              {can('offering.manage') && (
                <StatCard
                  title="رشته‌ها"
                  value={fmt(stats.offerings)}
                  icon={Layers}
                  accent="primary"
                  onClick={() => navigate('/offerings')}
                />
              )}
              {can('finance.report') && stats.finance && (
                <StatCard
                  title="درآمد ماهانه"
                  value={money(stats.finance.monthly?.income)}
                  icon={Wallet}
                  accent="success"
                  onClick={() => navigate('/finance/reports')}
                />
              )}
            </div>
          </section>

          {can('finance.report') && stats.finance && (
            <section aria-label="خلاصه مالی" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(['daily', 'monthly'] as const).map((period) => {
                const block = stats.finance![period];
                if (!block) return null;
                return (
                  <div
                    key={period}
                    className="rounded-2xl border border-border bg-surface p-5"
                    style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-ink">
                        {period === 'daily' ? 'مالی امروز' : 'مالی این ماه'}
                      </h3>
                      <Link
                        to="/finance"
                        className="text-[11px] text-primary hover:text-primary-hover inline-flex items-center gap-1"
                      >
                        جزئیات
                        <ArrowLeft className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[11px] text-muted mb-1">درآمد</p>
                        <p className="text-sm font-bold text-success-text tabular-nums">{money(block.income)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted mb-1">هزینه</p>
                        <p className="text-sm font-bold text-danger-text tabular-nums">{money(block.expense)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted mb-1">خالص</p>
                        <p className="text-sm font-bold text-ink tabular-nums">{money(block.net)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <section
            className="rounded-2xl border border-border bg-surface p-5"
            style={{ boxShadow: 'var(--fitopia-shadow-sm)' }}
            aria-label="میانبرها"
          >
            <h3 className="text-sm font-semibold text-ink mb-3">دسترسی سریع به بخش‌ها</h3>
            <div className="flex flex-wrap gap-2">
              {[
                can('customer.view') && { to: '/members', label: 'اعضا' },
                { to: '/coaches', label: 'مربیان' },
                can('attendance.view') && { to: '/attendance', label: 'حضور و غیاب' },
                can('offering.manage') && { to: '/offerings', label: 'رشته‌ها' },
                can('course.view') && { to: '/courses', label: 'دوره‌ها' },
                can('finance.view') && { to: '/finance/payments', label: 'پرداخت‌ها' },
                { to: '/settings', label: 'تنظیمات' },
              ]
                .filter(Boolean)
                .map((l) => {
                  const link = l as { to: string; label: string };
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-input
                        text-secondary hover:text-ink hover:border-primary/30 hover:bg-primary-soft transition-colors"
                    >
                      {link.label}
                    </Link>
                  );
                })}
            </div>
          </section>
        </>
      )}

    </div>
  );
};

export default DashboardPage;
