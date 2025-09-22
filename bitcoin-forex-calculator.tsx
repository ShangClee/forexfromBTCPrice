import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Calculator, AlertCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { getBitcoinPricesWithErrorHandling } from './services/enhancedBitcoinPriceService';
import { fetchForexRatesWithErrorHandling } from './services/enhancedForexRateService';
import { compareRates } from './services/calculationService';
import CurrencySelector from './components/CurrencySelector';
import AmountInput from './components/AmountInput';
import ComparisonDisplay from './components/ComparisonDisplay';
import CalculationBreakdown from './components/CalculationBreakdown';
import RateTable from './components/RateTable';
import ErrorBoundary from './components/ErrorBoundary';
import { useErrorHandling } from './hooks/useErrorHandling';
import { useDebounce, useAdvancedDebounce } from './hooks/useDebounce';
import { 
  useStableCallback, 
  useMemoizedCalculation, 
  useOptimizedCalculation,
  useDeepMemo,
  usePerformanceMonitor,
  useAdvancedCache
} from './utils/performance';
import { BitcoinPriceData, ForexRateData, AppState, CurrencyInfo } from './types';
import { getUserFriendlyErrorMessage } from './utils/errorHandling';

// Memoized currency data for the selector to prevent recreation on every render
const CURRENCY_DATA: CurrencyInfo[] = Object.freeze([
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
]);

const BitcoinForexCalculator = React.memo(() => {
  // Main application state
  const [state, setState] = useState<AppState>({
    bitcoinPrices: null,
    forexRates: null,
    selectedSourceCurrency: 'USD',
    selectedTargetCurrency: 'EUR',
    amount: '1000',
    lastUpdated: null,
    loading: {
      bitcoin: false,
      forex: false,
    },
    errors: {
      bitcoin: null,
      forex: null,
      validation: null,
    },
  });

  // Calculation breakdown state
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Enhanced error handling
  const bitcoinErrorHandler = useErrorHandling({
    maxRetries: 3,
    retryDelay: 2000,
    onError: (error) => {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, bitcoin: getUserFriendlyErrorMessage(error) },
        loading: { ...prev.loading, bitcoin: false },
      }));
    },
    onRecovery: () => {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, bitcoin: null },
      }));
    },
  });

  const forexErrorHandler = useErrorHandling({
    maxRetries: 2,
    retryDelay: 1500,
    onError: (error) => {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, forex: getUserFriendlyErrorMessage(error) },
        loading: { ...prev.loading, forex: false },
      }));
    },
    onRecovery: () => {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, forex: null },
      }));
    },
  });

  // Fetch Bitcoin prices with enhanced error handling
  const fetchBitcoinPrices = useCallback(async (forceRefresh = false) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, bitcoin: true },
      errors: { ...prev.errors, bitcoin: null },
    }));

    const result = await bitcoinErrorHandler.withErrorHandling(
      async () => {
        const currencies = ['usd', 'eur', 'gbp', 'jpy', 'aud', 'cad', 'chf', 'cny', 'sek', 'nok', 'dkk', 'pln', 'czk', 'huf', 'rub', 'brl', 'mxn', 'inr', 'krw', 'sgd'];
        return await getBitcoinPricesWithErrorHandling(currencies, forceRefresh);
      },
      { component: 'BitcoinForexCalculator', action: 'fetch_bitcoin_prices' }
    );

    if (result) {
      setState(prev => ({
        ...prev,
        bitcoinPrices: result,
        lastUpdated: new Date(),
        loading: { ...prev.loading, bitcoin: false },
      }));
    } else {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, bitcoin: false },
      }));
    }
  }, [bitcoinErrorHandler]);

  // Fetch forex rates with enhanced error handling
  const fetchForexRates = useCallback(async (baseCurrency = 'USD') => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, forex: true },
      errors: { ...prev.errors, forex: null },
    }));

    const result = await forexErrorHandler.withErrorHandling(
      async () => {
        return await fetchForexRatesWithErrorHandling(baseCurrency);
      },
      { component: 'BitcoinForexCalculator', action: 'fetch_forex_rates' }
    );

    if (result) {
      setState(prev => ({
        ...prev,
        forexRates: result,
        lastUpdated: new Date(),
        loading: { ...prev.loading, forex: false },
      }));
    } else {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, forex: false },
      }));
    }
  }, [forexErrorHandler]);

  // Fetch all data
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    await Promise.all([
      fetchBitcoinPrices(forceRefresh),
      fetchForexRates('USD'),
    ]);
  }, [fetchBitcoinPrices, fetchForexRates]);

  // Stable currency change handlers to prevent unnecessary re-renders
  const handleSourceCurrencyChange = useStableCallback((currency: string) => {
    setState(prev => ({
      ...prev,
      selectedSourceCurrency: currency,
      errors: { ...prev.errors, validation: null },
    }));
  }, []);

  const handleTargetCurrencyChange = useStableCallback((currency: string) => {
    setState(prev => ({
      ...prev,
      selectedTargetCurrency: currency,
      errors: { ...prev.errors, validation: null },
    }));
  }, []);

  // Stable amount change handler with debouncing to prevent excessive calculations
  const handleAmountChange = useStableCallback((amount: string) => {
    setState(prev => ({
      ...prev,
      amount,
      errors: { ...prev.errors, validation: null },
    }));
  }, []);

  // Advanced debounced amount for calculations to prevent excessive API calls and calculations
  const debouncedAmount = useAdvancedDebounce(state.amount, 300, {
    maxWait: 1000, // Force update after 1 second even if still changing
    enableProfiling: process.env.NODE_ENV === 'development',
    name: 'amount-input'
  });

  // Performance monitoring for expensive operations
  const calculationMonitor = usePerformanceMonitor('rate-comparison', process.env.NODE_ENV === 'development');
  
  // Advanced caching for API responses
  const apiCache = useAdvancedCache<string, any>(50, 5 * 60 * 1000); // 5 minute TTL

  // Optimized comparison data calculation with caching and performance monitoring
  const comparisonData = useOptimizedCalculation(() => {
    calculationMonitor.start();
    
    if (!state.bitcoinPrices || !state.forexRates || !debouncedAmount) {
      calculationMonitor.end();
      return null;
    }

    const numericAmount = parseFloat(debouncedAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      calculationMonitor.end();
      return null;
    }

    try {
      const result = compareRates(
        state.selectedSourceCurrency,
        state.selectedTargetCurrency,
        numericAmount,
        state.bitcoinPrices,
        state.forexRates
      );
      
      calculationMonitor.end();
      return result;
    } catch (error) {
      calculationMonitor.end();
      setState(prev => ({
        ...prev,
        errors: { 
          ...prev.errors, 
          validation: error instanceof Error ? error.message : 'Calculation error'
        },
      }));
      return null;
    }
  }, [state.bitcoinPrices, state.forexRates, debouncedAmount, state.selectedSourceCurrency, state.selectedTargetCurrency], {
    cacheSize: 20,
    enableProfiling: process.env.NODE_ENV === 'development',
    name: 'rate-comparison'
  });

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Check if we have any critical errors
  const hasCriticalError = state.errors.bitcoin && state.errors.forex;
  const isLoading = state.loading.bitcoin || state.loading.forex;
  const hasAnyError = state.errors.bitcoin || state.errors.forex;

  // Enhanced error display component with accessibility and animations
  const ErrorDisplay = ({ 
    error, 
    onRetry, 
    title, 
    canRetry = true,
    isRetrying = false 
  }: { 
    error: string; 
    onRetry: () => void; 
    title: string;
    canRetry?: boolean;
    isRetrying?: boolean;
  }) => (
    <div 
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-in slide-in-from-top-2 duration-300"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center mb-2">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" aria-hidden="true" />
        <h3 className="text-red-800 font-semibold flex-1" id={`error-${title.replace(/\s+/g, '-').toLowerCase()}`}>
          {title}
        </h3>
        {!navigator.onLine && (
          <WifiOff 
            className="w-4 h-4 text-red-600 ml-2 animate-pulse" 
            aria-label="No internet connection"
          />
        )}
      </div>
      <p className="text-red-600 mb-3" aria-describedby={`error-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        {error}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        {canRetry && (
          <button 
            onClick={onRetry}
            disabled={isRetrying}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={isRetrying ? `Retrying ${title}...` : `Retry ${title}`}
          >
            {isRetrying && <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
          </button>
        )}
        {!navigator.onLine && (
          <div className="text-sm text-red-600 flex items-center gap-1" role="status">
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            <span>No internet connection</span>
          </div>
        )}
      </div>
    </div>
  );

  if (hasCriticalError) {
    return (
      <div className="max-w-6xl mx-auto p-6" role="main" aria-label="Bitcoin Forex Calculator - Service Unavailable">
        <div className="bg-white rounded-lg shadow-lg p-6 animate-in fade-in-50 duration-500">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" aria-hidden="true" />
            Bitcoin Forex Calculator
          </h1>
          <div 
            className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-in slide-in-from-top-2 duration-300"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" aria-hidden="true" />
              <h2 className="text-yellow-800 font-semibold">Service Unavailable</h2>
            </div>
            <p className="text-yellow-700">
              Both Bitcoin price and forex rate services are currently unavailable. 
              This might be due to network issues or temporary service outages.
            </p>
          </div>
          
          {state.errors.bitcoin && (
            <ErrorDisplay 
              error={state.errors.bitcoin} 
              onRetry={() => {
                bitcoinErrorHandler.retry();
                fetchBitcoinPrices(true);
              }}
              title="Bitcoin Price Service"
              canRetry={bitcoinErrorHandler.canRetry}
              isRetrying={bitcoinErrorHandler.isRetrying}
            />
          )}
          
          {state.errors.forex && (
            <ErrorDisplay 
              error={state.errors.forex} 
              onRetry={() => {
                forexErrorHandler.retry();
                fetchForexRates('USD');
              }}
              title="Forex Rate Service"
              canRetry={forexErrorHandler.canRetry}
              isRetrying={forexErrorHandler.isRetrying}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      resetKeys={[state.selectedSourceCurrency, state.selectedTargetCurrency]}
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
      }}
    >
      <div className="min-h-screen bg-gray-50 sm:bg-white" role="main" aria-label="Bitcoin Forex Calculator Application">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-white rounded-lg shadow-sm sm:shadow-lg transition-all duration-300 hover:shadow-md">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap" id="app-title">
                    <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">Bitcoin Forex Calculator</span>
                    <div className="flex items-center gap-1" role="status" aria-live="polite">
                      {!navigator.onLine && (
                        <WifiOff 
                          className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 animate-pulse" 
                          aria-label="Offline"
                        />
                      )}
                      {navigator.onLine && !hasAnyError && (
                        <Wifi 
                          className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" 
                          aria-label="Online and connected"
                        />
                      )}
                    </div>
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1" id="app-description">
                    Compare traditional forex rates with Bitcoin-based exchange rates
                  </p>
                </div>
                <button
                  onClick={() => fetchAllData(true)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 text-sm sm:text-base font-medium min-h-[44px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={isLoading ? "Refreshing data..." : "Refresh exchange rate data"}
                  aria-describedby="refresh-status"
                >
                  <RefreshCw className={`w-4 h-4 transition-transform duration-200 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Refresh Data</span>
                </button>
              </div>
              {state.lastUpdated && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2" id="refresh-status" role="status">
                  Last updated: {state.lastUpdated.toLocaleTimeString()}
                  {isLoading && <span className="ml-2 inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Updating...
                  </span>}
                </p>
              )}
              
              {/* Connection status */}
              {!navigator.onLine && (
                <div 
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-in slide-in-from-top-2 duration-300"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>You are currently offline. Some features may not work properly.</span>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Currency Selection and Amount Input */}
          <section className="bg-white rounded-lg shadow-sm sm:shadow-lg transition-all duration-300 hover:shadow-md">
            <div className="p-4 sm:p-6 space-y-6" aria-labelledby="input-section-title">
              <h2 id="input-section-title" className="sr-only">Currency Selection and Amount Input</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Currency Selection */}
                <div className="space-y-4 animate-in fade-in-50 duration-500">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900" id="currency-selection-title">
                    Currency Selection
                  </h3>
                  <CurrencySelector
                    currencies={CURRENCY_DATA}
                    selectedSource={state.selectedSourceCurrency}
                    selectedTarget={state.selectedTargetCurrency}
                    onSourceChange={handleSourceCurrencyChange}
                    onTargetChange={handleTargetCurrencyChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Amount Input */}
                <div className="space-y-4 animate-in fade-in-50 duration-500 delay-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900" id="amount-input-title">
                    Amount to Convert
                  </h3>
                  <AmountInput
                    amount={state.amount}
                    currency={state.selectedSourceCurrency}
                    onChange={handleAmountChange}
                    disabled={isLoading}
                    error={state.errors.validation || undefined}
                  />
                </div>
              </div>

              {/* Error Messages */}
              {state.errors.bitcoin && (
                <ErrorDisplay 
                  error={state.errors.bitcoin} 
                  onRetry={() => {
                    bitcoinErrorHandler.retry();
                    fetchBitcoinPrices(true);
                  }}
                  title="Bitcoin Price Service"
                  canRetry={bitcoinErrorHandler.canRetry}
                  isRetrying={bitcoinErrorHandler.isRetrying}
                />
              )}
              {state.errors.forex && (
                <ErrorDisplay 
                  error={state.errors.forex} 
                  onRetry={() => {
                    forexErrorHandler.retry();
                    fetchForexRates('USD');
                  }}
                  title="Forex Rate Service"
                  canRetry={forexErrorHandler.canRetry}
                  isRetrying={forexErrorHandler.isRetrying}
                />
              )}
            </div>
          </section>

          {/* Comparison Display */}
          {comparisonData && (
            <section 
              className="bg-white rounded-lg shadow-sm sm:shadow-lg transition-all duration-300 hover:shadow-md animate-in slide-in-from-bottom-4 duration-500"
              aria-labelledby="comparison-title"
            >
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900" id="comparison-title">
                  Rate Comparison
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Side-by-side comparison of traditional forex vs Bitcoin-based rates
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <ComparisonDisplay
                  traditionalRate={comparisonData.traditionalRate}
                  bitcoinRate={comparisonData.bitcoinRate}
                  amount={comparisonData.amount}
                  sourceCurrency={comparisonData.sourceCurrency}
                  targetCurrency={comparisonData.targetCurrency}
                  loading={isLoading}
                />
              </div>
            </section>
          )}

          {/* Calculation Breakdown */}
          {comparisonData && state.bitcoinPrices && (
            <section 
              className="bg-white rounded-lg shadow-sm sm:shadow-lg transition-all duration-300 hover:shadow-md animate-in slide-in-from-bottom-4 duration-500 delay-100"
              aria-labelledby="breakdown-title"
            >
              <CalculationBreakdown
                sourceBtcPrice={state.bitcoinPrices[state.selectedSourceCurrency.toLowerCase()]}
                targetBtcPrice={state.bitcoinPrices[state.selectedTargetCurrency.toLowerCase()]}
                amount={parseFloat(state.amount) || 0}
                sourceCurrency={state.selectedSourceCurrency}
                targetCurrency={state.selectedTargetCurrency}
                expanded={showBreakdown}
                onToggle={() => setShowBreakdown(!showBreakdown)}
              />
            </section>
          )}

          {/* Rate Table */}
          {state.bitcoinPrices && state.forexRates && (
            <section 
              className="bg-white rounded-lg shadow-sm sm:shadow-lg transition-all duration-300 hover:shadow-md animate-in slide-in-from-bottom-4 duration-500 delay-200"
              aria-labelledby="rate-table-title"
            >
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900" id="rate-table-title">
                  All Currency Rates
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  Overview of all supported currency pairs with comparison data
                </p>
              </div>
              <RateTable
                bitcoinPrices={state.bitcoinPrices}
                forexRates={state.forexRates}
                baseCurrency="USD"
                onCurrencySelect={(source, target) => {
                  handleSourceCurrencyChange(source);
                  handleTargetCurrencyChange(target);
                }}
              />
            </section>
          )}

          {/* Loading State */}
          {isLoading && !state.bitcoinPrices && !state.forexRates && (
            <div 
              className="bg-white rounded-lg shadow-sm sm:shadow-lg p-8 sm:p-12 animate-in fade-in-50 duration-300"
              role="status"
              aria-live="polite"
              aria-label="Loading exchange rate data"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                  <div className="absolute inset-0 w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-200 rounded-full animate-pulse"></div>
                </div>
                <div className="text-center">
                  <span className="text-sm sm:text-base text-gray-600 block">Loading exchange rate data...</span>
                  <span className="text-xs text-gray-500 mt-1 block">This may take a few moments</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
});

BitcoinForexCalculator.displayName = 'BitcoinForexCalculator';

export default BitcoinForexCalculator;