import { cn } from '@/lib/utils/cn';

/**
 * Card component
 */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header
 */
export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Title
 */
export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-xl font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Card Description
 */
export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-sm text-[var(--muted)] mt-1', className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Card Content
 */
export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('mt-4 flex items-center', className)} {...props}>
      {children}
    </div>
  );
}
