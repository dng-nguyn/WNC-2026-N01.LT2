import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Spinner from './Spinner';

describe('Spinner', () => {
  it('renders spinner with aria-label', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('renders text when provided', () => {
    render(<Spinner text="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('does not render text when not provided', () => {
    render(<Spinner />);
    expect(screen.queryByText(/./)).toBeFalsy();
  });

  it('applies sm size class', () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.firstChild).toHaveClass('spinner-sm');
  });

  it('applies lg size class', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.firstChild).toHaveClass('spinner-lg');
  });
});
