import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  EnhancedError, 
  ErrorReporter, 
  getUserFriendlyErrorMessage, 
  isRecoverableError 
} from '../utils/errorHandling';

export interface ErrorState {
  error: EnhancedError | null;
  isRecoverable: boolean;
  userMessage: string;
  retryCount: number;
  lastRetryTime: number | null;
}

export interface ErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
  onError?: (error: EnhancedError) => void;
  onRetry?: (retryCount: number) => void;
  onRecovery?: () => void;
}

/**
 * Custom hook for comprehensive error handling
 */
export const useErrorHandling = (options: ErrorHandlingOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    autoRetry = false,
    onError,
    onRetry,
    onRecovery,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRecoverable: false,
    userMessage: '',
    retryCount: 0,
    lastRetryTime: null,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorReporter = ErrorReporter.getInstance();

  // Clear retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle an error
   */
  const handleError = useCallback((error: unknown, context?: { component?: string; action?: string }) => {
    let enhancedError: EnhancedError;

    if (error instanceof EnhancedError) {
      enhancedError = error;
    } else if (error instanceof Error) {
      enhancedError = new EnhancedError(
        error.message,
        context,
        error,
        isRecoverableError(error)
      );
    } else {
      enhancedError = new EnhancedError(
        String(error),
        context,
        undefined,
        true
      );
    }

    const newErrorState: ErrorState = {
      error: enhancedError,
      isRecoverable: enhancedError.recoverable,
      userMessage: getUserFriendlyErrorMessage(enhancedError),
      retryCount: 0,
      lastRetryTime: null,
    };

    setErrorState(newErrorState);
    errorReporter.reportError(enhancedError);

    // Call error callback
    if (onError) {
      onError(enhancedError);
    }

    // Auto-retry if enabled and error is recoverable
    if (autoRetry && enhancedError.recoverable) {
      scheduleRetry();
    }
  }, [autoRetry, onError]);

  /**
   * Schedule a retry attempt
   */
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      retry();
    }, retryDelay);
  }, [retryDelay]);

  /**
   * Manually retry the operation
   */
  const retry = useCallback(() => {
    if (!errorState.error || !errorState.isRecoverable) {
      return false;
    }

    if (errorState.retryCount >= maxRetries) {
      return false;
    }

    const newRetryCount = errorState.retryCount + 1;
    
    setErrorState(prev => ({
      ...prev,
      retryCount: newRetryCount,
      lastRetryTime: Date.now(),
    }));

    errorReporter.addBreadcrumb(`Retry attempt ${newRetryCount} for error: ${errorState.error.message}`);

    // Call retry callback
    if (onRetry) {
      onRetry(newRetryCount);
    }

    return true;
  }, [errorState, maxRetries, onRetry, errorReporter]);

  /**
   * Clear the error state
   */
  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const hadError = !!errorState.error;
    
    setErrorState({
      error: null,
      isRecoverable: false,
      userMessage: '',
      retryCount: 0,
      lastRetryTime: null,
    });

    // Call recovery callback if we had an error
    if (hadError && onRecovery) {
      onRecovery();
    }

    errorReporter.addBreadcrumb('Error state cleared - recovery successful');
  }, [errorState.error, onRecovery, errorReporter]);

  /**
   * Wrapper for async operations with error handling
   */
  const withErrorHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: { component?: string; action?: string }
    ): Promise<T | null> => {
      try {
        clearError();
        const result = await operation();
        return result;
      } catch (error) {
        handleError(error, context);
        return null;
      }
    },
    [handleError, clearError]
  );

  /**
   * Check if we can retry
   */
  const canRetry = errorState.error && 
                   errorState.isRecoverable && 
                   errorState.retryCount < maxRetries;

  /**
   * Check if we're currently in an error state
   */
  const hasError = !!errorState.error;

  /**
   * Get time until next retry (if auto-retry is enabled)
   */
  const getTimeUntilRetry = useCallback(() => {
    if (!autoRetry || !errorState.lastRetryTime) {
      return 0;
    }
    
    const elapsed = Date.now() - errorState.lastRetryTime;
    return Math.max(0, retryDelay - elapsed);
  }, [autoRetry, errorState.lastRetryTime, retryDelay]);

  return {
    // State
    errorState,
    hasError,
    canRetry,
    
    // Actions
    handleError,
    retry,
    clearError,
    withErrorHandling,
    
    // Utilities
    getTimeUntilRetry,
    
    // Computed values
    isRetrying: errorState.retryCount > 0 && errorState.retryCount < maxRetries,
    hasExceededMaxRetries: errorState.retryCount >= maxRetries,
  };
};

/**
 * Hook for handling multiple error sources
 */
export const useMultipleErrorHandling = (sources: string[]) => {
  const [errors, setErrors] = useState<Record<string, ErrorState>>({});
  
  const errorHandlers = sources.reduce((handlers, source) => {
    handlers[source] = useErrorHandling({
      onError: (error) => {
        setErrors(prev => ({
          ...prev,
          [source]: {
            error,
            isRecoverable: error.recoverable,
            userMessage: getUserFriendlyErrorMessage(error),
            retryCount: 0,
            lastRetryTime: null,
          },
        }));
      },
      onRecovery: () => {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[source];
          return newErrors;
        });
      },
    });
    return handlers;
  }, {} as Record<string, ReturnType<typeof useErrorHandling>>);

  const hasAnyError = Object.keys(errors).length > 0;
  const hasRecoverableErrors = Object.values(errors).some(error => error.isRecoverable);
  const errorCount = Object.keys(errors).length;

  const clearAllErrors = useCallback(() => {
    Object.values(errorHandlers).forEach(handler => handler.clearError());
    setErrors({});
  }, [errorHandlers]);

  const retryAll = useCallback(() => {
    Object.values(errorHandlers).forEach(handler => {
      if (handler.canRetry) {
        handler.retry();
      }
    });
  }, [errorHandlers]);

  return {
    errors,
    errorHandlers,
    hasAnyError,
    hasRecoverableErrors,
    errorCount,
    clearAllErrors,
    retryAll,
  };
};