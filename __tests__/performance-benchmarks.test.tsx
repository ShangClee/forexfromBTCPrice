import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import BitcoinForexCalculator from '../bitcoin-forex-calculator';
import AmountInput from '../components/AmountInput';
import ComparisonDisplay from '../components/ComparisonDisplay';
import CalculationBreakdown from '../components/CalculationBreakdown';
import { useAdvancedDebounce } from '../hooks/useDebounce';
import { useOptimizedCalculation, useAdvancedCache } from '../utils/performance';

// Mock the services to avoid actual API calls
jest.mock('../services/enhancedBitcoinPriceService', () => ({
  getBitcoinPricesWithErrorHandling: jest.fn().mockResolvedValue({
    usd: 50000,
    eur: 45000,
    gbp: 40000,
    jpy: 5500000,
  }),
}));

jest.mock('../services/enhancedForexRateService', () => ({
  fetchForexRatesWithErrorHandling: jest.fn().mockResolvedValue({
    base: 'USD',
    date: '2023-01-01',
    rates: {
      EUR: 0.9,
      GBP: 0.8,
      JPY: 110,
    },
  }),
}));

jest.mock('../services/calculationService', () => ({
  compareRates: jest.fn().mockReturnValue({
    sourceCurrency: 'USD',
    targetCurrency: 'EUR',
    amount: 1000,
    traditionalRate: 0.9,
    bitcoinRate: 0.9,
    traditionalAmount: 900,
    bitcoinAmount: 900,
    percentageDifference: 0,
    betterMethod: 'equal',
    arbitrageOpportunity: false,
  }),
}));

describe('Performance Benchmarks', () => {
  const PERFORMANCE_ITERATIONS = 100;
  const RENDER_ITERATIONS = 50;

  beforeEach(() => {
    // Clear any existing performance marks
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  });

  describe('Component Rendering Performance', () => {
    it('should benchmark AmountInput rendering performance', () => {
      const onChange = jest.fn();
      const startTime = performance.now();

      for (let i = 0; i < RENDER_ITERATIONS; i++) {
        const { unmount } = render(
          <AmountInput
            amount={`${1000 + i}`}
            currency="USD"
            onChange={onChange}
            disabled={false}
          />
        );
        unmount();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / RENDER_ITERATIONS;

      console.log(`AmountInput rendering: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms average`);
      
      expect(totalTime).toBeGreaterThan(0);
      expect(avgTime).toBeLessThan(50); // Should render in less than 50ms on average
    });

    it('should benchmark ComparisonDisplay rendering performance', () => {
      const startTime = performance.now();

      for (let i = 0; i < RENDER_ITERATIONS; i++) {
        const { unmount } = render(
          <ComparisonDisplay
            traditionalRate={0.9 + i * 0.001}
            bitcoinRate={0.9 + i * 0.0005}
            amount={1000 + i}
            sourceCurrency="USD"
            targetCurrency="EUR"
            loading={false}
          />
        );
        unmount();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / RENDER_ITERATIONS;

      console.log(`ComparisonDisplay rendering: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms average`);
      
      expect(totalTime).toBeGreaterThan(0);
      expect(avgTime).toBeLessThan(100); // Should render in less than 100ms on average
    });

    it('should benchmark CalculationBreakdown rendering performance', () => {
      const startTime = performance.now();

      for (let i = 0; i < RENDER_ITERATIONS; i++) {
        const { unmount } = render(
          <CalculationBreakdown
            sourceBtcPrice={50000 + i * 100}
            targetBtcPrice={45000 + i * 90}
            amount={1000 + i}
            sourceCurrency="USD"
            targetCurrency="EUR"
            expanded={i % 2 === 0}
          />
        );
        unmount();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / RENDER_ITERATIONS;

      console.log(`CalculationBreakdown rendering: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms average`);
      
      expect(totalTime).toBeGreaterThan(0);
      expect(avgTime).toBeLessThan(150); // Should render in less than 150ms on average
    });
  });

  describe('Hook Performance', () => {
    it('should benchmark useAdvancedDebounce performance', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useAdvancedDebounce(value, 10),
        { initialProps: { value: 'initial' } }
      );

      const startTime = performance.now();

      // Simulate rapid value changes
      for (let i = 0; i < PERFORMANCE_ITERATIONS; i++) {
        rerender({ value: `value-${i}` });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`useAdvancedDebounce: ${totalTime.toFixed(2)}ms for ${PERFORMANCE_ITERATIONS} updates`);

      // Wait for debounce to settle
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(result.current).toBe(`value-${PERFORMANCE_ITERATIONS - 1}`);
      expect(totalTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should benchmark useOptimizedCalculation performance', () => {
      const expensiveCalculation = jest.fn(() => {
        // Simulate expensive calculation
        let result = 0;
        for (let i = 0; i < 1000; i++) {
          result += Math.random();
        }
        return result;
      });

      const { result, rerender } = renderHook(
        ({ deps }) => useOptimizedCalculation(expensiveCalculation, deps, { cacheSize: 10 }),
        { initialProps: { deps: [1] } }
      );

      const startTime = performance.now();

      // Test cache hits and misses
      for (let i = 0; i < PERFORMANCE_ITERATIONS; i++) {
        rerender({ deps: [i % 10] }); // 10 different cache keys
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`useOptimizedCalculation: ${totalTime.toFixed(2)}ms for ${PERFORMANCE_ITERATIONS} calculations`);
      console.log(`Expensive calculation called ${expensiveCalculation.mock.calls.length} times (cache efficiency: ${((PERFORMANCE_ITERATIONS - expensiveCalculation.mock.calls.length) / PERFORMANCE_ITERATIONS * 100).toFixed(1)}%)`);

      expect(totalTime).toBeGreaterThan(0);
      expect(expensiveCalculation.mock.calls.length).toBeLessThan(PERFORMANCE_ITERATIONS); // Should use cache
    });

    it('should benchmark useAdvancedCache performance', () => {
      const { result } = renderHook(() => useAdvancedCache<number, string>(100, 60000));

      const startTime = performance.now();

      // Benchmark set operations
      for (let i = 0; i < PERFORMANCE_ITERATIONS; i++) {
        act(() => {
          result.current.set(i, `value-${i}`);
        });
      }

      const setTime = performance.now();

      // Benchmark get operations
      for (let i = 0; i < PERFORMANCE_ITERATIONS; i++) {
        result.current.get(i);
      }

      const endTime = performance.now();

      const setDuration = setTime - startTime;
      const getDuration = endTime - setTime;
      const totalTime = endTime - startTime;

      console.log(`useAdvancedCache set operations: ${setDuration.toFixed(2)}ms for ${PERFORMANCE_ITERATIONS} operations`);
      console.log(`useAdvancedCache get operations: ${getDuration.toFixed(2)}ms for ${PERFORMANCE_ITERATIONS} operations`);
      console.log(`useAdvancedCache total: ${totalTime.toFixed(2)}ms`);

      const stats = result.current.getStats();
      console.log(`Cache stats:`, stats);

      expect(totalTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(stats.hitRate).toBe(100); // All gets should be hits
    });
  });

  describe('Integration Performance', () => {
    it('should benchmark main calculator component initial render', async () => {
      const startTime = performance.now();

      render(<BitcoinForexCalculator />);

      // Wait for initial data loading
      await waitFor(() => {
        expect(screen.getByText(/Bitcoin Forex Calculator/)).toBeInTheDocument();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`BitcoinForexCalculator initial render: ${totalTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(5000); // Should render within 5 seconds
    });

    it('should benchmark user interaction performance', async () => {
      render(<BitcoinForexCalculator />);

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByText(/Bitcoin Forex Calculator/)).toBeInTheDocument();
      });

      const amountInput = screen.getByPlaceholderText(/Enter amount/i);
      
      const startTime = performance.now();

      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        fireEvent.change(amountInput, { target: { value: `${1000 + i}` } });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`User interaction (10 input changes): ${totalTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(500); // Should handle interactions quickly
    });

    it('should benchmark memory usage during extended use', async () => {
      const { rerender } = render(<BitcoinForexCalculator />);

      // Measure initial memory if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Simulate extended use with many re-renders
      for (let i = 0; i < 50; i++) {
        rerender(<BitcoinForexCalculator key={i} />);
        
        // Occasionally trigger garbage collection if available
        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      if (initialMemory > 0) {
        console.log(`Memory usage: ${(initialMemory / 1024 / 1024).toFixed(2)}MB -> ${(finalMemory / 1024 / 1024).toFixed(2)}MB (increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB)`);
        
        // Memory increase should be reasonable (less than 50MB for this test)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      } else {
        console.log('Memory measurement not available in this environment');
      }
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain consistent rendering performance', () => {
      const renderTimes: number[] = [];

      // Measure multiple renders
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        const { unmount } = render(
          <ComparisonDisplay
            traditionalRate={0.9}
            bitcoinRate={0.9}
            amount={1000}
            sourceCurrency="USD"
            targetCurrency="EUR"
            loading={false}
          />
        );
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
        
        unmount();
      }

      const avgTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      const maxTime = Math.max(...renderTimes);
      const minTime = Math.min(...renderTimes);
      const variance = renderTimes.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / renderTimes.length;
      const stdDev = Math.sqrt(variance);

      console.log(`Render performance stats: avg=${avgTime.toFixed(2)}ms, min=${minTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, stdDev=${stdDev.toFixed(2)}ms`);

      // Performance should be consistent (low standard deviation)
      expect(stdDev).toBeLessThan(avgTime * 0.5); // Standard deviation should be less than 50% of average
      expect(maxTime).toBeLessThan(avgTime * 3); // Max time should not be more than 3x average
    });

    it('should handle stress testing without performance degradation', async () => {
      const { result } = renderHook(() => useAdvancedCache<string, number>(1000, 60000));

      const batchSize = 100;
      const batches = 10;
      const batchTimes: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const startTime = performance.now();

        act(() => {
          for (let i = 0; i < batchSize; i++) {
            const key = `batch-${batch}-item-${i}`;
            result.current.set(key, i);
            result.current.get(key);
          }
        });

        const endTime = performance.now();
        batchTimes.push(endTime - startTime);
      }

      const firstBatchTime = batchTimes[0];
      const lastBatchTime = batchTimes[batchTimes.length - 1];
      const avgTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;

      console.log(`Stress test batch times: first=${firstBatchTime.toFixed(2)}ms, last=${lastBatchTime.toFixed(2)}ms, avg=${avgTime.toFixed(2)}ms`);

      // Performance should not degrade significantly over time
      expect(lastBatchTime).toBeLessThan(firstBatchTime * 2); // Last batch should not be more than 2x slower than first
      
      const stats = result.current.getStats();
      console.log(`Final cache stats:`, stats);
      
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });
});