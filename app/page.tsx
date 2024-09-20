'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import StockForm from './components/StockForm';

interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const DynamicStockChart = dynamic(() => import('./components/StockChart'), {
  ssr: false,
  loading: () => <div>Loading chart...</div>
});

export default function Home() {
  const [stockData, setStockData] = useState<StockDataPoint[][]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [symbols, setSymbols] = useState<string[]>(['USDJPY=X']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    setStartDate(oneYearAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchData = useCallback(async () => {
    if (symbols.length === 0 || !startDate || !endDate) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stockData?symbols=${symbols.join(',')}&startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      const data = await response.json();
      setStockData(data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [symbols, startDate, endDate]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (startDate && endDate && symbols.length > 0) {
        fetchData();
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [fetchData, startDate, endDate, symbols]);

  const handleSymbolsChange = useCallback((newSymbols: string[]) => {
    setSymbols(newSymbols);
  }, []);

  const handleDateChange = useCallback((newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  const memoizedStockChart = useMemo(() => (
    <DynamicStockChart 
      data={stockData} 
      symbols={symbols} 
      startDate={startDate}
      endDate={endDate}
      showTooltip={showTooltip}
    />
  ), [stockData, symbols, startDate, endDate, showTooltip]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Stock and Exchange Rate Dashboard</h1>
      <StockForm 
        onSymbolsChange={handleSymbolsChange}
        startDate={startDate} 
        endDate={endDate} 
        onDateChange={handleDateChange}
        symbols={symbols}
      />
      <div className="flex items-center space-x-2 mb-4">
        <input 
          type="checkbox" 
          id="show-tooltip" 
          checked={showTooltip} 
          onChange={(e) => setShowTooltip(e.target.checked)}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
        <label htmlFor="show-tooltip" className="text-sm font-medium text-gray-700">
          Show Tooltip
        </label>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {stockData.length > 0 && symbols.length > 0 && memoizedStockChart}
      {!isLoading && (stockData.length === 0 || symbols.length === 0) && (
        <p>No data available. Please select a stock symbol and date range.</p>
      )}
    </div>
  );
}