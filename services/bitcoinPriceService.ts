import { BitcoinPriceData, CoinGeckoResponse, ApiError } from '../types';

/**
 * Bitcoin Price Service
 * Handles CoinGecko API integration with caching, retry logic, and rate limiting
 */

// Configuration constants
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 30 * 1000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay
const RATE_LIMIT_DELAY = 60 * 1000; // 1 minute delay for rate limiting

// Supported currencies
const SUPPORTED_CURRENCIES = [
  'usd', 'eur', 'gbp', 'jpy', 'aud', 'cad', 'chf', 'cny',
  'sek', 'nok', 'dkk', 'pln', 'czk', 'huf', 'rub', 'brl',
  'mxn', 'inr', 'krw', 'sgd'
];

// Cache interface
interface CacheEntry {
  data: BitcoinPriceData;
  timestamp: number;
}

// Service state
let cache: CacheEntry | null = null;
let lastRequestTime = 0;
let isRateLimited = false;
let rateLimitResetTime = 0;

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number): number => 
  RETRY_DELAY * Math.pow(2, attempt);

/**
 * Check if cached data is still valid
 */
const isCacheValid = (): boolean => {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
};

/**
 * Check if we're currently rate limited
 */
const isCurrentlyRateLimited = (): boolean => {
  if (!isRateLimited) return false;
  if (Date.now() > rateLimitResetTime) {
    isRateLimited = false;
    return false;
  }
  return true;
};

/**
 * Enforce rate limiting (50 calls per minute for CoinGecko free tier)
 */
const enforceRateLimit = async (): Promise<void> => {
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  const minInterval = 1200; // 1.2 seconds between requests (50 per minute)
  
  if (timeSinceLastRequest < minInterval) {
    await sleep(minInterval - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
};

/**
 * Make HTTP request to CoinGecko API with error handling
 */
const makeApiRequest = async (url: string): Promise<CoinGeckoResponse> => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'BitcoinForexCalculator/1.0'
    }
  });

  if (!response || !response.ok) {
    if (response.status === 429) {
      // Rate limited
      isRateLimited = true;
      rateLimitResetTime = Date.now() + RATE_LIMIT_DELAY;
      throw new ApiError(
        'Rate limit exceeded. Please try again later.',
        response.status,
        'RATE_LIMITED'
      );
    }
    
    if (response.status >= 500) {
      throw new ApiError(
        'CoinGecko server error. Please try again.',
        response.status,
        'SERVER_ERROR'
      );
    }
    
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      'API_ERROR'
    );
  }

  const data = await response.json();
  
  // Validate response structure
  if (!data || !data.bitcoin || typeof data.bitcoin !== 'object') {
    throw new ApiError(
      'Invalid response format from CoinGecko API',
      200,
      'INVALID_RESPONSE'
    );
  }

  return data;
};

/**
 * Fetch Bitcoin prices with retry logic
 */
const fetchBitcoinPricesWithRetry = async (
  currencies: string[] = SUPPORTED_CURRENCIES,
  attempt = 0
): Promise<BitcoinPriceData> => {
  try {
    // Check rate limiting
    if (isCurrentlyRateLimited()) {
      throw new ApiError(
        'Rate limited. Please wait before making another request.',
        429,
        'RATE_LIMITED'
      );
    }

    // Enforce rate limiting
    await enforceRateLimit();

    // Build API URL
    const currencyList = currencies.join(',');
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=${currencyList}`;

    // Make API request
    const response = await makeApiRequest(url);
    
    // Extract Bitcoin prices
    const bitcoinPrices = response.bitcoin;
    
    // Validate that we have prices for requested currencies
    const missingCurrencies = currencies.filter(currency => 
      !(currency in bitcoinPrices)
    );
    
    if (missingCurrencies.length > 0) {
      console.warn(`Missing prices for currencies: ${missingCurrencies.join(', ')}`);
    }

    return bitcoinPrices;
    
  } catch (error) {
    // If this is our last attempt or it's a rate limit error, throw immediately
    if (attempt >= MAX_RETRIES - 1 || 
        (error instanceof ApiError && error.code === 'RATE_LIMITED')) {
      throw error;
    }

    // Wait before retrying (exponential backoff)
    const delay = getRetryDelay(attempt);
    console.warn(`Bitcoin price fetch attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error instanceof Error ? error.message : String(error));
    await sleep(delay);

    // Retry
    return fetchBitcoinPricesWithRetry(currencies, attempt + 1);
  }
};

/**
 * Main function to get Bitcoin prices with caching
 */
export const getBitcoinPrices = async (
  currencies: string[] = SUPPORTED_CURRENCIES,
  forceRefresh = false
): Promise<BitcoinPriceData> => {
  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && isCacheValid()) {
    return cache!.data;
  }

  try {
    // Fetch fresh data
    const bitcoinPrices = await fetchBitcoinPricesWithRetry(currencies);
    
    // Update cache
    cache = {
      data: bitcoinPrices,
      timestamp: Date.now()
    };

    return bitcoinPrices;
    
  } catch (error) {
    // If we have cached data and the error is not critical, return cached data
    if (cache && (
      error instanceof ApiError && 
      (error.code === 'RATE_LIMITED' || error.code === 'SERVER_ERROR')
    )) {
      console.warn('Using cached Bitcoin prices due to API error:', error.message);
      return cache.data;
    }

    // Re-throw the error if no cached data available or critical error
    throw error;
  }
};

/**
 * Get supported currencies list
 */
export const getSupportedCurrencies = (): string[] => {
  return [...SUPPORTED_CURRENCIES];
};

/**
 * Clear cache (useful for testing)
 */
export const clearCache = (): void => {
  cache = null;
};

/**
 * Reset all service state (useful for testing)
 */
export const resetServiceState = (): void => {
  cache = null;
  lastRequestTime = 0;
  isRateLimited = false;
  rateLimitResetTime = 0;
};

/**
 * Get cache status
 */
export const getCacheStatus = () => {
  return {
    hasCache: !!cache,
    isValid: isCacheValid(),
    timestamp: cache?.timestamp || null,
    age: cache ? Date.now() - cache.timestamp : null
  };
};

/**
 * Get rate limit status
 */
export const getRateLimitStatus = () => {
  return {
    isRateLimited: isCurrentlyRateLimited(),
    resetTime: rateLimitResetTime,
    timeUntilReset: isRateLimited ? Math.max(0, rateLimitResetTime - Date.now()) : 0
  };
};