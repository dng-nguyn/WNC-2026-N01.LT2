import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TopItemsTable from './TopItemsTable';

describe('TopItemsTable', () => {
  it('renders table headers', () => {
    render(<TopItemsTable items={[{ name: 'Espresso', quantity: 10, revenue: 450000 }]} />);
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Quantity Sold')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders item rows', () => {
    render(<TopItemsTable items={[
      { name: 'Espresso', quantity: 10, revenue: 450000 },
      { name: 'Latte', quantity: 7, revenue: 385000 },
    ]} />);
    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Latte')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows empty message when no items', () => {
    render(<TopItemsTable items={[]} />);
    expect(screen.getByText('No orders yet')).toBeInTheDocument();
  });
});
