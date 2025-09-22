import { BitcoinPriceData } from '../types';
import { getBitcoinPrices as originalGetBitcoinPrices, getSupportedCurrencies } from './bitcoinPriceService';
import { 
  withRetry, 
  withFallback, 
  CircuitBreaker, 
  ErrorReporter, 
  EnhancedError,
  DEFAULT_RETRY_CONFIG 
} from '../utils/errorHandling';

/**
 * Enhanced Bitcoin Price Service with comprehensive error handling
 */

// Circuit breaker for Bitcoin price service
const bitcoinPriceCircuitBreaker = new CircuitBreaker(3, 30000, 300000);
const errorReporter = ErrorReporter.getInstance();

// Fallback data - last known good prices (should be updated from cache)
let fallbackBitcoinPrices: BitcoinPriceData | null = null;

/**
 * Update fallback data when we get successful responses
 */
const updateFallbackData = (data: BitcoinPriceData): void => {
  fallbackBitcoinPrices = { ...data };
  
  // Store in localStorage for persistence across sessions
  try {
    localStorage.setItem('bitcoin_prices_fallback', JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to store fallback data in localStorage:', error);
  }
};

/**
 * Load fallback data from localStorage
 */
const loadFallbackData = (): BitcoinPriceData | null => {
  try {
    const stored = localStorage.getItem('bitcoin_prices_fallback');
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      // Use fallback data if it's less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to load fallback data from localStorage:', error);
  }
  return null;
};

// Initialize fallback data on module load
fallbackBitcoinPrices = loadFallbackData();

/**
 * Enhanced Bitcoin price fetching with comprehensive error handling
 */
export const getBitcoinPricesWithErrorHandling = async (
  currencies: string[] = getSupportedCurrencies(),
  forceRefresh = false
): Promise<BitcoinPriceData> => {
  errorReporter.addBreadcrumb(`Fetching Bitcoin prices for ${currencies.length} currencies`);

  const operation = async (): Promise<BitcoinPriceData> => {
    return bitcoinPriceCircuitBreaker.execute(async () => {
      const prices = await originalGetBitcoinPrices(currencies, forceRefresh);
      
      // Update fallback data on successful fetch
      updateFallbackData(prices);
      errorReporter.addBreadcrumb('Bitcoin prices fetched successfully');
      
      return prices;
    });
  };

  try {
    // First try with retry logic
    const result = await withRetry(
      operation,
      {
        ...DEFAULT_RETRY_CONFIG,
        maxAttempts: 3,
        retryCondition: (error) => {
          // Don't retry rate limit errors immediately
          if (error instanceof Error && error.message.includes('Rate limit')) {
            return false;
          }
          return DEFAULT_RETRY_CONFIG.retryCondition!(error);
        },
      },
      { component: 'BitcoinPriceService', action: 'fetch_prices' }
    );

    return result;
  } catch (error) {
    errorReporter.addBreadcrumb(`Bitcoin price fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    // Try fallback with cached data
    return withFallback(
      async () => {
        throw error; // Re-throw to trigger fallback
      },
      {
        fallbackData: fallbackBitcoinPrices || undefined,
        gracefulDegradation: true,
      },
      { component: 'BitcoinPriceService', action: 'fallback' }
    ).catch((fallbackError) => {
      // If fallback also fails, create a comprehensive error
      const enhancedError = new EnhancedError(
        'Failed to fetch Bitcoin prices and no fallback data available',
        {
          component: 'BitcoinPriceService',
          action: 'complete_failure',
        },
        fallbackError instanceof Error ? fallbackError : undefined,
        true
      );

      errorReporter.reportError(enhancedError);
      throw enhancedError;
    });
  }
};

/**
 * Get Bitcoin price for a specific currency pair with error handling
 */
export const getBitcoinPriceForPair = async (
  sourceCurrency: string,
  targetCurrency: string,
  forceRefresh = false
): Promise<{ sourcePrice: number; targetPrice: number }> => {
  errorReporter.addBreadcrumb(`Fetching Bitcoin prices for ${sourceCurrency}/${targetCurrency}`);

  try {
    const currencies = [sourceCurrency.toLowerCase(), targetCurrency.toLowerCase()];
    const prices = await getBitcoinPricesWithErrorHandling(currencies, forceRefresh);

    const sourcePrice = prices[sourceCurrency.toLowerCase()];
    const targetPrice = prices[targetCurrency.toLowerCase()];

    if (sourcePrice === undefined || targetPrice === undefined) {
      throw new EnhancedError(
        `Bitcoin prices not available for ${sourceCurrency}/${targetCurrency}`,
        {
          component: 'BitcoinPriceService',
          action: 'price_validation',
        },
        undefined,
        false
      );
    }

    return { sourcePrice, targetPrice };
  } catch (error) {
    const enhancedError = new EnhancedError(
      `Failed to get Bitcoin prices for ${sourceCurrency}/${targetCurrency}`,
      {
        component: 'BitcoinPriceService',
        action: 'get_pair_prices',
      },
      error instanceof Error ? error : undefined,
      true
    );

    errorReporter.reportError(enhancedError);
    throw enhancedError;
  }
};

/**
 * Health check for Bitcoin price service
 */
export const checkBitcoinPriceServiceHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  circuitBreakerState: string;
  hasFallbackData: boolean;
  lastError?: string;
}> => {
  const circuitBreakerState = bitcoinPriceCircuitBreaker.getState();
  
  try {
    // Try to fetch a single currency to test the service
    await getBitcoinPricesWithErrorHandling(['usd'], true);
    
    return {
      status: 'healthy',
      circuitBreakerState: circuitBreakerState.state,
      hasFallbackData: !!fallbackBitcoinPrices,
    };
  } catch (error) {
    const status = fallbackBitcoinPrices ? 'degraded' : 'unhealthy';
    
    return {
      status,
      circuitBreakerState: circuitBreakerState.state,
      hasFallbackData: !!fallbackBitcoinPrices,
      lastError: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Reset circuit breaker (useful for manual recovery)
 */
export const resetBitcoinPriceServiceCircuitBreaker = (): void => {
  bitcoinPriceCircuitBreaker.reset();
  errorReporter.addBreadcrumb('Bitcoin price service circuit breaker reset');
};

/**
 * Clear fallback data
 */
export const clearBitcoinPriceFallbackData = (): void => {
  fallbackBitcoinPrices = null;
  try {
    localStorage.removeItem('bitcoin_prices_fallback');
  } catch (error) {
    console.warn('Failed to clear fallback data from localStorage:', error);
  }
  errorReporter.addBreadcrumb('Bitcoin price fallback data cleared');
};

/**
 * Get service statistics
 */
export const getBitcoinPriceServiceStats = () => {
  return {
    circuitBreaker: bitcoinPriceCircuitBreaker.getState(),
    hasFallbackData: !!fallbackBitcoinPrices,
    fallbackDataAge: fallbackBitcoinPrices ? 'Available' : 'None',
  };
};