import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS_SHORT,
  toPersianDigits,
  gregorianToJalali,
  jalaliToGregorianStr,
  formatJalaliDate,
  getJalaliMonthDays,
  getJalaliFirstDayOfWeek,
} from '../../utils/jalaliUtils';

interface JalaliDatePickerProps {
  label?: string;
  required?: boolean;
  value: string; // Gregorian "YYYY-MM-DD"
  error?: string;
  onChange: (gregorianDateStr: string) => void;
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  label = 'تاریخ عضویت (شمسی)',
  required = false,
  value,
  error,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialJalali = gregorianToJalali(value);
  const [viewYear, setViewYear] = useState<number>(initialJalali.jy);
  const [viewMonth, setViewMonth] = useState<number>(initialJalali.jm);

  useEffect(() => {
    const j = gregorianToJalali(value);
    setViewYear(j.jy);
    setViewMonth(j.jm);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedJalali = gregorianToJalali(value);
  const todayJalali = gregorianToJalali();

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const gStr = jalaliToGregorianStr(viewYear, viewMonth, day);
    onChange(gStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const gStr = jalaliToGregorianStr(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    setViewYear(todayJalali.jy);
    setViewMonth(todayJalali.jm);
    onChange(gStr);
    setIsOpen(false);
  };

  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const firstDay = getJalaliFirstDayOfWeek(viewYear, viewMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const displayValue =
    value && selectedJalali.jy
      ? `${toPersianDigits(selectedJalali.jy)}/${toPersianDigits(String(selectedJalali.jm).padStart(2, '0'))}/${toPersianDigits(String(selectedJalali.jd).padStart(2, '0'))}`
      : '';

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-secondary mb-1.5">
          {label}
          {required && <span className="text-danger-text mr-0.5">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-input px-3 py-2.5 text-sm text-right
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-input-focus
          ${error ? 'border-danger/50' : 'border-border hover:border-border-hover'}
          ${isOpen ? 'border-primary ring-2 ring-primary/20 bg-input-focus' : ''}
        `}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={displayValue ? 'text-ink tabular-nums' : 'text-disabled'}>
          {displayValue || 'انتخاب تاریخ'}
        </span>
        <CalendarIcon className="w-4 h-4 text-muted shrink-0" aria-hidden />
      </button>

      {error && <p className="mt-1 text-[11px] text-danger-text">{error}</p>}

      {isOpen && (
        <div
          role="dialog"
          aria-label="تقویم شمسی"
          className="absolute z-50 mt-2 w-full min-w-[280px] max-w-sm rounded-2xl border border-border bg-surface-elevated p-3 shadow-lg"
          style={{ boxShadow: 'var(--fitopia-shadow)' }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover transition-colors"
              aria-label="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-bold text-ink tabular-nums">
              {PERSIAN_MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
            </div>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover transition-colors"
              aria-label="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {PERSIAN_WEEK_DAYS_SHORT.map((d) => (
              <div
                key={d}
                className="h-7 flex items-center justify-center text-[10px] font-semibold text-muted"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((dayNum, idx) => {
              if (dayNum == null) {
                return <div key={`e-${idx}`} className="h-8" />;
              }
              const isSelected =
                selectedJalali.jy === viewYear &&
                selectedJalali.jm === viewMonth &&
                selectedJalali.jd === dayNum;
              const isToday =
                todayJalali.jy === viewYear &&
                todayJalali.jm === viewMonth &&
                todayJalali.jd === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer tabular-nums
                    ${
                      isSelected
                        ? 'bg-primary text-primary-fg shadow-md shadow-primary/25 scale-105'
                        : isToday
                          ? 'border border-primary text-primary bg-primary-soft'
                          : 'text-ink hover:bg-surface-hover'
                    }
                  `}
                >
                  {toPersianDigits(dayNum)}
                </button>
              );
            })}
          </div>

          <div className="pt-2 mt-2 border-t border-border flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-primary hover:text-primary-hover font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>امروز ({formatJalaliDate()})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-ink transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JalaliDatePicker;
