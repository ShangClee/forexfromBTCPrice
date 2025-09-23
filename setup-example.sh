#!/bin/bash

# Bitcoin Forex Calculator - Quick Setup Script
# This script creates a new React app with the Bitcoin Forex Calculator integrated

echo "🚀 Bitcoin Forex Calculator - Quick Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    echo "   Please update Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Ask for project name
read -p "📁 Enter project name (default: bitcoin-forex-calculator-app): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-bitcoin-forex-calculator-app}

echo "📦 Creating React app: $PROJECT_NAME"

# Create React app with TypeScript
npx create-react-app "$PROJECT_NAME" --template typescript

if [ $? -ne 0 ]; then
    echo "❌ Failed to create React app"
    exit 1
fi

cd "$PROJECT_NAME"

echo "📦 Installing required dependencies..."

# Install required dependencies
npm install lucide-react

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

echo "⚙️  Configuring Tailwind CSS..."

# Configure Tailwind CSS
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

# Update src/index.css to include Tailwind
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

echo "📋 Copying Bitcoin Forex Calculator files..."

# Copy component files from current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📋 Copying Bitcoin Forex Calculator files from: $SCRIPT_DIR"

if [ -d "$SCRIPT_DIR/components" ]; then
    cp -r "$SCRIPT_DIR/components" src/
    cp -r "$SCRIPT_DIR/services" src/
    cp -r "$SCRIPT_DIR/hooks" src/
    cp -r "$SCRIPT_DIR/utils" src/
    cp -r "$SCRIPT_DIR/types" src/
    cp "$SCRIPT_DIR/bitcoin-forex-calculator.tsx" src/
    cp "$SCRIPT_DIR/styles-integrated.css" src/
    echo "✅ All component files copied successfully"
else
    echo "⚠️  Component files not found in script directory: $SCRIPT_DIR"
    echo "   Please manually copy the following files to src/:"
    echo "   - components/"
    echo "   - services/"
    echo "   - hooks/"
    echo "   - utils/"
    echo "   - types/"
    echo "   - bitcoin-forex-calculator.tsx"
    echo "   - styles-integrated.css"
    echo ""
    echo "   From the Bitcoin Forex Calculator project directory to:"
    echo "   $(pwd)/src/"
fi

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
echo "  npm run test:coverage - Run tests with coverage"
echo ""
echo "🔧 If you encounter any issues, check the README.md file for troubleshooting."
EOF