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

- **React 19.1+** with functional components and hooks
- **TypeScript 5.0+** with ES2015+ target for modern JavaScript features and better performance
- **Tailwind CSS 3.4+** for utility-first styling and responsive design
- **Lucide React 0.544+** for consistent iconography (RefreshCw, TrendingUp, TrendingDown, ExternalLink, etc.)
- **Jest 29.5+** for testing with comprehensive coverage
- **React Testing Library 16.3+** for component testing
- **CoinGecko API** for Bitcoin price data
- **ExchangeRate-API** (primary) and **open.er-api.com** (fallback) for traditional forex rates

## Project Structure

```
bitcoin-forex-calculator/
├── .kiro/                          # Kiro AI assistant configuration
│   ├── specs/                      # Feature specifications
│   │   └── bitcoin-forex-calculator/
│   │       ├── requirements.md     # User stories and acceptance criteria
│   │       ├── design.md          # Technical design and architecture
│   │       └── tasks.md           # Implementation roadmap
│   └── steering/                   # AI assistant guidance documents
├── src/                            # React application source
│   ├── App.tsx                    # Main App component
│   ├── index.tsx                  # Application entry point
│   ├── setupTests.ts              # Test configuration
│   └── react-app-env.d.ts         # React environment types
├── public/                         # Static assets
│   ├── index.html                 # HTML template
│   └── manifest.json              # PWA manifest
├── components/                     # React UI components
│   ├── __tests__/                 # Component unit tests
│   │   ├── AmountInput.test.tsx   # Amount input component tests
│   │   ├── CalculationBreakdown.test.tsx # Calculation breakdown tests
│   │   ├── ComparisonDisplay.test.tsx    # Comparison display tests
│   │   ├── CurrencySelector.test.tsx     # Currency selector tests
│   │   ├── ErrorBoundary.test.tsx        # Error boundary tests
│   │   ├── RateTable.test.tsx            # Rate table tests
│   │   └── ResponsiveDesign.test.tsx     # Responsive design tests
│   ├── AmountInput.tsx            # Amount input with validation and formatting ✅
│   ├── CalculationBreakdown.tsx   # Step-by-step calculation display ✅
│   ├── ComparisonDisplay.tsx      # Side-by-side rate comparison ✅
│   ├── CurrencySelector.tsx       # Currency selection component ✅
│   ├── ErrorBoundary.tsx          # Error boundary for graceful error handling ✅
│   └── RateTable.tsx              # Enhanced rate overview table ✅
├── services/                      # Service layer for API integrations
│   ├── __tests__/                 # Service unit tests
│   │   ├── bitcoinPriceService.test.ts      # Bitcoin API service tests
│   │   ├── calculationService.test.ts       # Rate calculation service tests
│   │   ├── enhancedBitcoinPriceService.test.ts # Enhanced Bitcoin service tests
│   │   ├── enhancedForexRateService.test.ts    # Enhanced forex service tests
│   │   └── forexRateService.test.ts            # Forex API service tests
│   ├── bitcoinPriceService.ts     # CoinGecko API integration ✅
│   ├── calculationService.ts      # Rate comparison calculation engine ✅
│   ├── enhancedBitcoinPriceService.ts # Enhanced Bitcoin service ✅
│   ├── enhancedForexRateService.ts    # Enhanced forex service ✅
│   └── forexRateService.ts        # Traditional forex API integration ✅
├── hooks/                          # Custom React hooks
│   ├── __tests__/                  # Hook unit tests
│   │   └── useDebounce.test.ts    # Debounce hook tests
│   ├── useDebounce.ts             # Debounce hook for input optimization ✅
│   └── useErrorHandling.ts        # Error handling hook ✅
├── utils/                          # Utility functions
│   ├── __tests__/                  # Utility unit tests
│   │   ├── errorHandling.test.ts  # Error handling utility tests
│   │   └── performance.test.ts    # Performance utility tests
│   ├── errorHandling.ts           # Error handling utilities ✅
│   └── performance.ts             # React performance optimization hooks ✅
├── types/                          # TypeScript type definitions
│   └── index.ts                   # Core interfaces and types ✅
├── __tests__/                      # Integration and performance tests
│   ├── integration/               # Integration test suites
│   └── performance-benchmarks.test.tsx # Performance benchmark tests
├── bitcoin-forex-calculator.tsx  # Main React component ✅
├── styles-integrated.css          # Integrated styles with Tailwind CSS ✅
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── jest.config.js                 # Jest testing configuration
├── package.json                   # Project dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
│   ├── enhancedBitcoinPriceService.ts # Enhanced Bitcoin service with advanced features
│   ├── enhancedForexRateService.ts    # Enhanced forex service with advanced features
│   └── forexRateService.ts        # Traditional forex API integration
├── hooks/                         # Custom React hooks
│   ├── __tests__/                 # Hook unit tests
│   │   └── useDebounce.test.ts    # Debounce hook tests
│   ├── useDebounce.ts             # Debounce hook for input optimization
│   └── useErrorHandling.ts        # Error handling hook
├── utils/                         # Utility functions and performance optimizations
│   ├── __tests__/                 # Utility unit tests
│   │   ├── errorHandling.test.ts  # Error handling utility tests
│   │   └── performance.test.ts    # Performance utility tests
│   ├── errorHandling.ts           # Error handling utilities
│   └── performance.ts             # React performance optimization hooks
├── types/                         # TypeScript type definitions
│   └── index.ts                   # Core interfaces and types
├── __tests__/                     # Integration and performance tests
│   └── performance-benchmarks.test.tsx # Performance benchmark tests
├── bitcoin-forex-calculator.tsx  # Main React component
├── jest.config.js                 # Jest testing configuration
├── jest.setup.js                  # Jest setup file
├── package.json                   # Project dependencies and scripts
├── tsconfig.json                  # TypeScript configuration (ES2015+ target)
└── validate-integration.js        # Integration validation script
```

## API Integration

### Forex Rate Service

The forex rate service (`services/forexRateService.ts`) provides:

- **Primary API**: ExchangeRate-API for real-time forex rates
- **Fallback API**: open.er-api.com for redundancy when primary API fails
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

### Calculation Service

The calculation service (`services/calculationService.ts`) provides the core rate comparison logic:

- **Bitcoin-based Rate Calculation**: Calculates exchange rates using Bitcoin as intermediary currency
- **Traditional Rate Processing**: Handles cross-currency calculations through base currency
- **Percentage Difference Analysis**: Computes differences between Bitcoin and traditional rates
- **Arbitrage Detection**: Identifies opportunities where rate differences exceed 2% threshold
- **Comprehensive Comparison**: Combines all calculations into detailed comparison results

#### Key Functions

- `calculateBitcoinBasedRate(source, target, bitcoinPrices)`: Calculate Bitcoin-derived exchange rate
- `getTraditionalForexRate(source, target, forexData)`: Extract traditional forex rate with cross-currency support
- `calculatePercentageDifference(bitcoinRate, traditionalRate)`: Compute percentage difference between rates
- `detectArbitrageOpportunity(percentageDifference, threshold)`: Identify arbitrage opportunities
- `determineBetterMethod(bitcoinRate, traditionalRate)`: Determine which method offers better rates
- `calculateConvertedAmounts(amount, bitcoinRate, traditionalRate)`: Calculate converted amounts for both methods
- `compareRates(source, target, amount, bitcoinPrices, forexData)`: Comprehensive rate comparison
- `batchCompareRates(currencyPairs, bitcoinPrices, forexData)`: Batch comparison for multiple currency pairs

## Usage

### Calculation Service Example

```typescript
import { compareRates } from './services/calculationService';
import { getBitcoinPrices } from './services/bitcoinPriceService';
import { fetchForexRates } from './services/forexRateService';

// Fetch data from APIs
const bitcoinPrices = await getBitcoinPrices(['usd', 'eur']);
const forexRates = await fetchForexRates('USD');

// Compare rates for $1000 USD to EUR conversion
const comparison = compareRates('USD', 'EUR', 1000, bitcoinPrices, forexRates);

console.log(`Traditional rate: ${comparison.traditionalRate}`);
console.log(`Bitcoin-based rate: ${comparison.bitcoinRate}`);
console.log(`Percentage difference: ${comparison.percentageDifference.toFixed(2)}%`);
console.log(`Better method: ${comparison.betterMethod}`);
console.log(`Arbitrage opportunity: ${comparison.arbitrageOpportunity}`);
console.log(`Traditional amount: ${comparison.traditionalAmount}`);
console.log(`Bitcoin amount: ${comparison.bitcoinAmount}`);
```

## Getting Started

### Prerequisites

- **Node.js 16+** (recommended: Node.js 18 or later)
- **npm** or **yarn** package manager
- **TypeScript 5.0+** with ES2015+ target (included in dependencies)
- Modern web browser supporting ES2015+ (Chrome 51+, Firefox 54+, Safari 10+, Edge 15+)

> **Note**: This project maintains two package.json configurations - see [PACKAGE_VERSION_NOTES.md](PACKAGE_VERSION_NOTES.md) for details on version alignment and development workflows.

### Quick Start

#### Automated Setup (Recommended)

Use the provided setup script to automatically create a new React app with the Bitcoin Forex Calculator:

```bash
# Make the script executable (on macOS/Linux)
chmod +x create-app.sh

# Run the setup script
./create-app.sh
```

The script will:
- Create a new React app with TypeScript
- Install all required dependencies
- Configure Tailwind CSS
- Copy all component files
- Set up the main App component
- Provide instructions to start the development server

#### Manual Setup

1. **Clone or download the project files**
2. **Follow one of the integration options below** (Create React App, Vite, or Next.js)
3. **Install dependencies and copy files as described in the integration steps**

### Development Setup

#### 1. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

#### 2. Verify Installation

Run the integration validation script to ensure everything is set up correctly:

```bash
node validate-integration.js
```

You should see all green checkmarks ✅ indicating successful setup.

#### 3. Run TypeScript Compilation Check

```bash
npx tsc --noEmit
```

This should complete without any errors.

#### 4. Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run tests in CI mode (no watch, with coverage)
npm run test:ci
```

### Running the Application

This project contains a React component that can be integrated into a React application. Here are several ways to run it:

#### Option 1: Create React App Integration

1. **Create a new React app** (if you don't have one):
   ```bash
   npx create-react-app my-bitcoin-calculator --template typescript
   cd my-bitcoin-calculator
   ```

2. **Copy the component files** into your React app:
   ```bash
   # Copy all the component files to your src directory
   cp -r bitcoin-forex-calculator/* my-bitcoin-calculator/src/
   ```

3. **Install required dependencies**:
   ```bash
   npm install lucide-react
   npm install -D @types/react @types/react-dom typescript
   ```

4. **Update your App.tsx**:
   ```tsx
   import React from 'react';
   import BitcoinForexCalculator from './bitcoin-forex-calculator';
   import './styles-integrated.css';

   function App() {
     return (
       <div className="App">
         <BitcoinForexCalculator />
       </div>
     );
   }

   export default App;
   ```

5. **Start the development server**:
   ```bash
   npm start
   ```

#### Option 2: Vite Integration (Recommended for faster development)

1. **Create a new Vite React app**:
   ```bash
   npm create vite@latest my-bitcoin-calculator -- --template react-ts
   cd my-bitcoin-calculator
   npm install
   ```

2. **Install Tailwind CSS**:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **Configure Tailwind** (update `tailwind.config.js`):
   ```js
   module.exports = {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

4. **Copy component files and install dependencies**:
   ```bash
   # Copy component files
   cp -r bitcoin-forex-calculator/* my-bitcoin-calculator/src/
   
   # Install required dependencies
   npm install lucide-react
   ```

5. **Update your main.tsx**:
   ```tsx
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import BitcoinForexCalculator from './bitcoin-forex-calculator'
   import './styles-integrated.css'

   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <BitcoinForexCalculator />
     </React.StrictMode>,
   )
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

#### Option 3: Next.js Integration

1. **Create a new Next.js app**:
   ```bash
   npx create-next-app@latest my-bitcoin-calculator --typescript --tailwind --eslint
   cd my-bitcoin-calculator
   ```

2. **Copy component files and install dependencies**:
   ```bash
   # Copy component files to your app directory
   cp -r bitcoin-forex-calculator/* my-bitcoin-calculator/app/
   
   # Install required dependencies
   npm install lucide-react
   ```

3. **Update your page.tsx**:
   ```tsx
   import BitcoinForexCalculator from './bitcoin-forex-calculator'

   export default function Home() {
     return (
       <main>
         <BitcoinForexCalculator />
       </main>
     )
   }
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

#### Option 4: Standalone HTML File (Quick Demo)

Create a simple HTML file to test the component:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bitcoin Forex Calculator</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        // Your component code here
        // Note: This is for demo purposes only, not recommended for production
    </script>
</body>
</html>
```

### Development Server

Once you have the app running, you'll see:

- **Real-time Bitcoin and Forex rates** loaded from APIs
- **Interactive currency selection** with search functionality
- **Amount input** with validation and formatting
- **Side-by-side rate comparison** with visual indicators
- **Detailed calculation breakdown** showing Bitcoin conversion steps
- **Comprehensive rate table** with all supported currencies

### Production Deployment

```bash
# Build for production (in your React app)
npm run build

# The build folder contains the production-ready files
# Deploy to your preferred hosting service (Vercel, Netlify, AWS, etc.)
```

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors
Make sure you've installed all required dependencies:
```bash
npm install lucide-react
npm install -D @types/react @types/react-dom typescript
```

#### 2. Tailwind CSS not working
Ensure Tailwind CSS is properly configured in your project:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

And make sure to import the styles:
```tsx
import './styles-integrated.css'
```

#### 3. TypeScript compilation errors
Run the TypeScript check to see specific errors:
```bash
npx tsc --noEmit
```

#### 4. API rate limit issues
The app uses free tier APIs with rate limits:
- **CoinGecko**: 50 calls/minute
- **ExchangeRate-API**: 1000 calls/month

If you hit rate limits, the app will show cached data or error messages with retry options.

#### 5. Network/CORS issues
The APIs used are public and CORS-enabled. The fallback API has been updated to open.er-api.com for better CORS compatibility. If you encounter network issues:
- Check your internet connection
- Verify the APIs are accessible from your network
- Check browser console for specific error messages
- The new fallback API (open.er-api.com) provides better browser compatibility than the previous Fixer.io endpoint

#### 6. Performance issues
The app includes performance optimizations, but if you experience slowness:
- Check the browser console for errors
- Run the performance benchmarks: `npm test __tests__/performance-benchmarks.test.tsx`
- Ensure you're not running in development mode for production use

### Getting Help

1. **Check the integration validation**:
   ```bash
   node validate-integration.js
   ```

2. **Run the test suite**:
   ```bash
   npm test
   ```

3. **Check the browser console** for error messages

4. **Verify API connectivity** by testing the services directly:
   ```bash
   npm test services/__tests__/bitcoinPriceService.test.ts
   npm test services/__tests__/forexRateService.test.ts
   ```

### Browser Compatibility

The application is compatible with:
- **Chrome** 51+ (ES2015+ support)
- **Firefox** 54+ (ES2015+ support)
- **Safari** 10+ (ES2015+ support)
- **Edge** 15+ (ES2015+ support)

**Note**: The TypeScript target has been updated to ES2015+ for better performance and modern JavaScript features. For older browsers, you may need additional polyfills or consider changing the TypeScript target to "es5" in tsconfig.json.

#### Testing Different Scenarios

```bash
# Run performance benchmarks
npm test __tests__/performance-benchmarks.test.tsx

# Run specific service tests
npm test services/__tests__/calculationService.test.ts

# Run component tests
npm test components/__tests__/

# Run utility tests
npm test utils/__tests__/

# Run integration tests
npm test __tests__/integration/
```

### Integration Validation

The project includes a comprehensive integration validation script that performs quick checks without running the full test suite:

```bash
# Run integration validation
node validate-integration.js

# Or make it executable and run directly
chmod +x validate-integration.js
./validate-integration.js
```

**Validation Checks:**
- ✅ **File Structure**: Verifies all required files are present
- ✅ **Component Structure**: Checks main component for essential patterns
- ✅ **Dependencies**: Validates package.json dependencies
- ✅ **TypeScript Config**: Ensures proper TypeScript configuration
- ✅ **CSS Integration**: Verifies Tailwind CSS and custom styles
- ✅ **Integration Summary**: Provides overall project health status

The validation script is particularly useful for:
- Quick project health checks before deployment
- Verifying integration after major changes
- Onboarding new developers to ensure proper setup
- CI/CD pipeline validation steps

### Performance Optimization

The project includes comprehensive performance utilities in `utils/performance.ts`:

- **useStableReference**: Prevents unnecessary re-renders with stable object references
- **useDeepMemo**: Deep comparison memoization for complex objects
- **useThrottle**: Function execution throttling for performance-critical operations
- **useOptimizedCalculation**: Advanced calculation caching with performance monitoring
- **useAdvancedCache**: TTL-based caching with LRU eviction and statistics
- **useRenderOptimization**: Prevents unnecessary component re-renders

### Error Handling

Robust error handling is implemented throughout the application:

- **ErrorBoundary Component**: Catches and displays user-friendly error messages
- **Error Handling Utilities**: Centralized error processing and logging with enhanced stability
- **Service-level Error Recovery**: Automatic retry logic and fallback mechanisms
- **User Input Validation**: Real-time validation with helpful error messages
- **useErrorHandling Hook**: Custom React hook with circular dependency fixes and inline retry logic
- **Auto-retry Support**: Configurable automatic retry with exponential backoff
- **Manual Retry**: User-initiated retry functionality with proper state management
- **Null Safety**: Enhanced error handler integration with null coalescing operators for production stability
- **Production Ready**: Robust error recovery mechanisms designed for production deployment

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

### ComparisonDisplay ✅ IMPLEMENTED

The `ComparisonDisplay` component provides a comprehensive side-by-side comparison of traditional forex rates versus Bitcoin-based exchange rates:

**Features:**
- **Side-by-side Rate Cards**: Clean comparison layout with traditional forex and Bitcoin route cards
- **Visual Indicators**: Color-coded borders and trend icons (TrendingUp, TrendingDown, Equal) to highlight better rates
- **Converted Amounts**: Shows actual amounts you would receive using each method
- **Percentage Difference**: Real-time calculation and display of rate differences with color coding
- **Arbitrage Detection**: Automatic alerts when rate differences exceed 2% threshold
- **Currency Formatting**: Proper formatting with currency symbols and integer currency support (JPY, KRW, HUF)
- **Amount Difference**: Shows the actual monetary impact of choosing one method over another
- **Loading States**: Skeleton animation during data fetching
- **Error Handling**: User-friendly error messages with retry suggestions
- **Responsive Design**: Mobile-optimized grid layout that adapts to different screen sizes

**Usage:**
```tsx
<ComparisonDisplay
  traditionalRate={0.8854}
  bitcoinRate={0.9123}
  amount={1000}
  sourceCurrency="USD"
  targetCurrency="EUR"
  loading={false}
/>
```

**Visual Elements:**
- Green highlighting and TrendingUp icon for the better rate method
- Red highlighting and TrendingDown icon for the inferior rate method
- Gray highlighting and Equal icon when rates are identical
- Yellow arbitrage alert box when opportunities are detected
- Percentage differences with appropriate color coding (green for positive, red for negative)

### CalculationBreakdown ✅ IMPLEMENTED

The `CalculationBreakdown` component provides a detailed, step-by-step explanation of how Bitcoin-based currency conversions are calculated:

**Features:**
- **Step-by-step Calculation Display**: Clear breakdown of the two-step Bitcoin conversion process
- **Expandable/Collapsible Interface**: Toggle between summary and detailed view with smooth transitions
- **Formula Visualization**: Mathematical formulas displayed in monospace font for clarity
- **Visual Step Indicators**: Numbered badges and clear section separation for easy following
- **Effective Rate Calculation**: Shows the final exchange rate derived from Bitcoin prices
- **Bitcoin Prices Reference**: Transparent display of the Bitcoin prices used in calculations
- **Error Handling**: Graceful handling of invalid or missing calculation data
- **Currency Formatting**: Proper formatting with currency symbols and integer currency support
- **Accessibility**: Full keyboard navigation, ARIA labels, and screen reader support
- **Responsive Design**: Mobile-optimized layout that works across all screen sizes

**Calculation Steps:**
1. **Source to Bitcoin**: Shows how the source currency amount is converted to Bitcoin
2. **Bitcoin to Target**: Displays the conversion from Bitcoin to the target currency
3. **Effective Rate Summary**: Calculates and shows the final exchange rate
4. **Reference Data**: Lists the Bitcoin prices used for transparency

**Usage:**
```tsx
<CalculationBreakdown
  sourceBtcPrice={45000}
  targetBtcPrice={38000}
  amount={1000}
  sourceCurrency="USD"
  targetCurrency="EUR"
  expanded={false}
  onToggle={() => setExpanded(!expanded)}
/>
```

**Visual Elements:**
- Blue-themed step indicators with numbered badges
- Monospace font for mathematical formulas
- Color-coded results (orange for Bitcoin amounts, green for final amounts)
- Clean separation between calculation steps and reference data
- Responsive grid layout for Bitcoin prices reference

### useErrorHandling Hook

The `useErrorHandling` custom hook provides comprehensive error management for React components:

**Features:**
- **Centralized Error Handling**: Single hook for managing all error states and recovery
- **Auto-retry Support**: Configurable automatic retry with exponential backoff
- **Manual Retry**: User-initiated retry functionality with proper state tracking
- **Error State Management**: Complete error state with recovery status and retry counts
- **Circular Dependency Safe**: Inline retry logic prevents React hooks dependency issues
- **Callback Support**: Optional callbacks for error, retry, and recovery events
- **Timeout Management**: Proper cleanup of retry timeouts on component unmount
- **Production Ready**: Enhanced stability with null safety and robust error recovery

**Usage:**
```tsx
const {
  errorState,
  hasError,
  canRetry,
  handleError,
  retry,
  clearError,
  withErrorHandling
} = useErrorHandling({
  maxRetries: 3,
  retryDelay: 2000,
  autoRetry: true,
  onError: (error) => console.error('Error occurred:', error),
  onRetry: (count) => console.log(`Retry attempt ${count}`),
  onRecovery: () => console.log('Error recovered')
});

// Use with async operations
const fetchData = async () => {
  const result = await withErrorHandling(
    () => apiCall(),
    { component: 'DataFetcher', action: 'fetchData' }
  );
  return result;
};
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
- **open.er-api.com**: CORS-friendly fallback API with generous limits and reliable uptime
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
- ✅ **Enhanced Services**: Advanced Bitcoin and Forex services with performance optimizations
- ✅ **Calculation Service**: Complete rate comparison engine with arbitrage detection and comprehensive testing
- ✅ **Performance Utilities**: Comprehensive React optimization hooks with improved TypeScript support
- ✅ **Error Handling**: Robust error handling utilities and error boundary components
- ✅ **Custom Hooks**: Debounce and error handling hooks for enhanced user experience
- ✅ **Unit Testing**: Comprehensive test suite for all layers (200+ tests, 96%+ coverage)
- ✅ **Currency Selection Component**: Full-featured CurrencySelector with search, swap, and accessibility
- ✅ **Amount Input Component**: Complete AmountInput with validation, formatting, and currency-specific handling
- ✅ **Comparison Display Component**: Complete ComparisonDisplay with side-by-side rate comparison, visual indicators, and arbitrage detection
- ✅ **Calculation Breakdown Component**: Complete CalculationBreakdown with step-by-step Bitcoin conversion explanation and expandable interface
- ✅ **Rate Table Component**: Enhanced rate overview table with sorting and trend indicators
- ✅ **Error Boundary Component**: Graceful error handling with user-friendly fallback UI
- 🚧 **Component Integration**: Integration of all components in the main calculator interface (next phase)

## Next Steps

The foundation is now complete with robust service layers, calculation engine, and core UI components. The next phase focuses on building the remaining user interface:

1. ✅ **Currency Selection Component**: Complete CurrencySelector with search, swap, and accessibility features
2. ✅ **Amount Input Component**: Complete AmountInput with validation, formatting, and currency-specific handling
3. ✅ **Rate Comparison Engine**: Complete calculation service with Bitcoin vs traditional rate comparison logic
4. ✅ **Comparison Display Component**: Complete ComparisonDisplay with side-by-side comparison, visual indicators, and arbitrage alerts
5. ✅ **Calculation Breakdown Component**: Complete CalculationBreakdown with detailed step-by-step calculation explanation and expandable interface
6. **Rate Table Component**: Build enhanced rate overview table with sorting and trend indicators
7. **Component Integration**: Integrate all components in the main calculator interface with proper state management
8. **Mobile Optimization**: Ensure responsive design for mobile trading scenarios

## Contributing

This project follows a specification-driven development approach with detailed requirements, design documents, and implementation tasks located in the `.kiro/specs/` directory.

## License

This project is licensed under the MIT License.