import type { ReactNode } from 'react';

interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantClassMap: Record<string, string> = {
  error: 'alert-error',
  success: 'alert-success',
  warning: 'alert-warning',
  info: 'alert-info',
};

export default function Alert({
  variant = 'error',
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  const classes = ['alert', variantClassMap[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span>{children}</span>
      {onDismiss && (
        <button
          type="button"
          className="alert-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}
