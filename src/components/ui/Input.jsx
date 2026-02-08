'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Input component with FPL styling
 */
export function Input({
  className,
  type = 'text',
  error,
  ...props
}) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border px-4 py-2 text-base transition-all duration-200',
        'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500',
        'focus:outline-none focus:ring-2 focus:ring-[var(--fpl-green)] focus:border-[var(--fpl-green)]',
        'disabled:cursor-not-allowed disabled:bg-gray-200 disabled:opacity-50',
        'hover:border-[var(--fpl-purple)]/50',
        error && 'border-[var(--fpl-pink)] focus:ring-[var(--fpl-pink)] focus:border-[var(--fpl-pink)]',
        className
      )}
      {...props}
    />
  );
}

/**
 * Label component
 */
export function Label({ className, children, required, ...props }) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-[var(--foreground)] mb-1.5',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-[var(--fpl-pink)] ml-0.5">*</span>}
    </label>
  );
}
