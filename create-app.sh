#!/bin/bash

# Bitcoin Forex Calculator - Direct Setup Script
# Run this from the Bitcoin Forex Calculator project directory

echo "🚀 Bitcoin Forex Calculator - Direct Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "bitcoin-forex-calculator.tsx" ]; then
    echo "❌ Error: bitcoin-forex-calculator.tsx not found in current directory"
    echo "   Please run this script from the Bitcoin Forex Calculator project directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Found Bitcoin Forex Calculator files"
echo "✅ Node.js $(node -v) detected"

# Ask for project name
read -p "📁 Enter project name (default: bitcoin-calculator-app): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-bitcoin-calculator-app}

echo "📦 Creating React app: $PROJECT_NAME"

# Create React app with TypeScript
npx create-react-app "$PROJECT_NAME" --template typescript

if [ $? -ne 0 ]; then
    echo "❌ Failed to create React app"
    exit 1
fi

echo "📦 Installing required dependencies..."

cd "$PROJECT_NAME"

# Install required dependencies
npm install lucide-react

# Install Tailwind CSS (using v3 for compatibility)
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
npx tailwindcss init -p

echo "⚙️  Configuring Tailwind CSS..."

# Configure Tailwind CSS (will be created by npx tailwindcss init -p)
# But let's ensure it has the right content paths
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

echo "📋 Copying Bitcoin Forex Calculator files..."

# Copy component files from parent directory (where the script was run from)
cp -r ../components src/
cp -r ../services src/
cp -r ../hooks src/
cp -r ../utils src/
cp -r ../types src/
cp ../bitcoin-forex-calculator.tsx src/
cp ../styles-integrated.css src/

# Update App.tsx
cat > src/App.tsx << 'EOF'
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
EOF

# Update TypeScript configuration for modern JavaScript features
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2015",
    "lib": [
      "dom",
      "dom.iterable",
      "es6"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}
EOF

# Update index.css to include Tailwind
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

echo "✅ Setup complete!"
echo ""
echo "🎉 Your Bitcoin Forex Calculator app is ready!"
echo ""
echo "To start the development server:"
echo "  cd $PROJECT_NAME"
echo "  npm start"
echo ""
echo "The app will be available at: http://localhost:3000"
echo ""
echo "📚 Additional commands:"
echo "  npm test              - Run tests"
echo "  npm run build         - Build for production"
echo ""
echo "🔧 If you encounter any issues, check the README.md file for troubleshooting."