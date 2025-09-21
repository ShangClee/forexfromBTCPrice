# Project Structure

## Current File Organization

```
bitcoin-forex-calculator/
├── .kiro/                          # Kiro AI assistant configuration
│   ├── specs/                      # Feature specifications
│   │   └── bitcoin-forex-calculator/
│   │       ├── requirements.md     # User stories and acceptance criteria
│   │       ├── design.md          # Technical design and architecture
│   │       └── tasks.md           # Implementation roadmap
│   └── steering/                   # AI assistant guidance documents
│       ├── product.md             # Product overview and features
│       ├── tech.md               # Technology stack and commands
│       └── structure.md          # This file - project organization
├── .vscode/                       # VS Code workspace settings
│   └── settings.json             # Editor configuration
├── components/                    # React UI components
│   ├── __tests__/                 # Component unit tests
│   │   ├── AmountInput.test.tsx   # AmountInput component tests ✅ IMPLEMENTED
│   │   ├── CalculationBreakdown.test.tsx # CalculationBreakdown component tests ✅ IMPLEMENTED
│   │   ├── ComparisonDisplay.test.tsx # ComparisonDisplay component tests ✅ IMPLEMENTED
│   │   └── CurrencySelector.test.tsx # CurrencySelector component tests ✅ IMPLEMENTED
│   ├── AmountInput.tsx            # Amount input with validation ✅ IMPLEMENTED
│   ├── CalculationBreakdown.tsx   # Step-by-step calculation display ✅ IMPLEMENTED
│   ├── ComparisonDisplay.tsx      # Side-by-side rate comparison component ✅ IMPLEMENTED
│   └── CurrencySelector.tsx       # Currency selection component ✅ IMPLEMENTED
├── services/                      # Service layer for API integrations
│   ├── __tests__/                 # Service unit tests
│   │   ├── bitcoinPriceService.test.ts # Bitcoin API service tests ✅ IMPLEMENTED
│   │   ├── calculationService.test.ts  # Rate calculation service tests (in progress)
│   │   └── forexRateService.test.ts    # Forex API service tests ✅ IMPLEMENTED
│   ├── bitcoinPriceService.ts     # CoinGecko API integration ✅ IMPLEMENTED
│   ├── calculationService.ts      # Rate comparison calculation engine ✅ IMPLEMENTED
│   └── forexRateService.ts        # Traditional forex API integration ✅ IMPLEMENTED
├── types/                         # TypeScript type definitions
│   └── index.ts                   # Core interfaces and types ✅ IMPLEMENTED
├── bitcoin-forex-calculator.tsx  # Main React component
├── jest.config.js                 # Jest testing configuration
├── jest.setup.js                  # Jest setup file
├── package.json                   # Project dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
```

## Component Architecture

### Current Implementation
- **Main Component**: `BitcoinForexCalculator` - main React component containing core functionality
- **UI Components**: Modular React components for specific functionality ✅ IMPLEMENTED
  - `CurrencySelector` - Currency selection with search, swap, and accessibility features
  - `AmountInput` - Amount input with validation, formatting, and currency-specific handling
  - `ComparisonDisplay` - Side-by-side rate comparison with visual indicators and arbitrage detection
  - `CalculationBreakdown` - Step-by-step Bitcoin conversion calculation display with expandable interface
- **Service Layer**: Comprehensive API integration and calculation services ✅ IMPLEMENTED
  - `bitcoinPriceService.ts` - CoinGecko API integration with caching and rate limiting
  - `forexRateService.ts` - Traditional forex API integration with caching and fallback
  - `calculationService.ts` - Rate comparison calculation engine with arbitrage detection
- **Type Definitions**: Complete TypeScript interfaces for all data structures ✅ IMPLEMENTED
- **Testing Infrastructure**: Jest configuration with comprehensive unit tests ✅ IMPLEMENTED
  - Component tests for UI components with React Testing Library
  - Service tests with mock API responses and error scenarios
- **Styling**: Tailwind CSS utility classes for responsive design
- **State Management**: Local React hooks (useState, useEffect) with props-based data flow

### Target Component Structure (from specs)
```
components/
├── BitcoinForexCalculator.tsx    # Main container component
├── CurrencySelector.tsx          # Currency dropdown selection ✅ IMPLEMENTED
├── AmountInput.tsx               # Amount input with validation ✅ IMPLEMENTED
├── ComparisonDisplay.tsx         # Side-by-side rate comparison ✅ IMPLEMENTED
├── CalculationBreakdown.tsx     # Step-by-step calculation display ✅ IMPLEMENTED
└── RateTable.tsx                # Enhanced rate overview table (planned)

services/
├── bitcoinPriceService.ts        # CoinGecko API integration ✅ IMPLEMENTED
├── forexRateService.ts          # Traditional forex API integration ✅ IMPLEMENTED
└── calculationService.ts        # Rate comparison logic ✅ IMPLEMENTED

types/
└── index.ts                     # TypeScript interfaces and types ✅ IMPLEMENTED

utils/ (planned)
├── formatters.ts                # Currency and number formatting
└── validators.ts                # Input validation helpers
```

## Naming Conventions

### Files
- **Components**: PascalCase with `.tsx` extension (e.g., `CurrencySelector.tsx`)
- **Services**: camelCase with `.ts` extension (e.g., `bitcoinPriceService.ts`)
- **Types**: camelCase with `.ts` extension (e.g., `index.ts`)
- **Utilities**: camelCase with `.ts` extension (e.g., `formatters.ts`)

### Code
- **Components**: PascalCase (e.g., `BitcoinForexCalculator`)
- **Functions**: camelCase (e.g., `fetchBitcoinPrices`)
- **Variables**: camelCase (e.g., `lastUpdated`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Interfaces**: PascalCase with descriptive names (e.g., `BitcoinPriceData`)

## Data Flow Patterns

### Current Pattern
- Single component manages all state
- Direct API calls within useEffect hooks (Bitcoin prices)
- Separate service layer for forex API integration ✅ NEW
- Comprehensive error handling and retry logic ✅ NEW
- Intelligent caching with fallback mechanisms ✅ NEW
- Dedicated calculation service for rate comparisons ✅ NEW
- Inline data processing and formatting

### Target Pattern (from design specs)
- Service layer handles all API interactions
- Components focus on presentation and user interaction
- Clear separation between data fetching, processing, and display
- Props-based data flow between parent and child components

## Configuration Management

### Environment Variables
- API keys stored in environment variables
- Different configurations for development/production
- Rate limiting and caching parameters configurable

### Settings
- VS Code workspace settings in `.vscode/settings.json`
- Kiro AI assistant configuration in `.kiro/` directory
- Component-specific configurations passed as props