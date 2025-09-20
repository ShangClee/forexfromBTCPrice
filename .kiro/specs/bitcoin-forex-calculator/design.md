# Design Document

## Overview

The Bitcoin Forex Calculator is a React-based web application that provides real-time comparison between traditional forex rates and Bitcoin-based exchange rates. The application builds upon the existing implementation by adding traditional forex rate integration, comparison features, and enhanced user interaction capabilities.

The system fetches Bitcoin prices from CoinGecko API and traditional forex rates from a free forex API (ExchangeRate-API or Fixer.io), then calculates and displays both rates side-by-side with percentage differences and arbitrage indicators.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │    │   Data Service   │    │   External APIs │
│                 │    │                  │    │                 │
│ - Calculator    │◄──►│ - Rate Fetcher   │◄──►│ - CoinGecko     │
│ - Comparison    │    │ - Data Processor │    │ - ExchangeRate  │
│ - Controls      │    │ - Error Handler  │    │ - API           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Architecture

```
BitcoinForexCalculator (Main Container)
├── Header (Title, Refresh, Last Updated)
├── CurrencySelector (Source/Target Currency Selection)
├── AmountInput (Amount to Convert)
├── ComparisonDisplay
│   ├── TraditionalRate (Forex Rate Display)
│   ├── BitcoinRate (BTC-based Rate Display)
│   └── DifferenceIndicator (Percentage Diff & Arbitrage Alert)
├── CalculationBreakdown (Detailed Steps)
└── RateTable (All Currency Pairs Overview)
```

## Components and Interfaces

### Core Components

#### 1. BitcoinForexCalculator (Main Container)
- **Purpose**: Main application container managing state and orchestrating child components
- **State Management**: 
  - Bitcoin prices from CoinGecko
  - Traditional forex rates from external API
  - Selected currency pair
  - Conversion amount
  - Loading states and errors
- **Key Methods**:
  - `fetchBitcoinPrices()`: Get BTC prices in all currencies
  - `fetchForexRates()`: Get traditional forex rates
  - `calculateComparison()`: Compare both rate types
  - `handleCurrencyChange()`: Update selected currencies
  - `handleAmountChange()`: Update conversion amount

#### 2. CurrencySelector
- **Purpose**: Dropdown selectors for source and target currencies
- **Props**: 
  - `currencies`: Available currency list
  - `selectedSource`: Currently selected source currency
  - `selectedTarget`: Currently selected target currency
  - `onSourceChange`: Callback for source currency change
  - `onTargetChange`: Callback for target currency change
- **Features**:
  - Search/filter functionality
  - Currency flags and full names
  - Swap button for quick reversal

#### 3. AmountInput
- **Purpose**: Input field for conversion amount with validation
- **Props**:
  - `amount`: Current amount value
  - `currency`: Source currency for formatting
  - `onChange`: Callback for amount changes
- **Features**:
  - Real-time validation
  - Currency-specific formatting
  - Clear/reset functionality

#### 4. ComparisonDisplay
- **Purpose**: Side-by-side comparison of traditional vs Bitcoin rates
- **Props**:
  - `traditionalRate`: Traditional forex rate
  - `bitcoinRate`: Bitcoin-based rate
  - `amount`: Conversion amount
  - `sourceCurrency`: Source currency
  - `targetCurrency`: Target currency
- **Features**:
  - Converted amounts for both methods
  - Percentage difference calculation
  - Visual indicators for better rates
  - Arbitrage opportunity alerts

#### 5. CalculationBreakdown
- **Purpose**: Detailed explanation of Bitcoin-based calculation steps
- **Props**:
  - `sourceBtcPrice`: BTC price in source currency
  - `targetBtcPrice`: BTC price in target currency
  - `amount`: Conversion amount
- **Features**:
  - Step-by-step calculation display
  - Formula explanation
  - Expandable/collapsible view

#### 6. RateTable
- **Purpose**: Overview table of all currency pairs and their rates
- **Props**:
  - `bitcoinPrices`: All BTC prices
  - `forexRates`: All traditional rates
  - `baseCurrency`: Base currency for comparison
- **Features**:
  - Sortable columns
  - Trend indicators
  - Percentage differences
  - Quick selection for detailed comparison

### Data Interfaces

#### BitcoinPriceData
```typescript
interface BitcoinPriceData {
  [currency: string]: number;
}
```

#### ForexRateData
```typescript
interface ForexRateData {
  base: string;
  date: string;
  rates: {
    [currency: string]: number;
  };
}
```

#### ComparisonResult
```typescript
interface ComparisonResult {
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
```

#### CurrencyInfo
```typescript
interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}
```

## Data Models

### API Integration

#### CoinGecko API Integration
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Parameters**: `ids=bitcoin&vs_currencies={currency_list}`
- **Rate Limiting**: 50 calls/minute for free tier
- **Error Handling**: Retry logic with exponential backoff
- **Caching**: 30-second cache to reduce API calls

#### Traditional Forex API Integration
- **Primary**: ExchangeRate-API (`https://api.exchangerate-api.com/v4/latest/{base}`)
- **Fallback**: Fixer.io API for redundancy
- **Rate Limiting**: 1000 calls/month for free tier
- **Error Handling**: Automatic fallback to secondary API
- **Caching**: 5-minute cache for forex rates

### Data Processing

#### Rate Calculation Logic
1. **Bitcoin-based Rate**: `(BTC_price_source / BTC_price_target)`
2. **Traditional Rate**: Direct from forex API
3. **Percentage Difference**: `((bitcoin_rate - traditional_rate) / traditional_rate) * 100`
4. **Arbitrage Detection**: Difference > 2% threshold

#### Currency Support
- **Major Currencies**: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY
- **Additional**: SEK, NOK, DKK, PLN, CZK, HUF, RUB, BRL, MXN, INR, KRW, SGD
- **Total**: 20+ currencies with expansion capability

## Error Handling

### API Error Scenarios
1. **Network Failures**: Display retry button with exponential backoff
2. **Rate Limiting**: Show rate limit message with next available time
3. **Invalid Responses**: Fallback to cached data if available
4. **Partial Failures**: Continue with available data, mark missing data

### User Input Validation
1. **Amount Validation**: Positive numbers only, reasonable limits
2. **Currency Selection**: Validate against supported currency list
3. **Real-time Feedback**: Immediate validation messages

### Error Recovery
1. **Graceful Degradation**: Show cached data when APIs fail
2. **Retry Mechanisms**: Automatic retry with user-initiated option
3. **Fallback APIs**: Secondary forex API when primary fails
4. **Offline Mode**: Basic calculator with last known rates

## Testing Strategy

### Unit Testing
- **Components**: Test all React components with Jest and React Testing Library
- **Utilities**: Test calculation functions, API helpers, and data processors
- **Hooks**: Test custom hooks for data fetching and state management
- **Coverage Target**: 90%+ code coverage

### Integration Testing
- **API Integration**: Mock API responses for consistent testing
- **Component Integration**: Test component interactions and data flow
- **Error Scenarios**: Test error handling and recovery mechanisms
- **User Workflows**: Test complete user journeys

### End-to-End Testing
- **Critical Paths**: Currency selection, amount input, rate comparison
- **Cross-browser**: Test on Chrome, Firefox, Safari, Edge
- **Mobile Responsiveness**: Test on various screen sizes
- **Performance**: Load time and API response testing

### API Testing
- **Mock Responses**: Create realistic mock data for development
- **Rate Limiting**: Test behavior under API limits
- **Error Responses**: Test handling of various API error codes
- **Fallback Logic**: Test secondary API activation

## Performance Considerations

### Optimization Strategies
1. **API Caching**: Implement intelligent caching to reduce API calls
2. **Debounced Inputs**: Prevent excessive calculations on rapid input changes
3. **Lazy Loading**: Load currency data on demand
4. **Memoization**: Cache expensive calculations using React.memo and useMemo

### Monitoring
1. **API Response Times**: Track and alert on slow responses
2. **Error Rates**: Monitor API failure rates and user errors
3. **User Interactions**: Track most used currency pairs and features
4. **Performance Metrics**: Core Web Vitals and loading times

## Security Considerations

### API Security
1. **API Keys**: Secure storage of API keys (environment variables)
2. **Rate Limiting**: Implement client-side rate limiting
3. **Input Sanitization**: Validate and sanitize all user inputs
4. **HTTPS Only**: Ensure all API calls use HTTPS

### Data Privacy
1. **No Personal Data**: Application doesn't collect personal information
2. **Local Storage**: Only store user preferences locally
3. **Analytics**: Anonymous usage analytics only
4. **GDPR Compliance**: Minimal data collection approach