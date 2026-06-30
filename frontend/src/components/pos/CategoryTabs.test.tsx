import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CategoryTabs from './CategoryTabs';

describe('CategoryTabs', () => {
  const categories = ['all', 'Coffee', 'Tea', 'Food'];
  const activeCategory = 'Coffee';
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all categories', () => {
    render(<CategoryTabs categories={categories} activeCategory={activeCategory} onSelect={onSelect} />);

    expect(screen.getByText('all')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('highlights active category', () => {
    render(<CategoryTabs categories={categories} activeCategory={activeCategory} onSelect={onSelect} />);

    const activeButton = screen.getByText('Coffee');
    expect(activeButton).toHaveClass('category-pill--active');

    const inactiveButton = screen.getByText('Tea');
    expect(inactiveButton).not.toHaveClass('category-pill--active');
  });

  it('calls onSelect on click', async () => {
    const user = userEvent.setup();
    render(<CategoryTabs categories={categories} activeCategory={activeCategory} onSelect={onSelect} />);

    await user.click(screen.getByText('Tea'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Tea');
  });

  it('renders with empty categories', () => {
    const { container } = render(<CategoryTabs categories={[]} activeCategory="all" onSelect={vi.fn()} />);
    expect(container.querySelector('.category-tabs')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});