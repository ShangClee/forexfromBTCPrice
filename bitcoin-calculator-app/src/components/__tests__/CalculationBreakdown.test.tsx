import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CalculationBreakdown from '../CalculationBreakdown';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
  Calculator: () => <div data-testid="calculator-icon">Calculator</div>,
  ArrowRight: () => <div data-testid="arrow-right-icon">ArrowRight</div>,
  Bitcoin: () => <div data-testid="bitcoin-icon">Bitcoin</div>,
}));

describe('CalculationBreakdown', () => {
  const defaultProps = {
    sourceBtcPrice: 45000,
    targetBtcPrice: 38000,
    amount: 1000,
    sourceCurrency: 'USD',
    targetCurrency: 'EUR',
    expanded: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<CalculationBreakdown {...defaultProps} />);
      
      expect(screen.getByText('Bitcoin Route Calculation')).toBeInTheDocument();
      expect(screen.getByTestId('calculator-icon')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('displays summary in header when collapsed', () => {
      render(<CalculationBreakdown {...defaultProps} />);
      
      // Should show source amount and final result in header
      expect(screen.getByText(/\$1,000\.00 → €1,184\.21/)).toBeInTheDocument();
    });

    it('shows expanded content when expanded prop is true', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      expect(screen.getByText('Convert USD to Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('Convert Bitcoin to EUR')).toBeInTheDocument();
      expect(screen.getByText('Effective Exchange Rate')).toBeInTheDocument();
    });

    it('uses chevron up icon when expanded', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error state when sourceBtcPrice is missing', () => {
      render(<CalculationBreakdown {...defaultProps} sourceBtcPrice={0} />);
      
      expect(screen.getByText('Unable to calculate')).toBeInTheDocument();
      expect(screen.getByText('Calculation Breakdown')).toBeInTheDocument();
    });

    it('shows error state when targetBtcPrice is missing', () => {
      render(<CalculationBreakdown {...defaultProps} targetBtcPrice={0} />);
      
      expect(screen.getByText('Unable to calculate')).toBeInTheDocument();
    });

    it('shows error state when amount is undefined', () => {
      render(<CalculationBreakdown {...defaultProps} amount={undefined as any} />);
      
      expect(screen.getByText('Unable to calculate')).toBeInTheDocument();
    });

    it('shows error state when amount is null', () => {
      render(<CalculationBreakdown {...defaultProps} amount={null as any} />);
      
      expect(screen.getByText('Unable to calculate')).toBeInTheDocument();
    });

    it('handles negative Bitcoin prices gracefully', () => {
      render(<CalculationBreakdown {...defaultProps} sourceBtcPrice={-1000} />);
      
      expect(screen.getByText('Unable to calculate')).toBeInTheDocument();
    });
  });

  describe('Calculation Logic', () => {
    it('calculates Bitcoin amount correctly', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      // 1000 USD ÷ 45000 USD/BTC = 0.02222222 BTC
      expect(screen.getByText('0.02222222 BTC')).toBeInTheDocument();
    });

    it('calculates final amount correctly', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      // 0.02222222 BTC × 38000 EUR/BTC = 844.44 EUR (approximately)
      expect(screen.getByText('€1,184.21')).toBeInTheDocument();
    });

    it('calculates effective rate correctly', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      // 45000 ÷ 38000 = 1.184211
      expect(screen.getByText('1 USD = 1.184211 EUR')).toBeInTheDocument();
    });

    it('displays formulas correctly', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      expect(screen.getByText('1000 USD ÷ 45000.00 USD/BTC')).toBeInTheDocument();
      expect(screen.getByText(/0\.02222222 BTC × 38000\.00 EUR\/BTC/)).toBeInTheDocument();
      expect(screen.getByText('45000.00 ÷ 38000.00')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats integer currencies without decimals', () => {
      const props = {
        ...defaultProps,
        targetCurrency: 'JPY',
        targetBtcPrice: 5000000,
      };
      
      render(<CalculationBreakdown {...props} expanded={true} />);
      
      // Should format JPY without decimals
      expect(screen.getByText('¥5,921,053')).toBeInTheDocument();
    });

    it('formats decimal currencies with 2 decimal places', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      expect(screen.getByText('€1,184.21')).toBeInTheDocument();
    });

    it('handles different currency symbols correctly', () => {
      const props = {
        ...defaultProps,
        sourceCurrency: 'GBP',
        sourceBtcPrice: 33000,
      };
      
      render(<CalculationBreakdown {...props} expanded={true} />);
      
      expect(screen.getByText('£33,000.00')).toBeInTheDocument();
    });
  });

  describe('Expandable Functionality', () => {
    it('toggles expansion when header is clicked', async () => {
      const user = userEvent.setup();
      render(<CalculationBreakdown {...defaultProps} />);
      
      const header = screen.getByRole('button');
      
      // Initially collapsed
      expect(screen.queryByText('Convert USD to Bitcoin')).not.toBeInTheDocument();
      
      // Click to expand
      await user.click(header);
      expect(screen.getByText('Convert USD to Bitcoin')).toBeInTheDocument();
      
      // Click to collapse
      await user.click(header);
      expect(screen.queryByText('Convert USD to Bitcoin')).not.toBeInTheDocument();
    });

    it('calls onToggle when provided', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();
      
      render(<CalculationBreakdown {...defaultProps} onToggle={onToggle} />);
      
      const header = screen.getByRole('button');
      await user.click(header);
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('uses external expanded state when onToggle is provided', () => {
      const onToggle = jest.fn();
      
      const { rerender } = render(
        <CalculationBreakdown {...defaultProps} expanded={false} onToggle={onToggle} />
      );
      
      expect(screen.queryByText('Convert USD to Bitcoin')).not.toBeInTheDocument();
      
      rerender(
        <CalculationBreakdown {...defaultProps} expanded={true} onToggle={onToggle} />
      );
      
      expect(screen.getByText('Convert USD to Bitcoin')).toBeInTheDocument();
    });

    it('uses internal state when onToggle is not provided', async () => {
      const user = userEvent.setup();
      render(<CalculationBreakdown {...defaultProps} />);
      
      const header = screen.getByRole('button');
      
      // Toggle multiple times to test internal state
      await user.click(header);
      expect(screen.getByText('Convert USD to Bitcoin')).toBeInTheDocument();
      
      await user.click(header);
      expect(screen.queryByText('Convert USD to Bitcoin')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<CalculationBreakdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'calculation-breakdown-content');
    });

    it('updates aria-expanded when expanded', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper focus management', () => {
      render(<CalculationBreakdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });

    it('has proper content structure with headings', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      expect(screen.getByText('Convert USD to Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('Convert Bitcoin to EUR')).toBeInTheDocument();
      expect(screen.getByText('Effective Exchange Rate')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('displays step numbers correctly', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      const stepNumbers = screen.getAllByText(/^[12]$/);
      expect(stepNumbers).toHaveLength(2);
    });

    it('shows Bitcoin icon in step 1 result', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      expect(screen.getByTestId('bitcoin-icon')).toBeInTheDocument();
    });

    it('shows arrow between steps', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
    });

    it('displays Bitcoin prices reference section', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      expect(screen.getByText('Bitcoin Prices Used')).toBeInTheDocument();
      expect(screen.getByText('USD/BTC')).toBeInTheDocument();
      expect(screen.getByText('EUR/BTC')).toBeInTheDocument();
      expect(screen.getByText('$45,000.00')).toBeInTheDocument();
      expect(screen.getByText('€38,000.00')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very small amounts', () => {
      const props = {
        ...defaultProps,
        amount: 0.01,
      };
      
      render(<CalculationBreakdown {...props} expanded={true} />);
      
      expect(screen.getByText('0.00000022 BTC')).toBeInTheDocument();
    });

    it('handles very large amounts', () => {
      const props = {
        ...defaultProps,
        amount: 1000000,
      };
      
      render(<CalculationBreakdown {...props} expanded={true} />);
      
      expect(screen.getByText('22.22222222 BTC')).toBeInTheDocument();
    });

    it('handles same currency conversion', () => {
      const props = {
        ...defaultProps,
        sourceCurrency: 'USD',
        targetCurrency: 'USD',
        targetBtcPrice: 45000,
      };
      
      render(<CalculationBreakdown {...props} expanded={true} />);
      
      expect(screen.getByText('1 USD = 1.000000 USD')).toBeInTheDocument();
    });

    it('handles decimal Bitcoin prices', () => {
      const props = {
        ...defaultProps,
        sourceBtcPrice: 45000.123,
        targetBtcPrice: 38000.456,
      };
      
      render(<CalculationBreakdown {...props} expanded={true} />);
      
      expect(screen.getByText('45000.12 ÷ 38000.46')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      const gridContainer = screen.getByText('USD/BTC').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });
  });

  describe('Component State Management', () => {
    it('maintains internal state independently', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<CalculationBreakdown {...defaultProps} />);
      
      // Expand using internal state
      const header = screen.getByRole('button');
      await user.click(header);
      expect(screen.getByText('Convert USD to Bitcoin')).toBeInTheDocument();
      
      // Rerender with different props but no onToggle - should maintain internal state
      rerender(<CalculationBreakdown {...defaultProps} amount={2000} />);
      expect(screen.getByText('Convert USD to Bitcoin')).toBeInTheDocument();
    });

    it('resets internal state when switching to external control', () => {
      const onToggle = jest.fn();
      
      const { rerender } = render(<CalculationBreakdown {...defaultProps} />);
      
      // Initially no external control, should be collapsed
      expect(screen.queryByText('Convert USD to Bitcoin')).not.toBeInTheDocument();
      
      // Switch to external control with expanded=true
      rerender(<CalculationBreakdown {...defaultProps} expanded={true} onToggle={onToggle} />);
      expect(screen.getByText('Convert USD to Bitcoin')).toBeInTheDocument();
    });
  });
});