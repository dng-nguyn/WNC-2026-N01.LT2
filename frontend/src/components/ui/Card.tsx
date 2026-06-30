import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  compact?: boolean;
}

export default function Card({
  children,
  title,
  compact = false,
  className = '',
  ...rest
}: CardProps) {
  const classes = ['card', compact ? 'card-compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}
