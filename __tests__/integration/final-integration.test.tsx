/**
 * Final Integration Tests for Bitcoin Forex Calculator
 * Tests the complete application flow with all components integrated
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BitcoinForexCalculator from '../../bitcoin-forex-calculator';

// Mock the services
jest.mock('../../services/enhancedBitcoinPriceService');
jest.mock('../../services/enhancedForexRateService');

const mockBitcoinService = require('../../services/enhancedBitcoinPriceService');
const mockForexService = require('../../services/enhancedForexRateService');

// Mock data
const mockBitcoinPrices = {
  usd: 45000,
  eur: 38000,
  gbp: 33000,
  jpy: 5000000,
};

const mockForexRates = {
  base: 'USD',
  date: '2024-01-01',
  rates: {
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110,
    USD: 1,
  },
};

describe('Final Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup successful API responses
    mockBitcoinService.getBitcoinPricesWithErrorHandling.mockResolvedValue(mockBitcoinPrices);
    mockForexService.fetchForexRatesWithErrorHandling.mockResolvedValue(mockForexRates);
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('Complete Application Flow', () => {
    it('should render all components and handle complete user workflow', async () => {
      const user = userEvent.setup();
      
      render(<BitcoinForexCalculator />);

      // Check initial render
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin Forex Calculator')).toBeInTheDocument();
      expect(screen.getByText('Compare traditional forex rates with Bitcoin-based exchange rates')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(mockBitcoinService.getBitcoinPricesWithErrorHandling).toHaveBeenCalled();
        expect(mockForexService.fetchForexRatesWithErrorHandling).toHaveBeenCalled();
      });

      // Check that comparison display appears
      await waitFor(() => {
        expect(screen.getByText('Rate Comparison')).toBeInTheDocument();
      });

      // Test currency selection
      const sourceCurrencyButton = screen.getAllByRole('button').find(btn => 
        btn.textContent?.includes('USD')
      );
      expect(sourceCurrencyButton).toBeInTheDocument();

      // Test amount input
      const amountInput = screen.getByRole('textbox');
      expect(amountInput).toBeInTheDocument();
      expect(amountInput).toHaveValue('1000');

      // Change amount
      await user.clear(amountInput);
      await user.type(amountInput, '5000');
      
      await waitFor(() => {
        expect(amountInput).toHaveValue('5000');
      });

      // Check that calculation breakdown is available
      expect(screen.getByText(/calculation/i)).toBeInTheDocument();

      // Check that rate table is displayed
      expect(screen.getByText('All Currency Rates')).toBeInTheDocument();
    });

    it('should handle refresh functionality', async () => {
      const user = userEvent.setup();
      
      render(<BitcoinForexCalculator />);

      // Wait for initial load
      await waitFor(() => {
        expect(mockBitcoinService.getBitcoinPricesWithErrorHandling).toHaveBeenCalledTimes(1);
      });

      // Find and click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();

      await user.click(refreshButton);

      // Check that services are called again
      await waitFor(() => {
        expect(mockBitcoinService.getBitcoinPricesWithErrorHandling).toHaveBeenCalledTimes(2);
        expect(mockForexService.fetchForexRatesWithErrorHandling).toHaveBeenCalledTimes(2);
      });
    });

    it('should display loading states properly', async () => {
      // Mock delayed responses
      mockBitcoinService.getBitcoinPricesWithErrorHandling.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockBitcoinPrices), 1000))
      );
      mockForexService.fetchForexRatesWithErrorHandling.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockForexRates), 1000))
      );

      render(<BitcoinForexCalculator />);

      // Check loading state
      expect(screen.getByText('Loading exchange rate data...')).toBeInTheDocument();
      expect(screen.getByText('This may take a few moments')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading exchange rate data...')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle offline state', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<BitcoinForexCalculator />);

      // Check offline indicator
      expect(screen.getByText('You are currently offline. Some features may not work properly.')).toBeInTheDocument();
      expect(screen.getByLabelText('Offline')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API failures
      mockBitcoinService.getBitcoinPricesWithErrorHandling.mockRejectedValue(
        new Error('Bitcoin API unavailable')
      );
      mockForexService.fetchForexRatesWithErrorHandling.mockRejectedValue(
        new Error('Forex API unavailable')
      );

      render(<BitcoinForexCalculator />);

      // Wait for error states
      await waitFor(() => {
        expect(screen.getByText('Service Unavailable')).toBeInTheDocument();
      });

      // Check that retry buttons are available
      const retryButtons = screen.getAllByText('Try Again');
      expect(retryButtons.length).toBeGreaterThan(0);
    });

    it('should handle partial API failures', async () => {
      // Mock partial failure
      mockBitcoinService.getBitcoinPricesWithErrorHandling.mockResolvedValue(mockBitcoinPrices);
      mockForexService.fetchForexRatesWithErrorHandling.mockRejectedValue(
        new Error('Forex API unavailable')
      );

      render(<BitcoinForexCalculator />);

      // Wait for partial error state
      await waitFor(() => {
        expect(screen.getByText('Forex Rate Service')).toBeInTheDocument();
      });

      // Should still show some functionality
      expect(screen.queryByText('Service Unavailable')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<BitcoinForexCalculator />);

      // Check main landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText('Bitcoin Forex Calculator Application')).toBeInTheDocument();

      // Check headings structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Wait for data to load and check sections
      await waitFor(() => {
        expect(screen.getByText('Rate Comparison')).toBeInTheDocument();
      });

      // Check that sections have proper labels
      const sections = screen.getAllByRole('region');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<BitcoinForexCalculator />);

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      // Test that interactive elements are focusable
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      refreshButton.focus();
      expect(document.activeElement).toBe(refreshButton);
    });

    it('should provide proper status updates', async () => {
      render(<BitcoinForexCalculator />);

      // Check for status regions
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);

      // Wait for loading completion
      await waitFor(() => {
        expect(screen.getByText(/last updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid user interactions without issues', async () => {
      const user = userEvent.setup();
      
      render(<BitcoinForexCalculator />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Rate Comparison')).toBeInTheDocument();
      });

      // Rapid amount changes
      const amountInput = screen.getByRole('textbox');
      
      await user.clear(amountInput);
      await user.type(amountInput, '1000');
      await user.clear(amountInput);
      await user.type(amountInput, '2000');
      await user.clear(amountInput);
      await user.type(amountInput, '3000');

      // Should handle without errors
      expect(amountInput).toHaveValue('3000');
    });

    it('should debounce calculations properly', async () => {
      const user = userEvent.setup();
      
      render(<BitcoinForexCalculator />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Rate Comparison')).toBeInTheDocument();
      });

      const amountInput = screen.getByRole('textbox');
      
      // Type rapidly
      await user.clear(amountInput);
      await user.type(amountInput, '12345', { delay: 50 });

      // Should show final value
      await waitFor(() => {
        expect(amountInput).toHaveValue('12345');
      });
    });
  });

  describe('Responsive Design Integration', () => {
    it('should adapt to different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<BitcoinForexCalculator />);

      // Check that responsive classes are applied
      const mainContainer = screen.getByRole('main');
      expect(mainContainer).toHaveClass('min-h-screen');
    });
  });
});