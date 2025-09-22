import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Search, ArrowUpDown } from 'lucide-react';
import { CurrencySelectorProps, CurrencyInfo } from '../types';

// Comprehensive currency data with full names and symbols
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

interface DropdownProps {
  isOpen: boolean;
  selectedCurrency: string;
  onSelect: (currency: string) => void;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredCurrencies: CurrencyInfo[];
  disabled?: boolean;
}

const CurrencyDropdown: React.FC<DropdownProps> = ({
  isOpen,
  selectedCurrency,
  onSelect,
  onClose,
  searchTerm,
  onSearchChange,
  filteredCurrencies,
  disabled
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 sm:max-h-96 overflow-hidden"
    >
      {/* Search Input */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search currencies..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base sm:text-sm touch-manipulation"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Currency List */}
      <div className="max-h-60 sm:max-h-80 overflow-y-auto">
        {filteredCurrencies.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No currencies found matching "{searchTerm}"
          </div>
        ) : (
          filteredCurrencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => onSelect(currency.code)}
              disabled={disabled}
              className={`w-full px-4 py-4 sm:py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors touch-manipulation ${
                selectedCurrency === currency.code ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{currency.flag}</span>
                  <div>
                    <div className="font-medium text-gray-900">{currency.code}</div>
                    <div className="text-sm text-gray-500">{currency.name}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 font-mono">{currency.symbol}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const CurrencySelector: React.FC<CurrencySelectorProps> = React.memo(({
  currencies = CURRENCY_DATA,
  selectedSource,
  selectedTarget,
  onSourceChange,
  onTargetChange,
  disabled = false
}) => {
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');
  const [targetSearchTerm, setTargetSearchTerm] = useState('');

  // Memoized currency info getter to prevent recalculation
  const getCurrencyInfo = useCallback((code: string): CurrencyInfo => {
    return currencies.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      flag: '💱'
    };
  }, [currencies]);

  // Memoized currency filter function
  const getFilteredCurrencies = useCallback((searchTerm: string): CurrencyInfo[] => {
    if (!searchTerm.trim()) return currencies;
    
    const term = searchTerm.toLowerCase();
    return currencies.filter(currency =>
      currency.code.toLowerCase().includes(term) ||
      currency.name.toLowerCase().includes(term)
    );
  }, [currencies]);

  // Memoized event handlers to prevent recreation on every render
  const handleSwap = useCallback(() => {
    if (disabled) return;
    
    const tempSource = selectedSource;
    onSourceChange(selectedTarget);
    onTargetChange(tempSource);
  }, [disabled, selectedSource, selectedTarget, onSourceChange, onTargetChange]);

  const handleSourceSelect = useCallback((currency: string) => {
    onSourceChange(currency);
    setSourceDropdownOpen(false);
    setSourceSearchTerm('');
  }, [onSourceChange]);

  const handleTargetSelect = useCallback((currency: string) => {
    onTargetChange(currency);
    setTargetDropdownOpen(false);
    setTargetSearchTerm('');
  }, [onTargetChange]);

  // Memoized currency info to prevent recalculation
  const sourceCurrency = useMemo(() => getCurrencyInfo(selectedSource), [getCurrencyInfo, selectedSource]);
  const targetCurrency = useMemo(() => getCurrencyInfo(selectedTarget), [getCurrencyInfo, selectedTarget]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Source Currency Selector */}
        <div className="flex-1 relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <button
            onClick={() => !disabled && setSourceDropdownOpen(!sourceDropdownOpen)}
            disabled={disabled}
            className={`w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[56px] touch-manipulation ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{sourceCurrency.flag}</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">{sourceCurrency.code}</div>
                <div className="text-sm text-gray-500">{sourceCurrency.name}</div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
              sourceDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          <CurrencyDropdown
            isOpen={sourceDropdownOpen}
            selectedCurrency={selectedSource}
            onSelect={handleSourceSelect}
            onClose={() => setSourceDropdownOpen(false)}
            searchTerm={sourceSearchTerm}
            onSearchChange={setSourceSearchTerm}
            filteredCurrencies={getFilteredCurrencies(sourceSearchTerm)}
            disabled={disabled}
          />
        </div>

        {/* Swap Button */}
        <div className="flex flex-row sm:flex-col items-center justify-center sm:justify-end sm:pb-2 order-2 sm:order-none">
          <button
            onClick={handleSwap}
            disabled={disabled}
            className={`p-3 sm:p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors min-h-[48px] min-w-[48px] touch-manipulation ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
            }`}
            title="Swap currencies"
          >
            <ArrowUpDown className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600" />
          </button>
        </div>

        {/* Target Currency Selector */}
        <div className="flex-1 relative order-3 sm:order-none">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <button
            onClick={() => !disabled && setTargetDropdownOpen(!targetDropdownOpen)}
            disabled={disabled}
            className={`w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[56px] touch-manipulation ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{targetCurrency.flag}</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">{targetCurrency.code}</div>
                <div className="text-sm text-gray-500">{targetCurrency.name}</div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
              targetDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          <CurrencyDropdown
            isOpen={targetDropdownOpen}
            selectedCurrency={selectedTarget}
            onSelect={handleTargetSelect}
            onClose={() => setTargetDropdownOpen(false)}
            searchTerm={targetSearchTerm}
            onSearchChange={setTargetSearchTerm}
            filteredCurrencies={getFilteredCurrencies(targetSearchTerm)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
});

CurrencySelector.displayName = 'CurrencySelector';

export default CurrencySelector;