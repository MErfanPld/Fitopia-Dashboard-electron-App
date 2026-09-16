import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active shadow-md shadow-primary/20 border border-transparent disabled:opacity-50 font-bold',
  secondary:
    'bg-surface-elevated text-ink border border-border hover:bg-surface-hover hover:border-border-hover active:bg-surface-hover disabled:opacity-50',
  danger:
    'bg-danger-soft text-danger-text border border-danger/20 hover:bg-danger/20 active:bg-danger/25 disabled:opacity-50',
  ghost:
    'bg-transparent text-muted hover:bg-surface-hover hover:text-ink border border-transparent disabled:opacity-50',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3 text-base rounded-xl gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center font-semibold transition-colors duration-200 cursor-pointer ${variantClass[variant]} ${sizeClass[size]} ${className}`}
    {...rest}
  >
    {loading ? (
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    ) : (
      leftIcon
    )}
    {children}
    {!loading && rightIcon}
  </button>
);
