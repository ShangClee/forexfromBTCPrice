import { ForexRateData, ExchangeRateApiResponse, FixerApiResponse, CacheEntry, ApiConfig } from '../types';

/**
 * Forex Rate Service
 * Handles fetching traditional forex rates from ExchangeRate-API with Fixer.io fallback
 * Includes caching, error handling, and retry logic
 */

// API Configuration
const EXCHANGE_RATE_API_CONFIG: ApiConfig = {
  baseUrl: 'https://api.exchangerate-api.com/v4/latest',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

const FIXER_API_CONFIG: ApiConfig = {
  baseUrl: 'https://api.fixer.io/latest',
  timeout: 10000,
  retryAttempts: 2,
  retryDelay: 1500,
};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<string, CacheEntry<ForexRateData>>();

/**
 * Custom error class for forex API errors
 */
export class ForexApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiSource?: 'exchangerate-api' | 'fixer'
  ) {
    super(message);
    this.name = 'ForexApiError';
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exponential backoff calculation
 */
const calculateBackoffDelay = (attempt: number, baseDelay: number): number => 
  baseDelay * Math.pow(2, attempt - 1);

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cacheEntry: CacheEntry<ForexRateData>): boolean => 
  Date.now() < cacheEntry.expiresAt;

/**
 * Get cached forex rates if available and valid
 */
const getCachedRates = (baseCurrency: string): ForexRateData | null => {
  const cacheKey = `forex_${baseCurrency}`;
  const cached = cache.get(cacheKey);
  
  if (cached && isCacheValid(cached)) {
    return cached.data;
  }
  
  // Remove expired cache entry
  if (cached) {
    cache.delete(cacheKey);
  }
  
  return null;
};

/**
 * Cache forex rates data
 */
const cacheRates = (baseCurrency: string, data: ForexRateData): void => {
  const cacheKey = `forex_${baseCurrency}`;
  const cacheEntry: CacheEntry<ForexRateData> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION,
  };
  
  cache.set(cacheKey, cacheEntry);
};

/**
 * Fetch with timeout and abort controller
 */
const fetchWithTimeout = async (
  url: string, 
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Transform ExchangeRate-API response to ForexRateData
 */
const transformExchangeRateApiResponse = (
  response: ExchangeRateApiResponse
): ForexRateData => ({
  base: response.base_code,
  date: response.time_last_update_utc.split('T')[0], // Extract date part
  rates: response.conversion_rates,
});

/**
 * Transform Fixer.io API response to ForexRateData
 */
const transformFixerApiResponse = (
  response: FixerApiResponse
): ForexRateData => ({
  base: response.base,
  date: response.date,
  rates: response.rates,
});

/**
 * Fetch forex rates from ExchangeRate-API (primary)
 */
const fetchFromExchangeRateApi = async (
  baseCurrency: string,
  attempt: number = 1
): Promise<ForexRateData> => {
  const url = `${EXCHANGE_RATE_API_CONFIG.baseUrl}/${baseCurrency}`;
  
  try {
    const response = await fetchWithTimeout(url, EXCHANGE_RATE_API_CONFIG.timeout);
    
    if (!response.ok) {
      throw new ForexApiError(
        `ExchangeRate-API returned ${response.status}: ${response.statusText}`,
        response.status,
        'exchangerate-api'
      );
    }
    
    const data: ExchangeRateApiResponse = await response.json();
    
    if (data.result !== 'success') {
      throw new ForexApiError(
        'ExchangeRate-API returned unsuccessful result',
        undefined,
        'exchangerate-api'
      );
    }
    
    return transformExchangeRateApiResponse(data);
  } catch (error) {
    if (attempt < EXCHANGE_RATE_API_CONFIG.retryAttempts) {
      const delay = calculateBackoffDelay(attempt, EXCHANGE_RATE_API_CONFIG.retryDelay);
      await sleep(delay);
      return fetchFromExchangeRateApi(baseCurrency, attempt + 1);
    }
    
    if (error instanceof ForexApiError) {
      throw error;
    }
    
    throw new ForexApiError(
      `Failed to fetch from ExchangeRate-API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      'exchangerate-api'
    );
  }
};

/**
 * Fetch forex rates from Fixer.io (fallback)
 */
const fetchFromFixerApi = async (
  baseCurrency: string,
  attempt: number = 1
): Promise<ForexRateData> => {
  const url = `${FIXER_API_CONFIG.baseUrl}?base=${baseCurrency}`;
  
  try {
    const response = await fetchWithTimeout(url, FIXER_API_CONFIG.timeout);
    
    if (!response.ok) {
      throw new ForexApiError(
        `Fixer.io returned ${response.status}: ${response.statusText}`,
        response.status,
        'fixer'
      );
    }
    
    const data: FixerApiResponse = await response.json();
    
    if (!data.success) {
      throw new ForexApiError(
        'Fixer.io returned unsuccessful result',
        undefined,
        'fixer'
      );
    }
    
    return transformFixerApiResponse(data);
  } catch (error) {
    if (attempt < FIXER_API_CONFIG.retryAttempts) {
      const delay = calculateBackoffDelay(attempt, FIXER_API_CONFIG.retryDelay);
      await sleep(delay);
      return fetchFromFixerApi(baseCurrency, attempt + 1);
    }
    
    if (error instanceof ForexApiError) {
      throw error;
    }
    
    throw new ForexApiError(
      `Failed to fetch from Fixer.io: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      'fixer'
    );
  }
};

/**
 * Main function to fetch forex rates with fallback mechanism
 */
export const fetchForexRates = async (baseCurrency: string = 'USD'): Promise<ForexRateData> => {
  // Check cache first
  const cachedRates = getCachedRates(baseCurrency);
  if (cachedRates) {
    return cachedRates;
  }
  
  let lastError: ForexApiError | null = null;
  
  // Try primary API (ExchangeRate-API)
  try {
    const rates = await fetchFromExchangeRateApi(baseCurrency);
    cacheRates(baseCurrency, rates);
    return rates;
  } catch (error) {
    lastError = error instanceof ForexApiError ? error : new ForexApiError(
      `Primary API failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      'exchangerate-api'
    );
  }
  
  // Try fallback API (Fixer.io)
  try {
    const rates = await fetchFromFixerApi(baseCurrency);
    cacheRates(baseCurrency, rates);
    return rates;
  } catch (error) {
    const fallbackError = error instanceof ForexApiError ? error : new ForexApiError(
      `Fallback API failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      'fixer'
    );
    
    // Throw combined error message
    throw new ForexApiError(
      `Both forex APIs failed. Primary: ${lastError?.message}. Fallback: ${fallbackError.message}`,
      undefined,
      'fixer'
    );
  }
};

/**
 * Get exchange rate between two currencies
 */
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  const rates = await fetchForexRates(fromCurrency);
  
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  const rate = rates.rates[toCurrency];
  if (rate === undefined) {
    throw new ForexApiError(
      `Exchange rate not available for ${fromCurrency} to ${toCurrency}`
    );
  }
  
  return rate;
};

/**
 * Convert amount between currencies
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

/**
 * Clear all cached forex rates
 */
export const clearForexCache = (): void => {
  cache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => ({
  size: cache.size,
  entries: Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    timestamp: entry.timestamp,
    expiresAt: entry.expiresAt,
    isValid: isCacheValid(entry),
  })),
});

/**
 * Check if forex service is available
 */
export const checkForexServiceHealth = async (): Promise<{
  primary: boolean;
  fallback: boolean;
  cache: boolean;
}> => {
  const results = {
    primary: false,
    fallback: false,
    cache: cache.size > 0,
  };
  
  // Test primary API
  try {
    await fetchFromExchangeRateApi('USD');
    results.primary = true;
  } catch {
    // Primary API is down
  }
  
  // Test fallback API
  try {
    await fetchFromFixerApi('USD');
    results.fallback = true;
  } catch {
    // Fallback API is down
  }
  
  return results;
};