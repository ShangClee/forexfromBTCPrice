import {
  fetchForexRates,
  getExchangeRate,
  convertCurrency,
  clearForexCache,
  getCacheStats,
  checkForexServiceHealth,
  ForexApiError,
} from '../forexRateService';
import { ForexRateData, ExchangeRateApiResponse, FixerApiResponse } from '../../types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ForexRateService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    clearForexCache();
  });

  describe('fetchForexRates', () => {
    const mockExchangeRateApiResponse: ExchangeRateApiResponse = {
      result: 'success',
      documentation: 'https://www.exchangerate-api.com/docs',
      terms_of_use: 'https://www.exchangerate-api.com/terms',
      time_last_update_unix: 1640995200,
      time_last_update_utc: 'Sat, 01 Jan 2022 00:00:00 +0000',
      time_next_update_unix: 1641081600,
      time_next_update_utc: 'Sun, 02 Jan 2022 00:00:00 +0000',
      base_code: 'USD',
      conversion_rates: {
        EUR: 0.8854,
        GBP: 0.7404,
        JPY: 115.11,
        AUD: 1.3845,
        CAD: 1.2684,
      },
    };

    const mockFixerApiResponse: FixerApiResponse = {
      success: true,
      timestamp: 1640995200,
      base: 'USD',
      date: '2022-01-01',
      rates: {
        EUR: 0.8854,
        GBP: 0.7404,
        JPY: 115.11,
        AUD: 1.3845,
        CAD: 1.2684,
      },
    };

    it('should fetch forex rates from primary API successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateApiResponse,
      });

      const result = await fetchForexRates('USD');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.exchangerate-api.com/v4/latest/USD',
        expect.objectContaining({
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual({
        base: 'USD',
        date: '2022-01-01',
        rates: mockExchangeRateApiResponse.conversion_rates,
      });
    });

    it('should use cached data when available', async () => {
      // First call to populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateApiResponse,
      });

      await fetchForexRates('USD');

      // Second call should use cache
      const result = await fetchForexRates('USD');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.base).toBe('USD');
    });

    it('should fallback to open.er-api.com when primary API fails', async () => {
      // Primary API fails all retries
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      // Fallback API succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFixerApiResponse,
      });

      const result = await fetchForexRates('USD');

      expect(mockFetch).toHaveBeenCalledTimes(4); // 3 retries + 1 fallback
      expect(result).toEqual({
        base: 'USD',
        date: '2022-01-01',
        rates: mockFixerApiResponse.rates,
      });
    });

    it('should retry primary API with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateApiResponse,
        });

      const result = await fetchForexRates('USD');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.base).toBe('USD');
    });

    it('should throw error when both APIs fail', async () => {
      // Clear any existing cache first
      clearForexCache();
      
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchForexRates('USD')).rejects.toThrow(ForexApiError);
      await expect(fetchForexRates('USD')).rejects.toThrow('Both forex APIs failed');
    }, 10000);

    it('should handle API response errors', async () => {
      clearForexCache();
      
      // Primary API fails with HTTP errors (all retries)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        });

      // Fallback API also fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(fetchForexRates('USD')).rejects.toThrow(ForexApiError);
    });

    it('should handle unsuccessful API results', async () => {
      clearForexCache();
      
      const unsuccessfulResponse = {
        ...mockExchangeRateApiResponse,
        result: 'error',
      };

      // Primary API returns unsuccessful result (all retries)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => unsuccessfulResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => unsuccessfulResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => unsuccessfulResponse,
        });

      const unsuccessfulFixerResponse = {
        ...mockFixerApiResponse,
        success: false,
      };

      // Fallback API also returns unsuccessful result
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => unsuccessfulFixerResponse,
      });

      await expect(fetchForexRates('USD')).rejects.toThrow(ForexApiError);
    });
  });

  describe('getExchangeRate', () => {
    const mockRates: ForexRateData = {
      base: 'USD',
      date: '2022-01-01',
      rates: {
        EUR: 0.8854,
        GBP: 0.7404,
        JPY: 115.11,
      },
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: 'success',
          base_code: 'USD',
          time_last_update_utc: '2022-01-01T00:00:00+0000',
          conversion_rates: mockRates.rates,
        }),
      });
    });

    it('should return 1 for same currency conversion', async () => {
      const rate = await getExchangeRate('USD', 'USD');
      expect(rate).toBe(1);
    });

    it('should return correct exchange rate', async () => {
      const rate = await getExchangeRate('USD', 'EUR');
      expect(rate).toBe(0.8854);
    });

    it('should throw error for unavailable currency', async () => {
      await expect(getExchangeRate('USD', 'XYZ')).rejects.toThrow(ForexApiError);
      await expect(getExchangeRate('USD', 'XYZ')).rejects.toThrow(
        'Exchange rate not available for USD to XYZ'
      );
    });
  });

  describe('convertCurrency', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: 'success',
          base_code: 'USD',
          time_last_update_utc: '2022-01-01T00:00:00+0000',
          conversion_rates: {
            EUR: 0.8854,
            GBP: 0.7404,
          },
        }),
      });
    });

    it('should convert currency correctly', async () => {
      const result = await convertCurrency(100, 'USD', 'EUR');
      expect(result).toBeCloseTo(88.54, 2);
    });

    it('should handle same currency conversion', async () => {
      const result = await convertCurrency(100, 'USD', 'USD');
      expect(result).toBe(100);
    });

    it('should handle decimal amounts', async () => {
      const result = await convertCurrency(123.45, 'USD', 'GBP');
      expect(result).toBeCloseTo(91.40, 2);
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: 'success',
          base_code: 'USD',
          time_last_update_utc: '2022-01-01T00:00:00+0000',
          conversion_rates: { EUR: 0.8854 },
        }),
      });
    });

    it('should clear cache', async () => {
      await fetchForexRates('USD');
      expect(getCacheStats().size).toBe(1);

      clearForexCache();
      expect(getCacheStats().size).toBe(0);
    });

    it('should provide cache statistics', async () => {
      await fetchForexRates('USD');
      await fetchForexRates('EUR');

      const stats = getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty('key');
      expect(stats.entries[0]).toHaveProperty('timestamp');
      expect(stats.entries[0]).toHaveProperty('expiresAt');
      expect(stats.entries[0]).toHaveProperty('isValid');
    });

    it('should expire cache after timeout', async () => {
      // Mock Date.now to control cache expiration
      const originalDateNow = Date.now;
      const mockTime = 1640995200000; // Fixed timestamp
      Date.now = jest.fn(() => mockTime);

      await fetchForexRates('USD');
      expect(getCacheStats().size).toBe(1);

      // Advance time beyond cache duration (5 minutes)
      Date.now = jest.fn(() => mockTime + 6 * 60 * 1000);

      // This should fetch fresh data, not use cache
      await fetchForexRates('USD');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('checkForexServiceHealth', () => {
    it('should return health status for all services', async () => {
      // Mock successful responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: 'success',
            base_code: 'USD',
            time_last_update_utc: '2022-01-01T00:00:00+0000',
            conversion_rates: { EUR: 0.8854 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            base: 'USD',
            date: '2022-01-01',
            rates: { EUR: 0.8854 },
          }),
        });

      const health = await checkForexServiceHealth();

      expect(health.primary).toBe(true);
      expect(health.fallback).toBe(true);
      expect(health.cache).toBe(false); // No cache initially
    });

    it('should handle service failures in health check', async () => {
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      const health = await checkForexServiceHealth();

      expect(health.primary).toBe(false);
      expect(health.fallback).toBe(false);
      expect(health.cache).toBe(false);
    });
  });

  describe('ForexApiError', () => {
    it('should create error with message only', () => {
      const error = new ForexApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ForexApiError');
      expect(error.statusCode).toBeUndefined();
      expect(error.apiSource).toBeUndefined();
    });

    it('should create error with all properties', () => {
      const error = new ForexApiError('Test error', 429, 'exchangerate-api');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(429);
      expect(error.apiSource).toBe('exchangerate-api');
    });
  });

  describe('Timeout Handling', () => {
    it('should handle timeout errors', async () => {
      clearForexCache();
      
      // Mock AbortController to simulate timeout
      mockFetch.mockRejectedValue(new Error('The operation was aborted'));

      await expect(fetchForexRates('USD')).rejects.toThrow(ForexApiError);
    });
  });
});