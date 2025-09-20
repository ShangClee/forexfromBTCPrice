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
├── services/                      # Service layer for API integrations
│   ├── __tests__/                 # Service unit tests
│   │   └── forexRateService.test.ts
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

### Bitcoin Price Integration

- **CoinGecko API**: Real-time Bitcoin prices across multiple currencies
- **Rate Limiting**: 50 calls/minute (free tier)
- **Caching**: 30-second cache for Bitcoin prices

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

### Testing

The project includes comprehensive unit tests for all service layers:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in continuous integration mode
npm run test:ci
```

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
- ✅ **Unit Testing**: Comprehensive test suite for service layer
- 🚧 **Bitcoin Price Service**: Refactoring existing integration (in progress)
- 🚧 **UI Components**: Component-based architecture (planned)
- 🚧 **Rate Comparison**: Calculation engine and display components (planned)

## Contributing

This project follows a specification-driven development approach with detailed requirements, design documents, and implementation tasks located in the `.kiro/specs/` directory.

## License

This project is licensed under the MIT License.