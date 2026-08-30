import React from 'react';

export const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-[var(--color-surface2)] text-[var(--color-text)] border-[var(--color-border)]',
    primary: 'bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] border-[var(--color-border)] shadow-sm',
    success: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    warning: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
    danger: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
    info: 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/60',
    purple: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/60',
  };

  // Auto-detect by status string
  let autoVariant = variant;
  if (typeof children === 'string') {
    const s = children.toUpperCase();
    if (['ACTIVE', 'APPROVED', 'COMPLETED', 'CONFIRMED', 'PAID'].includes(s)) autoVariant = 'success';
    else if (['PENDING', 'PENDING_REVIEW', 'IN_PROGRESS', 'PROCESSING', 'RESERVED'].includes(s)) autoVariant = 'warning';
    else if (['REJECTED', 'BANNED', 'SUSPENDED', 'CANCELLED', 'FAILED', 'EXPIRED'].includes(s)) autoVariant = 'danger';
    else if (['RESUBMIT_REQUIRED', 'PAUSED'].includes(s)) autoVariant = 'info';
    else if (['PINNED', 'PREMIUM', 'ADMIN', 'EMPLOYER'].includes(s)) autoVariant = 'primary';
  }

  const selectedClass = variants[autoVariant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase ${selectedClass} ${className}`}>
      {children}
    </span>
  );
};
