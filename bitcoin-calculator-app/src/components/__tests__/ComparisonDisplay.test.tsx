import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComparisonDisplay from '../ComparisonDisplay';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trending-down-icon">TrendingDown</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  Equal: () => <div data-testid="equal-icon">Equal</div>,
}));

describe('ComparisonDisplay', () => {
  const defaultProps = {
    traditionalRate: 0.8854,
    bitcoinRate: 0.9123,
    amount: 1000,
    sourceCurrency: 'USD',
    targetCurrency: 'EUR',
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      expect(screen.getByText('Rate Comparison')).toBeInTheDocument();
      expect(screen.getByText('USD → EUR')).toBeInTheDocument();
      expect(screen.getByText('Traditional Forex')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin Route')).toBeInTheDocument();
    });

    it('displays rates correctly', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      expect(screen.getByText('0.885400')).toBeInTheDocument(); // Traditional rate
      expect(screen.getByText('0.912300')).toBeInTheDocument(); // Bitcoin rate
    });

    it('calculates and displays converted amounts', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      // Traditional amount: 1000 * 0.8854 = 885.40 EUR
      expect(screen.getByText('€885.40')).toBeInTheDocument();
      
      // Bitcoin amount: 1000 * 0.9123 = 912.30 EUR
      expect(screen.getByText('€912.30')).toBeInTheDocument();
    });

    it('shows percentage difference', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      // Percentage difference: ((0.9123 - 0.8854) / 0.8854) * 100 = 3.04%
      expect(screen.getByText('+3.04%')).toBeInTheDocument();
    });

    it('identifies better method correctly', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      expect(screen.getByText('bitcoin Route')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<ComparisonDisplay {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      expect(screen.queryByText('Rate Comparison')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when rates are missing', () => {
      render(<ComparisonDisplay {...defaultProps} traditionalRate={0} bitcoinRate={0} />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('Unable to calculate comparison')).toBeInTheDocument();
      expect(screen.getByText('Please check your inputs and try again')).toBeInTheDocument();
    });

    it('shows error message when amount is missing', () => {
      render(<ComparisonDisplay {...defaultProps} amount={0} />);
      
      expect(screen.getByText('Unable to calculate comparison')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('shows trending up icon for better bitcoin rate', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      // Bitcoin rate is better, so it should show trending up
      const bitcoinCard = screen.getByText('Bitcoin Route').closest('div');
      expect(bitcoinCard).toContainElement(screen.getByTestId('trending-up-icon'));
    });

    it('shows trending down icon for worse traditional rate', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      // Traditional rate is worse, so it should show trending down
      const traditionalCard = screen.getByText('Traditional Forex').closest('div');
      expect(traditionalCard).toContainElement(screen.getByTestId('trending-down-icon'));
    });

    it('shows equal icon when rates are the same', () => {
      render(<ComparisonDisplay {...defaultProps} traditionalRate={0.9123} bitcoinRate={0.9123} />);
      
      expect(screen.getAllByTestId('equal-icon')).toHaveLength(2); // One for each card
    });
  });

  describe('Arbitrage Detection', () => {
    it('shows arbitrage alert when difference exceeds 2%', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      // 3.04% difference should trigger arbitrage alert
      expect(screen.getByText('Arbitrage Opportunity Detected')).toBeInTheDocument();
      expect(screen.getByText(/The rate difference exceeds 2%/)).toBeInTheDocument();
    });

    it('does not show arbitrage alert when difference is below 2%', () => {
      render(<ComparisonDisplay {...defaultProps} bitcoinRate={0.9000} />);
      
      // 1.65% difference should not trigger arbitrage alert
      expect(screen.queryByText('Arbitrage Opportunity Detected')).not.toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats integer currencies without decimals', () => {
      const props = {
        ...defaultProps,
        targetCurrency: 'JPY',
        traditionalRate: 115.11,
        bitcoinRate: 118.50,
      };
      
      render(<ComparisonDisplay {...props} />);
      
      expect(screen.getByText('¥115,110')).toBeInTheDocument(); // Traditional amount
      expect(screen.getByText('¥118,500')).toBeInTheDocument(); // Bitcoin amount
    });

    it('formats decimal currencies with 2 decimal places', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      expect(screen.getByText('€885.40')).toBeInTheDocument();
      expect(screen.getByText('€912.30')).toBeInTheDocument();
    });
  });

  describe('Amount Difference', () => {
    it('shows amount difference when significant', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      // Difference: 912.30 - 885.40 = +26.90 EUR
      expect(screen.getByText('+€26.90')).toBeInTheDocument();
    });

    it('does not show amount difference when negligible', () => {
      render(<ComparisonDisplay {...defaultProps} bitcoinRate={0.8855} />);
      
      // Very small difference should not be displayed
      expect(screen.queryByText('Amount Difference')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      const gridContainer = screen.getByText('Traditional Forex').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large amounts', () => {
      render(<ComparisonDisplay {...defaultProps} amount={1000000} />);
      
      expect(screen.getByText('€885,400.00')).toBeInTheDocument();
      expect(screen.getByText('€912,300.00')).toBeInTheDocument();
    });

    it('handles very small amounts', () => {
      render(<ComparisonDisplay {...defaultProps} amount={0.01} />);
      
      expect(screen.getByText('€0.01')).toBeInTheDocument();
    });

    it('handles negative percentage differences', () => {
      render(<ComparisonDisplay {...defaultProps} bitcoinRate={0.8000} />);
      
      // Should show negative percentage
      expect(screen.getByText('-9.65%')).toBeInTheDocument();
    });
  });
});