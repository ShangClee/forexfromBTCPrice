// Core data structures for Bitcoin Forex Calculator

/**
 * Bitcoin price data from CoinGecko API
 * Maps currency codes to their Bitcoin exchange rates
 */
export interface BitcoinPriceData {
  [currency: string]: number;
}

/**
 * Traditional forex rate data from ExchangeRate-API or open.er-api.com
 */
export interface ForexRateData {
  base: string;
  date: string;
  rates: {
    [currency: string]: number;
  };
}

/**
 * Result of comparing traditional vs Bitcoin-based exchange rates
 */
export interface ComparisonResult {
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  traditionalRate: number;
  bitcoinRate: number;
  traditionalAmount: number;
  bitcoinAmount: number;
  percentageDifference: number;
  betterMethod: 'traditional' | 'bitcoin' | 'equal';
  arbitrageOpportunity: boolean;
}

/**
 * Currency information with display details
 */
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

// API Response Types

/**
 * CoinGecko API response structure
 */
export interface CoinGeckoResponse {
  bitcoin: BitcoinPriceData;
}

/**
 * ExchangeRate-API response structure
 */
export interface ExchangeRateApiResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: {
    [currency: string]: number;
  };
}

/**
 * open.er-api.com API response structure (fallback)
 */
export interface FixerApiResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: {
    [currency: string]: number;
  };
}

// Component Props Types

/**
 * Props for CurrencySelector component
 */
export interface CurrencySelectorProps {
  currencies: CurrencyInfo[];
  selectedSource: string;
  selectedTarget: string;
  onSourceChange: (currency: string) => void;
  onTargetChange: (currency: string) => void;
  disabled?: boolean;
}

/**
 * Props for AmountInput component
 */
export interface AmountInputProps {
  amount: string;
  currency: string;
  onChange: (amount: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Props for ComparisonDisplay component
 */
export interface ComparisonDisplayProps {
  traditionalRate: number;
  bitcoinRate: number;
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  loading?: boolean;
}

/**
 * Props for CalculationBreakdown component
 */
export interface CalculationBreakdownProps {
  sourceBtcPrice: number;
  targetBtcPrice: number;
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  expanded?: boolean;
  onToggle?: () => void;
}

/**
 * Props for RateTable component
 */
export interface RateTableProps {
  bitcoinPrices: BitcoinPriceData;
  forexRates: ForexRateData;
  baseCurrency: string;
  onCurrencySelect?: (source: string, target: string) => void;
}

// State Management Types

/**
 * Main application state
 */
export interface AppState {
  bitcoinPrices: BitcoinPriceData | null;
  forexRates: ForexRateData | null;
  selectedSourceCurrency: string;
  selectedTargetCurrency: string;
  amount: string;
  lastUpdated: Date | null;
  loading: {
    bitcoin: boolean;
    forex: boolean;
  };
  errors: {
    bitcoin: string | null;
    forex: string | null;
    validation: string | null;
  };
}

/**
 * Loading states for different operations
 */
export interface LoadingState {
  bitcoin: boolean;
  forex: boolean;
  calculation: boolean;
}

/**
 * Error states for different operations
 */
export interface ErrorState {
  bitcoin: string | null;
  forex: string | null;
  validation: string | null;
  network: string | null;
}

// Utility Types

/**
 * API cache entry with timestamp
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * API request configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Rate calculation parameters
 */
export interface CalculationParams {
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  bitcoinPrices: BitcoinPriceData;
  forexRates: ForexRateData;
}

/**
 * Supported currency codes
 */
export type SupportedCurrency = 
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY'
  | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RUB' | 'BRL'
  | 'MXN' | 'INR' | 'KRW' | 'SGD';

/**
 * Rate comparison methods
 */
export type ComparisonMethod = 'traditional' | 'bitcoin' | 'equal';

/**
 * API status types
 */
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Theme preference for UI components
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

// Error Handling Types

/**
 * Custom API error class with additional context
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.timestamp = new Date();
  }
}

/**
 * Error codes for different API failure scenarios
 */
export type ApiErrorCode = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'API_ERROR'
  | 'INVALID_RESPONSE'
  | 'VALIDATION_ERROR';