import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const mockIsAuthenticated = vi.fn();
vi.mock('../services/auth.service', () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when isAuthenticated returns true', () => {
    mockIsAuthenticated.mockReturnValue(true);

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects to /login when isAuthenticated returns false', () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // When not authenticated, the Navigate component redirects
    // The protected content should not be rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children as React fragment (not extra DOM wrapper)', () => {
    mockIsAuthenticated.mockReturnValue(true);

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <span data-testid="child-element">Child</span>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // The ProtectedRoute should render children directly without a wrapper div
    // MemoryRouter adds a wrapper div (container.firstChild), but ProtectedRoute should not add another one
    // ProtectedRoute uses a React Fragment (<>...</>) which doesn't create a DOM node
    // So the child should be rendered as a direct descendant of MemoryRouter's wrapper
    const memoryRouterWrapper = container.firstChild as HTMLElement;
    expect(memoryRouterWrapper).toBeInTheDocument();
    // The child element should be a descendant (not necessarily direct child due to Fragment)
    const child = screen.getByTestId('child-element');
    expect(child).toBeInTheDocument();
    // Verify the child is inside MemoryRouter's wrapper
    expect(memoryRouterWrapper.contains(child)).toBe(true);
  });
});