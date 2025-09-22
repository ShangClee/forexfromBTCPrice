import {
  fetchForexRatesWithErrorHandling,
  getExchangeRateWithErrorHandling,
  convertCurrencyWithErrorHandling,
  checkForexRateServiceHealth,
  resetForexRateServiceCircuitBreaker,
  clearForexRateFallbackData,
  getForexRateServiceStats,
} from '../enhancedForexRateService';
import * as originalService from '../forexRateService';
import { EnhancedError } from '../../utils/errorHandling';
import { ForexRateData } from '../../types';

// Mock the original service
jest.mock('../forexRateService');
const mockOriginalService = originalService as jest.Mocked<typeof originalService>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock console methods
const originalConsoleWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue(null);
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  clearForexRateFallbackData();
  resetForexRateServiceCircuitBreaker();
});

describe('Enhanced Forex Rate Service', () => {
  const mockForexRates: ForexRateData = {
    base: 'USD',
    date: '2023-12-01',
    rates: {
      EUR: 0.85,
      GBP: 0.72,
      JPY: 110.5,
      CAD: 1.25,
    },
  };

  describe('fetchForexRatesWithErrorHandling', () => {
    it('should return rates on successful fetch', async () => {
      mockOriginalService.fetchForexRates.mockResolvedValue(mockForexRates);

      const result = await fetchForexRatesWithErrorHandling('USD');

      expect(result).toEqual(mockForexRates);
      expect(mockOriginalService.fetchForexRates).toHaveBeenCalledWith('USD');
    });

    it('should store fallback data on successful fetch', async () => {
      mockOriginalService.fetchForexRates.mockResolvedValue(mockForexRates);

      await fetchForexRatesWithErrorHandling('USD');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'forex_rates_fallback',
        expect.stringContaining('"EUR":0.85')
      );
    });

    it('should throw enhanced error when API fails and no fallback', async () => {
      // Mock API failure
      mockOriginalService.fetchForexRates.mockRejectedValue(new Error('API failed'));

      await expect(fetchForexRatesWithErrorHandling('USD')).rejects.toThrow(EnhancedError);
    });

    it('should throw enhanced error when no fallback available', async () => {
      mockOriginalService.fetchForexRates.mockRejectedValue(new Error('API failed'));

      await expect(fetchForexRatesWithErrorHandling('USD')).rejects.toThrow(EnhancedError);
    });

    it('should ignore old fallback data', async () => {
      // Setup old fallback data (25 hours ago)
      const oldFallbackData = {
        data: { USD: mockForexRates },
        timestamp: Date.now() - (25 * 60 * 60 * 1000),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldFallbackData));

      mockOriginalService.fetchForexRates.mockRejectedValue(new Error('API failed'));

      await expect(fetchForexRatesWithErrorHandling('USD')).rejects.toThrow(EnhancedError);
    });
  });

  describe('getExchangeRateWithErrorHandling', () => {
    it('should return 1 for same currency', async () => {
      const result = await getExchangeRateWithErrorHandling('USD', 'USD');
      expect(result).toBe(1);
    });

    it('should return exchange rate for different currencies', async () => {
      mockOriginalService.fetchForexRates.mockResolvedValue(mockForexRates);

      const result = await getExchangeRateWithErrorHandling('USD', 'EUR');

      expect(result).toBe(0.85);
    });

    it('should throw error for unavailable currency', async () => {
      mockOriginalService.fetchForexRates.mockResolvedValue(mockForexRates);

      await expect(getExchangeRateWithErrorHandling('USD', 'XYZ')).rejects.toThrow(EnhancedError);
    });

    it('should handle cross-rate calculation errors', async () => {
      // Mock API failure for both direct and cross-rate attempts
      mockOriginalService.fetchForexRates.mockRejectedValue(new Error('API failed'));

      await expect(getExchangeRateWithErrorHandling('EUR', 'GBP')).rejects.toThrow(EnhancedError);
    });
  });

  describe('convertCurrencyWithErrorHandling', () => {
    it('should convert currency amounts', async () => {
      mockOriginalService.fetchForexRates.mockResolvedValue(mockForexRates);

      const result = await convertCurrencyWithErrorHandling(100, 'USD', 'EUR');

      expect(result).toBe(85); // 100 * 0.85
    });

    it('should throw error for invalid amount', async () => {
      await expect(convertCurrencyWithErrorHandling(0, 'USD', 'EUR')).rejects.toThrow(EnhancedError);
      await expect(convertCurrencyWithErrorHandling(-100, 'USD', 'EUR')).rejects.toThrow(EnhancedError);
    });

    it('should handle conversion errors', async () => {
      mockOriginalService.fetchForexRates.mockRejectedValue(new Error('API failed'));

      await expect(convertCurrencyWithErrorHandling(100, 'USD', 'EUR')).rejects.toThrow(EnhancedError);
    });
  });

  describe('checkForexRateServiceHealth', () => {
    it('should return healthy status when service works', async () => {
      mockOriginalService.fetchForexRates.mockResolvedValue(mockForexRates);

      const health = await checkForexRateServiceHealth();

      expect(health.status).toBe('healthy');
      expect(health.circuitBreakerState).toBe('CLOSED');
      expect(health.availableCurrencies).toEqual([]);
    });

    it('should return unhealthy status when service fails and no fallback', async () => {
      mockOriginalService.fetchForexRates.mockRejectedValue(new Error('API failed'));

      const health = await checkForexRateServiceHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.hasFallbackData).toBe(false);
      expect(health.availableCurrencies).toEqual([]);
      expect(health.lastError).toBeTruthy();
    });

    it('should return unhealthy status when service fails and no fallback', async () => {
      mockOriginalService.fetchForexRates.mockRejectedValue(new Error('API failed'));

      const health = await checkForexRateServiceHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.hasFallbackData).toBe(false);
      expect(health.availableCurrencies).toEqual([]);
      expect(health.lastError).toBeTruthy();
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should track circuit breaker state', () => {
      const stats = getForexRateServiceStats();
      expect(stats.circuitBreaker).toHaveProperty('state');
      expect(stats.circuitBreaker).toHaveProperty('failures');
    });

    it('should reset circuit breaker', () => {
      resetForexRateServiceCircuitBreaker();
      
      const stats = getForexRateServiceStats();
      expect(stats.circuitBreaker.state).toBe('CLOSED');
      expect(stats.circuitBreaker.failures).toBe(0);
    });
  });

  describe('Fallback Data Management', () => {
    it('should clear fallback data', () => {
      clearForexRateFallbackData();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('forex_rates_fallback');
      
      const stats = getForexRateServiceStats();
      expect(stats.hasFallbackData).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      mockOriginalService.fetchForexRates.mockResolvedValue(mockForexRates);

      // Should not throw even if localStorage fails
      expect(async () => {
        await fetchForexRatesWithErrorHandling('USD');
      }).not.toThrow();
    });
  });

  describe('Service Statistics', () => {
    it('should return service statistics', () => {
      const stats = getForexRateServiceStats();
      
      expect(stats).toHaveProperty('circuitBreaker');
      expect(stats).toHaveProperty('hasFallbackData');
      expect(stats).toHaveProperty('availableCurrencies');
      expect(stats).toHaveProperty('fallbackDataAge');
      expect(stats.circuitBreaker).toHaveProperty('state');
      expect(stats.circuitBreaker).toHaveProperty('failures');
    });

    it('should return empty array for available currencies when no fallback data', () => {
      const stats = getForexRateServiceStats();
      expect(stats.availableCurrencies).toEqual([]);
    });
  });
});