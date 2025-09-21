# Bitcoin Forex Calculator

A React-based web application that provides real-time comparison between traditional forex rates and Bitcoin-based exchange rates. The tool helps cryptocurrency traders and financial analysts identify arbitrage opportunities by showing how currency conversions differ when routed through Bitcoin versus traditional forex markets.

## Features

- **Real-time Rate Comparison**: Side-by-side display of traditional forex rates vs Bitcoin-derived rates
- **Multi-currency Support**: 20+ major currencies including USD, EUR, GBP, JPY, and emerging market currencies
- **Arbitrage Detection**: Automatic identification of opportunities where Bitcoin-based conversion offers better rates
- **Calculation Transparency**: Step-by-step breakdown showing how Bitcoin-based rates are derived
- **Robust API Integration**: Primary and fallback forex APIs with intelligent caching and error handling
- **Comprehensive Testing**: Unit tests for all service layers with Jest

## Technology Stack

- **React 18+** with functional components and hooks
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for utility-first styling and responsive design
- **Jest** for testing with comprehensive coverage
- **CoinGecko API** for Bitcoin price data
- **ExchangeRate-API** (primary) and **Fixer.io** (fallback) for traditional forex rates

## Project Structure

```
bitcoin-forex-calculator/
├── components/                    # React UI components
│   ├── __tests__/                 # Component unit tests
│   │   ├── AmountInput.test.tsx   # Amount input component tests
│   │   └── CurrencySelector.test.tsx    # Currency selector tests
│   ├── AmountInput.tsx            # Amount input with validation and formatting
│   └── CurrencySelector.tsx       # Currency selection component
├── services/                      # Service layer for API integrations
│   ├── __tests__/                 # Service unit tests
│   │   ├── bitcoinPriceService.test.ts  # Bitcoin API service tests
│   │   ├── calculationService.test.ts   # Rate calculation service tests
│   │   └── forexRateService.test.ts     # Forex API service tests
│   ├── bitcoinPriceService.ts     # CoinGecko API integration
│   ├── calculationService.ts      # Rate comparison calculation engine
│   └── forexRateService.ts        # Traditional forex API integration
├── types/                         # TypeScript type definitions
│   └── index.ts                   # Core interfaces and types
├── bitcoin-forex-calculator.tsx  # Main React component
├── jest.config.js                 # Jest testing configuration
├── package.json                   # Project dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
```

## API Integration

### Forex Rate Service

The forex rate service (`services/forexRateService.ts`) provides:

- **Primary API**: ExchangeRate-API for real-time forex rates
- **Fallback API**: Fixer.io for redundancy when primary API fails
- **Intelligent Caching**: 5-minute cache duration to reduce API calls
- **Error Handling**: Comprehensive error handling with retry logic and exponential backoff
- **Rate Limiting**: Built-in protection against API rate limits

#### Key Functions

- `fetchForexRates(baseCurrency)`: Fetch rates with caching and fallback
- `getExchangeRate(from, to)`: Get specific currency pair rate
- `convertCurrency(amount, from, to)`: Convert amount between currencies
- `checkForexServiceHealth()`: Health check for API availability

### Bitcoin Price Service

The Bitcoin price service (`services/bitcoinPriceService.ts`) provides:

- **CoinGecko API Integration**: Real-time Bitcoin prices across 20+ currencies
- **Intelligent Caching**: 30-second cache duration to optimize API usage
- **Rate Limiting Protection**: Enforces 50 calls/minute limit with automatic throttling
- **Comprehensive Error Handling**: Retry logic with exponential backoff and graceful degradation
- **Fallback to Cache**: Returns cached data during API failures when available

#### Key Functions

- `getBitcoinPrices(currencies, forceRefresh)`: Fetch Bitcoin prices with caching
- `getSupportedCurrencies()`: Get list of supported currency codes
- `getCacheStatus()`: Monitor cache validity and age
- `getRateLimitStatus()`: Check current rate limiting status
- `clearCache()` and `resetServiceState()`: Utilities for testing and debugging

## Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Components

### CurrencySelector

The `CurrencySelector` component provides an intuitive interface for selecting source and target currencies:

**Features:**
- **Dropdown Interface**: Clean, accessible dropdown with currency flags, names, and symbols
- **Search Functionality**: Real-time search filtering by currency code or name
- **Currency Swap**: One-click button to swap source and target currencies
- **20+ Currencies**: Support for major global currencies with proper formatting
- **Accessibility**: Full keyboard navigation, focus management, and screen reader support
- **Responsive Design**: Mobile-optimized with touch-friendly interactions

**Usage:**
```tsx
<CurrencySelector
  currencies={CURRENCY_DATA}
  selectedSource="USD"
  selectedTarget="EUR"
  onSourceChange={(currency) => setSourceCurrency(currency)}
  onTargetChange={(currency) => setTargetCurrency(currency)}
  disabled={false}
/>
```

### AmountInput

The `AmountInput` component provides a sophisticated input field for currency amounts with comprehensive validation and formatting:

**Features:**
- **Real-time Validation**: Instant validation with user-friendly error messages
- **Currency-specific Formatting**: Automatic number formatting with thousand separators
- **Integer Currency Support**: Special handling for currencies like JPY and KRW that don't use decimals
- **Input Sanitization**: Prevents invalid characters and formats input correctly
- **Visual Currency Display**: Shows currency flag and symbol for better user experience
- **Clear Functionality**: One-click clear button with focus management
- **Accessibility**: Proper ARIA labels, keyboard navigation, and screen reader support
- **Focus/Blur Behavior**: Raw editing mode when focused, formatted display when blurred

**Validation Rules:**
- Minimum amount: 0.01
- Maximum amount: 1 billion
- Maximum decimal places: 8 (0 for integer currencies)
- Only numeric characters and decimal points allowed
- Special handling for integer currencies (JPY, KRW, HUF, etc.)

**Usage:**
```tsx
<AmountInput
  amount="1234.56"
  currency="USD"
  onChange={(amount) => setAmount(amount)}
  disabled={false}
  error={validationError}
/>
```

### Testing

The project includes comprehensive unit tests for all service layers and components with 96%+ code coverage:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in continuous integration mode
npm run test:ci

# Run specific service tests
npm test services/__tests__/forexRateService.test.ts
npm test services/__tests__/bitcoinPriceService.test.ts
```

#### Test Coverage

- **Forex Rate Service**: Complete test coverage including API fallback, caching, error handling, and retry logic
- **Bitcoin Price Service**: Comprehensive tests for CoinGecko integration, rate limiting, caching, and error scenarios
- **CurrencySelector Component**: Unit tests for dropdown functionality, search, swap, and accessibility features
- **Mock API Responses**: Realistic test data for consistent testing across different scenarios
- **Error Simulation**: Tests for network failures, API rate limits, invalid responses, and timeout handling

## API Rate Limits & Considerations

- **CoinGecko**: 50 calls/minute (free tier)
- **ExchangeRate-API**: 1000 calls/month (free tier)
- **Fixer.io**: Fallback API with similar limits
- **Caching Strategy**: Intelligent caching reduces API calls significantly
- **Error Handling**: Graceful degradation when APIs are unavailable

## Target Users

- Cryptocurrency traders looking for arbitrage opportunities
- Financial analysts comparing currency conversion methods
- International businesses exploring alternative currency conversion routes
- Forex enthusiasts interested in Bitcoin's impact on traditional currency markets

## Implementation Status

- ✅ **TypeScript Interfaces**: Complete type definitions for all data structures
- ✅ **Forex API Service**: Full implementation with caching, fallback, and error handling
- ✅ **Bitcoin Price Service**: Complete CoinGecko integration with caching and rate limiting
- ✅ **Unit Testing**: Comprehensive test suite for service layers (96%+ coverage)
- ✅ **Currency Selection Component**: Full-featured CurrencySelector with search, swap, and accessibility
- ✅ **Amount Input Component**: Complete AmountInput with validation, formatting, and currency-specific handling
- 🚧 **UI Components**: Additional components for comparison display and calculation breakdown (in progress)
- 🚧 **Rate Comparison**: Calculation engine and display components (planned)

## Next Steps

The foundation is now complete with robust service layers and core UI components. The next phase continues building the user interface:

1. ✅ **Currency Selection Component**: Complete CurrencySelector with search, swap, and accessibility features
2. ✅ **Amount Input Component**: Complete AmountInput with validation, formatting, and currency-specific handling
3. **Rate Comparison Engine**: Implement calculation logic to compare traditional vs Bitcoin-based rates
4. **Comparison Display Components**: Build visual comparison and arbitrage detection displays
5. **Component Integration**: Integrate all components into the main calculator interface
6. **Mobile Optimization**: Ensure responsive design for mobile trading scenarios

## Contributing

This project follows a specification-driven development approach with detailed requirements, design documents, and implementation tasks located in the `.kiro/specs/` directory.

## License

This project is licensed under the MIT License.