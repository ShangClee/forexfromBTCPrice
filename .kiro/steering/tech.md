# Technology Stack

## Frontend Framework
- **React 18+** with functional components and hooks
- **TypeScript** for type safety and better developer experience
- **JSX/TSX** for component templates

## Styling & UI
- **Tailwind CSS** for utility-first styling and responsive design
- **Lucide React** for consistent iconography (RefreshCw, TrendingUp, TrendingDown)
- Responsive design patterns with mobile-first approach

## State Management
- **React Hooks** (useState, useEffect) for local component state
- No external state management library - keeping it simple with built-in React state

## API Integration
- **Fetch API** for HTTP requests
- **CoinGecko API** for Bitcoin price data across multiple currencies
- **ExchangeRate-API** (primary) and **Fixer.io** (fallback) for traditional forex rates
- Client-side caching strategies (30-second cache for Bitcoin, 5-minute for forex)

## Data Processing
- Real-time rate calculations and comparisons
- Arbitrage opportunity detection (>2% threshold)
- Currency-specific number formatting (special handling for JPY, KRW)

## Development Tools
- **VS Code** as primary IDE
- **Kiro AI Assistant** integration disabled in current setup
- Project uses `.tsx` extension for React components

## Common Commands

### Development
```bash
# Install dependencies (assuming npm/yarn setup)
npm install
# or
yarn install

# Start development server
npm start
# or
yarn start

# Build for production
npm run build
# or
yarn build
```

### Testing
```bash
# Run tests
npm test
# or
yarn test

# Run tests with coverage
npm run test:coverage
# or
yarn test:coverage
```

## API Rate Limits & Considerations
- **CoinGecko**: 50 calls/minute (free tier)
- **ExchangeRate-API**: 1000 calls/month (free tier)
- Implement exponential backoff for failed requests
- Use fallback APIs when primary services are unavailable