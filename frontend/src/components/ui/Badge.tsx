import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info';
  children: ReactNode;
  className?: string;
}

const variantMap: Record<string, string> = {
  success: 'badge-success',
  danger: 'badge-danger',
  warning: 'badge-warning',
  info: 'badge-info',
};

export default function Badge({
  variant = 'info',
  children,
  className = '',
}: BadgeProps) {
  const classes = ['badge', variantMap[variant] || '', className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
