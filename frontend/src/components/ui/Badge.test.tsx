import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies success variant class', () => {
    render(<Badge variant="success">OK</Badge>);
    expect(screen.getByText('OK')).toHaveClass('badge-success');
  });

  it('applies danger variant class', () => {
    render(<Badge variant="danger">Fail</Badge>);
    expect(screen.getByText('Fail')).toHaveClass('badge-danger');
  });

  it('defaults to info variant', () => {
    render(<Badge>Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('badge-info');
  });
});
