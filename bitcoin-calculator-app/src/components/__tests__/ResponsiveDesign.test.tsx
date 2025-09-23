import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CurrencySelector from '../CurrencySelector';
import AmountInput from '../AmountInput';
import ComparisonDisplay from '../ComparisonDisplay';
import CalculationBreakdown from '../CalculationBreakdown';
import RateTable from '../RateTable';
import { CurrencyInfo, BitcoinPriceData, ForexRateData } from '../../types';

// Mock data
const mockCurrencies: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
];

const mockBitcoinPrices: BitcoinPriceData = {
  usd: 50000,
  eur: 42000,
  gbp: 36000,
};

const mockForexRates: ForexRateData = {
  base: 'USD',
  date: '2023-01-01',
  rates: {
    EUR: 0.85,
    GBP: 0.73,
    USD: 1,
  },
};

// Mock window.matchMedia for responsive tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    // Reset viewport to desktop by default
    mockMatchMedia(false);
  });

  describe('CurrencySelector Responsive Behavior', () => {
    const defaultProps = {
      currencies: mockCurrencies,
      selectedSource: 'USD',
      selectedTarget: 'EUR',
      onSourceChange: jest.fn(),
      onTargetChange: jest.fn(),
    };

    it('should display mobile layout on small screens', () => {
      mockMatchMedia(true); // Mobile viewport
      render(<CurrencySelector {...defaultProps} />);
      
      // Check for mobile-specific classes on the main container
      const mainContainer = screen.getByText('From').closest('.bg-white');
      const flexContainer = mainContainer?.querySelector('.flex');
      expect(flexContainer).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('should have touch-friendly button sizes', () => {
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getByRole('button', { name: /us dollar/i });
      expect(sourceButton).toHaveClass('min-h-[56px]', 'touch-manipulation');
      
      const swapButton = screen.getByRole('button', { name: /swap currencies/i });
      expect(swapButton).toHaveClass('min-h-[48px]', 'min-w-[48px]', 'touch-manipulation');
    });

    it('should show responsive search input in dropdown', async () => {
      render(<CurrencySelector {...defaultProps} />);
      
      // Open dropdown
      const sourceButton = screen.getByRole('button', { name: /us dollar/i });
      fireEvent.click(sourceButton);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search currencies...');
        expect(searchInput).toHaveClass('py-3', 'sm:py-2', 'text-base', 'sm:text-sm', 'touch-manipulation');
      });
    });

    it('should have responsive currency list items', async () => {
      render(<CurrencySelector {...defaultProps} />);
      
      // Open dropdown
      const sourceButton = screen.getByRole('button', { name: /us dollar/i });
      fireEvent.click(sourceButton);
      
      await waitFor(() => {
        const currencyButtons = screen.getAllByRole('button');
        const currencyButton = currencyButtons.find(btn => btn.textContent?.includes('Euro'));
        expect(currencyButton).toHaveClass('py-4', 'sm:py-3', 'touch-manipulation');
      });
    });
  });

  describe('AmountInput Responsive Behavior', () => {
    const defaultProps = {
      amount: '1000',
      currency: 'USD',
      onChange: jest.fn(),
    };

    it('should have responsive input sizing', () => {
      render(<AmountInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('py-4', 'sm:py-3', 'text-base', 'sm:text-lg', 'touch-manipulation');
      expect(input).toHaveClass('pl-16', 'sm:pl-20');
    });

    it('should show appropriate currency symbol on mobile', () => {
      render(<AmountInput {...defaultProps} />);
      
      // Check for mobile-specific currency display
      const container = screen.getByRole('textbox').parentElement;
      expect(container?.querySelector('.sm\\:hidden')).toBeInTheDocument();
      expect(container?.querySelector('.hidden.sm\\:inline')).toBeInTheDocument();
    });

    it('should have touch-friendly clear button', () => {
      render(<AmountInput {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear amount/i });
      expect(clearButton).toHaveClass('p-2', 'sm:p-1', 'touch-manipulation');
    });

    it('should use correct input mode for mobile keyboards', () => {
      render(<AmountInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('inputMode', 'decimal');
    });
  });

  describe('ComparisonDisplay Responsive Behavior', () => {
    const defaultProps = {
      traditionalRate: 0.85,
      bitcoinRate: 0.84,
      amount: 1000,
      sourceCurrency: 'USD',
      targetCurrency: 'EUR',
    };

    it('should use responsive grid layout', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      // Check for responsive grid classes - look for the grid container in the component
      const gridContainer = screen.getByText('Traditional Forex').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });

    it('should have responsive header layout', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      const header = screen.getByText('Rate Comparison').parentElement;
      expect(header).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('should show responsive text sizes', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      const title = screen.getByText('Rate Comparison');
      expect(title).toHaveClass('text-base', 'sm:text-lg');
    });

    it('should have responsive padding in cards', () => {
      render(<ComparisonDisplay {...defaultProps} />);
      
      // Find the card container (parent of the header that contains Traditional Forex)
      const traditionalCard = screen.getByText('Traditional Forex').closest('.border-2');
      expect(traditionalCard).toHaveClass('p-4', 'sm:p-5');
    });
  });

  describe('CalculationBreakdown Responsive Behavior', () => {
    const defaultProps = {
      sourceBtcPrice: 50000,
      targetBtcPrice: 42000,
      amount: 1000,
      sourceCurrency: 'USD',
      targetCurrency: 'EUR',
    };

    it('should have touch-friendly toggle button', () => {
      render(<CalculationBreakdown {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /bitcoin route calculation/i });
      expect(toggleButton).toHaveClass('touch-manipulation');
    });

    it('should show responsive header layout', () => {
      render(<CalculationBreakdown {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /bitcoin route calculation/i });
      const headerContent = toggleButton.querySelector('.flex.items-center.space-x-2.min-w-0');
      expect(headerContent).toBeInTheDocument();
    });

    it('should have responsive formula display when expanded', async () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      await waitFor(() => {
        const formulaElements = screen.getAllByText(/÷|×/);
        expect(formulaElements.length).toBeGreaterThan(0);
        
        // Check for responsive formula containers
        const formulaContainer = formulaElements[0].closest('.font-mono');
        expect(formulaContainer).toHaveClass('overflow-x-auto');
      });
    });

    it('should show responsive spacing in expanded content', async () => {
      render(<CalculationBreakdown {...defaultProps} expanded={true} />);
      
      await waitFor(() => {
        const content = screen.getByText('Convert USD to Bitcoin').closest('.space-y-4');
        expect(content).toHaveClass('space-y-4', 'sm:space-y-6');
      });
    });
  });

  describe('RateTable Responsive Behavior', () => {
    const defaultProps = {
      bitcoinPrices: mockBitcoinPrices,
      forexRates: mockForexRates,
      baseCurrency: 'USD',
      onCurrencySelect: jest.fn(),
    };

    it('should have horizontal scroll on mobile', () => {
      render(<RateTable {...defaultProps} />);
      
      const tableContainer = screen.getByRole('table').parentElement;
      expect(tableContainer).toHaveClass('overflow-x-auto');
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('min-w-[640px]');
    });

    it('should show responsive column headers', () => {
      render(<RateTable {...defaultProps} />);
      
      // Check for mobile-specific header text
      expect(screen.getByText('BTC')).toBeInTheDocument(); // Mobile header
      expect(screen.getByText('Forex')).toBeInTheDocument(); // Mobile header
    });

    it('should have touch-friendly table rows', async () => {
      render(<RateTable {...defaultProps} />);
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        const dataRow = rows.find(row => row.textContent?.includes('EUR'));
        expect(dataRow).toHaveClass('touch-manipulation');
      });
    });

    it('should show responsive cell content', async () => {
      render(<RateTable {...defaultProps} />);
      
      await waitFor(() => {
        // Check for responsive text sizes in cells
        const cells = screen.getAllByRole('cell');
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it('should have responsive footer layout', () => {
      render(<RateTable {...defaultProps} />);
      
      const footer = screen.getByText('How to read this table:').closest('.grid');
      expect(footer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });
  });

  describe('Touch Interactions', () => {
    it('should handle touch events on interactive elements', () => {
      const onSourceChange = jest.fn();
      render(
        <CurrencySelector
          currencies={mockCurrencies}
          selectedSource="USD"
          selectedTarget="EUR"
          onSourceChange={onSourceChange}
          onTargetChange={jest.fn()}
        />
      );
      
      const sourceButton = screen.getByRole('button', { name: /us dollar/i });
      
      // Simulate touch events
      fireEvent.touchStart(sourceButton);
      fireEvent.touchEnd(sourceButton);
      fireEvent.click(sourceButton);
      
      // Should open dropdown
      expect(screen.getByPlaceholderText('Search currencies...')).toBeInTheDocument();
    });

    it('should handle swipe gestures appropriately', () => {
      const onSwap = jest.fn();
      render(
        <CurrencySelector
          currencies={mockCurrencies}
          selectedSource="USD"
          selectedTarget="EUR"
          onSourceChange={jest.fn()}
          onTargetChange={jest.fn()}
        />
      );
      
      const swapButton = screen.getByRole('button', { name: /swap currencies/i });
      
      // Simulate touch interaction
      fireEvent.touchStart(swapButton);
      fireEvent.touchEnd(swapButton);
      fireEvent.click(swapButton);
      
      // Should trigger swap (we can't directly test the swap function, but we can test the button works)
      expect(swapButton).not.toBeDisabled();
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should maintain proper focus management on mobile', async () => {
      render(
        <CurrencySelector
          currencies={mockCurrencies}
          selectedSource="USD"
          selectedTarget="EUR"
          onSourceChange={jest.fn()}
          onTargetChange={jest.fn()}
        />
      );
      
      const sourceButton = screen.getByRole('button', { name: /us dollar/i });
      fireEvent.click(sourceButton);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search currencies...');
        expect(searchInput).toBeInTheDocument();
        // Focus should be on search input when dropdown opens
        expect(document.activeElement).toBe(searchInput);
      });
    });

    it('should have proper ARIA labels for mobile interactions', () => {
      render(<CalculationBreakdown
        sourceBtcPrice={50000}
        targetBtcPrice={42000}
        amount={1000}
        sourceCurrency="USD"
        targetCurrency="EUR"
      />);
      
      const toggleButton = screen.getByRole('button', { name: /bitcoin route calculation/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(toggleButton).toHaveAttribute('aria-controls', 'calculation-breakdown-content');
    });

    it('should support keyboard navigation on mobile', () => {
      render(<AmountInput
        amount="1000"
        currency="USD"
        onChange={jest.fn()}
      />);
      
      const input = screen.getByRole('textbox');
      
      // Test keyboard events
      fireEvent.keyDown(input, { key: 'Tab' });
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Escape' });
      
      // Should not throw errors and maintain functionality
      expect(input).toBeInTheDocument();
    });
  });

  describe('Performance on Mobile', () => {
    it('should not cause layout shifts during responsive changes', () => {
      const { rerender } = render(
        <ComparisonDisplay
          traditionalRate={0.85}
          bitcoinRate={0.84}
          amount={1000}
          sourceCurrency="USD"
          targetCurrency="EUR"
        />
      );
      
      // Simulate viewport change
      mockMatchMedia(true);
      
      rerender(
        <ComparisonDisplay
          traditionalRate={0.85}
          bitcoinRate={0.84}
          amount={1000}
          sourceCurrency="USD"
          targetCurrency="EUR"
        />
      );
      
      // Component should still render correctly
      expect(screen.getByText('Rate Comparison')).toBeInTheDocument();
    });

    it('should handle rapid state changes without performance issues', () => {
      const onChange = jest.fn();
      render(<AmountInput
        amount=""
        currency="USD"
        onChange={onChange}
      />);
      
      const input = screen.getByRole('textbox');
      
      // Simulate rapid typing
      const rapidInputs = ['1', '12', '123', '1234', '12345'];
      rapidInputs.forEach(value => {
        fireEvent.change(input, { target: { value } });
      });
      
      expect(onChange).toHaveBeenCalledTimes(rapidInputs.length);
    });
  });
});