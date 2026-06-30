import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatsCard from './StatsCard';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Revenue" value="₫100,000" />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('₫100,000')).toBeInTheDocument();
  });

  it('applies green variant class', () => {
    render(<StatsCard title="Completed" value={5} variant="green" />);
    expect(screen.getByText('5')).toHaveClass('stat-green');
  });

  it('applies orange variant class', () => {
    render(<StatsCard title="Pending" value={3} variant="orange" />);
    expect(screen.getByText('3')).toHaveClass('stat-orange');
  });

  it('uses default variant when not specified', () => {
    render(<StatsCard title="Total" value={10} />);
    expect(screen.getByText('10')).toHaveClass('stat-value');
    expect(screen.getByText('10')).not.toHaveClass('stat-green');
  });
});
