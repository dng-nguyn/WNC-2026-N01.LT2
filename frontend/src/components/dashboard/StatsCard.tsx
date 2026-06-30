import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: ReactNode;
  variant?: 'default' | 'green' | 'orange';
}

export default function StatsCard({
  title,
  value,
  variant = 'default',
}: StatsCardProps) {
  const valueClass =
    variant === 'green'
      ? 'stat-value stat-green'
      : variant === 'orange'
      ? 'stat-value stat-orange'
      : 'stat-value';

  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <p className={valueClass}>{value}</p>
    </div>
  );
}
