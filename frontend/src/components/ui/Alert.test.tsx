import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import Alert from './Alert';

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>Error message</Alert>);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('applies error variant class by default', () => {
    render(<Alert>Error</Alert>);
    expect(screen.getByText('Error').closest('.alert')).toHaveClass('alert-error');
  });

  it('applies specified variant class', () => {
    render(<Alert variant="success">Saved</Alert>);
    expect(screen.getByText('Saved').closest('.alert')).toHaveClass('alert-success');
  });

  it('renders dismiss button when onDismiss provided', () => {
    render(<Alert onDismiss={vi.fn()}>Dismissible</Alert>);
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('does not render dismiss button when onDismiss not provided', () => {
    render(<Alert>Not dismissible</Alert>);
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<Alert onDismiss={onDismiss}>Alert</Alert>);
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
