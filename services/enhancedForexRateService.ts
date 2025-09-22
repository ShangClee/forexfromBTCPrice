import { ForexRateData } from '../types';
import { fetchForexRates as originalFetchForexRates } from './forexRateService';
import { 
  withRetry, 
  withFallback, 
  CircuitBreaker, 
  ErrorReporter, 
  EnhancedError,
  DEFAULT_RETRY_CONFIG 
} from '../utils/errorHandling';

/**
 * Enhanced Forex Rate Service with comprehensive error handling
 */

// Circuit breaker for forex rate service
const forexRateCircuitBreaker = new CircuitBreaker(3, 30000, 300000);
const errorReporter = ErrorReporter.getInstance();

// Fallback data - last known good rates
let fallbackForexRates: { [baseCurrency: string]: ForexRateData } = {};

/**
 * Update fallback data when we get successful responses
 */
const updateFallbackData = (baseCurrency: string, data: ForexRateData): void => {
  fallbackForexRates[baseCurrency] = { ...data };
  
  // Store in localStorage for persistence across sessions
  try {
    localStorage.setItem('forex_rates_fallback', JSON.stringify({
      data: fallbackForexRates,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to store forex fallback data in localStorage:', error);
  }
};

/**
 * Load fallback data from localStorage
 */
const loadFallbackData = (): void => {
  try {
    const stored = localStorage.getItem('forex_rates_fallback');
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      // Use fallback data if it's less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        fallbackForexRates = data;
      }
    }
  } catch (error) {
    console.warn('Failed to load forex fallback data from localStorage:', error);
  }
};

// Initialize fallback data on module load
loadFallbackData();

/**
 * Enhanced forex rate fetching with comprehensive error handling
 */
export const fetchForexRatesWithErrorHandling = async (
  baseCurrency = 'USD'
): Promise<ForexRateData> => {
  errorReporter.addBreadcrumb(`Fetching forex rates for base currency: ${baseCurrency}`);

  const operation = async (): Promise<ForexRateData> => {
    return forexRateCircuitBreaker.execute(async () => {
      const rates = await originalFetchForexRates(baseCurrency);
      
      // Update fallback data on successful fetch
      updateFallbackData(baseCurrency, rates);
      errorReporter.addBreadcrumb('Forex rates fetched successfully');
      
      return rates;
    });
  };

  try {
    // First try with retry logic
    const result = await withRetry(
      operation,
      {
        ...DEFAULT_RETRY_CONFIG,
        maxAttempts: 2, // Fewer retries for forex since we have fallback APIs
        retryCondition: (error) => {
          // Don't retry rate limit errors immediately
          if (error instanceof Error && error.message.includes('rate limit')) {
            return false;
          }
          return DEFAULT_RETRY_CONFIG.retryCondition!(error);
        },
      },
      { component: 'ForexRateService', action: 'fetch_rates' }
    );

    return result;
  } catch (error) {
    errorReporter.addBreadcrumb(`Forex rate fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    // Try fallback with cached data
    return withFallback(
      async () => {
        throw error; // Re-throw to trigger fallback
      },
      {
        fallbackData: fallbackForexRates[baseCurrency],
        gracefulDegradation: true,
      },
      { component: 'ForexRateService', action: 'fallback' }
    ).catch((fallbackError) => {
      // If fallback also fails, create a comprehensive error
      const enhancedError = new EnhancedError(
        `Failed to fetch forex rates for ${baseCurrency} and no fallback data available`,
        {
          component: 'ForexRateService',
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
 * Get exchange rate between two currencies with error handling
 */
export const getExchangeRateWithErrorHandling = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  errorReporter.addBreadcrumb(`Getting exchange rate: ${fromCurrency} -> ${toCurrency}`);

  if (fromCurrency === toCurrency) {
    return 1;
  }

  try {
    const rates = await fetchForexRatesWithErrorHandling(fromCurrency);
    
    const rate = rates.rates[toCurrency];
    if (rate === undefined) {
      throw new EnhancedError(
        `Exchange rate not available for ${fromCurrency} to ${toCurrency}`,
        {
          component: 'ForexRateService',
          action: 'rate_validation',
        },
        undefined,
        false
      );
    }

    return rate;
  } catch (error) {
    // Try cross-rate calculation through USD if direct rate fails
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      try {
        errorReporter.addBreadcrumb(`Attempting cross-rate calculation via USD`);
        
        const usdRates = await fetchForexRatesWithErrorHandling('USD');

        const fromRateToUsd = 1 / usdRates.rates[fromCurrency]; // fromCurrency to USD rate
        const usdToTargetRate = usdRates.rates[toCurrency]; // USD to toCurrency rate

        if (fromRateToUsd && usdToTargetRate) {
          const crossRate = fromRateToUsd * usdToTargetRate;
          errorReporter.addBreadcrumb(`Cross-rate calculation successful: ${crossRate}`);
          return crossRate;
        }
      } catch (crossRateError) {
        errorReporter.addBreadcrumb(`Cross-rate calculation failed`);
      }
    }

    const enhancedError = new EnhancedError(
      `Failed to get exchange rate for ${fromCurrency}/${toCurrency}`,
      {
        component: 'ForexRateService',
        action: 'get_exchange_rate',
      },
      error instanceof Error ? error : undefined,
      true
    );

    errorReporter.reportError(enhancedError);
    throw enhancedError;
  }
};

/**
 * Convert amount between currencies with error handling
 */
export const convertCurrencyWithErrorHandling = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (amount <= 0) {
    throw new EnhancedError(
      'Amount must be greater than zero',
      {
        component: 'ForexRateService',
        action: 'convert_currency_validation',
      },
      undefined,
      false
    );
  }

  try {
    const rate = await getExchangeRateWithErrorHandling(fromCurrency, toCurrency);
    return amount * rate;
  } catch (error) {
    const enhancedError = new EnhancedError(
      `Failed to convert ${amount} ${fromCurrency} to ${toCurrency}`,
      {
        component: 'ForexRateService',
        action: 'convert_currency',
      },
      error instanceof Error ? error : undefined,
      true
    );

    errorReporter.reportError(enhancedError);
    throw enhancedError;
  }
};

/**
 * Health check for forex rate service
 */
export const checkForexRateServiceHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  circuitBreakerState: string;
  hasFallbackData: boolean;
  availableCurrencies: string[];
  lastError?: string;
}> => {
  const circuitBreakerState = forexRateCircuitBreaker.getState();
  const availableCurrencies = Object.keys(fallbackForexRates);
  
  try {
    // Try to fetch USD rates to test the service
    await fetchForexRatesWithErrorHandling('USD');
    
    return {
      status: 'healthy',
      circuitBreakerState: circuitBreakerState.state,
      hasFallbackData: availableCurrencies.length > 0,
      availableCurrencies,
    };
  } catch (error) {
    const status = availableCurrencies.length > 0 ? 'degraded' : 'unhealthy';
    
    return {
      status,
      circuitBreakerState: circuitBreakerState.state,
      hasFallbackData: availableCurrencies.length > 0,
      availableCurrencies,
      lastError: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Reset circuit breaker (useful for manual recovery)
 */
export const resetForexRateServiceCircuitBreaker = (): void => {
  forexRateCircuitBreaker.reset();
  errorReporter.addBreadcrumb('Forex rate service circuit breaker reset');
};

/**
 * Clear fallback data
 */
export const clearForexRateFallbackData = (): void => {
  fallbackForexRates = {};
  try {
    localStorage.removeItem('forex_rates_fallback');
  } catch (error) {
    console.warn('Failed to clear forex fallback data from localStorage:', error);
  }
  errorReporter.addBreadcrumb('Forex rate fallback data cleared');
};

/**
 * Get service statistics
 */
export const getForexRateServiceStats = () => {
  return {
    circuitBreaker: forexRateCircuitBreaker.getState(),
    hasFallbackData: Object.keys(fallbackForexRates).length > 0,
    availableCurrencies: Object.keys(fallbackForexRates),
    fallbackDataAge: Object.keys(fallbackForexRates).length > 0 ? 'Available' : 'None',
  };
};