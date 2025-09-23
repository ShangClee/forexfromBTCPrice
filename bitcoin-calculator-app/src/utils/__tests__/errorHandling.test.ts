import {
  EnhancedError,
  withRetry,
  withFallback,
  CircuitBreaker,
  ErrorReporter,
  getUserFriendlyErrorMessage,
  isRecoverableError,
  calculateBackoffDelay,
  DEFAULT_RETRY_CONFIG,
} from '../errorHandling';
import { ApiError } from '../../types';

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('EnhancedError', () => {
  it('should create an enhanced error with context', () => {
    const error = new EnhancedError(
      'Test error',
      { component: 'TestComponent', action: 'test_action' },
      new Error('Original error'),
      true
    );

    expect(error.message).toBe('Test error');
    expect(error.context.component).toBe('TestComponent');
    expect(error.context.action).toBe('test_action');
    expect(error.originalError?.message).toBe('Original error');
    expect(error.recoverable).toBe(true);
    expect(error.userMessage).toBeTruthy();
  });

  it('should generate appropriate user messages for different error types', () => {
    const networkError = new EnhancedError(
      'Test error',
      {},
      new ApiError('Network failed', 0, 'NETWORK_ERROR')
    );
    expect(networkError.userMessage).toContain('internet connection');

    const timeoutError = new EnhancedError(
      'Test error',
      {},
      new ApiError('Timeout', 408, 'TIMEOUT')
    );
    expect(timeoutError.userMessage).toContain('longer than expected');

    const rateLimitError = new EnhancedError(
      'Test error',
      {},
      new ApiError('Rate limited', 429, 'RATE_LIMITED')
    );
    expect(rateLimitError.userMessage).toContain('Too many requests');
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');
    
    const result = await withRetry(operation, { maxAttempts: 3, baseDelay: 10 });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
    
    await expect(withRetry(operation, { maxAttempts: 2, baseDelay: 10 }))
      .rejects.toThrow('Operation failed after 2 attempts');
    
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should respect retry condition', async () => {
    const operation = jest.fn().mockRejectedValue(new ApiError('Rate limited', 429, 'RATE_LIMITED'));
    
    await expect(withRetry(operation, {
      maxAttempts: 3,
      baseDelay: 10,
      retryCondition: (error) => !(error instanceof ApiError && error.code === 'RATE_LIMITED')
    })).rejects.toThrow(EnhancedError);
    
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe('withFallback', () => {
  it('should return primary result when operation succeeds', async () => {
    const operation = jest.fn().mockResolvedValue('primary');
    
    const result = await withFallback(operation, { fallbackData: 'fallback' });
    
    expect(result).toBe('primary');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should return fallback data when operation fails', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    
    const result = await withFallback(operation, { fallbackData: 'fallback' });
    
    expect(result).toBe('fallback');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should throw enhanced error when no fallback available', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    
    await expect(withFallback(operation, {})).rejects.toThrow(EnhancedError);
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(2, 100, 1000); // 2 failures, 100ms recovery
  });

  it('should allow operations when closed', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(operation);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('CLOSED');
  });

  it('should open after failure threshold', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failure'));
    
    // First failure
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
    expect(circuitBreaker.getState().state).toBe('CLOSED');
    
    // Second failure - should open circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
    expect(circuitBreaker.getState().state).toBe('OPEN');
    
    // Third attempt should be rejected immediately
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is OPEN');
    expect(operation).toHaveBeenCalledTimes(2); // Not called on third attempt
  });

  it('should transition to half-open after recovery timeout', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failure'));
    
    // Trigger circuit opening
    await expect(circuitBreaker.execute(operation)).rejects.toThrow();
    await expect(circuitBreaker.execute(operation)).rejects.toThrow();
    expect(circuitBreaker.getState().state).toBe('OPEN');
    
    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Next operation should be allowed (half-open state)
    operation.mockResolvedValueOnce('success');
    const result = await circuitBreaker.execute(operation);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('CLOSED');
  });

  it('should reset state', () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failure'));
    
    // Trigger some failures
    circuitBreaker.execute(operation).catch(() => {});
    
    circuitBreaker.reset();
    
    const state = circuitBreaker.getState();
    expect(state.state).toBe('CLOSED');
    expect(state.failures).toBe(0);
  });
});

describe('ErrorReporter', () => {
  let errorReporter: ErrorReporter;

  beforeEach(() => {
    errorReporter = ErrorReporter.getInstance();
    errorReporter.clearBreadcrumbs();
  });

  it('should add breadcrumbs', () => {
    errorReporter.addBreadcrumb('First action');
    errorReporter.addBreadcrumb('Second action');
    
    const error = new EnhancedError('Test error');
    const report = errorReporter.reportError(error);
    
    expect(report.breadcrumbs).toHaveLength(2);
    expect(report.breadcrumbs![0]).toContain('First action');
    expect(report.breadcrumbs![1]).toContain('Second action');
  });

  it('should limit breadcrumb count', () => {
    // Add more than max breadcrumbs
    for (let i = 0; i < 15; i++) {
      errorReporter.addBreadcrumb(`Action ${i}`);
    }
    
    const error = new EnhancedError('Test error');
    const report = errorReporter.reportError(error);
    
    expect(report.breadcrumbs).toHaveLength(10); // Max breadcrumbs
    expect(report.breadcrumbs![0]).toContain('Action 5'); // Oldest should be removed
  });

  it('should create error report with context', () => {
    const error = new EnhancedError(
      'Test error',
      { component: 'TestComponent', action: 'test_action' }
    );
    
    const report = errorReporter.reportError(error);
    
    expect(report.error).toBe(error);
    expect(report.context.component).toBe('TestComponent');
    expect(report.context.action).toBe('test_action');
    expect(report.stackTrace).toBeTruthy();
  });
});

describe('getUserFriendlyErrorMessage', () => {
  it('should return user message for EnhancedError', () => {
    const error = new EnhancedError('Technical error');
    const message = getUserFriendlyErrorMessage(error);
    expect(message).toBe(error.userMessage);
  });

  it('should return appropriate message for ApiError', () => {
    const networkError = new ApiError('Network failed', 0, 'NETWORK_ERROR');
    const message = getUserFriendlyErrorMessage(networkError);
    expect(message).toContain('Connection problem');

    const timeoutError = new ApiError('Timeout', 408, 'TIMEOUT');
    const timeoutMessage = getUserFriendlyErrorMessage(timeoutError);
    expect(timeoutMessage).toContain('timed out');
  });

  it('should return generic message for unknown errors', () => {
    const message = getUserFriendlyErrorMessage('Unknown error');
    expect(message).toBe('An unexpected error occurred. Please try again.');
  });

  it('should detect common error patterns', () => {
    const fetchError = new Error('fetch failed');
    const message = getUserFriendlyErrorMessage(fetchError);
    expect(message).toContain('Connection problem');

    const timeoutError = new Error('timeout occurred');
    const timeoutMessage = getUserFriendlyErrorMessage(timeoutError);
    expect(timeoutMessage).toContain('timed out');
  });
});

describe('isRecoverableError', () => {
  it('should return recoverable status for EnhancedError', () => {
    const recoverableError = new EnhancedError('Error', {}, undefined, true);
    expect(isRecoverableError(recoverableError)).toBe(true);

    const nonRecoverableError = new EnhancedError('Error', {}, undefined, false);
    expect(isRecoverableError(nonRecoverableError)).toBe(false);
  });

  it('should return true for recoverable ApiError codes', () => {
    const rateLimitError = new ApiError('Rate limited', 429, 'RATE_LIMITED');
    expect(isRecoverableError(rateLimitError)).toBe(true);

    const serverError = new ApiError('Server error', 500, 'SERVER_ERROR');
    expect(isRecoverableError(serverError)).toBe(true);

    const validationError = new ApiError('Validation failed', 400, 'VALIDATION_ERROR');
    expect(isRecoverableError(validationError)).toBe(false);
  });

  it('should return true for most generic errors', () => {
    const genericError = new Error('Generic error');
    expect(isRecoverableError(genericError)).toBe(true);
  });
});

describe('calculateBackoffDelay', () => {
  it('should calculate exponential backoff with jitter', () => {
    const config = { ...DEFAULT_RETRY_CONFIG, baseDelay: 1000, maxDelay: 10000 };
    
    const delay1 = calculateBackoffDelay(1, config);
    const delay2 = calculateBackoffDelay(2, config);
    const delay3 = calculateBackoffDelay(3, config);
    
    expect(delay1).toBeGreaterThanOrEqual(1000);
    expect(delay1).toBeLessThanOrEqual(1100); // Base + 10% jitter
    
    expect(delay2).toBeGreaterThanOrEqual(2000);
    expect(delay2).toBeLessThanOrEqual(2200);
    
    expect(delay3).toBeGreaterThanOrEqual(4000);
    expect(delay3).toBeLessThanOrEqual(4400);
  });

  it('should respect max delay', () => {
    const config = { ...DEFAULT_RETRY_CONFIG, baseDelay: 1000, maxDelay: 3000 };
    
    const delay = calculateBackoffDelay(10, config); // Very high attempt
    expect(delay).toBeLessThanOrEqual(3000);
  });
});