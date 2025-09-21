import {
  calculateBitcoinBasedRate,
  getTraditionalForexRate,
  calculatePercentageDifference,
  detectArbitrageOpportunity,
  determineBetterMethod,
  calculateConvertedAmounts,
  compareRates,
  batchCompareRates
} from '../calculationService';
import { BitcoinPriceData, ForexRateData } from '../../types';

describe('calculationService', () => {
  // Mock data for testing
  const mockBitcoinPrices: BitcoinPriceData = {
    usd: 45000,
    eur: 38000,
    gbp: 33000,
    jpy: 5000000,
    cad: 55000
  };

  const mockForexData: ForexRateData = {
    base: 'USD',
    date: '2024-01-01',
    rates: {
      EUR: 0.85,
      GBP: 0.75,
      JPY: 110,
      CAD: 1.25
    }
  };

  describe('calculateBitcoinBasedRate', () => {
    it('should calculate Bitcoin-based rate correctly', () => {
      const rate = calculateBitcoinBasedRate('USD', 'EUR', mockBitcoinPrices);
      expect(rate).toBeCloseTo(45000 / 38000, 6);
    });

    it('should handle case-insensitive currency codes', () => {
      const rate1 = calculateBitcoinBasedRate('usd', 'eur', mockBitcoinPrices);
      const rate2 = calculateBitcoinBasedRate('USD', 'EUR', mockBitcoinPrices);
      expect(rate1).toBe(rate2);
    });

    it('should throw error for missing Bitcoin price', () => {
      expect(() => {
        calculateBitcoinBasedRate('USD', 'XYZ', mockBitcoinPrices);
      }).toThrow('Bitcoin price not available for USD or XYZ');
    });

    it('should throw error for zero or negative Bitcoin price', () => {
      const invalidPrices = { usd: 45000, eur: 0 };
      expect(() => {
        calculateBitcoinBasedRate('USD', 'EUR', invalidPrices);
      }).toThrow('Invalid Bitcoin price data');
    });

    it('should calculate reverse rate correctly', () => {
      const rate1 = calculateBitcoinBasedRate('USD', 'EUR', mockBitcoinPrices);
      const rate2 = calculateBitcoinBasedRate('EUR', 'USD', mockBitcoinPrices);
      expect(rate1 * rate2).toBeCloseTo(1, 6);
    });
  });

  describe('getTraditionalForexRate', () => {
    it('should get rate when source is base currency', () => {
      const rate = getTraditionalForexRate('USD', 'EUR', mockForexData);
      expect(rate).toBe(0.85);
    });

    it('should get rate when target is base currency', () => {
      const rate = getTraditionalForexRate('EUR', 'USD', mockForexData);
      expect(rate).toBeCloseTo(1 / 0.85, 6);
    });

    it('should calculate cross-currency rate', () => {
      const rate = getTraditionalForexRate('EUR', 'GBP', mockForexData);
      expect(rate).toBeCloseTo(0.75 / 0.85, 6);
    });

    it('should handle case-insensitive currency codes', () => {
      const rate1 = getTraditionalForexRate('usd', 'eur', mockForexData);
      const rate2 = getTraditionalForexRate('USD', 'EUR', mockForexData);
      expect(rate1).toBe(rate2);
    });

    it('should throw error for missing forex rate', () => {
      expect(() => {
        getTraditionalForexRate('USD', 'XYZ', mockForexData);
      }).toThrow('Forex rate not available for XYZ');
    });

    it('should handle same currency conversion', () => {
      // Add USD to rates for this test
      const forexWithUSD = {
        ...mockForexData,
        rates: { ...mockForexData.rates, USD: 1 }
      };
      const rate = getTraditionalForexRate('USD', 'USD', forexWithUSD);
      expect(rate).toBe(1);
    });
  });

  describe('calculatePercentageDifference', () => {
    it('should calculate positive percentage difference', () => {
      const diff = calculatePercentageDifference(1.1, 1.0);
      expect(diff).toBeCloseTo(10, 10);
    });

    it('should calculate negative percentage difference', () => {
      const diff = calculatePercentageDifference(0.9, 1.0);
      expect(diff).toBeCloseTo(-10, 10);
    });

    it('should calculate zero percentage difference', () => {
      const diff = calculatePercentageDifference(1.0, 1.0);
      expect(diff).toBe(0);
    });

    it('should throw error for zero traditional rate', () => {
      expect(() => {
        calculatePercentageDifference(1.0, 0);
      }).toThrow('Traditional rate must be positive');
    });

    it('should throw error for negative traditional rate', () => {
      expect(() => {
        calculatePercentageDifference(1.0, -1.0);
      }).toThrow('Traditional rate must be positive');
    });

    it('should handle large percentage differences', () => {
      const diff = calculatePercentageDifference(2.0, 1.0);
      expect(diff).toBe(100);
    });
  });

  describe('detectArbitrageOpportunity', () => {
    it('should detect arbitrage opportunity above threshold', () => {
      expect(detectArbitrageOpportunity(3.0)).toBe(true);
      expect(detectArbitrageOpportunity(-3.0)).toBe(true);
    });

    it('should not detect arbitrage opportunity below threshold', () => {
      expect(detectArbitrageOpportunity(1.5)).toBe(false);
      expect(detectArbitrageOpportunity(-1.5)).toBe(false);
    });

    it('should use custom threshold', () => {
      expect(detectArbitrageOpportunity(3.0, 5.0)).toBe(false);
      expect(detectArbitrageOpportunity(6.0, 5.0)).toBe(true);
    });

    it('should handle edge case at threshold', () => {
      expect(detectArbitrageOpportunity(2.0)).toBe(false);
      expect(detectArbitrageOpportunity(2.1)).toBe(true);
    });
  });

  describe('determineBetterMethod', () => {
    it('should identify Bitcoin as better when rate is higher', () => {
      const result = determineBetterMethod(1.1, 1.0);
      expect(result).toBe('bitcoin');
    });

    it('should identify traditional as better when rate is higher', () => {
      const result = determineBetterMethod(0.9, 1.0);
      expect(result).toBe('traditional');
    });

    it('should identify equal rates within tolerance', () => {
      const result = determineBetterMethod(1.00005, 1.0);
      expect(result).toBe('equal');
    });

    it('should handle very small differences', () => {
      const result = determineBetterMethod(1.001, 1.0);
      expect(result).toBe('bitcoin');
    });
  });

  describe('calculateConvertedAmounts', () => {
    it('should calculate converted amounts correctly', () => {
      const result = calculateConvertedAmounts(100, 1.2, 1.1);
      expect(result.bitcoinAmount).toBeCloseTo(120, 10);
      expect(result.traditionalAmount).toBeCloseTo(110, 10);
    });

    it('should handle zero amount', () => {
      const result = calculateConvertedAmounts(0, 1.2, 1.1);
      expect(result.bitcoinAmount).toBe(0);
      expect(result.traditionalAmount).toBe(0);
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        calculateConvertedAmounts(-100, 1.2, 1.1);
      }).toThrow('Amount must be non-negative');
    });

    it('should handle fractional amounts', () => {
      const result = calculateConvertedAmounts(0.5, 2.0, 1.5);
      expect(result.bitcoinAmount).toBe(1.0);
      expect(result.traditionalAmount).toBe(0.75);
    });
  });

  describe('compareRates', () => {
    it('should perform comprehensive rate comparison', () => {
      const result = compareRates('USD', 'EUR', 1000, mockBitcoinPrices, mockForexData);
      
      expect(result.sourceCurrency).toBe('USD');
      expect(result.targetCurrency).toBe('EUR');
      expect(result.amount).toBe(1000);
      expect(result.traditionalRate).toBe(0.85);
      expect(result.bitcoinRate).toBeCloseTo(45000 / 38000, 6);
      expect(result.traditionalAmount).toBe(850);
      expect(result.bitcoinAmount).toBeCloseTo(1000 * (45000 / 38000), 6);
      expect(typeof result.percentageDifference).toBe('number');
      expect(['bitcoin', 'traditional', 'equal']).toContain(result.betterMethod);
      expect(typeof result.arbitrageOpportunity).toBe('boolean');
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        compareRates('USD', 'EUR', -100, mockBitcoinPrices, mockForexData);
      }).toThrow('Amount must be non-negative');
    });

    it('should throw error for missing currencies', () => {
      expect(() => {
        compareRates('', 'EUR', 100, mockBitcoinPrices, mockForexData);
      }).toThrow('Source and target currencies are required');
    });

    it('should use custom arbitrage threshold', () => {
      const result = compareRates('USD', 'EUR', 1000, mockBitcoinPrices, mockForexData, 10);
      expect(typeof result.arbitrageOpportunity).toBe('boolean');
    });

    it('should handle same currency conversion', () => {
      const sameCurrencyBtc = { usd: 45000 };
      const sameCurrencyForex = { base: 'USD', date: '2024-01-01', rates: { USD: 1 } };
      
      const result = compareRates('USD', 'USD', 1000, sameCurrencyBtc, sameCurrencyForex);
      expect(result.traditionalRate).toBe(1);
      expect(result.bitcoinRate).toBe(1);
      expect(result.percentageDifference).toBe(0);
      expect(result.betterMethod).toBe('equal');
    });
  });

  describe('batchCompareRates', () => {
    const currencyPairs = [
      { source: 'USD', target: 'EUR' },
      { source: 'USD', target: 'GBP' },
      { source: 'EUR', target: 'GBP' }
    ];

    it('should perform batch comparison for multiple currency pairs', () => {
      const results = batchCompareRates(currencyPairs, mockBitcoinPrices, mockForexData);
      
      expect(results).toHaveLength(3);
      expect(results[0].sourceCurrency).toBe('USD');
      expect(results[0].targetCurrency).toBe('EUR');
      expect(results[1].sourceCurrency).toBe('USD');
      expect(results[1].targetCurrency).toBe('GBP');
      expect(results[2].sourceCurrency).toBe('EUR');
      expect(results[2].targetCurrency).toBe('GBP');
    });

    it('should use custom arbitrage threshold for batch comparison', () => {
      const results = batchCompareRates(currencyPairs, mockBitcoinPrices, mockForexData, 10);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(typeof result.arbitrageOpportunity).toBe('boolean');
      });
    });

    it('should handle empty currency pairs array', () => {
      const results = batchCompareRates([], mockBitcoinPrices, mockForexData);
      expect(results).toHaveLength(0);
    });

    it('should propagate errors from individual comparisons', () => {
      const invalidPairs = [{ source: 'USD', target: 'XYZ' }];
      expect(() => {
        batchCompareRates(invalidPairs, mockBitcoinPrices, mockForexData);
      }).toThrow();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very large numbers', () => {
      const largeBtcPrices = { usd: 1e10, eur: 1e9 };
      const rate = calculateBitcoinBasedRate('USD', 'EUR', largeBtcPrices);
      expect(rate).toBe(10);
    });

    it('should handle very small numbers', () => {
      const smallBtcPrices = { usd: 0.001, eur: 0.0001 };
      const rate = calculateBitcoinBasedRate('USD', 'EUR', smallBtcPrices);
      expect(rate).toBe(10);
    });

    it('should maintain precision in calculations', () => {
      const precisePrices = { usd: 45123.456789, eur: 38987.654321 };
      const rate = calculateBitcoinBasedRate('USD', 'EUR', precisePrices);
      expect(rate).toBeCloseTo(45123.456789 / 38987.654321, 10);
    });
  });
});