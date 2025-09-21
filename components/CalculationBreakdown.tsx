import React from 'react';
import { ChevronDown, ChevronUp, Calculator, ArrowRight, Bitcoin } from 'lucide-react';
import { CalculationBreakdownProps } from '../types';

/**
 * CalculationBreakdown component displays step-by-step breakdown of Bitcoin-based
 * currency conversion calculations with expandable/collapsible functionality
 */
export const CalculationBreakdown: React.FC<CalculationBreakdownProps> = ({
  sourceBtcPrice,
  targetBtcPrice,
  amount,
  sourceCurrency,
  targetCurrency,
  expanded = false,
  onToggle
}) => {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  // Handle toggle - use internal state if no external handler provided
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  // Use external expanded state if onToggle is provided, otherwise use internal state
  const currentExpanded = onToggle ? expanded : isExpanded;

  // Format currency amounts
  const formatAmount = React.useCallback((value: number, currency: string): string => {
    const integerCurrencies = ['JPY', 'KRW', 'HUF'];
    const decimals = integerCurrencies.includes(currency.toUpperCase()) ? 0 : 2;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }, []);

  // Calculate step-by-step values
  const calculations = React.useMemo(() => {
    if (sourceBtcPrice === undefined || sourceBtcPrice === null || sourceBtcPrice <= 0 ||
        targetBtcPrice === undefined || targetBtcPrice === null || targetBtcPrice <= 0 ||
        amount === undefined || amount === null || amount < 0) {
      return null;
    }

    try {
      // Step 1: Convert source currency to Bitcoin
      const btcAmount = amount / sourceBtcPrice;
      
      // Step 2: Convert Bitcoin to target currency
      const finalAmount = btcAmount * targetBtcPrice;
      
      // Calculate the effective rate
      const effectiveRate = sourceBtcPrice / targetBtcPrice;

      return {
        step1: {
          description: `Convert ${sourceCurrency.toUpperCase()} to Bitcoin`,
          formula: `${amount} ${sourceCurrency.toUpperCase()} ÷ ${sourceBtcPrice.toFixed(2)} ${sourceCurrency.toUpperCase()}/BTC`,
          result: btcAmount,
          resultFormatted: `${btcAmount.toFixed(8)} BTC`
        },
        step2: {
          description: `Convert Bitcoin to ${targetCurrency.toUpperCase()}`,
          formula: `${btcAmount.toFixed(8)} BTC × ${targetBtcPrice.toFixed(2)} ${targetCurrency.toUpperCase()}/BTC`,
          result: finalAmount,
          resultFormatted: formatAmount(finalAmount, targetCurrency)
        },
        effectiveRate: {
          description: 'Effective Exchange Rate',
          formula: `${sourceBtcPrice.toFixed(2)} ÷ ${targetBtcPrice.toFixed(2)}`,
          result: effectiveRate,
          resultFormatted: `1 ${sourceCurrency.toUpperCase()} = ${effectiveRate.toFixed(6)} ${targetCurrency.toUpperCase()}`
        }
      };
    } catch (error) {
      console.error('Error calculating breakdown:', error);
      return null;
    }
  }, [sourceBtcPrice, targetBtcPrice, amount, sourceCurrency, targetCurrency, formatAmount]);

  // Error state
  if (!calculations) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">
              Calculation Breakdown
            </span>
          </div>
          <span className="text-xs text-red-500">
            Unable to calculate
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        aria-expanded={currentExpanded}
        aria-controls="calculation-breakdown-content"
      >
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            Bitcoin Route Calculation
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {formatAmount(amount, sourceCurrency)} → {calculations.step2.resultFormatted}
          </span>
          {currentExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {currentExpanded && (
        <div 
          id="calculation-breakdown-content"
          className="border-t border-gray-200 p-4 space-y-4"
        >
          {/* Step 1: Source to Bitcoin */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <h4 className="text-sm font-medium text-gray-900">
                {calculations.step1.description}
              </h4>
            </div>
            
            <div className="ml-8 space-y-1">
              <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {calculations.step1.formula}
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Result:</span>
                <span className="font-semibold text-orange-600 flex items-center space-x-1">
                  <Bitcoin className="w-4 h-4" />
                  <span>{calculations.step1.resultFormatted}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          {/* Step 2: Bitcoin to Target */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <h4 className="text-sm font-medium text-gray-900">
                {calculations.step2.description}
              </h4>
            </div>
            
            <div className="ml-8 space-y-1">
              <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                {calculations.step2.formula}
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Result:</span>
                <span className="font-semibold text-green-600">
                  {calculations.step2.resultFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Effective Rate Summary */}
          <div className="border-t border-gray-100 pt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                {calculations.effectiveRate.description}
              </h5>
              <div className="space-y-1">
                <div className="text-sm text-blue-700 font-mono">
                  {calculations.effectiveRate.formula} = {calculations.effectiveRate.result.toFixed(6)}
                </div>
                <div className="text-sm font-semibold text-blue-800">
                  {calculations.effectiveRate.resultFormatted}
                </div>
              </div>
            </div>
          </div>

          {/* Bitcoin Prices Reference */}
          <div className="border-t border-gray-100 pt-4">
            <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Bitcoin Prices Used
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">
                  {sourceCurrency.toUpperCase()}/BTC
                </span>
                <span className="font-medium">
                  {formatAmount(sourceBtcPrice, sourceCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">
                  {targetCurrency.toUpperCase()}/BTC
                </span>
                <span className="font-medium">
                  {formatAmount(targetBtcPrice, targetCurrency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculationBreakdown;