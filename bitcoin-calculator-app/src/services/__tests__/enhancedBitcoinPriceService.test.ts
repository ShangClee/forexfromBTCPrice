import {
  getBitcoinPricesWithErrorHandling,
  getBitcoinPriceForPair,
  checkBitcoinPriceServiceHealth,
  resetBitcoinPriceServiceCircuitBreaker,
  clearBitcoinPriceFallbackData,
  getBitcoinPriceServiceStats,
} from '../enhancedBitcoinPriceService';
import * as originalService from '../bitcoinPriceService';
import { EnhancedError } from '../../utils/errorHandling';
import { ApiError } from '../../types';

// Mock the original service
jest.mock('../bitcoinPriceService');
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
  clearBitcoinPriceFallbackData();
  resetBitcoinPriceServiceCircuitBreaker();
});

describe('Enhanced Bitcoin Price Service', () => {
  const mockBitcoinPrices = {
    usd: 50000,
    eur: 42000,
    gbp: 36000,
  };

  describe('getBitcoinPricesWithErrorHandling', () => {
    it('should return prices on successful fetch', async () => {
      mockOriginalService.getBitcoinPrices.mockResolvedValue(mockBitcoinPrices);
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd', 'eur', 'gbp']);

      const result = await getBitcoinPricesWithErrorHandling();

      expect(result).toEqual(mockBitcoinPrices);
      expect(mockOriginalService.getBitcoinPrices).toHaveBeenCalledWith(['usd', 'eur', 'gbp'], false);
    });

    it('should store fallback data on successful fetch', async () => {
      mockOriginalService.getBitcoinPrices.mockResolvedValue(mockBitcoinPrices);
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd', 'eur', 'gbp']);

      await getBitcoinPricesWithErrorHandling();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'bitcoin_prices_fallback',
        expect.stringContaining('"usd":50000')
      );
    });

    it('should throw enhanced error when API fails and no fallback', async () => {
      // Mock API failure
      mockOriginalService.getBitcoinPrices.mockRejectedValue(
        new ApiError('API failed', 500, 'SERVER_ERROR')
      );
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd', 'eur', 'gbp']);

      await expect(getBitcoinPricesWithErrorHandling()).rejects.toThrow(EnhancedError);
    });

    it('should throw enhanced error when no fallback available', async () => {
      mockOriginalService.getBitcoinPrices.mockRejectedValue(
        new ApiError('API failed', 500, 'SERVER_ERROR')
      );
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd', 'eur', 'gbp']);

      await expect(getBitcoinPricesWithErrorHandling()).rejects.toThrow(EnhancedError);
    });

    it('should not retry rate limit errors immediately', async () => {
      mockOriginalService.getBitcoinPrices.mockRejectedValue(
        new Error('Rate limit exceeded')
      );
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd']);

      await expect(getBitcoinPricesWithErrorHandling()).rejects.toThrow();

      // Should only be called once (no retries for rate limit)
      expect(mockOriginalService.getBitcoinPrices).toHaveBeenCalledTimes(1);
    });

    it('should ignore old fallback data', async () => {
      // Setup old fallback data (25 hours ago)
      const oldFallbackData = {
        data: mockBitcoinPrices,
        timestamp: Date.now() - (25 * 60 * 60 * 1000),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldFallbackData));

      mockOriginalService.getBitcoinPrices.mockRejectedValue(
        new ApiError('API failed', 500, 'SERVER_ERROR')
      );
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd']);

      await expect(getBitcoinPricesWithErrorHandling()).rejects.toThrow(EnhancedError);
    });
  });

  describe('getBitcoinPriceForPair', () => {
    it('should return prices for currency pair', async () => {
      mockOriginalService.getBitcoinPrices.mockResolvedValue(mockBitcoinPrices);
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd', 'eur', 'gbp']);

      const result = await getBitcoinPriceForPair('USD', 'EUR');

      expect(result).toEqual({
        sourcePrice: 50000,
        targetPrice: 42000,
      });
    });

    it('should throw error for unavailable currencies', async () => {
      mockOriginalService.getBitcoinPrices.mockResolvedValue({ usd: 50000 });
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd', 'eur']);

      await expect(getBitcoinPriceForPair('USD', 'JPY')).rejects.toThrow(EnhancedError);
    });

    it('should handle case-insensitive currency codes', async () => {
      mockOriginalService.getBitcoinPrices.mockResolvedValue(mockBitcoinPrices);
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd', 'eur', 'gbp']);

      const result = await getBitcoinPriceForPair('usd', 'eur');

      expect(result).toEqual({
        sourcePrice: 50000,
        targetPrice: 42000,
      });
    });
  });

  describe('checkBitcoinPriceServiceHealth', () => {
    it('should return healthy status when service works', async () => {
      mockOriginalService.getBitcoinPrices.mockResolvedValue({ usd: 50000 });
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd']);

      const health = await checkBitcoinPriceServiceHealth();

      expect(health.status).toBe('healthy');
      expect(health.circuitBreakerState).toBe('CLOSED');
    });

    it('should return unhealthy status when service fails and no fallback', async () => {
      mockOriginalService.getBitcoinPrices.mockRejectedValue(new Error('API failed'));
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd']);

      const health = await checkBitcoinPriceServiceHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.hasFallbackData).toBe(false);
      expect(health.lastError).toBeTruthy();
    });

    it('should return unhealthy status when service fails and no fallback', async () => {
      mockOriginalService.getBitcoinPrices.mockRejectedValue(new Error('API failed'));
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd']);

      const health = await checkBitcoinPriceServiceHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.hasFallbackData).toBe(false);
      expect(health.lastError).toBeTruthy();
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should track circuit breaker state', () => {
      const stats = getBitcoinPriceServiceStats();
      expect(stats.circuitBreaker).toHaveProperty('state');
      expect(stats.circuitBreaker).toHaveProperty('failures');
    });

    it('should reset circuit breaker', () => {
      resetBitcoinPriceServiceCircuitBreaker();
      
      const stats = getBitcoinPriceServiceStats();
      expect(stats.circuitBreaker.state).toBe('CLOSED');
      expect(stats.circuitBreaker.failures).toBe(0);
    });
  });

  describe('Fallback Data Management', () => {
    it('should clear fallback data', () => {
      clearBitcoinPriceFallbackData();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('bitcoin_prices_fallback');
      
      const stats = getBitcoinPriceServiceStats();
      expect(stats.hasFallbackData).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      mockOriginalService.getBitcoinPrices.mockResolvedValue(mockBitcoinPrices);
      mockOriginalService.getSupportedCurrencies.mockReturnValue(['usd']);

      // Should not throw even if localStorage fails
      expect(async () => {
        await getBitcoinPricesWithErrorHandling();
      }).not.toThrow();
    });
  });

  describe('Service Statistics', () => {
    it('should return service statistics', () => {
      const stats = getBitcoinPriceServiceStats();
      
      expect(stats).toHaveProperty('circuitBreaker');
      expect(stats).toHaveProperty('hasFallbackData');
      expect(stats).toHaveProperty('fallbackDataAge');
      expect(stats.circuitBreaker).toHaveProperty('state');
      expect(stats.circuitBreaker).toHaveProperty('failures');
    });
  });
});