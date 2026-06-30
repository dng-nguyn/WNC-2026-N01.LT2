import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="My Card">Content</Card>);
    expect(screen.getByText('My Card')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(<Card>No title</Card>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('applies compact class', () => {
    const { container } = render(<Card compact>Compact</Card>);
    expect(container.firstChild).toHaveClass('card-compact');
  });
});
