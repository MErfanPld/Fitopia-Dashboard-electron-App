import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label?: string;
  helpText?: string;
  error?: string;
  isSelect?: boolean;
  isTextarea?: boolean;
  options?: Option[];
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  helpText,
  error,
  isSelect,
  isTextarea,
  options = [],
  required,
  className = '',
  ...rest
}) => {
  const base =
    'w-full bg-input border border-border text-ink placeholder:text-disabled rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-input-focus transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-disabled';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-secondary">
          {label}
          {required && <span className="text-primary mr-0.5">*</span>}
        </label>
      )}
      {isSelect ? (
        <select className={base} {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-ink">
              {opt.label}
            </option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea className={`${base} min-h-[90px] resize-y`} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input className={base} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {helpText && !error && <p className="text-[11px] text-muted">{helpText}</p>}
      {error && <p className="text-[11px] text-danger-text">{error}</p>}
    </div>
  );
};
