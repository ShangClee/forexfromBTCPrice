import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values to prevent excessive API calls
 * and expensive calculations during rapid user input
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debouncing callbacks to prevent excessive function calls
 * Simplified version focusing on core functionality
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set up new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Advanced debounce hook with performance monitoring
 */
export function useAdvancedDebounce<T>(
  value: T,
  delay: number,
  options?: {
    maxWait?: number;
    enableProfiling?: boolean;
    name?: string;
  }
): T {
  const { maxWait, enableProfiling = false, name = 'debounce' } = options || {};
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const statsRef = useRef({ updates: 0, skips: 0, totalDelay: 0 });

  useEffect(() => {
    const startTime = Date.now();
    
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      
      if (enableProfiling) {
        const actualDelay = Date.now() - startTime;
        statsRef.current.updates++;
        statsRef.current.totalDelay += actualDelay;
        
        console.log(`[Performance] ${name}: Updated after ${actualDelay}ms (avg: ${(statsRef.current.totalDelay / statsRef.current.updates).toFixed(2)}ms)`);
      }
    }, delay);

    if (enableProfiling) {
      statsRef.current.skips++;
    }

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, enableProfiling, name]);

  return debouncedValue;
}