import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, LogIn, Building2, Users, UserCheck, DollarSign, Ticket,
  ChevronDown, ChevronUp, CheckCircle2, Sparkles, ClipboardList, UserCog,
} from 'lucide-react';
import { Header } from '../components/common/Header';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge: string;
  summary: string;
  steps: string[];
}

const guideSections: GuideSection[] = [
  {
    id: 'login',
    title: 'ورود و مدیریت نشست',
    icon: LogIn,
    badge: 'گام اول',
    summary: 'نحوه ورود به پنل، احراز هویت و خروج هنگام پایان نشست.',
    steps: [
      'شماره موبایل و رمز عبور باشگاه را در صفحه ورود وارد کنید.',
      'پس از ورود موفق به داشبورد هدایت می‌شوید.',
      'اگر نشست منقضی شود، دوباره از صفحه ورود وارد شوید.',
    ],
  },
  {
    id: 'gym',
    title: 'اطلاعات باشگاه',
    icon: Building2,
    badge: 'تنظیمات',
    summary: 'ویرایش اطلاعات قابل‌تغییر و درخواست تغییر نام/آدرس از طریق تیکت.',
    steps: [
      'از منو وارد «تنظیمات» شوید.',
      'توضیحات، تماس، شبکه‌های اجتماعی و ساعات کاری را ویرایش و ذخیره کنید.',
      'برای تغییر نام یا آدرس باشگاه از بخش «تیکت‌ها» درخواست ویرایش ثبت کنید.',
    ],
  },
  {
    id: 'members',
    title: 'مدیریت اعضا',
    icon: UserCheck,
    badge: 'اعضا',
    summary: 'ثبت‌نام اعضا، وضعیت عضویت و فیلتر بر اساس رشته.',
    steps: [
      'از منو وارد «اعضا» شوید.',
      'با دکمه «عضو جدید» اطلاعات را وارد کنید.',
      'می‌توانید بر اساس نام، شماره یا رشته جستجو و فیلتر کنید.',
    ],
  },
  {
    id: 'coaches',
    title: 'مدیریت مربیان',
    icon: Users,
    badge: 'کادر فنی',
    summary: 'تعریف مربیان، تخصص و رشته‌های ورزشی.',
    steps: [
      'از منو وارد «مربیان» شوید.',
      'مربی جدید اضافه کنید و رشته‌ها را انتخاب کنید.',
      'در صورت نیاز عکس و تخصص را ویرایش کنید.',
    ],
  },
  {
    id: 'employees',
    title: 'کارکنان و دسترسی‌ها',
    icon: UserCog,
    badge: 'دسترسی',
    summary: 'تعریف کارمند، نقش و مجوزهای عملیاتی.',
    steps: [
      'از منو وارد «کارکنان» شوید.',
      'نقش (مدیر، پذیرش، حسابدار و …) را انتخاب کنید.',
      'در صورت نیاز مجوزهای اختصاصی را تنظیم کنید.',
    ],
  },
  {
    id: 'offerings',
    title: 'خدمات و رشته‌ها',
    icon: ClipboardList,
    badge: 'خدمات',
    summary: 'تعریف خدمات، قیمت‌ها، مربیان و برنامه زمانی.',
    steps: [
      'از منو وارد «خدمات و رشته‌ها» شوید.',
      'خدمت جدید با رشته، ظرفیت، قیمت و سانس‌ها بسازید.',
      'برای رشته‌های جدید از «پیشنهاد رشته» استفاده کنید.',
    ],
  },
  {
    id: 'prices',
    title: 'قیمت‌ها و تعرفه‌ها',
    icon: DollarSign,
    badge: 'مالی',
    summary: 'تعرفه تک‌جلسه، ماهانه، سه‌ماهه و سالانه هر رشته.',
    steps: [
      'از منو وارد «قیمت‌ها» شوید.',
      'برای هر رشته تعرفه تعریف یا ویرایش کنید.',
      'مبالغ به تومان نمایش داده می‌شوند.',
    ],
  },
  {
    id: 'tickets',
    title: 'تیکت‌ها و پشتیبانی',
    icon: Ticket,
    badge: 'پشتیبانی',
    summary: 'درخواست ویرایش اطلاعات و پیشنهاد رشته به تیم فیتوپیا.',
    steps: [
      'از منو وارد «تیکت‌ها» شوید یا از زنگوله اعلان استفاده کنید.',
      'وضعیت تیکت‌ها را به فارسی می‌بینید: در انتظار، تایید شده، رد شده.',
      'روی تیکت‌های در انتظار می‌توانید پیام ارسال کنید.',
    ],
  },
];

export const GuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    login: true,
    gym: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    guideSections.forEach((s) => {
      all[s.id] = true;
    });
    setOpenSections(all);
  };

  const collapseAll = () => setOpenSections({});

  return (
    <div className="space-y-6">
      <Header
        title="راهنمای استفاده"
        subtitle="آشنایی سریع با امکانات پنل مدیریت باشگاه"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={expandAll} className="px-3 py-2 text-xs rounded-xl border border-border text-secondary hover:bg-surface-hover">
              باز کردن همه
            </button>
            <button type="button" onClick={collapseAll} className="px-3 py-2 text-xs rounded-xl border border-border text-muted hover:bg-surface-hover">
              بستن همه
            </button>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-soft border border-border flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">به پنل فیتوپیا خوش آمدید</h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            این راهنما مراحل اصلی کار با داشبورد را به‌صورت خلاصه توضیح می‌دهد. هر بخش را باز کنید و مراحل را دنبال کنید.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {guideSections.map((sec) => {
          const Icon = sec.icon;
          const isOpen = !!openSections[sec.id];
          return (
            <div key={sec.id} className="rounded-2xl border border-border bg-surface overflow-hidden transition-colors">
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-4 md:p-5 flex items-center justify-between text-right hover:bg-surface-hover transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm md:text-base text-ink">{sec.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary border border-primary/20">
                        {sec.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1 line-clamp-1">{sec.summary}</p>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface-elevated text-muted shrink-0 mr-2">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-border bg-surface-elevated/50 space-y-3">
                  <p className="text-xs text-secondary font-medium leading-relaxed pt-3">{sec.summary}</p>
                  <div className="space-y-2">
                    {sec.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-ink bg-surface p-3 rounded-xl border border-border">
                        <CheckCircle2 className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-surface flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h4 className="text-xs font-bold text-ink">نیاز به راهنمایی بیشتر دارید؟</h4>
            <p className="text-[11px] text-muted mt-0.5">از بخش تیکت‌ها با پشتیبانی فیتوپیا در ارتباط باشید.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-soft text-primary border border-primary/30 hover:bg-primary hover:text-primary-fg transition-colors"
        >
          رفتن به تیکت‌ها
        </button>
      </div>
    </div>
  );
};

export default GuidePage;
