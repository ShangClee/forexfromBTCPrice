import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Equal } from 'lucide-react';
import { ComparisonDisplayProps } from '../types';

/**
 * ComparisonDisplay component shows side-by-side comparison of traditional
 * vs Bitcoin-based exchange rates with visual indicators and arbitrage alerts
 */
export const ComparisonDisplay: React.FC<ComparisonDisplayProps> = ({
  traditionalRate,
  bitcoinRate,
  amount,
  sourceCurrency,
  targetCurrency,
  loading = false
}) => {
  // Calculate comparison data
  const comparison = React.useMemo(() => {
    if (loading || !traditionalRate || !bitcoinRate || amount === undefined || amount === null) {
      return null;
    }

    try {
      // Calculate converted amounts directly
      const traditionalAmount = amount * traditionalRate;
      const bitcoinAmount = amount * bitcoinRate;
      
      // Calculate percentage difference
      const percentageDifference = ((bitcoinRate - traditionalRate) / traditionalRate) * 100;
      
      // Determine better method
      let betterMethod: 'traditional' | 'bitcoin' | 'equal';
      
      if (bitcoinRate === traditionalRate) {
        betterMethod = 'equal';
      } else {
        betterMethod = bitcoinRate > traditionalRate ? 'bitcoin' : 'traditional';
      }
      
      // Detect arbitrage opportunity (>2% difference)
      const arbitrageOpportunity = Math.abs(percentageDifference) > 2;

      return {
        sourceCurrency: sourceCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
        amount,
        traditionalRate,
        bitcoinRate,
        traditionalAmount,
        bitcoinAmount,
        percentageDifference,
        betterMethod,
        arbitrageOpportunity
      };
    } catch (error) {
      console.error('Error calculating comparison:', error);
      return null;
    }
  }, [traditionalRate, bitcoinRate, amount, sourceCurrency, targetCurrency, loading]);

  // Format currency amounts
  const formatAmount = (value: number, currency: string): string => {
    const integerCurrencies = ['JPY', 'KRW', 'HUF'];
    const decimals = integerCurrencies.includes(currency.toUpperCase()) ? 0 : 2;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Format percentage with sign
  const formatPercentage = (value: number): string => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Get color classes based on better method
  const getMethodColors = (method: 'traditional' | 'bitcoin' | 'equal', isBetter: boolean) => {
    if (method === 'equal') {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
    
    if (isBetter) {
      return 'text-green-700 bg-green-50 border-green-200';
    }
    
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse" data-testid="loading-skeleton">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-16 bg-gray-200 rounded mt-4"></div>
        </div>
      </div>
    );
  }

  // Error or no data state
  if (!comparison) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to calculate comparison</p>
          <p className="text-sm">Please check your inputs and try again</p>
        </div>
      </div>
    );
  }

  const { 
    traditionalAmount, 
    bitcoinAmount, 
    percentageDifference, 
    betterMethod, 
    arbitrageOpportunity 
  } = comparison;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Rate Comparison
        </h3>
        <div className="text-sm text-gray-500">
          {sourceCurrency.toUpperCase()} → {targetCurrency.toUpperCase()}
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Traditional Forex */}
        <div className={`p-4 rounded-lg border-2 transition-colors ${
          getMethodColors(betterMethod, betterMethod === 'traditional')
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Traditional Forex</h4>
            {betterMethod === 'traditional' && (
              <TrendingUp className="w-5 h-5 text-green-600" />
            )}
            {betterMethod === 'bitcoin' && (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            {betterMethod === 'equal' && (
              <Equal className="w-5 h-5 text-gray-500" />
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Rate</div>
            <div className="text-lg font-semibold">
              {traditionalRate.toFixed(6)}
            </div>
            <div className="text-sm text-gray-600">You get</div>
            <div className="text-xl font-bold">
              {formatAmount(traditionalAmount, targetCurrency)}
            </div>
          </div>
        </div>

        {/* Bitcoin-based */}
        <div className={`p-4 rounded-lg border-2 transition-colors ${
          getMethodColors(betterMethod, betterMethod === 'bitcoin')
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Bitcoin Route</h4>
            {betterMethod === 'bitcoin' && (
              <TrendingUp className="w-5 h-5 text-green-600" />
            )}
            {betterMethod === 'traditional' && (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            {betterMethod === 'equal' && (
              <Equal className="w-5 h-5 text-gray-500" />
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Rate</div>
            <div className="text-lg font-semibold">
              {bitcoinRate.toFixed(6)}
            </div>
            <div className="text-sm text-gray-600">You get</div>
            <div className="text-xl font-bold">
              {formatAmount(bitcoinAmount, targetCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* Difference and Arbitrage Alert */}
      <div className="space-y-3">
        {/* Percentage Difference */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            Difference
          </span>
          <span className={`text-sm font-semibold ${
            percentageDifference > 0 
              ? 'text-green-600' 
              : percentageDifference < 0 
                ? 'text-red-600' 
                : 'text-gray-600'
          }`}>
            {formatPercentage(percentageDifference)}
          </span>
        </div>

        {/* Better Method Indicator */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            Better Method
          </span>
          <span className={`text-sm font-semibold capitalize ${
            betterMethod === 'bitcoin' 
              ? 'text-orange-600' 
              : betterMethod === 'traditional'
                ? 'text-blue-600'
                : 'text-gray-600'
          }`}>
            {betterMethod === 'equal' ? 'Same Rate' : `${betterMethod} Route`}
          </span>
        </div>

        {/* Arbitrage Alert */}
        {arbitrageOpportunity && (
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-semibold text-yellow-800 mb-1">
                Arbitrage Opportunity Detected
              </h5>
              <p className="text-sm text-yellow-700">
                The rate difference exceeds 2%, indicating a potential arbitrage opportunity. 
                The {betterMethod} route offers {formatPercentage(Math.abs(percentageDifference))} better rates.
              </p>
            </div>
          </div>
        )}

        {/* Amount Difference */}
        {Math.abs(bitcoinAmount - traditionalAmount) > 0.01 && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              Amount Difference
            </span>
            <span className={`text-sm font-semibold ${
              bitcoinAmount > traditionalAmount 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {bitcoinAmount > traditionalAmount ? '+' : ''}
              {formatAmount(bitcoinAmount - traditionalAmount, targetCurrency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonDisplay;