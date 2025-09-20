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
├── services/                      # Service layer for API integrations
│   ├── __tests__/                 # Service unit tests
│   │   └── forexRateService.test.ts
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
- **Single Component**: `BitcoinForexCalculator` - monolithic React component containing all functionality
- **Service Layer**: `forexRateService.ts` - comprehensive forex API integration with caching and fallback ✅ IMPLEMENTED
- **Type Definitions**: Complete TypeScript interfaces for all data structures ✅ IMPLEMENTED
- **Testing Infrastructure**: Jest configuration with unit tests for services ✅ IMPLEMENTED
- **Inline Styling**: Tailwind CSS classes applied directly to JSX elements
- **State Management**: Local React hooks (useState, useEffect) within main component

### Planned Component Structure (from specs)
```
src/
├── components/
│   ├── BitcoinForexCalculator.tsx    # Main container component
│   ├── CurrencySelector.tsx          # Currency dropdown selection
│   ├── AmountInput.tsx               # Amount input with validation
│   ├── ComparisonDisplay.tsx         # Side-by-side rate comparison
│   ├── CalculationBreakdown.tsx     # Step-by-step calculation display
│   └── RateTable.tsx                # Enhanced rate overview table
├── services/
│   ├── bitcoinPriceService.ts        # CoinGecko API integration
│   ├── forexRateService.ts          # Traditional forex API integration
│   └── calculationService.ts        # Rate comparison logic
├── types/
│   └── index.ts                     # TypeScript interfaces and types
└── utils/
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