import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEK_DAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export function toPersianDigits(n: string | number): string {
  if (n === null || n === undefined) return '';
  const str = String(n);
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => farsiDigits[parseInt(w, 10)]);
}

export function toEnglishDigits(str: string): string {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['0', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(persianDigits[i], 'g'), String(i));
    res = res.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return res;
}

export function gregorianToJalali(gStr?: string | null): { jy: number; jm: number; jd: number } {
  if (!gStr) {
    const now = new Date();
    return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  const clean = gStr.split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length < 3) {
    const now = new Date();
    return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);

  if (isNaN(gy) || isNaN(gm) || isNaN(gd)) {
    const now = new Date();
    return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  return toJalaali(gy, gm, gd);
}

export function jalaliToGregorianStr(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  const mm = String(g.gm).padStart(2, '0');
  const dd = String(g.gd).padStart(2, '0');
  return `${g.gy}-${mm}-${dd}`;
}

export function formatJalaliDate(gStr?: string | null): string {
  if (!gStr) return '—';
  const j = gregorianToJalali(gStr);
  const monthName = PERSIAN_MONTH_NAMES[j.jm - 1] || '';
  return `${toPersianDigits(j.jd)} ${monthName} ${toPersianDigits(j.jy)}`;
}

export function formatJalaliNumeric(gStr?: string | null): string {
  if (!gStr) return '—';
  const j = gregorianToJalali(gStr);
  const jm = String(j.jm).padStart(2, '0');
  const jd = String(j.jd).padStart(2, '0');
  return toPersianDigits(`${j.jy}/${jm}/${jd}`);
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

export function getJalaliFirstDayOfWeek(jy: number, jm: number): number {
  const g = toGregorian(jy, jm, 1);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  return (d.getDay() + 1) % 7;
}

export function formatJalaliDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const g = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const datePart = formatJalaliNumeric(g);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${datePart} ${toPersianDigits(`${hh}:${mm}`)}`;
  } catch {
    return '—';
  }
}
