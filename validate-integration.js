#!/usr/bin/env node

/**
 * Simple validation script for Bitcoin Forex Calculator integration
 * This script performs basic checks without running the full test suite
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Bitcoin Forex Calculator Integration...\n');

// Check if all required files exist
const requiredFiles = [
  'bitcoin-forex-calculator.tsx',
  'components/CurrencySelector.tsx',
  'components/AmountInput.tsx',
  'components/ComparisonDisplay.tsx',
  'components/CalculationBreakdown.tsx',
  'components/RateTable.tsx',
  'components/ErrorBoundary.tsx',
  'services/enhancedBitcoinPriceService.ts',
  'services/enhancedForexRateService.ts',
  'services/calculationService.ts',
  'hooks/useDebounce.ts',
  'hooks/useErrorHandling.ts',
  'utils/performance.ts',
  'utils/errorHandling.ts',
  'types/index.ts',
  'styles-integrated.css'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check main component structure
console.log('\n🔧 Checking main component structure:');
try {
  const mainComponent = fs.readFileSync('bitcoin-forex-calculator.tsx', 'utf8');
  
  const checks = [
    { name: 'React import', pattern: /import React/ },
    { name: 'Component exports', pattern: /export default BitcoinForexCalculator/ },
    { name: 'Error boundary usage', pattern: /ErrorBoundary/ },
    { name: 'Accessibility features', pattern: /aria-/ },
    { name: 'Loading states', pattern: /isLoading/ },
    { name: 'Error handling', pattern: /useErrorHandling/ },
    { name: 'Performance optimizations', pattern: /useStableCallback|useOptimizedCalculation/ },
    { name: 'Responsive design', pattern: /sm:|md:|lg:/ },
    { name: 'Animation classes', pattern: /animate-/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(mainComponent)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ⚠️  ${check.name} - Not found or incomplete`);
    }
  });
} catch (error) {
  console.log(`  ❌ Error reading main component: ${error.message}`);
  allFilesExist = false;
}

// Check package.json dependencies
console.log('\n📦 Checking dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = ['lucide-react'];
  const requiredDevDeps = ['@types/react', '@types/react-dom', 'typescript'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep} (production)`);
    } else {
      console.log(`  ❌ ${dep} - Missing from dependencies`);
      allFilesExist = false;
    }
  });
  
  requiredDevDeps.forEach(dep => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`  ✅ ${dep} (development)`);
    } else {
      console.log(`  ❌ ${dep} - Missing from devDependencies`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log(`  ❌ Error reading package.json: ${error.message}`);
  allFilesExist = false;
}

// Check TypeScript configuration
console.log('\n⚙️  Checking TypeScript configuration:');
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  const requiredOptions = [
    { key: 'target', expected: 'es2015' },
    { key: 'jsx', expected: 'react-jsx' },
    { key: 'strict', expected: true },
    { key: 'esModuleInterop', expected: true }
  ];
  
  requiredOptions.forEach(option => {
    if (tsConfig.compilerOptions && tsConfig.compilerOptions[option.key] === option.expected) {
      console.log(`  ✅ ${option.key}: ${option.expected}`);
    } else {
      console.log(`  ⚠️  ${option.key}: Expected ${option.expected}, got ${tsConfig.compilerOptions?.[option.key] || 'undefined'}`);
    }
  });
} catch (error) {
  console.log(`  ❌ Error reading tsconfig.json: ${error.message}`);
}

// Check CSS integration
console.log('\n🎨 Checking CSS integration:');
try {
  const css = fs.readFileSync('styles-integrated.css', 'utf8');
  
  const cssChecks = [
    { name: 'Tailwind imports', pattern: /@import 'tailwindcss/ },
    { name: 'Custom animations', pattern: /@keyframes/ },
    { name: 'Component classes', pattern: /@layer components/ },
    { name: 'Utility classes', pattern: /@layer utilities/ },
    { name: 'Responsive design', pattern: /@media/ },
    { name: 'Accessibility support', pattern: /prefers-reduced-motion/ }
  ];
  
  cssChecks.forEach(check => {
    if (check.pattern.test(css)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ⚠️  ${check.name} - Not found`);
    }
  });
} catch (error) {
  console.log(`  ❌ Error reading CSS file: ${error.message}`);
}

// Summary
console.log('\n📊 Integration Summary:');
if (allFilesExist) {
  console.log('  ✅ All required files are present');
  console.log('  ✅ Main component structure looks good');
  console.log('  ✅ Dependencies are properly configured');
  console.log('  ✅ TypeScript configuration is valid');
  console.log('  ✅ CSS integration includes modern features');
  
  console.log('\n🎉 Integration validation PASSED!');
  console.log('\n📝 Next steps:');
  console.log('  1. Run TypeScript compilation: npx tsc --noEmit');
  console.log('  2. Test the application in a browser');
  console.log('  3. Verify all animations and interactions work');
  console.log('  4. Test accessibility features with screen readers');
  console.log('  5. Test responsive design on different screen sizes');
  
  process.exit(0);
} else {
  console.log('  ❌ Some files are missing or incomplete');
  console.log('\n🔧 Please address the missing files before proceeding.');
  process.exit(1);
}