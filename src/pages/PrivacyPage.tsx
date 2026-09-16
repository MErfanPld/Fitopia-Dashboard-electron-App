import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Database,
  EyeOff,
  UserCheck,
  Headphones,
  CheckCircle2,
  FileText,
  Server,
  Cookie,
  Scale,
} from 'lucide-react';
import { Header } from '../components/common/Header';

const sections = [
  {
    icon: ShieldCheck,
    title: '۱. مقدمه و تعهد فیتوپیا',
    content:
      'سامانه «فیتوپیا» (Fitopia) به‌عنوان پلتفرم مدیریت باشگاه‌های ورزشی، متعهد به حفاظت از اطلاعات شخصی و تجاری باشگاه‌داران، کارکنان، مربیان و اعضاست. این سند توضیح می‌دهد چه داده‌هایی جمع‌آوری می‌شود، چگونه استفاده و نگهداری می‌شود و چه حقوقی برای شما به‌عنوان کاربر پنل مدیریت وجود دارد.',
  },
  {
    icon: Database,
    title: '۲. داده‌هایی که جمع‌آوری می‌کنیم',
    content:
      'بسته به استفاده شما از پنل، ممکن است این موارد ذخیره شوند: مشخصات حساب (نام کاربری، شماره تماس)، مشخصات باشگاه (نام، آدرس، تلفن، ساعات کاری، شبکه‌های اجتماعی)، اطلاعات اعضا و مربیان، حضور و غیاب، دوره‌ها و رشته‌ها، تراکنش‌ها و پرداخت‌ها، تیکت‌های پشتیبانی و لاگ فعالیت‌های مدیریتی. داده‌ها صرفاً برای ارائه و بهبود خدمات مدیریت باشگاه استفاده می‌شوند.',
  },
  {
    icon: FileText,
    title: '۳. اهداف استفاده از اطلاعات',
    content:
      'از داده‌ها برای احراز هویت، مدیریت عضویت و حضور، گزارش مالی، پشتیبانی فنی، ارسال اعلان‌های مرتبط با پنل و رعایت الزامات قانونی استفاده می‌شود. از اطلاعات برای تبلیغات شخص ثالث یا فروش به دیگران استفاده نمی‌کنیم.',
  },
  {
    icon: Lock,
    title: '۴. امنیت و نگهداری',
    content:
      'ارتباط با سرور از طریق HTTPS انجام می‌شود. دسترسی به API با توکن JWT و نقش‌های کارکنان محدود است. پشتیبان‌گیری و کنترل دسترسی در زیرساخت سرور اعمال می‌شود. با این حال هیچ سامانه‌ای امنیت مطلق ندارد؛ توصیه می‌کنیم رمز عبور قوی انتخاب کنید و دسترسی کارکنان را فقط به حد نیاز بدهید.',
  },
  {
    icon: EyeOff,
    title: '۵. اشتراک‌گذاری با دیگران',
    content:
      'اطلاعات باشگاه و اعضا را به شرکت‌های تبلیغاتی نمی‌فروشیم و اجاره نمی‌دهیم. افشا فقط در موارد الزام قانونی، یا با رضایت شما، یا برای ارائه‌دهندگان زیرساخت فنی که تحت تعهد محرمانگی کار می‌کنند، ممکن است انجام شود.',
  },
  {
    icon: UserCheck,
    title: '۶. حقوق شما',
    content:
      'می‌توانید اطلاعات قابل ویرایش باشگاه را از بخش تنظیمات به‌روزرسانی کنید. برای تغییر نام یا آدرس رسمی باشگاه از مسیر تیکت‌ها درخواست ثبت کنید. درخواست مشاهده، اصلاح یا حذف داده‌های قابل حذف را از طریق پشتیبانی ارسال کنید؛ در حدود قانون و نیاز عملیاتی پاسخ داده می‌شود.',
  },
  {
    icon: Cookie,
    title: '۷. نشست و ذخیره‌سازی محلی',
    content:
      'برای حفظ ورود شما، توکن احراز هویت در فضای ذخیره‌سازی مرورگر نگهداری می‌شود. ترجیح تم (روشن/تاریک) نیز به‌صورت محلی ذخیره می‌شود. با خروج از حساب، نشست پایان می‌یابد. از دستگاه‌های مشترک بدون خروج استفاده نکنید.',
  },
  {
    icon: Server,
    title: '۸. نگهداری و حذف',
    content:
      'داده‌ها تا زمانی که حساب فعال است و برای ارائه خدمات یا الزامات قانونی لازم باشد نگهداری می‌شوند. پس از پایان همکاری یا درخواست حذف، داده‌های قابل حذف در بازه معقول از سیستم عملیاتی خارج یا ناشناس می‌شوند؛ نسخه‌های پشتیبان ممکن است تا چرخه پاکسازی بعدی باقی بمانند.',
  },
  {
    icon: Scale,
    title: '۹. تغییرات این سند',
    content:
      'ممکن است این بیانیه با توسعه محصول به‌روزرسانی شود. نسخه به‌روز در همین صفحه پنل در دسترس است. ادامه استفاده از سامانه پس از انتشار نسخه جدید به‌منزله آگاهی از تغییرات است؛ در تغییرات مهم تلاش می‌کنیم از طریق پنل اطلاع‌رسانی کنیم.',
  },
  {
    icon: Headphones,
    title: '۱۰. تماس با ما',
    content:
      'برای سوال یا درخواست مرتبط با حریم خصوصی، از بخش «تیکت‌ها» در همین پنل پیام بفرستید یا با ایمیل privacy@fitopia.ir تماس بگیرید. تیم پشتیبانی درخواست‌های مربوط به داده و امنیت را پیگیری می‌کند.',
  },
];

export const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Header title="حریم خصوصی" subtitle="سیاست حفاظت از داده‌ها در پنل باشگاه‌داران فیتوپیا" />

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-1 space-y-3 text-right">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary-soft text-primary text-[11px] font-semibold">
            <FileText className="w-3.5 h-3.5" />
            سند رسمی حریم خصوصی پنل
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-ink leading-snug">
            حفاظت از اطلاعات باشگاه، اعضا و تراکنش‌ها
          </h2>
          <p className="text-sm text-muted leading-relaxed max-w-2xl">
            این صفحه برای مدیران باشگاه نوشته شده است. محتوای آن با طراحی روشن و تاریک پنل سازگار است
            و سیاست واقعی جمع‌آوری و استفاده از داده در محصول فیتوپیا را شرح می‌دهد.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-fg text-xs font-bold"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به داشبورد
            </button>
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-secondary text-xs font-semibold hover:bg-surface-hover"
            >
              ارسال تیکت پشتیبانی
            </button>
          </div>
        </div>
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary shrink-0 self-center md:self-auto">
          <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <article
              key={sec.title}
              className="p-4 sm:p-5 rounded-2xl border border-border bg-surface space-y-3 text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-primary shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-ink leading-snug">{sec.title}</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">{sec.content}</p>
            </article>
          );
        })}
      </div>

      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success-text shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-ink">تعهد امنیت داده فیتوپیا</h4>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5">
              آخرین به‌روزرسانی این سند: مرداد ۱۴۰۵ · نسخه پنل باشگاه‌داران
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="px-4 py-2 rounded-xl border border-border text-secondary text-xs font-bold hover:bg-surface-hover shrink-0"
        >
          ارتباط با تیم پشتیبانی
        </button>
      </div>
    </div>
  );
};

export default PrivacyPage;
