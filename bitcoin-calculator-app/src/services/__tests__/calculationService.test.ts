import {
  calculateBitcoinBasedRate,
  getTraditionalForexRate,
  calculatePercentageDifference,
  detectArbitrageOpportunity,
  determineBetterMethod,
  calculateConvertedAmounts,
  compareRates,
  batchCompareRates,
} from '../calculationService';
import { BitcoinPriceData, ForexRateData, ComparisonResult } from '../../types';

describe('CalculationService', () => {
  // Mock data for testing
  const mockBitcoinPrices: BitcoinPriceData = {
    usd: 45000,
    eur: 38000,
    gbp: 33000,
    jpy: 5000000,
    aud: 62000,
  };

  const mockForexRates: ForexRateData = {
    base: 'USD',
    date: '2022-01-01',
    rates: {
      EUR: 0.8854,
      GBP: 0.7404,
      JPY: 115.11,
      AUD: 1.3845,
    },
  };

  describe('calculateBitcoinBasedRate', () => {
    it('should calculate Bitcoin-based rate correctly', () => {
      const rate = calculateBitcoinBasedRate('USD', 'EUR', mockBitcoinPrices);
      expect(rate).toBeCloseTo(45000 / 38000, 6);
    });

    it('should handle case-insensitive currency codes', () => {
      const rate = calculateBitcoinBasedRate('usd', 'eur', mockBitcoinPrices);
      expect(rate).toBeCloseTo(45000 / 38000, 6);
    });

    it('should throw error for missing source currency', () => {
      expect(() => {
        calculateBitcoinBasedRate('XYZ', 'EUR', mockBitcoinPrices);
      }).toThrow('Bitcoin price not available for XYZ or EUR');
    });

    it('should throw error for missing target currency', () => {
      expect(() => {
        calculateBitcoinBasedRate('USD', 'XYZ', mockBitcoinPrices);
      }).toThrow('Bitcoin price not available for USD or XYZ');
    });

    it('should throw error for zero or negative Bitcoin prices', () => {
      const invalidPrices = { ...mockBitcoinPrices, usd: 0 };
      expect(() => {
        calculateBitcoinBasedRate('USD', 'EUR', invalidPrices);
      }).toThrow('Invalid Bitcoin price data');
    });

    it('should handle same currency conversion', () => {
      const rate = calculateBitcoinBasedRate('USD', 'USD', mockBitcoinPrices);
      expect(rate).toBe(1);
    });
  });

  describe('getTraditionalForexRate', () => {
    it('should get rate when source is base currency', () => {
      const rate = getTraditionalForexRate('USD', 'EUR', mockForexRates);
      expect(rate).toBe(0.8854);
    });

    it('should get rate when target is base currency', () => {
      const rate = getTraditionalForexRate('EUR', 'USD', mockForexRates);
      expect(rate).toBeCloseTo(1 / 0.8854, 6);
    });

    it('should calculate cross-currency rate', () => {
      const rate = getTraditionalForexRate('EUR', 'GBP', mockForexRates);
      expect(rate).toBeCloseTo(0.7404 / 0.8854, 6);
    });

    it('should handle case-insensitive currency codes', () => {
      const rate = getTraditionalForexRate('usd', 'eur', mockForexRates);
      expect(rate).toBe(0.8854);
    });

    it('should throw error for missing source currency', () => {
      expect(() => {
        getTraditionalForexRate('XYZ', 'EUR', mockForexRates);
      }).toThrow('Forex rate not available for XYZ or EUR');
    });

    it('should throw error for missing target currency', () => {
      expect(() => {
        getTraditionalForexRate('USD', 'XYZ', mockForexRates);
      }).toThrow('Forex rate not available for XYZ');
    });

    it('should handle same currency conversion', () => {
      const rate = getTraditionalForexRate('USD', 'USD', mockForexRates);
      expect(rate).toBe(1);
    });
  });

  describe('calculatePercentageDifference', () => {
    it('should calculate positive percentage difference', () => {
      const diff = calculatePercentageDifference(1.1, 1.0);
      expect(diff).toBeCloseTo(10, 6);
    });

    it('should calculate negative percentage difference', () => {
      const diff = calculatePercentageDifference(0.9, 1.0);
      expect(diff).toBeCloseTo(-10, 6);
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
      expect(detectArbitrageOpportunity(1.5, 1.0)).toBe(true);
      expect(detectArbitrageOpportunity(0.5, 1.0)).toBe(false);
    });

    it('should handle edge case at exact threshold', () => {
      expect(detectArbitrageOpportunity(2.0)).toBe(false);
      expect(detectArbitrageOpportunity(2.1)).toBe(true);
    });
  });

  describe('determineBetterMethod', () => {
    it('should identify Bitcoin as better method', () => {
      const result = determineBetterMethod(1.1, 1.0);
      expect(result).toBe('bitcoin');
    });

    it('should identify traditional as better method', () => {
      const result = determineBetterMethod(0.9, 1.0);
      expect(result).toBe('traditional');
    });

    it('should identify equal methods', () => {
      const result = determineBetterMethod(1.0, 1.0);
      expect(result).toBe('equal');
    });

    it('should handle floating point precision', () => {
      const result = determineBetterMethod(1.00005, 1.0);
      expect(result).toBe('equal'); // Within tolerance
    });

    it('should detect difference outside tolerance', () => {
      const result = determineBetterMethod(1.0002, 1.0);
      expect(result).toBe('bitcoin'); // Outside tolerance
    });
  });

  describe('calculateConvertedAmounts', () => {
    it('should calculate converted amounts correctly', () => {
      const result = calculateConvertedAmounts(100, 1.1, 1.0);
      expect(result.bitcoinAmount).toBeCloseTo(110, 6);
      expect(result.traditionalAmount).toBe(100);
    });

    it('should handle zero amount', () => {
      const result = calculateConvertedAmounts(0, 1.1, 1.0);
      expect(result.bitcoinAmount).toBe(0);
      expect(result.traditionalAmount).toBe(0);
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        calculateConvertedAmounts(-100, 1.1, 1.0);
      }).toThrow('Amount must be non-negative');
    });

    it('should handle decimal amounts', () => {
      const result = calculateConvertedAmounts(123.45, 0.8854, 1.0);
      expect(result.bitcoinAmount).toBeCloseTo(123.45 * 0.8854, 4);
      expect(result.traditionalAmount).toBe(123.45);
    });
  });

  describe('compareRates', () => {
    it('should perform comprehensive rate comparison', () => {
      const result = compareRates(
        'USD',
        'EUR',
        1000,
        mockBitcoinPrices,
        mockForexRates
      );

      expect(result.sourceCurrency).toBe('USD');
      expect(result.targetCurrency).toBe('EUR');
      expect(result.amount).toBe(1000);
      expect(result.traditionalRate).toBe(0.8854);
      expect(result.bitcoinRate).toBeCloseTo(45000 / 38000, 6);
      expect(result.traditionalAmount).toBe(885.4);
      expect(result.bitcoinAmount).toBeCloseTo(1000 * (45000 / 38000), 2);
      expect(typeof result.percentageDifference).toBe('number');
      expect(['bitcoin', 'traditional', 'equal']).toContain(result.betterMethod);
      expect(typeof result.arbitrageOpportunity).toBe('boolean');
    });

    it('should handle case-insensitive currency codes', () => {
      const result = compareRates(
        'usd',
        'eur',
        1000,
        mockBitcoinPrices,
        mockForexRates
      );

      expect(result.sourceCurrency).toBe('USD');
      expect(result.targetCurrency).toBe('EUR');
    });

    it('should use custom arbitrage threshold', () => {
      const result = compareRates(
        'USD',
        'EUR',
        1000,
        mockBitcoinPrices,
        mockForexRates,
        0.5 // Lower threshold
      );

      expect(typeof result.arbitrageOpportunity).toBe('boolean');
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        compareRates('USD', 'EUR', -100, mockBitcoinPrices, mockForexRates);
      }).toThrow('Amount must be non-negative');
    });

    it('should throw error for missing currencies', () => {
      expect(() => {
        compareRates('', 'EUR', 100, mockBitcoinPrices, mockForexRates);
      }).toThrow('Source and target currencies are required');

      expect(() => {
        compareRates('USD', '', 100, mockBitcoinPrices, mockForexRates);
      }).toThrow('Source and target currencies are required');
    });

    it('should propagate Bitcoin price errors', () => {
      expect(() => {
        compareRates('XYZ', 'EUR', 100, mockBitcoinPrices, mockForexRates);
      }).toThrow('Bitcoin price not available');
    });

    it('should propagate forex rate errors', () => {
      // Use a currency that exists in Bitcoin prices but not in forex rates
      const bitcoinPricesWithExtra = { ...mockBitcoinPrices, xyz: 1000 };
      expect(() => {
        compareRates('USD', 'XYZ', 100, bitcoinPricesWithExtra, mockForexRates);
      }).toThrow('Forex rate not available');
    });
  });

  describe('batchCompareRates', () => {
    const currencyPairs = [
      { source: 'USD', target: 'EUR' },
      { source: 'USD', target: 'GBP' },
      { source: 'EUR', target: 'GBP' },
    ];

    it('should perform batch comparison', () => {
      const results = batchCompareRates(
        currencyPairs,
        mockBitcoinPrices,
        mockForexRates
      );

      expect(results).toHaveLength(3);
      expect(results[0].sourceCurrency).toBe('USD');
      expect(results[0].targetCurrency).toBe('EUR');
      expect(results[1].sourceCurrency).toBe('USD');
      expect(results[1].targetCurrency).toBe('GBP');
      expect(results[2].sourceCurrency).toBe('EUR');
      expect(results[2].targetCurrency).toBe('GBP');

      // All should have amount of 1 (default for batch comparison)
      results.forEach(result => {
        expect(result.amount).toBe(1);
      });
    });

    it('should use custom arbitrage threshold for batch', () => {
      const results = batchCompareRates(
        currencyPairs,
        mockBitcoinPrices,
        mockForexRates,
        0.5
      );

      expect(results).toHaveLength(3);
      // Results should reflect the custom threshold
      results.forEach(result => {
        expect(typeof result.arbitrageOpportunity).toBe('boolean');
      });
    });

    it('should handle empty currency pairs array', () => {
      const results = batchCompareRates(
        [],
        mockBitcoinPrices,
        mockForexRates
      );

      expect(results).toHaveLength(0);
    });

    it('should propagate errors for invalid currency pairs', () => {
      const invalidPairs = [{ source: 'XYZ', target: 'EUR' }];

      expect(() => {
        batchCompareRates(invalidPairs, mockBitcoinPrices, mockForexRates);
      }).toThrow('Bitcoin price not available');
    });
  });

  describe('Integration Tests', () => {
    it('should handle real-world scenario with arbitrage opportunity', () => {
      // Scenario where Bitcoin route is significantly better
      const bitcoinPrices = {
        usd: 50000,
        eur: 40000, // Bitcoin route: 50000/40000 = 1.25
      };

      const forexRates = {
        base: 'USD',
        date: '2022-01-01',
        rates: {
          EUR: 0.9, // Traditional route: 0.9
        },
      };

      const result = compareRates('USD', 'EUR', 1000, bitcoinPrices, forexRates);

      expect(result.bitcoinRate).toBeCloseTo(1.25, 2);
      expect(result.traditionalRate).toBe(0.9);
      expect(result.betterMethod).toBe('bitcoin');
      expect(result.arbitrageOpportunity).toBe(true);
      expect(result.percentageDifference).toBeCloseTo(38.89, 1); // (1.25-0.9)/0.9*100
    });

    it('should handle scenario with no arbitrage opportunity', () => {
      // Scenario where rates are very similar
      const bitcoinPrices = {
        usd: 45000,
        eur: 40000, // Bitcoin route: 45000/40000 = 1.125
      };

      const forexRates = {
        base: 'USD',
        date: '2022-01-01',
        rates: {
          EUR: 1.12, // Traditional route: 1.12 (very close)
        },
      };

      const result = compareRates('USD', 'EUR', 1000, bitcoinPrices, forexRates);

      expect(result.bitcoinRate).toBeCloseTo(1.125, 3);
      expect(result.traditionalRate).toBe(1.12);
      expect(result.arbitrageOpportunity).toBe(false);
      expect(Math.abs(result.percentageDifference)).toBeLessThan(2);
    });

    it('should handle cross-currency comparison correctly', () => {
      const result = compareRates('EUR', 'GBP', 500, mockBitcoinPrices, mockForexRates);

      // Bitcoin route: (38000/33000) = 1.1515...
      // Traditional route: 0.7404/0.8854 = 0.8362...
      expect(result.bitcoinRate).toBeCloseTo(38000 / 33000, 4);
      expect(result.traditionalRate).toBeCloseTo(0.7404 / 0.8854, 4);
      expect(result.amount).toBe(500);
      expect(result.sourceCurrency).toBe('EUR');
      expect(result.targetCurrency).toBe('GBP');
    });
  });
});