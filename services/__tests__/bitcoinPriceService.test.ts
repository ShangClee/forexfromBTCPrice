import {
  getBitcoinPrices,
  getSupportedCurrencies,
  clearCache,
  getCacheStatus,
  getRateLimitStatus,
  resetServiceState
} from '../bitcoinPriceService';
import { ApiError } from '../../types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods to avoid noise in tests
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation()
};

describe('bitcoinPriceService', () => {
  const mockBitcoinPrices = {
    usd: 45000,
    eur: 38000,
    gbp: 33000,
    jpy: 6500000
  };

  const mockSuccessResponse = {
    bitcoin: mockBitcoinPrices
  };

  beforeEach(() => {
    // Reset all service state before each test
    resetServiceState();
    
    // Reset fetch mock
    mockFetch.mockReset();
    
    // Reset console spies
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
    
    // Reset timers
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getBitcoinPrices', () => {

    it('should fetch Bitcoin prices successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse
      });

      const result = await getBitcoinPrices(['usd', 'eur', 'gbp', 'jpy']);

      expect(result).toEqual(mockBitcoinPrices);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('vs_currencies=usd,eur,gbp,jpy'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': 'BitcoinForexCalculator/1.0'
          })
        })
      );
    });

    it('should use default currencies when none specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse
      });

      await getBitcoinPrices();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('vs_currencies=usd,eur,gbp,jpy,aud,cad,chf,cny,sek,nok,dkk,pln,czk,huf,rub,brl,mxn,inr,krw,sgd'),
        expect.any(Object)
      );
    });

    it('should cache results and return cached data on subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse
      });

      // First call should make API request
      const result1 = await getBitcoinPrices(['usd', 'eur']);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockBitcoinPrices);

      // Second call should use cache
      const result2 = await getBitcoinPrices(['usd', 'eur']);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
      expect(result2).toEqual(mockBitcoinPrices);
    });

    it('should force refresh when requested', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ bitcoin: { usd: 46000, eur: 39000 } })
        });

      // First call
      await getBitcoinPrices(['usd', 'eur']);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Force refresh should make new API call
      const result = await getBitcoinPrices(['usd', 'eur'], true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ usd: 46000, eur: 39000 });
    });

    it('should retry on network errors', async () => {
      // Mock first call to fail, second to succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse
        });

      const result = await getBitcoinPrices(['usd']);
      expect(result).toEqual(mockBitcoinPrices);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle rate limiting (429 status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      try {
        await getBitcoinPrices(['usd']);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toContain('Rate limit exceeded');
      }
    });

    it('should handle server errors (5xx status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      try {
        await getBitcoinPrices(['usd']);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(500);
      }
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'response' })
      });

      try {
        await getBitcoinPrices(['usd']);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toContain('Invalid response format');
      }
    });

    it('should return cached data when API fails with server error', async () => {
      // First, populate cache with successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse
      });

      await getBitcoinPrices(['usd']);

      // Then simulate server error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await getBitcoinPrices(['usd'], true);
      expect(result).toEqual(mockBitcoinPrices);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Using cached Bitcoin prices due to API error'),
        expect.any(String)
      );
    });

    it('should warn about missing currencies in response', async () => {
      const partialResponse = {
        bitcoin: {
          usd: 45000,
          eur: 38000
          // Missing gbp and jpy
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => partialResponse
      });

      const result = await getBitcoinPrices(['usd', 'eur', 'gbp', 'jpy']);
      
      expect(result).toEqual(partialResponse.bitcoin);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Missing prices for currencies: gbp, jpy'
      );
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return array of supported currency codes', () => {
      const currencies = getSupportedCurrencies();
      
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies).toContain('usd');
      expect(currencies).toContain('eur');
      expect(currencies).toContain('gbp');
      expect(currencies).toContain('jpy');
      expect(currencies.length).toBeGreaterThan(15);
    });

    it('should return a copy of the array (not reference)', () => {
      const currencies1 = getSupportedCurrencies();
      const currencies2 = getSupportedCurrencies();
      
      expect(currencies1).not.toBe(currencies2);
      expect(currencies1).toEqual(currencies2);
    });
  });

  describe('cache management', () => {
    it('should report cache status correctly', async () => {
      // Initially no cache
      let status = getCacheStatus();
      expect(status.hasCache).toBe(false);
      expect(status.isValid).toBe(false);

      // After successful fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ bitcoin: { usd: 45000 } })
      });

      await getBitcoinPrices(['usd']);

      status = getCacheStatus();
      expect(status.hasCache).toBe(true);
      expect(status.isValid).toBe(true);
      expect(status.timestamp).toBeInstanceOf(Number);
      expect(status.age).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache when requested', async () => {
      // Populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ bitcoin: { usd: 45000 } })
      });

      await getBitcoinPrices(['usd']);
      expect(getCacheStatus().hasCache).toBe(true);

      // Clear cache
      clearCache();
      expect(getCacheStatus().hasCache).toBe(false);
    });

    it('should expire cache after 30 seconds', async () => {
      jest.useFakeTimers();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ bitcoin: { usd: 45000 } })
      });

      await getBitcoinPrices(['usd']);
      expect(getCacheStatus().isValid).toBe(true);

      // Fast-forward 31 seconds
      jest.advanceTimersByTime(31000);
      expect(getCacheStatus().isValid).toBe(false);
      
      jest.useRealTimers();
    });
  });

  describe('rate limiting', () => {
    it('should report rate limit status', () => {
      const status = getRateLimitStatus();
      
      expect(status).toHaveProperty('isRateLimited');
      expect(status).toHaveProperty('resetTime');
      expect(status).toHaveProperty('timeUntilReset');
      expect(typeof status.isRateLimited).toBe('boolean');
    });

    it('should enforce minimum interval between requests', async () => {
      jest.useFakeTimers();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ bitcoin: { usd: 45000 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ bitcoin: { usd: 46000 } })
        });

      // First request
      const promise1 = getBitcoinPrices(['usd'], true);
      jest.advanceTimersByTime(1200); // Rate limit delay
      await promise1;

      // Second request immediately after
      const promise2 = getBitcoinPrices(['usd'], true);
      jest.advanceTimersByTime(1200); // Rate limit delay
      await promise2;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });
});