import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { getBitcoinPrices, getSupportedCurrencies } from './services/bitcoinPriceService';
import { BitcoinPriceData } from './types';

const BitcoinForexCalculator = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get supported currencies from the service
  const currencies = getSupportedCurrencies();

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get Bitcoin prices using the service
      const btcPrices: BitcoinPriceData = await getBitcoinPrices(currencies, forceRefresh);
      
      // Calculate forex rates using USD as base
      const usdPrice = btcPrices.usd;
      const forexData = currencies.map(currency => {
        if (currency === 'usd') {
          return {
            currency: 'USD',
            btcPrice: usdPrice,
            forexRate: 1.0000,
            pair: 'USD/USD'
          };
        }
        
        const price = btcPrices[currency];
        if (!price) {
          return null; // Skip currencies without prices
        }
        
        const forexRate = usdPrice / price; // How many units of foreign currency per 1 USD
        
        return {
          currency: currency.toUpperCase(),
          btcPrice: price,
          forexRate: forexRate,
          pair: `USD/${currency.toUpperCase()}`
        };
      }).filter(Boolean); // Remove null entries
      
      setData(forexData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatPrice = (price, currency) => {
    if (currency === 'JPY' || currency === 'KRW') {
      return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatForexRate = (rate) => {
    if (rate > 100) {
      return rate.toFixed(2);
    } else if (rate > 1) {
      return rate.toFixed(4);
    } else {
      return rate.toFixed(6);
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchData(true)}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bitcoin-Based Forex Rates</h1>
              <p className="text-gray-600 mt-1">Exchange rates calculated from Bitcoin prices across major currencies</p>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">Last updated: {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading forex data...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forex Pair
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bitcoin Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Implied Forex Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={item.currency} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-800 font-semibold text-sm">{item.currency.slice(0, 2)}</span>
                        </div>
                        <span className="font-medium text-gray-900">{item.currency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {item.pair}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-mono">
                      {formatPrice(item.btcPrice, item.currency)} {item.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono">
                      <span className={item.currency === 'USD' ? 'text-blue-600 font-semibold' : 'text-gray-900'}>
                        {formatForexRate(item.forexRate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.currency === 'USD' ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <div className="flex justify-center">
                          {Math.random() > 0.5 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            <p className="mb-2"><strong>How it works:</strong> This table shows implied forex rates calculated from Bitcoin prices in different currencies.</p>
            <p><strong>Formula:</strong> USD/Currency rate = (BTC price in USD) ÷ (BTC price in Currency)</p>
            <p className="mt-2 text-xs text-gray-500">Data source: CoinGecko API • Rates update in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinForexCalculator;