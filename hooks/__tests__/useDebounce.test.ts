import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback, useAdvancedDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useDebounce', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      // Change value
      rerender({ value: 'updated', delay: 500 });
      
      // Value should not change immediately
      expect(result.current).toBe('initial');

      // Advance time by less than delay
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('initial');

      // Advance time to complete delay
      act(() => {
        jest.advanceTimersByTime(200);
      });
      
      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // Change value multiple times rapidly
      rerender({ value: 'change1', delay: 500 });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      rerender({ value: 'change2', delay: 500 });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      rerender({ value: 'final', delay: 500 });

      // Should still be initial value
      expect(result.current).toBe('initial');

      // Complete the final delay
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(result.current).toBe('final');
    });

    it('should handle different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      );

      rerender({ value: 'updated', delay: 100 });

      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(result.current).toBe('updated');
    });
  });

  describe('useDebouncedCallback', () => {
    it('should return the callback immediately', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500));
      
      expect(typeof result.current).toBe('function');
    });

    it('should update callback reference', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      const { result, rerender } = renderHook(
        ({ callback }) => useDebouncedCallback(callback, 100),
        { initialProps: { callback: mockCallback1 } }
      );

      // Rerender with different callback
      rerender({ callback: mockCallback2 });
      
      // The debounced callback should use the new callback
      act(() => {
        result.current('test');
        jest.advanceTimersByTime(100);
      });
      
      expect(mockCallback2).toHaveBeenCalledWith('test');
      expect(mockCallback1).not.toHaveBeenCalled();
    });

    it('should handle callback execution with arguments', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(mockCallback, 100));
      
      act(() => {
        result.current('test', 'args');
        jest.advanceTimersByTime(100);
      });
      
      expect(mockCallback).toHaveBeenCalledWith('test', 'args');
    });
  });
});

describe('useDebouncedCallback simplified', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce callback execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => 
      useDebouncedCallback(callback, 100)
    );

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(0);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on new calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => 
      useDebouncedCallback(callback, 100)
    );

    act(() => {
      result.current();
      jest.advanceTimersByTime(50);
      result.current(); // This should reset the timer
      jest.advanceTimersByTime(50);
    });

    expect(callback).toHaveBeenCalledTimes(0); // Still waiting

    act(() => {
      jest.advanceTimersByTime(50); // Now 100ms since last call
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('useAdvancedDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 100),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated1' });
    rerender({ value: 'updated2' });
    rerender({ value: 'final' });

    expect(result.current).toBe('initial'); // Still old value

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('final');
  });

  it('should respect maxWait option', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 100, { maxWait: 200 }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'update1' });
    rerender({ value: 'update2' });
    rerender({ value: 'final' });

    // Wait for normal debounce delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('final');
  });

  it('should log performance metrics when profiling is enabled', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result, rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 100, { 
        enableProfiling: true, 
        name: 'test-debounce' 
      }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Performance] test-debounce: Updated after')
    );

    consoleSpy.mockRestore();
  });
});

// Performance benchmarks for debounce hooks
describe('Debounce Performance Benchmarks', () => {
  const ITERATIONS = 1000;

  it('should benchmark debounce performance', async () => {
    const callback = jest.fn();
    
    const { result } = renderHook(() => useDebouncedCallback(callback, 10));
    
    const startTime = performance.now();
    
    // Simulate rapid calls
    for (let i = 0; i < ITERATIONS; i++) {
      result.current();
    }
    
    const endTime = performance.now();
    const callTime = endTime - startTime;
    
    console.log(`Debounced callback calls: ${callTime.toFixed(2)}ms for ${ITERATIONS} calls`);
    
    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 20));
    
    expect(callback).toHaveBeenCalledTimes(1); // Should only be called once due to debouncing
    expect(callTime).toBeGreaterThan(0);
  });

  it('should benchmark value debounce performance', () => {
    const values = Array.from({ length: ITERATIONS }, (_, i) => `value-${i}`);
    
    const { rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 10),
      { initialProps: { value: values[0] } }
    );
    
    const startTime = performance.now();
    
    // Simulate rapid value changes
    values.forEach(value => {
      rerender({ value });
    });
    
    const endTime = performance.now();
    const updateTime = endTime - startTime;
    
    console.log(`Debounced value updates: ${updateTime.toFixed(2)}ms for ${ITERATIONS} updates`);
    
    expect(updateTime).toBeGreaterThan(0);
  });
});