import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Test component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Test component that can be controlled
const ControlledComponent = ({ throwError }: { throwError: boolean }) => {
  if (throwError) {
    throw new Error('Controlled error');
  }
  return <div>Working component</div>;
};

describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('should display error details when expanded', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Detailed error message" />
      </ErrorBoundary>
    );

    const detailsButton = screen.getByText('Error details');
    fireEvent.click(detailsButton);

    expect(screen.getByText('Detailed error message')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should allow retry when error is recoverable', () => {
    const onRetry = jest.fn();
    
    render(
      <ErrorBoundary onError={onRetry}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Component should attempt to re-render
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show retry count', () => {
    render(
      <ErrorBoundary maxRetries={3}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(screen.getByText('Retry attempt 1 of 3')).toBeInTheDocument();
  });

  it('should disable retry after max attempts', () => {
    render(
      <ErrorBoundary maxRetries={1}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    expect(screen.getByText(/Maximum retry attempts reached/)).toBeInTheDocument();
  });

  it('should provide reload page option', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('should reset on props change when resetOnPropsChange is true', () => {
    const { rerender } = render(
      <ErrorBoundary resetOnPropsChange={true}>
        <ControlledComponent throwError={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change props to trigger reset
    rerender(
      <ErrorBoundary resetOnPropsChange={true}>
        <ControlledComponent throwError={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('should reset on resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change resetKeys to trigger reset
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should auto-reset after timeout when retrying', async () => {
    jest.useFakeTimers();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Fast-forward time to trigger auto-reset
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      // Should still show error since component still throws
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should handle multiple resetKeys correctly', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1', 'key2']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change only one key - should trigger reset
    rerender(
      <ErrorBoundary resetKeys={['key1', 'key3']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should not reset when resetKeys are the same', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1', 'key2']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Same keys - should not reset
    rerender(
      <ErrorBoundary resetKeys={['key1', 'key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should clean up timeout on unmount', () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    jest.useRealTimers();
    clearTimeoutSpy.mockRestore();
  });
});