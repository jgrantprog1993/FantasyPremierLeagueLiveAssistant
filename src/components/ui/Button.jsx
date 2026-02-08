'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Button component with FPL-styled variants
 */
export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-lg';

  const variants = {
    primary: 'bg-[var(--fpl-purple)] text-white hover:bg-[#5a0052] active:bg-[#2d0025] focus-visible:ring-[var(--fpl-green)]',
    secondary: 'bg-[var(--fpl-green)] text-[var(--fpl-purple)] hover:bg-[#00cc6a] active:bg-[#00b35c] focus-visible:ring-[var(--fpl-purple)]',
    outline: 'border-2 border-[var(--fpl-purple)] text-[var(--fpl-purple)] bg-transparent hover:bg-[var(--fpl-purple)] hover:text-white focus-visible:ring-[var(--fpl-purple)]',
    ghost: 'text-[var(--foreground)] bg-transparent hover:bg-[var(--border)] focus-visible:ring-[var(--fpl-purple)]',
    danger: 'bg-[var(--fpl-pink)] text-white hover:bg-[#e6246e] focus-visible:ring-[var(--fpl-pink)]',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
