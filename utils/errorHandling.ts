import { ApiError, ApiErrorCode } from '../types';

/**
 * Error handling utilities for the Bitcoin Forex Calculator
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export interface FallbackConfig<T> {
  fallbackData?: T;
  useCachedData?: boolean;
  gracefulDegradation?: boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and server errors
    if (error instanceof ApiError) {
      return ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'].includes(error.code);
    }
    return true;
  },
};

/**
 * Enhanced error class with additional context
 */
export class EnhancedError extends Error {
  public readonly context: ErrorContext;
  public readonly originalError?: Error;
  public readonly recoverable: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error,
    recoverable = true
  ) {
    super(message);
    this.name = 'EnhancedError';
    this.context = {
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context,
    };
    this.originalError = originalError;
    this.recoverable = recoverable;
    this.userMessage = this.generateUserMessage();
  }

  private generateUserMessage(): string {
    if (this.originalError instanceof ApiError) {
      switch (this.originalError.code) {
        case 'NETWORK_ERROR':
          return 'Unable to connect to the server. Please check your internet connection and try again.';
        case 'TIMEOUT':
          return 'The request is taking longer than expected. Please try again.';
        case 'RATE_LIMITED':
          return 'Too many requests. Please wait a moment before trying again.';
        case 'SERVER_ERROR':
          return 'The server is experiencing issues. Please try again in a few minutes.';
        case 'INVALID_RESPONSE':
          return 'Received unexpected data from the server. Please try again.';
        case 'VALIDATION_ERROR':
          return 'Please check your input and try again.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay with jitter
 */
export const calculateBackoffDelay = (
  attempt: number,
  config: RetryConfig
): number => {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, config.maxDelay);
};

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: Partial<ErrorContext> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!retryConfig.retryCondition || !retryConfig.retryCondition(lastError)) {
        throw new EnhancedError(
          `Operation failed: ${lastError.message}`,
          { ...context, action: 'retry_failed_non_retryable' },
          lastError,
          false
        );
      }

      // If this is the last attempt, throw the error
      if (attempt === retryConfig.maxAttempts) {
        throw new EnhancedError(
          `Operation failed after ${retryConfig.maxAttempts} attempts: ${lastError.message}`,
          { ...context, action: 'retry_exhausted' },
          lastError,
          true
        );
      }

      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, retryConfig);
      console.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms:`,
        lastError.message
      );
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

/**
 * Graceful degradation wrapper
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  fallbackConfig: FallbackConfig<T> = {},
  context: Partial<ErrorContext> = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const enhancedError = new EnhancedError(
      `Primary operation failed: ${error instanceof Error ? error.message : String(error)}`,
      { ...context, action: 'fallback_triggered' },
      error instanceof Error ? error : undefined,
      true
    );

    // Try to use fallback data if available
    if (fallbackConfig.fallbackData !== undefined) {
      console.warn('Using fallback data due to error:', enhancedError.message);
      return fallbackConfig.fallbackData;
    }

    // If graceful degradation is enabled, return a safe default
    if (fallbackConfig.gracefulDegradation) {
      console.warn('Graceful degradation triggered:', enhancedError.message);
      // Return a safe default - this should be handled by the caller
      throw enhancedError;
    }

    throw enhancedError;
  }
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly monitoringPeriod: number = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new EnhancedError(
          'Circuit breaker is OPEN - service temporarily unavailable',
          { action: 'circuit_breaker_open' },
          undefined,
          true
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Error reporting utility
 */
export interface ErrorReport {
  error: EnhancedError;
  context: ErrorContext;
  stackTrace?: string;
  breadcrumbs?: string[];
}

export class ErrorReporter {
  private static instance: ErrorReporter;
  private breadcrumbs: string[] = [];
  private maxBreadcrumbs = 10;

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  addBreadcrumb(message: string): void {
    this.breadcrumbs.push(`${new Date().toISOString()}: ${message}`);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  reportError(error: EnhancedError): ErrorReport {
    const report: ErrorReport = {
      error,
      context: error.context,
      stackTrace: error.stack,
      breadcrumbs: [...this.breadcrumbs],
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', report);
    }

    // In production, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.

    return report;
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

/**
 * User-friendly error message generator
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof EnhancedError) {
    return error.userMessage;
  }

  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Connection problem. Please check your internet and try again.';
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment.';
      case 'SERVER_ERROR':
        return 'Server error. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return 'Connection problem. Please check your internet and try again.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if an error is recoverable
 */
export const isRecoverableError = (error: unknown): boolean => {
  if (error instanceof EnhancedError) {
    return error.recoverable;
  }

  if (error instanceof ApiError) {
    // Rate limiting and server errors are usually recoverable
    return ['RATE_LIMITED', 'SERVER_ERROR', 'TIMEOUT', 'NETWORK_ERROR'].includes(error.code);
  }

  // Most errors are potentially recoverable
  return true;
};