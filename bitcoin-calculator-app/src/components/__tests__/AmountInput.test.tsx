import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AmountInput from '../AmountInput';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  DollarSign: () => <div data-testid="dollar-icon">$</div>,
}));

describe('AmountInput', () => {
  const defaultProps = {
    amount: '',
    currency: 'USD',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<AmountInput {...defaultProps} />);
      
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter amount in USD')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('displays the correct currency symbol and flag', () => {
      render(<AmountInput {...defaultProps} currency="EUR" />);
      
      expect(screen.getByText('🇪🇺')).toBeInTheDocument();
      expect(screen.getByText('€')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter amount in EUR')).toBeInTheDocument();
    });

    it('shows helper text for decimal currencies', () => {
      render(<AmountInput {...defaultProps} currency="USD" />);
      
      expect(screen.getByText('Enter up to 8 decimal places')).toBeInTheDocument();
    });

    it('shows helper text for integer currencies', () => {
      render(<AmountInput {...defaultProps} currency="JPY" />);
      
      expect(screen.getByText('JPY amounts are whole numbers only')).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('calls onChange when user types', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      fireEvent.change(input, { target: { value: '123.45' } });
      
      expect(onChange).toHaveBeenCalledWith('123.45');
    });

    it('formats input correctly for decimal currencies', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      fireEvent.change(input, { target: { value: '1234.567' } });
      
      expect(onChange).toHaveBeenCalledWith('1234.567');
    });

    it('prevents decimal input for integer currencies', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} currency="JPY" onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in JPY');
      fireEvent.change(input, { target: { value: '1234.56' } });
      
      // Should only accept the integer part
      expect(onChange).toHaveBeenCalledWith('1234');
    });

    it('removes non-numeric characters', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      fireEvent.change(input, { target: { value: 'abc123def.45ghi' } });
      
      expect(onChange).toHaveBeenCalledWith('123.45');
    });

    it('handles multiple decimal points correctly', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      fireEvent.change(input, { target: { value: '123.45.67' } });
      
      expect(onChange).toHaveBeenCalledWith('123.4567');
    });
  });

  describe('Validation', () => {
    it('shows error for invalid characters', async () => {
      render(<AmountInput {...defaultProps} amount="abc" />);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter only numbers and decimal points')).toBeInTheDocument();
      });
    });

    it('shows error for amount below minimum', async () => {
      render(<AmountInput {...defaultProps} amount="0.001" />);
      
      await waitFor(() => {
        expect(screen.getByText('Minimum amount is 0.01')).toBeInTheDocument();
      });
    });

    it('shows error for amount above maximum', async () => {
      render(<AmountInput {...defaultProps} amount="9999999999" />);
      
      await waitFor(() => {
        expect(screen.getByText('Maximum amount is 1,000,000,000')).toBeInTheDocument();
      });
    });

    it('shows error for decimal places in integer currencies', async () => {
      render(<AmountInput {...defaultProps} currency="JPY" amount="123.45" />);
      
      await waitFor(() => {
        expect(screen.getByText('JPY does not support decimal places')).toBeInTheDocument();
      });
    });

    it('shows error for too many decimal places', async () => {
      render(<AmountInput {...defaultProps} amount="123.123456789" />);
      
      await waitFor(() => {
        expect(screen.getByText('Maximum 8 decimal places allowed')).toBeInTheDocument();
      });
    });

    it('displays external error when provided', () => {
      render(<AmountInput {...defaultProps} error="Custom error message" />);
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('prioritizes external error over internal validation', () => {
      render(<AmountInput {...defaultProps} amount="abc" error="External error" />);
      
      expect(screen.getByText('External error')).toBeInTheDocument();
      expect(screen.queryByText('Please enter a valid number')).not.toBeInTheDocument();
    });
  });

  describe('Focus and Blur Behavior', () => {
    it('shows raw numeric value when focused', async () => {
      const user = userEvent.setup();
      
      render(<AmountInput {...defaultProps} amount="1234.56" />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      
      // Initially shows formatted value
      expect(input).toHaveValue('1,234.56');
      
      // Focus should show raw value
      await user.click(input);
      expect(input).toHaveValue('1234.56');
    });

    it('formats value for display when blurred', () => {
      render(<AmountInput {...defaultProps} amount="1234.56" />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      
      // The input should show formatted value when not focused
      expect(input).toHaveValue('1,234.56');
    });
  });

  describe('Clear Functionality', () => {
    it('shows clear button when there is a value', () => {
      render(<AmountInput {...defaultProps} amount="123.45" />);
      
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('does not show clear button when empty', () => {
      render(<AmountInput {...defaultProps} amount="" />);
      
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });

    it('clears the input when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} amount="123.45" onChange={onChange} />);
      
      const clearButton = screen.getByTitle('Clear amount');
      await user.click(clearButton);
      
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('does not show clear button when disabled', () => {
      render(<AmountInput {...defaultProps} amount="123.45" disabled />);
      
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<AmountInput {...defaultProps} disabled />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      expect(input).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<AmountInput {...defaultProps} disabled />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      expect(input).toHaveClass('bg-gray-50', 'text-gray-500', 'cursor-not-allowed');
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows numeric keys', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      fireEvent.change(input, { target: { value: '123' } });
      
      expect(onChange).toHaveBeenCalledWith('123');
    });

    it('allows decimal point for decimal currencies', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      fireEvent.change(input, { target: { value: '123.45' } });
      
      expect(onChange).toHaveBeenCalledWith('123.45');
    });

    it('prevents decimal point for integer currencies', async () => {
      const user = userEvent.setup();
      
      render(<AmountInput {...defaultProps} currency="JPY" />);
      
      const input = screen.getByPlaceholderText('Enter amount in JPY');
      
      // Try to type decimal point
      fireEvent.keyDown(input, { key: '.', keyCode: 190 });
      
      // The decimal point should be prevented
      expect(input).toHaveValue('');
    });

    it('allows control keys (backspace, delete, etc.)', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      
      // Simulate typing and then backspace
      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.change(input, { target: { value: '12' } });
      
      expect(onChange).toHaveBeenLastCalledWith('12');
    });
  });

  describe('Currency-Specific Formatting', () => {
    it('formats USD with dollar sign and commas', () => {
      render(<AmountInput {...defaultProps} currency="USD" amount="1234.56" />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      expect(input).toHaveValue('1,234.56');
      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('formats EUR with euro symbol', () => {
      render(<AmountInput {...defaultProps} currency="EUR" amount="1234.56" />);
      
      expect(screen.getByText('€')).toBeInTheDocument();
    });

    it('formats JPY as integer with yen symbol', () => {
      render(<AmountInput {...defaultProps} currency="JPY" amount="1234" />);
      
      const input = screen.getByPlaceholderText('Enter amount in JPY');
      expect(input).toHaveValue('1,234');
      expect(screen.getByText('¥')).toBeInTheDocument();
    });

    it('handles unknown currency gracefully', () => {
      render(<AmountInput {...defaultProps} currency="XYZ" />);
      
      expect(screen.getByText('💱')).toBeInTheDocument();
      expect(screen.getAllByText('XYZ')[0]).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string input', () => {
      const onChange = jest.fn();
      render(<AmountInput {...defaultProps} amount="" onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      expect(input).toHaveValue('');
    });

    it('handles zero value', async () => {
      render(<AmountInput {...defaultProps} amount="0" />);
      
      await waitFor(() => {
        expect(screen.getByText('Minimum amount is 0.01')).toBeInTheDocument();
      });
    });

    it('handles very large numbers', () => {
      render(<AmountInput {...defaultProps} amount="999999999" />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      expect(input).toHaveValue('999,999,999');
    });

    it('handles leading zeros', () => {
      const onChange = jest.fn();
      
      render(<AmountInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Enter amount in USD');
      fireEvent.change(input, { target: { value: '000123.45' } });
      
      expect(onChange).toHaveBeenCalledWith('123.45');
    });
  });
});