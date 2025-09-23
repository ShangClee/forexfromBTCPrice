import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Performance utilities for React optimization
 */

// Type definitions for better TypeScript support
type DependencyList = ReadonlyArray<any>;

/**
 * Stable reference hook - returns the same reference unless dependencies change
 * Useful for preventing unnecessary re-renders when passing objects/arrays as props
 */
export function useStableReference<T>(value: T, deps: DependencyList): T {
  const ref = useRef<T>(value);
  const depsRef = useRef<DependencyList>(deps);

  // Check if dependencies have changed
  const depsChanged = useMemo(() => {
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, index) => dep !== depsRef.current[index]);
  }, deps);

  if (depsChanged) {
    ref.current = value;
    depsRef.current = deps;
  }

  return ref.current;
}

/**
 * Memoized callback that only changes when dependencies change
 * More stable than useCallback for complex dependency arrays
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Deep comparison hook for complex objects
 * Only triggers re-render when object contents actually change
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  const serializedValue = JSON.stringify(value);
  const serializedRef = useRef<string>(serializedValue);

  if (serializedValue !== serializedRef.current) {
    ref.current = value;
    serializedRef.current = serializedValue;
  }

  return ref.current;
}

/**
 * Throttle hook for limiting function execution frequency
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(0); // Initialize to 0 so first call executes immediately

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Memoized calculation hook with dependency tracking
 */
export function useMemoizedCalculation<T>(
  calculation: () => T,
  deps: DependencyList,
  shouldRecalculate?: (prevDeps: DependencyList, newDeps: DependencyList) => boolean
): T {
  const prevDepsRef = useRef<DependencyList>(deps);
  
  return useMemo(() => {
    const result = calculation();
    prevDepsRef.current = deps;
    return result;
  }, shouldRecalculate ? (shouldRecalculate(prevDepsRef.current, deps) ? deps : prevDepsRef.current) : deps);
}

/**
 * Optimized calculation hook with caching and performance monitoring
 */
export function useOptimizedCalculation<T>(
  calculation: () => T,
  deps: DependencyList,
  options?: {
    cacheSize?: number;
    enableProfiling?: boolean;
    name?: string;
  }
): T {
  const { cacheSize = 10, enableProfiling = false, name = 'calculation' } = options || {};
  const cacheRef = useRef<Map<string, { result: T; timestamp: number }>>(new Map());
  const performanceRef = useRef<{ totalTime: number; callCount: number }>({ totalTime: 0, callCount: 0 });

  return useMemo(() => {
    const startTime = enableProfiling ? performance.now() : 0;
    const cacheKey = JSON.stringify(deps);
    
    // Check cache first
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      if (enableProfiling) {
        console.log(`[Performance] ${name}: Cache hit`);
      }
      return cached.result;
    }

    // Calculate new result
    const result = calculation();
    
    // Update cache
    cacheRef.current.set(cacheKey, { result, timestamp: Date.now() });
    
    // Maintain cache size
    if (cacheRef.current.size > cacheSize) {
      const oldestKey = Array.from(cacheRef.current.keys())[0];
      cacheRef.current.delete(oldestKey);
    }

    // Performance monitoring
    if (enableProfiling) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      performanceRef.current.totalTime += duration;
      performanceRef.current.callCount += 1;
      
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms (avg: ${(performanceRef.current.totalTime / performanceRef.current.callCount).toFixed(2)}ms)`);
    }

    return result;
  }, deps);
}

/**
 * Performance measurement hook for development
 */
export function usePerformanceMonitor(name: string, enabled: boolean = process.env.NODE_ENV === 'development') {
  const startTime = useRef<number>(0);

  const start = useCallback(() => {
    if (enabled) {
      startTime.current = performance.now();
    }
  }, [enabled]);

  const end = useCallback(() => {
    if (enabled && startTime.current > 0) {
      const duration = performance.now() - startTime.current;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      startTime.current = 0;
    }
  }, [enabled, name]);

  return { start, end };
}

/**
 * Intersection Observer hook for lazy loading optimization
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Advanced caching hook with TTL and size limits
 */
export function useAdvancedCache<K, V>(
  maxSize: number = 100,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) {
  const cacheRef = useRef<Map<K, { value: V; timestamp: number; accessCount: number }>>(new Map());
  const statsRef = useRef({ hits: 0, misses: 0, evictions: 0 });

  const get = useCallback((key: K): V | undefined => {
    const entry = cacheRef.current.get(key);
    
    if (!entry) {
      statsRef.current.misses++;
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > ttl) {
      cacheRef.current.delete(key);
      statsRef.current.misses++;
      return undefined;
    }

    // Update access count and timestamp for LRU
    entry.accessCount++;
    entry.timestamp = Date.now();
    statsRef.current.hits++;
    
    return entry.value;
  }, [ttl]);

  const set = useCallback((key: K, value: V): void => {
    // Evict expired entries first
    const now = Date.now();
    for (const [k, entry] of cacheRef.current.entries()) {
      if (now - entry.timestamp > ttl) {
        cacheRef.current.delete(k);
        statsRef.current.evictions++;
      }
    }

    // Evict LRU entries if cache is full
    while (cacheRef.current.size >= maxSize) {
      let lruKey: K | undefined;
      let lruAccessCount = Infinity;
      
      for (const [k, entry] of cacheRef.current.entries()) {
        if (entry.accessCount < lruAccessCount) {
          lruAccessCount = entry.accessCount;
          lruKey = k;
        }
      }
      
      if (lruKey !== undefined) {
        cacheRef.current.delete(lruKey);
        statsRef.current.evictions++;
      } else {
        break;
      }
    }

    cacheRef.current.set(key, {
      value,
      timestamp: now,
      accessCount: 0
    });
  }, [maxSize, ttl]);

  const clear = useCallback((): void => {
    cacheRef.current.clear();
    statsRef.current = { hits: 0, misses: 0, evictions: 0 };
  }, []);

  const getStats = useCallback(() => {
    const { hits, misses, evictions } = statsRef.current;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    return {
      size: cacheRef.current.size,
      maxSize,
      hits,
      misses,
      evictions,
      hitRate: parseFloat(hitRate.toFixed(2))
    };
  }, [maxSize]);

  return { get, set, clear, getStats };
}

/**
 * Render optimization hook - prevents unnecessary re-renders
 */
export function useRenderOptimization<T extends Record<string, any>>(
  props: T,
  options?: {
    shallow?: boolean;
    ignoreKeys?: (keyof T)[];
  }
): T {
  const { shallow = true, ignoreKeys = [] } = options || {};
  const prevPropsRef = useRef<T>(props);

  return useMemo(() => {
    const hasChanged = shallow 
      ? Object.keys(props).some(key => {
          if (ignoreKeys.includes(key as keyof T)) return false;
          return props[key as keyof T] !== prevPropsRef.current[key as keyof T];
        })
      : JSON.stringify(props) !== JSON.stringify(prevPropsRef.current);

    if (hasChanged) {
      prevPropsRef.current = props;
    }

    return prevPropsRef.current;
  }, [props, shallow, ignoreKeys]);
}