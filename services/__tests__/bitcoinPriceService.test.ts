import {
  getBitcoinPrices,
  getSupportedCurrencies,
  clearCache,
  resetServiceState,
  getCacheStatus,
  getRateLimitStatus,
} from '../bitcoinPriceService';
import { BitcoinPriceData, CoinGeckoResponse, ApiError } from '../../types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('BitcoinPriceService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    resetServiceState();
  });

  describe('getBitcoinPrices', () => {
    const mockCoinGeckoResponse: CoinGeckoResponse = {
      bitcoin: {
        usd: 45000,
        eur: 38000,
        gbp: 33000,
        jpy: 5000000,
        aud: 62000,
        cad: 57000,
      },
    };

    it('should fetch Bitcoin prices successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCoinGeckoResponse,
      });

      const result = await getBitcoinPrices(['usd', 'eur', 'gbp']);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,gbp',
        expect.objectContaining({
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'BitcoinForexCalculator/1.0',
          },
        })
      );

      expect(result).toEqual(mockCoinGeckoResponse.bitcoin);
    });

    it('should use cached data when available', async () => {
      // First call to populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCoinGeckoResponse,
      });

      await getBitcoinPrices(['usd', 'eur']);

      // Second call should use cache
      const result = await getBitcoinPrices(['usd', 'eur']);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCoinGeckoResponse.bitcoin);
    });

    it('should force refresh when requested', async () => {
      // First call to populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCoinGeckoResponse,
      });

      await getBitcoinPrices(['usd', 'eur']);

      // Second call with force refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: { usd: 46000, eur: 39000 },
        }),
      });

      const result = await getBitcoinPrices(['usd', 'eur'], true);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.usd).toBe(46000);
    });

    it('should retry on network errors with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCoinGeckoResponse,
        });

      const result = await getBitcoinPrices(['usd']);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockCoinGeckoResponse.bitcoin);
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(getBitcoinPrices(['usd'])).rejects.toThrow(ApiError);
      await expect(getBitcoinPrices(['usd'])).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getBitcoinPrices(['usd'])).rejects.toThrow(ApiError);
      await expect(getBitcoinPrices(['usd'])).rejects.toThrow('CoinGecko server error');
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(getBitcoinPrices(['usd'])).rejects.toThrow(ApiError);
      await expect(getBitcoinPrices(['usd'])).rejects.toThrow('Invalid response format');
    });

    it('should return cached data on non-critical errors', async () => {
      // First populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCoinGeckoResponse,
      });

      await getBitcoinPrices(['usd']);

      // Then simulate rate limiting
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await getBitcoinPrices(['usd']);
      expect(result).toEqual(mockCoinGeckoResponse.bitcoin);
    });

    it('should warn about missing currencies', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: { usd: 45000 }, // Missing EUR
        }),
      });

      await getBitcoinPrices(['usd', 'eur']);

      expect(consoleSpy).toHaveBeenCalledWith('Missing prices for currencies: eur');
      consoleSpy.mockRestore();
    });

    it('should throw error after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(getBitcoinPrices(['usd'])).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // MAX_RETRIES
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return list of supported currencies', () => {
      const currencies = getSupportedCurrencies();
      
      expect(currencies).toContain('usd');
      expect(currencies).toContain('eur');
      expect(currencies).toContain('gbp');
      expect(currencies).toContain('jpy');
      expect(currencies.length).toBeGreaterThan(15);
    });

    it('should return a copy of the array', () => {
      const currencies1 = getSupportedCurrencies();
      const currencies2 = getSupportedCurrencies();
      
      expect(currencies1).not.toBe(currencies2);
      expect(currencies1).toEqual(currencies2);
    });
  });

  describe('Cache Management', () => {
    const mockResponse = {
      bitcoin: { usd: 45000, eur: 38000 },
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
    });

    it('should clear cache', async () => {
      await getBitcoinPrices(['usd']);
      expect(getCacheStatus().hasCache).toBe(true);

      clearCache();
      expect(getCacheStatus().hasCache).toBe(false);
    });

    it('should provide cache status', async () => {
      const statusBefore = getCacheStatus();
      expect(statusBefore.hasCache).toBe(false);
      expect(statusBefore.isValid).toBe(false);

      await getBitcoinPrices(['usd']);

      const statusAfter = getCacheStatus();
      expect(statusAfter.hasCache).toBe(true);
      expect(statusAfter.isValid).toBe(true);
      expect(statusAfter.timestamp).toBeGreaterThan(0);
      expect(statusAfter.age).toBeGreaterThanOrEqual(0);
    });

    it('should expire cache after timeout', async () => {
      // Mock Date.now to control cache expiration
      const originalDateNow = Date.now;
      const mockTime = 1640995200000;
      Date.now = jest.fn(() => mockTime);

      await getBitcoinPrices(['usd']);
      expect(getCacheStatus().isValid).toBe(true);

      // Advance time beyond cache duration (30 seconds)
      Date.now = jest.fn(() => mockTime + 35 * 1000);

      expect(getCacheStatus().isValid).toBe(false);

      // This should fetch fresh data
      await getBitcoinPrices(['usd']);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting between requests', async () => {
      const mockResponse = {
        bitcoin: { usd: 45000 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const startTime = Date.now();
      
      // Make two consecutive requests
      await getBitcoinPrices(['usd'], true);
      await getBitcoinPrices(['usd'], true);
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should have waited at least 1.2 seconds between requests
      expect(elapsed).toBeGreaterThanOrEqual(1200);
    });

    it('should provide rate limit status', () => {
      const status = getRateLimitStatus();
      
      expect(status).toHaveProperty('isRateLimited');
      expect(status).toHaveProperty('resetTime');
      expect(status).toHaveProperty('timeUntilReset');
      expect(typeof status.isRateLimited).toBe('boolean');
    });

    it('should handle rate limit reset', async () => {
      // Simulate rate limiting
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      try {
        await getBitcoinPrices(['usd']);
      } catch (error) {
        // Expected to fail
      }

      const status = getRateLimitStatus();
      expect(status.isRateLimited).toBe(true);
      expect(status.timeUntilReset).toBeGreaterThan(0);
    });
  });

  describe('resetServiceState', () => {
    it('should reset all service state', async () => {
      // Populate cache and trigger rate limiting
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 45000 } }),
      });

      await getBitcoinPrices(['usd']);
      expect(getCacheStatus().hasCache).toBe(true);

      resetServiceState();

      expect(getCacheStatus().hasCache).toBe(false);
      expect(getRateLimitStatus().isRateLimited).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(getBitcoinPrices(['usd'])).rejects.toThrow(ApiError);
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(getBitcoinPrices(['usd'])).rejects.toThrow();
    });

    it('should preserve error messages in retry chain', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockFetch
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bitcoin: { usd: 45000 } }),
        });

      await getBitcoinPrices(['usd']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bitcoin price fetch attempt 1 failed'),
        'First error'
      );
      
      consoleSpy.mockRestore();
    });
  });
});