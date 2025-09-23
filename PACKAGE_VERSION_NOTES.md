# Package Version Notes

## Current Package Configuration

### Root Package (package.json)
- **Name**: bitcoin-forex-calculator
- **Version**: 1.0.0
- **React**: 19.1.1
- **TypeScript**: 5.0.0
- **Testing**: Jest 29.5.0 with custom configuration

### Bitcoin Calculator App (bitcoin-calculator-app/package.json)
- **Name**: bitcoin-calculator-app
- **Version**: 0.1.0
- **React**: 19.1.1
- **TypeScript**: 4.9.5
- **Testing**: React Scripts test runner

## Version Alignment Recommendations

### TypeScript Version Discrepancy
The root package uses TypeScript 5.0.0 while the bitcoin-calculator-app uses 4.9.5. For consistency and to leverage the latest TypeScript features:

**Recommended Action**: Update bitcoin-calculator-app TypeScript to 5.0.0+
```bash
cd bitcoin-calculator-app
npm install typescript@^5.0.0 --save-dev
```

### Testing Configuration
- Root package uses Jest with custom configuration for comprehensive testing
- Bitcoin-calculator-app uses React Scripts default test runner
- Both approaches are valid for their respective use cases

### Dependencies Alignment
Both packages use the same versions for:
- ✅ React 19.1.1
- ✅ React DOM 19.1.1
- ✅ Lucide React 0.544.0
- ✅ Tailwind CSS 3.4.17

## Development Workflow

### For Root Package Development
```bash
npm test              # Run Jest tests
npm run test:coverage # Run tests with coverage
npm run test:ci       # CI mode testing
```

### For Bitcoin Calculator App Development
```bash
cd bitcoin-calculator-app
npm start            # Start development server
npm test             # Run React Scripts tests
npm run build        # Build for production
```

## Notes
- The root package serves as the main development environment with comprehensive testing
- The bitcoin-calculator-app provides a Create React App environment for easy deployment
- Both configurations are maintained for different development and deployment scenarios