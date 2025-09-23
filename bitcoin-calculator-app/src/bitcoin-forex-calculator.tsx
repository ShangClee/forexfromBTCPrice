import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Calculator, AlertCircle, Wifi, WifiOff, Loader2, ExternalLink } from 'lucide-react';
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
import { useAdvancedDebounce } from './hooks/useDebounce';
import { 
  useStableCallback, 
  useOptimizedCalculation,
  usePerformanceMonitor
} from './utils/performance';
import { AppState, CurrencyInfo } from './types';
import { getUserFriendlyErrorMessage } from './utils/errorHandling';

// Memoized currency data for the selector to prevent recreation on every render
const CURRENCY_DATA: readonly CurrencyInfo[] = Object.freeze([
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

const BitcoinForexCalculator: React.FC = React.memo(() => {
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

  // Stable error callbacks to prevent infinite re-renders
  const handleBitcoinError = useStableCallback((error: any) => {
    setState((prev: AppState) => ({
      ...prev,
      errors: { ...prev.errors, bitcoin: getUserFriendlyErrorMessage(error) },
      loading: { ...prev.loading, bitcoin: false },
    }));
  }, []);

  const handleBitcoinRecovery = useStableCallback(() => {
    setState((prev: AppState) => ({
      ...prev,
      errors: { ...prev.errors, bitcoin: null },
    }));
  }, []);

  const handleForexError = useStableCallback((error: any) => {
    setState((prev: AppState) => ({
      ...prev,
      errors: { ...prev.errors, forex: getUserFriendlyErrorMessage(error) },
      loading: { ...prev.loading, forex: false },
    }));
  }, []);

  const handleForexRecovery = useStableCallback(() => {
    setState((prev: AppState) => ({
      ...prev,
      errors: { ...prev.errors, forex: null },
    }));
  }, []);

  // Enhanced error handling with stable callbacks
  const bitcoinErrorHandler = useErrorHandling({
    maxRetries: 3,
    retryDelay: 2000,
    onError: handleBitcoinError,
    onRecovery: handleBitcoinRecovery,
  });

  const forexErrorHandler = useErrorHandling({
    maxRetries: 2,
    retryDelay: 1500,
    onError: handleForexError,
    onRecovery: handleForexRecovery,
  });

  // Fetch Bitcoin prices with enhanced error handling
  const fetchBitcoinPrices = useCallback(async (forceRefresh = false) => {
    setState((prev: AppState) => ({
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
      setState((prev: AppState) => ({
        ...prev,
        bitcoinPrices: result,
        lastUpdated: new Date(),
        loading: { ...prev.loading, bitcoin: false },
      }));
    } else {
      setState((prev: AppState) => ({
        ...prev,
        loading: { ...prev.loading, bitcoin: false },
      }));
    }
  }, [bitcoinErrorHandler]);

  // Fetch forex rates with enhanced error handling
  const fetchForexRates = useCallback(async (baseCurrency = 'USD') => {
    setState((prev: AppState) => ({
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
      setState((prev: AppState) => ({
        ...prev,
        forexRates: result,
        lastUpdated: new Date(),
        loading: { ...prev.loading, forex: false },
      }));
    } else {
      setState((prev: AppState) => ({
        ...prev,
        loading: { ...prev.loading, forex: false },
      }));
    }
  }, [forexErrorHandler]);

  // Fetch all data with stable reference
  const fetchAllData = useStableCallback(async (forceRefresh = false) => {
    await Promise.all([
      fetchBitcoinPrices(forceRefresh),
      fetchForexRates('USD'),
    ]);
  }, [fetchBitcoinPrices, fetchForexRates]);

  // Stable currency change handlers to prevent unnecessary re-renders
  const handleSourceCurrencyChange = useStableCallback((currency: string) => {
    setState((prev: AppState) => ({
      ...prev,
      selectedSourceCurrency: currency,
      errors: { ...prev.errors, validation: null },
    }));
  }, []);

  const handleTargetCurrencyChange = useStableCallback((currency: string) => {
    setState((prev: AppState) => ({
      ...prev,
      selectedTargetCurrency: currency,
      errors: { ...prev.errors, validation: null },
    }));
  }, []);

  // Stable amount change handler with debouncing to prevent excessive calculations
  const handleAmountChange = useStableCallback((amount: string) => {
    setState((prev: AppState) => ({
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
      setState((prev: AppState) => ({
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

  // Initial data fetch - run only once on mount
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Check if we have any critical errors
  const hasCriticalError = state.errors.bitcoin && state.errors.forex;
  const isLoading = state.loading.bitcoin || state.loading.forex;
  const hasAnyError = state.errors.bitcoin || state.errors.forex;

  // Enhanced error display component with accessibility and animations
  const ErrorDisplay: React.FC<{
    error: string;
    onRetry: () => void;
    title: string;
    canRetry?: boolean;
    isRetrying?: boolean;
  }> = ({ 
    error, 
    onRetry, 
    title, 
    canRetry = true,
    isRetrying = false 
  }) => (
    <div 
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-slide-in-top"
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
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 justify-center focus-ring mobile-touch-target"
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
        <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" aria-hidden="true" />
            Bitcoin Forex Calculator
          </h1>
          <div 
            className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-slide-in-top"
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
              canRetry={bitcoinErrorHandler.canRetry ?? true}
              isRetrying={bitcoinErrorHandler.isRetrying ?? false}
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
              canRetry={forexErrorHandler.canRetry ?? true}
              isRetrying={forexErrorHandler.isRetrying ?? false}
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
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <div className="min-h-screen bg-gray-50 sm:bg-white safe-area-inset" role="main" aria-label="Bitcoin Forex Calculator Application">
        <div id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-white rounded-lg shadow-sm sm:shadow-lg card-hover animate-fade-in">
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
                  className="btn-primary mobile-touch-target text-sm sm:text-base"
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
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-slide-in-top"
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
          <section className="bg-white rounded-lg shadow-sm sm:shadow-lg card-hover animate-slide-in-bottom stagger-1">
            <div className="p-4 sm:p-6 space-y-6" aria-labelledby="input-section-title">
              <h2 id="input-section-title" className="sr-only">Currency Selection and Amount Input</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Currency Selection */}
                <div className="space-y-4 animate-slide-in-left stagger-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900" id="currency-selection-title">
                    Currency Selection
                  </h3>
                  <CurrencySelector
                    currencies={CURRENCY_DATA as CurrencyInfo[]}
                    selectedSource={state.selectedSourceCurrency}
                    selectedTarget={state.selectedTargetCurrency}
                    onSourceChange={handleSourceCurrencyChange}
                    onTargetChange={handleTargetCurrencyChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Amount Input */}
                <div className="space-y-4 animate-slide-in-right stagger-2">
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
                  canRetry={bitcoinErrorHandler.canRetry ?? true}
                  isRetrying={bitcoinErrorHandler.isRetrying ?? false}
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
                  canRetry={forexErrorHandler.canRetry ?? true}
                  isRetrying={forexErrorHandler.isRetrying ?? false}
                />
              )}
            </div>
          </section>

          {/* Comparison Display */}
          {comparisonData && (
            <section 
              className="bg-white rounded-lg shadow-sm sm:shadow-lg card-hover animate-slide-in-bottom stagger-2"
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
              className="bg-white rounded-lg shadow-sm sm:shadow-lg card-hover animate-slide-in-bottom stagger-3"
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
              className="bg-white rounded-lg shadow-sm sm:shadow-lg card-hover animate-slide-in-bottom stagger-4"
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
                onCurrencySelect={(source: string, target: string) => {
                  handleSourceCurrencyChange(source);
                  handleTargetCurrencyChange(target);
                }}
              />
            </section>
          )}

          {/* Enhanced Loading State */}
          {isLoading && !state.bitcoinPrices && !state.forexRates && (
            <div 
              className="bg-white rounded-lg shadow-sm sm:shadow-lg p-8 sm:p-12 animate-fade-in"
              role="status"
              aria-live="polite"
              aria-label="Loading exchange rate data"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-600" />
                  <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 border-2 border-blue-200 rounded-full animate-pulse"></div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-base sm:text-lg font-medium text-gray-900">Loading Exchange Rates</div>
                  <div className="text-sm text-gray-600">Fetching Bitcoin prices and forex rates...</div>
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
              
              {/* Progress indicators */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Bitcoin Prices</span>
                  <span>{state.loading.bitcoin ? 'Loading...' : 'Ready'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className={`h-1 rounded-full transition-all duration-500 ${state.loading.bitcoin ? 'bg-blue-600 animate-pulse w-3/4' : 'bg-green-600 w-full'}`}></div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Forex Rates</span>
                  <span>{state.loading.forex ? 'Loading...' : 'Ready'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className={`h-1 rounded-full transition-all duration-500 ${state.loading.forex ? 'bg-blue-600 animate-pulse w-3/4' : 'bg-green-600 w-full'}`}></div>
                </div>
              </div>
            </div>
          )}

          {/* Footer with additional information */}
          <footer className="bg-white rounded-lg shadow-sm sm:shadow-lg p-4 sm:p-6 animate-fade-in text-center">
            <div className="text-xs sm:text-sm text-gray-500 space-y-2">
              <p>
                Data provided by{' '}
                <a 
                  href="https://www.coingecko.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                  aria-label="Visit CoinGecko website (opens in new tab)"
                >
                  CoinGecko
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>{' '}
                (Bitcoin prices) and{' '}
                <a 
                  href="https://exchangerate-api.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                  aria-label="Visit ExchangeRate-API website (opens in new tab)"
                >
                  ExchangeRate-API
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>{' '}
                (forex rates)
              </p>
              <p>
                Rates are updated in real-time and cached for optimal performance
              </p>
              <div className="flex items-center justify-center space-x-4 mt-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Live Data</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs">Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs">Fast</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
});

BitcoinForexCalculator.displayName = 'BitcoinForexCalculator';

export default BitcoinForexCalculator;