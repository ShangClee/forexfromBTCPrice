import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AmountInputProps, CurrencyInfo } from '../types';

// Currency data for formatting and symbols
const CURRENCY_DATA: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
];

// Validation rules
const VALIDATION_RULES = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1000000000, // 1 billion
  MAX_DECIMAL_PLACES: 8,
  ALLOWED_CHARS: /^[0-9.,\s]*$/,
};

// Currencies that typically don't use decimal places
const INTEGER_CURRENCIES = ['JPY', 'KRW', 'HUF', 'CLP', 'ISK', 'PYG', 'UGX', 'VND'];

/**
 * Utility functions for number formatting and validation
 */
const formatNumber = (value: string, currency: string): string => {
  // Remove all non-numeric characters except decimal points
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points - keep only the first one
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Remove leading zeros but preserve single zero before decimal
  if (parts[0]) {
    parts[0] = parts[0].replace(/^0+/, '') || '0';
    // If we have only zeros, keep one zero
    if (parts[0] === '') {
      parts[0] = '0';
    }
  }
  
  // For integer currencies, remove decimal points
  if (INTEGER_CURRENCIES.includes(currency)) {
    return parts[0] || '';
  }
  
  // Limit decimal places
  if (parts.length === 2) {
    const maxDecimals = INTEGER_CURRENCIES.includes(currency) ? 0 : VALIDATION_RULES.MAX_DECIMAL_PLACES;
    parts[1] = parts[1].substring(0, maxDecimals);
  }
  
  return parts.join('.');
};

const validateAmount = (value: string, currency: string): string | null => {
  if (!value || value.trim() === '') {
    return null; // Empty is valid (optional input)
  }
  
  const numValue = parseFloat(value);
  
  // Check if it's a valid number
  if (isNaN(numValue)) {
    // Check for invalid characters first
    if (!VALIDATION_RULES.ALLOWED_CHARS.test(value)) {
      return 'Please enter only numbers and decimal points';
    }
    return 'Please enter a valid number';
  }
  
  // Check minimum amount
  if (numValue < VALIDATION_RULES.MIN_AMOUNT) {
    return `Minimum amount is ${VALIDATION_RULES.MIN_AMOUNT}`;
  }
  
  // Check maximum amount
  if (numValue > VALIDATION_RULES.MAX_AMOUNT) {
    return `Maximum amount is ${VALIDATION_RULES.MAX_AMOUNT.toLocaleString()}`;
  }
  
  // Check decimal places for integer currencies
  if (INTEGER_CURRENCIES.includes(currency) && value.includes('.')) {
    return `${currency} does not support decimal places`;
  }
  
  // Check decimal places limit
  const decimalPart = value.split('.')[1];
  if (decimalPart && decimalPart.length > VALIDATION_RULES.MAX_DECIMAL_PLACES) {
    return `Maximum ${VALIDATION_RULES.MAX_DECIMAL_PLACES} decimal places allowed`;
  }
  
  return null; // Valid
};

const getCurrencyInfo = (code: string): CurrencyInfo => {
  return CURRENCY_DATA.find(c => c.code === code) || {
    code,
    name: code,
    symbol: code,
    flag: '💱'
  };
};

const formatDisplayValue = (value: string, currency: string): string => {
  if (!value || value === '') return '';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  // Format based on currency
  if (INTEGER_CURRENCIES.includes(currency)) {
    return Math.round(numValue).toLocaleString();
  }
  
  // For other currencies, preserve the decimal input but add thousand separators to integer part
  const parts = value.split('.');
  const integerPart = parseInt(parts[0] || '0').toLocaleString();
  
  if (parts.length === 2) {
    return `${integerPart}.${parts[1]}`;
  }
  
  return integerPart;
};

const AmountInput: React.FC<AmountInputProps> = ({
  amount,
  currency,
  onChange,
  disabled = false,
  error: externalError
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(amount);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currencyInfo = getCurrencyInfo(currency);
  const error = externalError || internalError;
  
  // Update display value when amount prop changes
  useEffect(() => {
    setDisplayValue(amount);
  }, [amount]);
  
  // Validate on amount change
  useEffect(() => {
    const validationError = validateAmount(amount, currency);
    setInternalError(validationError);
  }, [amount, currency]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Format the input value
    const formattedValue = formatNumber(rawValue, currency);
    
    // Update display value immediately for responsive UI
    setDisplayValue(formattedValue);
    
    // Call onChange with the clean numeric value
    onChange(formattedValue);
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    // Show raw numeric value when focused for easier editing
    if (displayValue) {
      const numericValue = displayValue.replace(/[^\d.]/g, '');
      setDisplayValue(numericValue);
    }
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    // Format for display when not focused
    if (displayValue) {
      const formatted = formatDisplayValue(displayValue, currency);
      setDisplayValue(formatted);
    }
  };
  
  const handleClear = () => {
    setDisplayValue('');
    onChange('');
    setInternalError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    
    // Ensure that it is a number or decimal point and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
        (e.keyCode < 96 || e.keyCode > 105) && 
        e.keyCode !== 190 && e.keyCode !== 110) {
      e.preventDefault();
    }
    
    // Prevent decimal point for integer currencies
    if (INTEGER_CURRENCIES.includes(currency) && (e.keyCode === 190 || e.keyCode === 110)) {
      e.preventDefault();
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <label htmlFor="amount-input" className="block text-sm font-medium text-gray-700 mb-2">
        Amount
      </label>
      
      <div className="relative">
        {/* Currency Symbol */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <span className="text-lg">{currencyInfo.flag}</span>
          <span className="text-sm font-medium text-gray-600">{currencyInfo.symbol}</span>
        </div>
        
        {/* Input Field */}
        <input
          id="amount-input"
          ref={inputRef}
          type="text"
          value={isFocused ? displayValue : (displayValue ? formatDisplayValue(displayValue, currency) : '')}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={`Enter amount in ${currency}`}
          className={`w-full pl-20 pr-12 py-3 border rounded-lg text-lg font-medium transition-colors ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } ${
            disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
          } focus:ring-2 focus:ring-opacity-50 outline-none`}
        />
        
        {/* Clear Button */}
        {displayValue && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none transition-colors"
            title="Clear amount"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      {/* Helper Text */}
      {!error && (
        <div className="mt-2 text-xs text-gray-500">
          {INTEGER_CURRENCIES.includes(currency) 
            ? `${currency} amounts are whole numbers only`
            : `Enter up to ${VALIDATION_RULES.MAX_DECIMAL_PLACES} decimal places`
          }
        </div>
      )}
    </div>
  );
};

export default AmountInput;