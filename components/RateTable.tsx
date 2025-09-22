import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown, Equal, ExternalLink } from 'lucide-react';
import { RateTableProps, BitcoinPriceData, ForexRateData, ComparisonResult } from '../types';
import { compareRates } from '../services/calculationService';

/**
 * Enhanced rate table component that displays comparison between traditional forex rates
 * and Bitcoin-based exchange rates with sorting and selection capabilities
 */

type SortField = 'currency' | 'bitcoinRate' | 'traditionalRate' | 'percentageDifference' | 'arbitrage';
type SortDirection = 'asc' | 'desc';

interface TableRow {
  currency: string;
  currencyName: string;
  bitcoinRate: number;
  traditionalRate: number;
  percentageDifference: number;
  betterMethod: 'bitcoin' | 'traditional' | 'equal';
  arbitrageOpportunity: boolean;
  trend: 'up' | 'down' | 'neutral';
}

// Currency display names mapping
const CURRENCY_NAMES: { [key: string]: string } = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  PLN: 'Polish Zloty',
  CZK: 'Czech Koruna',
  HUF: 'Hungarian Forint',
  RUB: 'Russian Ruble',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
  INR: 'Indian Rupee',
  KRW: 'South Korean Won',
  SGD: 'Singapore Dollar'
};

const RateTable: React.FC<RateTableProps> = ({
  bitcoinPrices,
  forexRates,
  baseCurrency,
  onCurrencySelect
}) => {
  const [sortField, setSortField] = useState<SortField>('currency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Generate table data with comparisons
  const tableData = useMemo(() => {
    if (!bitcoinPrices || !forexRates) return [];

    const data: TableRow[] = [];
    const baseUpper = baseCurrency.toUpperCase();

    // Get all available currencies from both Bitcoin prices and forex rates
    // Normalize to uppercase to avoid duplicates
    const availableCurrencies = new Set([
      ...Object.keys(bitcoinPrices).map(c => c.toUpperCase()),
      ...Object.keys(forexRates.rates).map(c => c.toUpperCase()),
      forexRates.base.toUpperCase()
    ]);

    availableCurrencies.forEach(currencyUpper => {
      // Skip base currency for comparison
      if (currencyUpper === baseUpper) return;

      try {
        // Calculate comparison using the calculation service
        const comparison: ComparisonResult = compareRates(
          baseCurrency,
          currencyUpper.toLowerCase(), // Pass lowercase to compareRates
          1, // Use 1 unit for rate comparison
          bitcoinPrices,
          forexRates
        );

        // Generate mock trend (in real app, this would come from historical data)
        const trend: 'up' | 'down' | 'neutral' = 
          Math.random() > 0.6 ? 'up' : 
          Math.random() > 0.3 ? 'down' : 'neutral';

        data.push({
          currency: currencyUpper,
          currencyName: CURRENCY_NAMES[currencyUpper] || currencyUpper,
          bitcoinRate: comparison.bitcoinRate,
          traditionalRate: comparison.traditionalRate,
          percentageDifference: comparison.percentageDifference,
          betterMethod: comparison.betterMethod,
          arbitrageOpportunity: comparison.arbitrageOpportunity,
          trend
        });
      } catch (error) {
        // Skip currencies that can't be compared (missing data)
        console.warn(`Skipping ${currencyUpper}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return data;
  }, [bitcoinPrices, forexRates, baseCurrency]);

  // Sort table data
  const sortedData = useMemo(() => {
    return [...tableData].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'currency':
          aValue = a.currency;
          bValue = b.currency;
          break;
        case 'bitcoinRate':
          aValue = a.bitcoinRate;
          bValue = b.bitcoinRate;
          break;
        case 'traditionalRate':
          aValue = a.traditionalRate;
          bValue = b.traditionalRate;
          break;
        case 'percentageDifference':
          aValue = Math.abs(a.percentageDifference);
          bValue = Math.abs(b.percentageDifference);
          break;
        case 'arbitrage':
          aValue = a.arbitrageOpportunity ? 1 : 0;
          bValue = b.arbitrageOpportunity ? 1 : 0;
          break;
        default:
          aValue = a.currency;
          bValue = b.currency;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [tableData, sortField, sortDirection]);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle row selection for detailed comparison
  const handleRowClick = (currency: string) => {
    if (onCurrencySelect) {
      onCurrencySelect(baseCurrency, currency.toLowerCase());
    }
  };

  // Format rate display
  const formatRate = (rate: number): string => {
    if (rate > 100) {
      return rate.toFixed(2);
    } else if (rate > 1) {
      return rate.toFixed(4);
    } else {
      return rate.toFixed(6);
    }
  };

  // Format percentage difference
  const formatPercentage = (percentage: number): string => {
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  // Get sort icon for column headers
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Equal className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get percentage difference color
  const getPercentageColor = (percentage: number, betterMethod: string) => {
    if (Math.abs(percentage) < 0.1) return 'text-gray-600';
    
    if (betterMethod === 'bitcoin') {
      return percentage > 0 ? 'text-green-600' : 'text-red-600';
    } else if (betterMethod === 'traditional') {
      return percentage > 0 ? 'text-red-600' : 'text-green-600';
    }
    
    return 'text-gray-600';
  };

  if (!bitcoinPrices || !forexRates) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <p>Loading rate comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm sm:shadow-lg overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Rate Comparison Table
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Compare traditional forex rates with Bitcoin-based rates for {baseCurrency.toUpperCase()}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors touch-manipulation"
                onClick={() => handleSort('currency')}
              >
                <div className="flex items-center gap-2">
                  Currency
                  {getSortIcon('currency')}
                </div>
              </th>
              <th 
                className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors touch-manipulation"
                onClick={() => handleSort('bitcoinRate')}
              >
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <span className="hidden sm:inline">Bitcoin Rate</span>
                  <span className="sm:hidden">BTC</span>
                  {getSortIcon('bitcoinRate')}
                </div>
              </th>
              <th 
                className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors touch-manipulation"
                onClick={() => handleSort('traditionalRate')}
              >
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <span className="hidden sm:inline">Traditional Rate</span>
                  <span className="sm:hidden">Forex</span>
                  {getSortIcon('traditionalRate')}
                </div>
              </th>
              <th 
                className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors touch-manipulation"
                onClick={() => handleSort('percentageDifference')}
              >
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <span className="hidden sm:inline">Difference</span>
                  <span className="sm:hidden">Diff</span>
                  {getSortIcon('percentageDifference')}
                </div>
              </th>
              <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden sm:inline">Trend</span>
                <span className="sm:hidden">📈</span>
              </th>
              <th 
                className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors touch-manipulation"
                onClick={() => handleSort('arbitrage')}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline">Arbitrage</span>
                  <span className="sm:hidden">Arb</span>
                  {getSortIcon('arbitrage')}
                </div>
              </th>
              <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden sm:inline">Action</span>
                <span className="sm:hidden">⚡</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr 
                key={row.currency}
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer touch-manipulation`}
                onClick={() => handleRowClick(row.currency)}
              >
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                      <span className="text-blue-800 font-semibold text-xs sm:text-sm">
                        {row.currency.slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{row.currency}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{row.currencyName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                  <div className="text-xs sm:text-sm font-mono text-gray-900">
                    {formatRate(row.bitcoinRate)}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">via BTC</div>
                </td>
                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                  <div className="text-xs sm:text-sm font-mono text-gray-900">
                    {formatRate(row.traditionalRate)}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">forex</div>
                </td>
                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                  <div className={`text-xs sm:text-sm font-semibold ${getPercentageColor(row.percentageDifference, row.betterMethod)}`}>
                    {formatPercentage(row.percentageDifference)}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {row.betterMethod === 'bitcoin' ? 'BTC better' : 
                     row.betterMethod === 'traditional' ? 'Forex better' : 'Equal'}
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                  {getTrendIcon(row.trend)}
                </td>
                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                  {row.arbitrageOpportunity ? (
                    <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <span className="hidden sm:inline">Opportunity</span>
                      <span className="sm:hidden">⚡</span>
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">
                      <span className="hidden sm:inline">None</span>
                      <span className="sm:hidden">-</span>
                    </span>
                  )}
                </td>
                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(row.currency);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-1 touch-manipulation"
                    title="View detailed comparison"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No rate comparison data available</p>
        </div>
      )}

      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
        <div className="text-sm text-gray-600">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">How to read this table:</p>
              <ul className="text-xs space-y-1">
                <li>• <strong>Bitcoin Rate:</strong> Exchange rate calculated via Bitcoin prices</li>
                <li>• <strong>Traditional Rate:</strong> Direct forex market rate</li>
                <li>• <strong>Difference:</strong> Percentage difference between methods</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Arbitrage opportunities:</p>
              <ul className="text-xs space-y-1">
                <li>• <strong>Opportunity:</strong> &gt;2% difference between methods</li>
                <li>• <strong>Trend:</strong> Simulated rate movement direction</li>
                <li>• <strong>Click any row</strong> for detailed comparison</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateTable;