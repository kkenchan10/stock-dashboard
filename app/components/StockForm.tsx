'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import TickerSearch from './TickerSearch';

interface StockFormProps {
  onSymbolsChange: (symbols: string[]) => void;
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  symbols: string[];
}

interface TickerItem {
  ticker: string;
  name: string;
}

export default function StockForm({ onSymbolsChange, startDate, endDate, onDateChange, symbols }: StockFormProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState<TickerItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('^');

  useEffect(() => {
    const fetchTickerDetails = async () => {
      const response = await fetch('/ticker_list.json');
      const allTickers: TickerItem[] = await response.json();
      const initialSelectedTickers = symbols.map((symbol) => ({
        ...allTickers.find(item => item.ticker === symbol) || { ticker: symbol, name: 'Unknown' },
      }));
      setSelectedTickers(initialSelectedTickers);
    };
    fetchTickerDetails();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [symbols]);

  const handleAddSymbol = useCallback(() => {
    setIsPopupOpen(true);
    setSearchText('^');
  }, []);

  const handleRemoveSymbol = (index: number) => {
    const newSelectedTickers = selectedTickers.filter((_, i) => i !== index);
    setSelectedTickers(newSelectedTickers);
    onSymbolsChange(newSelectedTickers.map(item => item.ticker));
  };

  const handleTickerSelect = useCallback((ticker: string, name: string) => {
    const newTicker = { ticker, name };
    setSelectedTickers(prev => [...prev, newTicker]);
    onSymbolsChange([...symbols, ticker]);
    setIsPopupOpen(false);
  }, [symbols, onSymbolsChange]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(startDate, e.target.value);
  };

  const closePopup = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      setIsPopupOpen(false);
    }
  }, []);

  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const buttonBgColor = isDarkMode ? 'bg-blue-600' : 'bg-blue-500';
  const buttonHoverBgColor = isDarkMode ? 'hover:bg-blue-700' : 'hover:bg-blue-600';

  return (
    <div className={`space-y-4 ${bgColor} ${textColor} p-4 rounded-lg`}>
      <div className="flex flex-wrap gap-2">
        {selectedTickers.map((item, index) => (
          <div key={index} className={`flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-2 rounded`}>
            <span className="mr-2">{item.ticker} - {item.name}</span>
            <button 
              onClick={() => handleRemoveSymbol(index)}
              className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
              aria-label={`Remove ${item.ticker}`}
            >
              ×
            </button>
          </div>
        ))}
        <button 
          onClick={handleAddSymbol}
          className={`${buttonBgColor} ${buttonHoverBgColor} text-white p-2 rounded`}
        >
          Add Symbol
        </button>
      </div>
      <div className="flex space-x-2">
        <input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          className={`border ${borderColor} p-2 rounded ${bgColor} ${textColor}`}
        />
        <input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          className={`border ${borderColor} p-2 rounded ${bgColor} ${textColor}`}
        />
      </div>
      {isPopupOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closePopup}
        >
          <div ref={popupRef} className={`${bgColor} p-6 rounded-lg w-[80vw] max-w-4xl h-[80vh] flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${textColor}`}>Add Stock Symbol</h2>
            </div>
            <div className="flex-grow overflow-hidden">
              <TickerSearch 
                onSelect={handleTickerSelect} 
                isDarkMode={isDarkMode} 
                searchText={searchText}
                setSearchText={setSearchText}
              />
            </div>
            <button 
              onClick={() => setIsPopupOpen(false)}
              className={`mt-4 ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white p-2 rounded w-full`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}