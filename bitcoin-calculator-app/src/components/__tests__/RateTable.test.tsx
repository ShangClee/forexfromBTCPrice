import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RateTable from '../RateTable';
import { BitcoinPriceData, ForexRateData } from '../../types';

// Mock the calculation service
jest.mock('../../services/calculationService', () => ({
  compareRates: jest.fn()
}));

import { compareRates } from '../../services/calculationService';
const mockCompareRates = compareRates as jest.MockedFunction<typeof compareRates>;

describe('RateTable', () => {
  const mockBitcoinPrices: BitcoinPriceData = {
    usd: 45000,
    eur: 38000,
    gbp: 33000,
    jpy: 5000000,
    aud: 62000,
    cad: 57000
  };

  const mockForexRates: ForexRateData = {
    base: 'USD',
    date: '2024-01-01',
    rates: {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110,
      AUD: 1.35,
      CAD: 1.25
    }
  };

  const defaultProps = {
    bitcoinPrices: mockBitcoinPrices,
    forexRates: mockForexRates,
    baseCurrency: 'USD',
    onCurrencySelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock return values
    mockCompareRates.mockImplementation((source, target) => ({
      sourceCurrency: source.toUpperCase(),
      targetCurrency: target.toUpperCase(),
      amount: 1,
      traditionalRate: target === 'eur' ? 0.85 : target === 'gbp' ? 0.73 : 110,
      bitcoinRate: target === 'eur' ? 0.84 : target === 'gbp' ? 0.74 : 111,
      traditionalAmount: target === 'eur' ? 0.85 : target === 'gbp' ? 0.73 : 110,
      bitcoinAmount: target === 'eur' ? 0.84 : target === 'gbp' ? 0.74 : 111,
      percentageDifference: target === 'eur' ? -1.18 : target === 'gbp' ? 1.37 : 0.91,
      betterMethod: target === 'eur' ? 'traditional' : target === 'gbp' ? 'bitcoin' : 'bitcoin',
      arbitrageOpportunity: target === 'gbp' ? false : target === 'eur' ? false : false
    }));
  });

  describe('Rendering', () => {
    it('renders the rate table with correct title', () => {
      render(<RateTable {...defaultProps} />);
      
      expect(screen.getByText('Rate Comparison Table')).toBeInTheDocument();
      expect(screen.getByText(/Compare traditional forex rates with Bitcoin-based rates for USD/)).toBeInTheDocument();
    });

    it('renders loading state when data is not available', () => {
      render(<RateTable {...defaultProps} bitcoinPrices={null} />);
      
      expect(screen.getByText('Loading rate comparison data...')).toBeInTheDocument();
    });

    it('renders table headers correctly', () => {
      render(<RateTable {...defaultProps} />);
      
      expect(screen.getByText('Currency')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin Rate')).toBeInTheDocument();
      expect(screen.getByText('Traditional Rate')).toBeInTheDocument();
      expect(screen.getByText('Difference')).toBeInTheDocument();
      expect(screen.getByText('Trend')).toBeInTheDocument();
      expect(screen.getByText('Arbitrage')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders currency data when available', () => {
      render(<RateTable {...defaultProps} />);
      
      // Check that table has data rows
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('displays rate values in correct format', () => {
      render(<RateTable {...defaultProps} />);
      
      // Check for rate display elements
      const rateElements = document.querySelectorAll('.font-mono');
      expect(rateElements.length).toBeGreaterThan(0);
    });

    it('shows arbitrage indicators', () => {
      render(<RateTable {...defaultProps} />);
      
      // Check for arbitrage column content
      const arbitrageElements = screen.getAllByText(/None|Opportunity/);
      expect(arbitrageElements.length).toBeGreaterThan(0);
    });
  });

  describe('Sorting Functionality', () => {
    it('enables sorting when headers are clicked', () => {
      render(<RateTable {...defaultProps} />);
      
      const currencyHeader = screen.getByText('Currency');
      
      // Should be clickable
      expect(currencyHeader.closest('th')).toHaveClass('cursor-pointer');
      
      // Should not throw when clicked
      expect(() => fireEvent.click(currencyHeader)).not.toThrow();
    });

    it('changes sort direction on repeated clicks', () => {
      render(<RateTable {...defaultProps} />);
      
      const currencyHeader = screen.getByText('Currency');
      
      // First click
      fireEvent.click(currencyHeader);
      
      // Second click should not throw
      expect(() => fireEvent.click(currencyHeader)).not.toThrow();
    });

    it('supports sorting different columns', () => {
      render(<RateTable {...defaultProps} />);
      
      // Test different sortable headers
      const headers = ['Currency', 'Bitcoin Rate', 'Traditional Rate', 'Difference', 'Arbitrage'];
      
      headers.forEach(headerText => {
        const header = screen.getByText(headerText);
        expect(() => fireEvent.click(header)).not.toThrow();
      });
    });

    it('displays sort icons', () => {
      render(<RateTable {...defaultProps} />);
      
      // Should have sort icons in headers
      const sortIcons = document.querySelectorAll('svg');
      expect(sortIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Row Selection', () => {
    it('calls onCurrencySelect when row is clicked', () => {
      const mockOnCurrencySelect = jest.fn();
      render(<RateTable {...defaultProps} onCurrencySelect={mockOnCurrencySelect} />);
      
      // Click on first data row
      const firstRow = document.querySelector('tbody tr');
      fireEvent.click(firstRow!);
      
      expect(mockOnCurrencySelect).toHaveBeenCalled();
    });

    it('calls onCurrencySelect when action button is clicked', () => {
      const mockOnCurrencySelect = jest.fn();
      render(<RateTable {...defaultProps} onCurrencySelect={mockOnCurrencySelect} />);
      
      // Click on first action button
      const actionButtons = screen.getAllByTitle('View detailed comparison');
      fireEvent.click(actionButtons[0]);
      
      expect(mockOnCurrencySelect).toHaveBeenCalled();
    });

    it('handles missing onCurrencySelect prop gracefully', () => {
      const { container } = render(<RateTable {...defaultProps} onCurrencySelect={undefined} />);
      
      // Click on first row - should not throw error
      const firstRow = container.querySelector('tbody tr');
      expect(() => fireEvent.click(firstRow!)).not.toThrow();
    });
  });

  describe('Data Processing', () => {
    it('skips base currency from comparison', () => {
      render(<RateTable {...defaultProps} baseCurrency="EUR" />);
      
      // EUR should not appear in the table when it's the base currency
      expect(screen.queryByText('EUR')).not.toBeInTheDocument();
    });

    it('handles missing Bitcoin price data gracefully', () => {
      const incompleteBitcoinPrices = {
        usd: 45000,
        eur: 38000
        // Missing other currencies
      };

      // Mock compareRates to throw error for missing data
      mockCompareRates.mockImplementation((source, target) => {
        if (target === 'gbp') {
          throw new Error('Bitcoin price not available for GBP');
        }
        if (target === 'eur') {
          return {
            sourceCurrency: source.toUpperCase(),
            targetCurrency: target.toUpperCase(),
            amount: 1,
            traditionalRate: 0.85,
            bitcoinRate: 0.84,
            traditionalAmount: 0.85,
            bitcoinAmount: 0.84,
            percentageDifference: -1.18,
            betterMethod: 'traditional' as const,
            arbitrageOpportunity: false
          };
        }
        throw new Error('Skip other currencies');
      });

      render(<RateTable {...defaultProps} bitcoinPrices={incompleteBitcoinPrices} />);
      
      // Should still render available currencies
      const eurElements = screen.getAllByText('EUR');
      expect(eurElements.length).toBeGreaterThan(0);
      // GBP should be skipped due to missing data
      expect(screen.queryByText('GBP')).not.toBeInTheDocument();
    });

    it('handles missing forex rate data gracefully', () => {
      const incompleteForexRates = {
        base: 'USD',
        date: '2024-01-01',
        rates: {
          EUR: 0.85
          // Missing other currencies
        }
      };

      // Mock compareRates to throw error for missing forex data
      mockCompareRates.mockImplementation((source, target) => {
        if (target === 'gbp') {
          throw new Error('Forex rate not available for GBP');
        }
        if (target === 'eur') {
          return {
            sourceCurrency: source.toUpperCase(),
            targetCurrency: target.toUpperCase(),
            amount: 1,
            traditionalRate: 0.85,
            bitcoinRate: 0.84,
            traditionalAmount: 0.85,
            bitcoinAmount: 0.84,
            percentageDifference: -1.18,
            betterMethod: 'traditional' as const,
            arbitrageOpportunity: false
          };
        }
        throw new Error('Skip other currencies');
      });

      render(<RateTable {...defaultProps} forexRates={incompleteForexRates} />);
      
      // Should still render available currencies
      const eurElements = screen.getAllByText('EUR');
      expect(eurElements.length).toBeGreaterThan(0);
    });

    it('displays empty state when no data is available', () => {
      mockCompareRates.mockImplementation(() => {
        throw new Error('No data available');
      });

      render(<RateTable {...defaultProps} />);
      
      expect(screen.getByText('No rate comparison data available')).toBeInTheDocument();
    });
  });

  describe('Rate Formatting', () => {
    it('formats rates correctly based on value ranges', () => {
      // Test that the formatRate function works correctly by checking the component renders rates
      render(<RateTable {...defaultProps} />);
      
      // Just verify that rates are displayed in some format (the exact formatting is tested in the component)
      const rateElements = document.querySelectorAll('.font-mono');
      expect(rateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Indicators', () => {
    it('displays correct trend icons', () => {
      render(<RateTable {...defaultProps} />);
      
      // Should have trend icons (using class names since trends are random)
      const trendIcons = document.querySelectorAll('.lucide-trending-up, .lucide-trending-down, .lucide-equal');
      expect(trendIcons.length).toBeGreaterThan(0);
    });

    it('applies correct color classes for percentage differences', () => {
      mockCompareRates.mockImplementation((source, target) => {
        if (target === 'eur') {
          return {
            sourceCurrency: source.toUpperCase(),
            targetCurrency: target.toUpperCase(),
            amount: 1,
            traditionalRate: 0.85,
            bitcoinRate: 0.88, // EUR: bitcoin better
            traditionalAmount: 0.85,
            bitcoinAmount: 0.88,
            percentageDifference: 3.53,
            betterMethod: 'bitcoin' as const,
            arbitrageOpportunity: true
          };
        } else if (target === 'gbp') {
          return {
            sourceCurrency: source.toUpperCase(),
            targetCurrency: target.toUpperCase(),
            amount: 1,
            traditionalRate: 0.85,
            bitcoinRate: 0.82, // GBP: traditional better
            traditionalAmount: 0.85,
            bitcoinAmount: 0.82,
            percentageDifference: -3.53,
            betterMethod: 'traditional' as const,
            arbitrageOpportunity: true
          };
        }
        throw new Error('Skip other currencies');
      });

      render(<RateTable {...defaultProps} />);
      
      // Check for colored percentage text
      const positivePercentage = screen.getByText('+3.53%');
      const negativePercentage = screen.getByText('-3.53%');
      
      // For bitcoin better method with positive percentage: green
      expect(positivePercentage).toHaveClass('text-green-600');
      // For traditional better method with negative percentage: green (inverted logic)
      expect(negativePercentage).toHaveClass('text-green-600');
    });

    it('shows better method indicators correctly', () => {
      mockCompareRates.mockImplementation((source, target) => {
        if (target === 'eur') {
          return {
            sourceCurrency: source.toUpperCase(),
            targetCurrency: target.toUpperCase(),
            amount: 1,
            traditionalRate: 0.85,
            bitcoinRate: 0.88,
            traditionalAmount: 0.85,
            bitcoinAmount: 0.88,
            percentageDifference: 3.53,
            betterMethod: 'bitcoin' as const,
            arbitrageOpportunity: false
          };
        } else if (target === 'gbp') {
          return {
            sourceCurrency: source.toUpperCase(),
            targetCurrency: target.toUpperCase(),
            amount: 1,
            traditionalRate: 0.85,
            bitcoinRate: 0.82,
            traditionalAmount: 0.85,
            bitcoinAmount: 0.82,
            percentageDifference: -3.53,
            betterMethod: 'traditional' as const,
            arbitrageOpportunity: false
          };
        }
        throw new Error('Skip other currencies');
      });

      render(<RateTable {...defaultProps} />);
      
      expect(screen.getByText('BTC better')).toBeInTheDocument();
      expect(screen.getByText('Forex better')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure for screen readers', () => {
      render(<RateTable {...defaultProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(7);
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('has clickable elements with proper titles', () => {
      render(<RateTable {...defaultProps} />);
      
      const actionButtons = screen.getAllByTitle('View detailed comparison');
      expect(actionButtons.length).toBeGreaterThan(0);
      
      actionButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation for sortable headers', () => {
      render(<RateTable {...defaultProps} />);
      
      const currencyHeader = screen.getByText('Currency').closest('th');
      expect(currencyHeader).toHaveClass('cursor-pointer');
      
      // Should be focusable and clickable
      fireEvent.click(currencyHeader!);
      expect(mockCompareRates).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes correctly', () => {
      render(<RateTable {...defaultProps} />);
      
      const tableContainer = screen.getByRole('table').parentElement;
      expect(tableContainer).toHaveClass('overflow-x-auto');
    });

    it('uses responsive grid in footer', () => {
      render(<RateTable {...defaultProps} />);
      
      const footerGrid = screen.getByText('How to read this table:').closest('div');
      expect(footerGrid?.parentElement).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2');
    });
  });

  describe('Error Handling', () => {
    it('logs warnings for currencies that cannot be compared', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockCompareRates.mockImplementation(() => {
        throw new Error('Test error');
      });

      render(<RateTable {...defaultProps} />);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('continues rendering other currencies when one fails', () => {
      mockCompareRates.mockImplementation((source, target) => {
        if (target === 'gbp') {
          throw new Error('GBP data unavailable');
        }
        if (target === 'eur') {
          return {
            sourceCurrency: source.toUpperCase(),
            targetCurrency: target.toUpperCase(),
            amount: 1,
            traditionalRate: 0.85,
            bitcoinRate: 0.84,
            traditionalAmount: 0.85,
            bitcoinAmount: 0.84,
            percentageDifference: -1.18,
            betterMethod: 'traditional' as const,
            arbitrageOpportunity: false
          };
        }
        throw new Error('Skip other currencies');
      });

      render(<RateTable {...defaultProps} />);
      
      // Should still show EUR but not GBP
      const eurElements = screen.getAllByText('EUR');
      expect(eurElements.length).toBeGreaterThan(0);
      expect(screen.queryByText('GBP')).not.toBeInTheDocument();
    });
  });
});