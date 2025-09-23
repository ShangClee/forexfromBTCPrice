import { renderHook, act } from '@testing-library/react';
import {
  useStableReference,
  useStableCallback,
  useDeepMemo,
  useMemoizedCalculation,
  useOptimizedCalculation,
  useAdvancedCache,
  useRenderOptimization,
  usePerformanceMonitor,
  useThrottle
} from '../performance';

describe('Performance Utilities', () => {
  describe('useStableReference', () => {
    it('should return same reference when dependencies do not change', () => {
      const value = { test: 'value' };
      const deps = ['dep1', 'dep2'];
      
      const { result, rerender } = renderHook(
        ({ value, deps }) => useStableReference(value, deps),
        { initialProps: { value, deps } }
      );

      const firstResult = result.current;
      
      // Rerender with same deps
      rerender({ value: { test: 'value' }, deps });
      
      expect(result.current).toBe(firstResult);
    });

    it('should return new reference when dependencies change', () => {
      const value = { test: 'value' };
      const deps = ['dep1', 'dep2'];
      
      const { result, rerender } = renderHook(
        ({ value, deps }) => useStableReference(value, deps),
        { initialProps: { value, deps } }
      );

      const firstResult = result.current;
      
      // Rerender with different deps
      rerender({ value: { test: 'new value' }, deps: ['dep1', 'dep3'] });
      
      expect(result.current).not.toBe(firstResult);
      expect(result.current).toEqual({ test: 'new value' });
    });
  });

  describe('useStableCallback', () => {
    it('should memoize callback with stable dependencies', () => {
      const callback = jest.fn();
      const deps = ['dep1'];
      
      const { result, rerender } = renderHook(
        ({ callback, deps }) => useStableCallback(callback, deps),
        { initialProps: { callback, deps } }
      );

      const firstCallback = result.current;
      
      // Rerender with same deps
      rerender({ callback: jest.fn(), deps });
      
      expect(result.current).toBe(firstCallback);
    });

    it('should update callback when dependencies change', () => {
      const callback = jest.fn();
      const deps = ['dep1'];
      
      const { result, rerender } = renderHook(
        ({ callback, deps }) => useStableCallback(callback, deps),
        { initialProps: { callback, deps } }
      );

      const firstCallback = result.current;
      
      // Rerender with different deps
      rerender({ callback: jest.fn(), deps: ['dep2'] });
      
      expect(result.current).not.toBe(firstCallback);
    });
  });

  describe('useDeepMemo', () => {
    it('should return same reference for deeply equal objects', () => {
      const value = { nested: { prop: 'value' } };
      
      const { result, rerender } = renderHook(
        ({ value }) => useDeepMemo(value),
        { initialProps: { value } }
      );

      const firstResult = result.current;
      
      // Rerender with deeply equal object
      rerender({ value: { nested: { prop: 'value' } } });
      
      expect(result.current).toBe(firstResult);
    });

    it('should return new reference for different objects', () => {
      const value = { nested: { prop: 'value' } };
      
      const { result, rerender } = renderHook(
        ({ value }) => useDeepMemo(value),
        { initialProps: { value } }
      );

      const firstResult = result.current;
      
      // Rerender with different object
      rerender({ value: { nested: { prop: 'different' } } });
      
      expect(result.current).not.toBe(firstResult);
      expect(result.current).toEqual({ nested: { prop: 'different' } });
    });
  });

  describe('useMemoizedCalculation', () => {
    it('should memoize expensive calculations', () => {
      const expensiveCalculation = jest.fn(() => 'result');
      const deps = ['dep1'];
      
      const { result, rerender } = renderHook(
        ({ calculation, deps }) => useMemoizedCalculation(calculation, deps),
        { initialProps: { calculation: expensiveCalculation, deps } }
      );

      expect(result.current).toBe('result');
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
      
      // Rerender with same deps
      rerender({ calculation: expensiveCalculation, deps });
      
      expect(result.current).toBe('result');
      expect(expensiveCalculation).toHaveBeenCalledTimes(1); // Should not recalculate
    });

    it('should recalculate when dependencies change', () => {
      const expensiveCalculation = jest.fn(() => 'result');
      const deps = ['dep1'];
      
      const { result, rerender } = renderHook(
        ({ calculation, deps }) => useMemoizedCalculation(calculation, deps),
        { initialProps: { calculation: expensiveCalculation, deps } }
      );

      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
      
      // Rerender with different deps
      rerender({ calculation: expensiveCalculation, deps: ['dep2'] });
      
      expect(expensiveCalculation).toHaveBeenCalledTimes(2); // Should recalculate
    });
  });

  describe('useOptimizedCalculation', () => {
    it('should cache calculation results', () => {
      const calculation = jest.fn(() => Math.random());
      const deps = ['dep1'];
      
      const { result, rerender } = renderHook(
        ({ calculation, deps }) => useOptimizedCalculation(calculation, deps),
        { initialProps: { calculation, deps } }
      );

      const firstResult = result.current;
      expect(calculation).toHaveBeenCalledTimes(1);
      
      // Rerender with same deps - should use cache
      rerender({ calculation, deps });
      
      expect(result.current).toBe(firstResult);
      expect(calculation).toHaveBeenCalledTimes(1); // Should not recalculate
    });

    it('should respect cache size limit', () => {
      const calculation = jest.fn((dep: string) => `result-${dep}`);
      
      const { rerender } = renderHook(
        ({ deps }) => useOptimizedCalculation(() => calculation(deps[0]), deps, { cacheSize: 2 }),
        { initialProps: { deps: ['dep1'] } }
      );

      // Fill cache
      rerender({ deps: ['dep1'] });
      rerender({ deps: ['dep2'] });
      rerender({ deps: ['dep3'] }); // Should evict dep1
      
      // Go back to dep1 - should recalculate
      rerender({ deps: ['dep1'] });
      
      expect(calculation).toHaveBeenCalledWith('dep1');
      expect(calculation).toHaveBeenCalledWith('dep2');
      expect(calculation).toHaveBeenCalledWith('dep3');
      expect(calculation).toHaveBeenCalledTimes(4); // dep1 called twice due to eviction
    });
  });

  describe('useAdvancedCache', () => {
    it('should cache and retrieve values', () => {
      const { result } = renderHook(() => useAdvancedCache<string, number>());
      
      act(() => {
        result.current.set('key1', 100);
      });
      
      expect(result.current.get('key1')).toBe(100);
      expect(result.current.get('nonexistent')).toBeUndefined();
    });

    it('should respect TTL', async () => {
      const { result } = renderHook(() => useAdvancedCache<string, number>(10, 100)); // 100ms TTL
      
      act(() => {
        result.current.set('key1', 100);
      });
      
      expect(result.current.get('key1')).toBe(100);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(result.current.get('key1')).toBeUndefined();
    });

    it('should track cache statistics', () => {
      const { result } = renderHook(() => useAdvancedCache<string, number>());
      
      act(() => {
        result.current.set('key1', 100);
        result.current.get('key1'); // hit
        result.current.get('nonexistent'); // miss
      });
      
      const stats = result.current.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    it('should evict LRU entries when cache is full', () => {
      const { result } = renderHook(() => useAdvancedCache<string, number>(2)); // Max size 2
      
      act(() => {
        result.current.set('key1', 100);
        result.current.set('key2', 200);
        result.current.get('key1'); // Make key1 more recently used
        result.current.set('key3', 300); // Should evict key2
      });
      
      expect(result.current.get('key1')).toBe(100);
      expect(result.current.get('key2')).toBeUndefined(); // Evicted
      expect(result.current.get('key3')).toBe(300);
    });
  });

  describe('useRenderOptimization', () => {
    it('should prevent unnecessary re-renders with shallow comparison', () => {
      const props = { a: 1, b: 2 };
      
      const { result, rerender } = renderHook(
        ({ props }) => useRenderOptimization(props),
        { initialProps: { props } }
      );

      const firstResult = result.current;
      
      // Rerender with same props
      rerender({ props: { a: 1, b: 2 } });
      
      expect(result.current).toBe(firstResult);
    });

    it('should allow re-renders when props actually change', () => {
      const props = { a: 1, b: 2 };
      
      const { result, rerender } = renderHook(
        ({ props }) => useRenderOptimization(props),
        { initialProps: { props } }
      );

      const firstResult = result.current;
      
      // Rerender with different props
      rerender({ props: { a: 1, b: 3 } });
      
      expect(result.current).not.toBe(firstResult);
      expect(result.current).toEqual({ a: 1, b: 3 });
    });

    it('should ignore specified keys', () => {
      const props = { a: 1, b: 2, ignored: 'value' };
      
      const { result, rerender } = renderHook(
        ({ props }) => useRenderOptimization(props, { ignoreKeys: ['ignored'] }),
        { initialProps: { props } }
      );

      const firstResult = result.current;
      
      // Rerender with only ignored key changed
      rerender({ props: { a: 1, b: 2, ignored: 'different' } });
      
      expect(result.current).toBe(firstResult);
    });
  });

  describe('usePerformanceMonitor', () => {
    it('should measure performance when enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const { result } = renderHook(() => usePerformanceMonitor('test', true));
      
      act(() => {
        result.current.start();
        // Simulate some work
        result.current.end();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] test:')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not measure performance when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const { result } = renderHook(() => usePerformanceMonitor('test', false));
      
      act(() => {
        result.current.start();
        result.current.end();
      });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('useThrottle', () => {
    it('should throttle function calls', async () => {
      const callback = jest.fn();
      const delay = 100;
      
      const { result } = renderHook(() => useThrottle(callback, delay));
      
      // First call should execute immediately
      act(() => {
        result.current();
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Subsequent calls within delay should be throttled
      act(() => {
        result.current();
        result.current();
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Wait for throttle delay
      await new Promise(resolve => setTimeout(resolve, delay + 10));
      
      // Call after delay should execute
      act(() => {
        result.current();
      });
      
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  const ITERATIONS = 1000;
  
  it('should benchmark useOptimizedCalculation vs useMemo', () => {
    const expensiveCalculation = () => {
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += Math.random();
      }
      return result;
    };

    // Benchmark useOptimizedCalculation
    const startOptimized = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const { result } = renderHook(() => 
        useOptimizedCalculation(expensiveCalculation, [i % 10]) // 10 different cache keys
      );
      result.current;
    }
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`useOptimizedCalculation: ${optimizedTime.toFixed(2)}ms for ${ITERATIONS} iterations`);
    
    // This test mainly serves as a benchmark - we don't assert specific times
    // as they vary by environment, but we log them for analysis
    expect(optimizedTime).toBeGreaterThan(0);
  });

  it('should benchmark cache performance', () => {
    const { result } = renderHook(() => useAdvancedCache<number, string>());
    
    // Benchmark cache operations
    const startTime = performance.now();
    
    act(() => {
      // Set operations
      for (let i = 0; i < ITERATIONS; i++) {
        result.current.set(i, `value-${i}`);
      }
      
      // Get operations
      for (let i = 0; i < ITERATIONS; i++) {
        result.current.get(i);
      }
    });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`Cache operations: ${totalTime.toFixed(2)}ms for ${ITERATIONS * 2} operations`);
    
    const stats = result.current.getStats();
    console.log(`Cache stats:`, stats);
    
    expect(totalTime).toBeGreaterThan(0);
    expect(stats.hits).toBeGreaterThan(0);
  });
});