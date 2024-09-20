'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface TickerSearchProps {
  onSelect: (ticker: string, name: string) => void;
  isDarkMode: boolean;
  searchText: string;
  setSearchText: (text: string) => void;
}

interface TickerItem {
  ticker: string;
  name: string;
}

export default function TickerSearch({ onSelect, isDarkMode, searchText, setSearchText }: TickerSearchProps) {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [filteredTickers, setFilteredTickers] = useState<TickerItem[]>([]);

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const response = await fetch('/ticker_list.json');
        const data = await response.json();
        setTickers(data);
      } catch (error) {
        console.error('Error fetching tickers:', error);
      }
    };
    fetchTickers();
  }, []);

  useEffect(() => {
    const filtered = tickers.filter(
      ticker => 
        ticker.ticker.toLowerCase().includes(searchText.toLowerCase()) ||
        ticker.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredTickers(filtered.slice(0, 100)); // Limit to 100 results for performance
  }, [searchText, tickers]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }, [setSearchText]);

  const handleTickerClick = useCallback((ticker: string, name: string) => {
    onSelect(ticker, name);
  }, [onSelect]);

  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-800';
  const hoverBgColor = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <div className={`${bgColor} ${textColor}`}>
      <input
        type="text"
        value={searchText}
        onChange={handleSearchChange}
        placeholder="Search for a ticker or company name"
        className={`w-full p-2 mb-4 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} rounded`}
      />
      <div className="h-[calc(100%-60px)] overflow-y-auto">
        {filteredTickers.map((ticker, index) => (
          <div
            key={index}
            className={`p-2 cursor-pointer ${hoverBgColor}`}
            onClick={() => handleTickerClick(ticker.ticker, ticker.name)}
          >
            <span className="font-bold">{ticker.ticker}</span> - {ticker.name}
          </div>
        ))}
      </div>
    </div>
  );
}