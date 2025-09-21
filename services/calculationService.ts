import { BitcoinPriceData, ForexRateData, ComparisonResult } from '../types';

/**
 * Service for handling rate comparison calculations between traditional forex
 * and Bitcoin-based exchange rates
 */

/**
 * Calculate Bitcoin-based exchange rate between two currencies
 * Formula: (BTC_price_source / BTC_price_target)
 */
export function calculateBitcoinBasedRate(
  sourceCurrency: string,
  targetCurrency: string,
  bitcoinPrices: BitcoinPriceData
): number {
  const sourceBtcPrice = bitcoinPrices[sourceCurrency.toLowerCase()];
  const targetBtcPrice = bitcoinPrices[targetCurrency.toLowerCase()];

  if (sourceBtcPrice === undefined || targetBtcPrice === undefined) {
    throw new Error(`Bitcoin price not available for ${sourceCurrency} or ${targetCurrency}`);
  }

  if (sourceBtcPrice <= 0 || targetBtcPrice <= 0) {
    throw new Error('Invalid Bitcoin price data');
  }

  return sourceBtcPrice / targetBtcPrice;
}

/**
 * Get traditional forex rate between two currencies
 */
export function getTraditionalForexRate(
  sourceCurrency: string,
  targetCurrency: string,
  forexData: ForexRateData
): number {
  const sourceUpper = sourceCurrency.toUpperCase();
  const targetUpper = targetCurrency.toUpperCase();

  // If source is the base currency
  if (forexData.base === sourceUpper) {
    const rate = forexData.rates[targetUpper];
    if (!rate) {
      throw new Error(`Forex rate not available for ${targetUpper}`);
    }
    return rate;
  }

  // If target is the base currency
  if (forexData.base === targetUpper) {
    const rate = forexData.rates[sourceUpper];
    if (!rate) {
      throw new Error(`Forex rate not available for ${sourceUpper}`);
    }
    return 1 / rate;
  }

  // Cross-currency calculation through base currency
  const sourceRate = forexData.rates[sourceUpper];
  const targetRate = forexData.rates[targetUpper];

  if (!sourceRate || !targetRate) {
    throw new Error(`Forex rate not available for ${sourceUpper} or ${targetUpper}`);
  }

  return targetRate / sourceRate;
}

/**
 * Calculate percentage difference between two rates
 * Formula: ((bitcoin_rate - traditional_rate) / traditional_rate) * 100
 */
export function calculatePercentageDifference(
  bitcoinRate: number,
  traditionalRate: number
): number {
  if (traditionalRate <= 0) {
    throw new Error('Traditional rate must be positive');
  }

  return ((bitcoinRate - traditionalRate) / traditionalRate) * 100;
}

/**
 * Detect arbitrage opportunity based on percentage difference threshold
 * Default threshold is 2% as specified in requirements
 */
export function detectArbitrageOpportunity(
  percentageDifference: number,
  threshold: number = 2
): boolean {
  return Math.abs(percentageDifference) > threshold;
}

/**
 * Determine which method provides better rate
 */
export function determineBetterMethod(
  bitcoinRate: number,
  traditionalRate: number
): 'bitcoin' | 'traditional' | 'equal' {
  const difference = bitcoinRate - traditionalRate;
  const tolerance = 0.0001; // Small tolerance for floating point comparison

  if (Math.abs(difference) < tolerance) {
    return 'equal';
  }

  return bitcoinRate > traditionalRate ? 'bitcoin' : 'traditional';
}

/**
 * Calculate converted amounts for both methods
 */
export function calculateConvertedAmounts(
  amount: number,
  bitcoinRate: number,
  traditionalRate: number
): { bitcoinAmount: number; traditionalAmount: number } {
  if (amount < 0) {
    throw new Error('Amount must be non-negative');
  }

  return {
    bitcoinAmount: amount * bitcoinRate,
    traditionalAmount: amount * traditionalRate
  };
}

/**
 * Comprehensive comparison function that combines all calculations
 */
export function compareRates(
  sourceCurrency: string,
  targetCurrency: string,
  amount: number,
  bitcoinPrices: BitcoinPriceData,
  forexData: ForexRateData,
  arbitrageThreshold: number = 2
): ComparisonResult {
  // Input validation
  if (amount < 0) {
    throw new Error('Amount must be non-negative');
  }

  if (!sourceCurrency || !targetCurrency) {
    throw new Error('Source and target currencies are required');
  }

  // Calculate rates
  const bitcoinRate = calculateBitcoinBasedRate(sourceCurrency, targetCurrency, bitcoinPrices);
  const traditionalRate = getTraditionalForexRate(sourceCurrency, targetCurrency, forexData);

  // Calculate percentage difference
  const percentageDifference = calculatePercentageDifference(bitcoinRate, traditionalRate);

  // Detect arbitrage opportunity
  const arbitrageOpportunity = detectArbitrageOpportunity(percentageDifference, arbitrageThreshold);

  // Determine better method
  const betterMethod = determineBetterMethod(bitcoinRate, traditionalRate);

  // Calculate converted amounts
  const { bitcoinAmount, traditionalAmount } = calculateConvertedAmounts(
    amount,
    bitcoinRate,
    traditionalRate
  );

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
}

/**
 * Batch comparison for multiple currency pairs
 */
export function batchCompareRates(
  currencyPairs: Array<{ source: string; target: string }>,
  bitcoinPrices: BitcoinPriceData,
  forexData: ForexRateData,
  arbitrageThreshold: number = 2
): ComparisonResult[] {
  return currencyPairs.map(({ source, target }) =>
    compareRates(source, target, 1, bitcoinPrices, forexData, arbitrageThreshold)
  );
}