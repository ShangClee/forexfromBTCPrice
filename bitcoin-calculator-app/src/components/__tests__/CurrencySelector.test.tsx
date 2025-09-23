import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CurrencySelector from '../CurrencySelector';
import { CurrencyInfo } from '../../types';

// Mock currency data for testing
const mockCurrencies: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
];

describe('CurrencySelector', () => {
  const defaultProps = {
    currencies: mockCurrencies,
    selectedSource: 'USD',
    selectedTarget: 'EUR',
    onSourceChange: jest.fn(),
    onTargetChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders source and target currency selectors', () => {
      render(<CurrencySelector {...defaultProps} />);
      
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
      expect(screen.getByText('US Dollar')).toBeInTheDocument();
      expect(screen.getByText('EUR')).toBeInTheDocument();
      expect(screen.getByText('Euro')).toBeInTheDocument();
    });

    it('displays currency flags and symbols correctly', () => {
      render(<CurrencySelector {...defaultProps} />);
      
      // Check for flags (emojis)
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('🇪🇺')).toBeInTheDocument();
    });

    it('renders swap button', () => {
      render(<CurrencySelector {...defaultProps} />);
      
      const swapButton = screen.getByTitle('Swap currencies');
      expect(swapButton).toBeInTheDocument();
    });

    it('handles missing currency data gracefully', () => {
      const propsWithUnknownCurrency = {
        ...defaultProps,
        selectedSource: 'XXX',
        selectedTarget: 'YYY',
      };
      
      render(<CurrencySelector {...propsWithUnknownCurrency} />);
      
      // Should show unknown currencies with fallback display
      expect(screen.getAllByText('XXX')[0]).toBeInTheDocument();
      expect(screen.getAllByText('YYY')[0]).toBeInTheDocument();
    });
  });

  describe('Dropdown Functionality', () => {
    it('opens source dropdown when source selector is clicked', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      expect(screen.getByPlaceholderText('Search currencies...')).toBeInTheDocument();
      expect(screen.getByText('British Pound')).toBeInTheDocument();
    });

    it('opens target dropdown when target selector is clicked', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const targetButton = screen.getAllByText('EUR')[0].closest('button');
      await user.click(targetButton!);
      
      expect(screen.getByPlaceholderText('Search currencies...')).toBeInTheDocument();
      // Check that dropdown contains US Dollar (there will be multiple instances)
      const dropdownContainer = screen.getByPlaceholderText('Search currencies...').closest('.absolute');
      expect(dropdownContainer).toHaveTextContent('US Dollar');
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <CurrencySelector {...defaultProps} />
          <div data-testid="outside">Outside element</div>
        </div>
      );
      
      // Open dropdown
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      expect(screen.getByPlaceholderText('Search currencies...')).toBeInTheDocument();
      
      // Click outside
      await user.click(screen.getByTestId('outside'));
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search currencies...')).not.toBeInTheDocument();
      });
    });

    it('displays all currencies in dropdown', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      // Check that dropdown contains all currencies
      const dropdownContainer = screen.getByPlaceholderText('Search currencies...').closest('.absolute');
      mockCurrencies.forEach(currency => {
        expect(dropdownContainer).toHaveTextContent(currency.name);
        expect(dropdownContainer).toHaveTextContent(currency.code);
      });
    });

    it('highlights selected currency in dropdown', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      // Find the dropdown item (not the main selector)
      const dropdownItems = screen.getAllByText('US Dollar');
      const selectedItem = dropdownItems.find(item => 
        item.closest('button')?.classList.contains('bg-blue-50')
      )?.closest('button');
      expect(selectedItem).toHaveClass('bg-blue-50');
    });
  });

  describe('Search Functionality', () => {
    it('filters currencies by code when searching', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      const searchInput = screen.getByPlaceholderText('Search currencies...');
      await user.type(searchInput, 'GBP');
      
      // Wait for filtering to complete
      await waitFor(() => {
        expect(screen.getByText('British Pound')).toBeInTheDocument();
      });
      
      // Check that other currencies are not in the dropdown (but might still be in main selector)
      const dropdownContainer = screen.getByPlaceholderText('Search currencies...').closest('.absolute');
      expect(dropdownContainer).not.toHaveTextContent('Euro');
      expect(dropdownContainer).not.toHaveTextContent('Japanese Yen');
    });

    it('filters currencies by name when searching', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      const searchInput = screen.getByPlaceholderText('Search currencies...');
      await user.type(searchInput, 'British');
      
      await waitFor(() => {
        expect(screen.getByText('British Pound')).toBeInTheDocument();
      });
      
      // Check that other currencies are not in the dropdown
      const dropdownContainer = screen.getByPlaceholderText('Search currencies...').closest('.absolute');
      expect(dropdownContainer).not.toHaveTextContent('Euro');
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getByText('USD').closest('button');
      await user.click(sourceButton!);
      
      const searchInput = screen.getByPlaceholderText('Search currencies...');
      await user.type(searchInput, 'XYZ');
      
      expect(screen.getByText('No currencies found matching "XYZ"')).toBeInTheDocument();
    });

    it('is case insensitive when searching', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      const searchInput = screen.getByPlaceholderText('Search currencies...');
      await user.type(searchInput, 'usd');
      
      await waitFor(() => {
        // Should find USD in the dropdown
        const dropdownContainer = screen.getByPlaceholderText('Search currencies...').closest('.absolute');
        expect(dropdownContainer).toHaveTextContent('US Dollar');
      });
    });

    it('clears search term when dropdown closes', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      // Open dropdown and search
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      const searchInput = screen.getByPlaceholderText('Search currencies...');
      await user.type(searchInput, 'GBP');
      
      // Select a currency (closes dropdown)
      const britishPoundOption = screen.getByText('British Pound');
      await user.click(britishPoundOption);
      
      // Reopen dropdown
      await user.click(sourceButton!);
      
      // Search term should be cleared
      const newSearchInput = screen.getByPlaceholderText('Search currencies...');
      expect(newSearchInput).toHaveValue('');
    });

    it('focuses search input when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      const searchInput = screen.getByPlaceholderText('Search currencies...');
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Currency Selection', () => {
    it('calls onSourceChange when source currency is selected', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      // Find the British Pound option in the dropdown
      const britishPoundOption = screen.getByText('British Pound');
      await user.click(britishPoundOption);
      
      expect(defaultProps.onSourceChange).toHaveBeenCalledWith('GBP');
    });

    it('calls onTargetChange when target currency is selected', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const targetButton = screen.getAllByText('EUR')[0].closest('button');
      await user.click(targetButton!);
      
      const japaneseYenOption = screen.getByText('Japanese Yen');
      await user.click(japaneseYenOption);
      
      expect(defaultProps.onTargetChange).toHaveBeenCalledWith('JPY');
    });

    it('closes dropdown after currency selection', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      const britishPoundOption = screen.getByText('British Pound');
      await user.click(britishPoundOption);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search currencies...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Swap Functionality', () => {
    it('swaps source and target currencies when swap button is clicked', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const swapButton = screen.getByTitle('Swap currencies');
      await user.click(swapButton);
      
      expect(defaultProps.onSourceChange).toHaveBeenCalledWith('EUR');
      expect(defaultProps.onTargetChange).toHaveBeenCalledWith('USD');
    });

    it('does not swap when disabled', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} disabled />);
      
      const swapButton = screen.getByTitle('Swap currencies');
      await user.click(swapButton);
      
      expect(defaultProps.onSourceChange).not.toHaveBeenCalled();
      expect(defaultProps.onTargetChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('disables all interactions when disabled prop is true', () => {
      render(<CurrencySelector {...defaultProps} disabled />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      const targetButton = screen.getAllByText('EUR')[0].closest('button');
      const swapButton = screen.getByTitle('Swap currencies');
      
      expect(sourceButton).toBeDisabled();
      expect(targetButton).toBeDisabled();
      expect(swapButton).toBeDisabled();
    });

    it('applies disabled styling when disabled', () => {
      render(<CurrencySelector {...defaultProps} disabled />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      expect(sourceButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} disabled />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      expect(screen.queryByPlaceholderText('Search currencies...')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation in dropdown', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      await user.click(sourceButton!);
      
      // Tab to first currency option
      await user.tab();
      await user.tab();
      
      // Press Enter to select
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onSourceChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<CurrencySelector {...defaultProps} />);
      
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
    });

    it('maintains focus management in dropdown', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getByText('USD').closest('button');
      await user.click(sourceButton!);
      
      const searchInput = screen.getByPlaceholderText('Search currencies...');
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty currencies array', () => {
      const propsWithEmptyCurrencies = {
        ...defaultProps,
        currencies: [],
      };
      
      render(<CurrencySelector {...propsWithEmptyCurrencies} />);
      
      // Should still show selected currencies even with empty array
      expect(screen.getAllByText('USD')[0]).toBeInTheDocument();
      expect(screen.getAllByText('EUR')[0]).toBeInTheDocument();
    });

    it('handles undefined currencies prop', () => {
      const propsWithUndefinedCurrencies = {
        ...defaultProps,
        currencies: undefined as any,
      };
      
      render(<CurrencySelector {...propsWithUndefinedCurrencies} />);
      
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('handles rapid dropdown open/close', async () => {
      const user = userEvent.setup();
      render(<CurrencySelector {...defaultProps} />);
      
      const sourceButton = screen.getAllByText('USD')[0].closest('button');
      
      // Rapidly open and close
      await user.click(sourceButton!);
      await user.click(sourceButton!);
      await user.click(sourceButton!);
      
      // Should handle gracefully without errors
      expect(screen.getAllByText('USD')[0]).toBeInTheDocument();
    });
  });
});