import axios from 'axios';

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';

export interface StockDataPoint {
  date: string;
  close: number | null;
}

export function findNextTradingDay(data: StockDataPoint[], startDate: string): string {
  if (!data || data.length === 0) return startDate;
  
  const sortedDates = data.map(point => point.date).sort();
  const startIndex = sortedDates.findIndex(date => date >= startDate);
  return startIndex !== -1 ? sortedDates[startIndex] : startDate;
}

async function fetchSingleStockData(symbol: string, startDate: number, endDate: number): Promise<StockDataPoint[]> {
  const url = `${BASE_URL}${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
  
  try {
    const response = await axios.get(url);
    const prices = response.data.chart.result[0].indicators.quote[0].close;
    const timestamps = response.data.chart.result[0].timestamp;

    return timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      close: prices[index] !== null ? Number(prices[index].toFixed(4)) : null
    }));
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return [];
  }
}

export async function fetchStockData(symbols: string[], startDate: string, endDate: string): Promise<StockDataPoint[][]> {
  const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
  
  // 開始日を30年前に設定
  const extendedStartDate = new Date();
  extendedStartDate.setFullYear(extendedStartDate.getFullYear() - 30);
  const startTimestamp = Math.floor(extendedStartDate.getTime() / 1000);

  try {
    const promises = symbols.map(symbol => fetchSingleStockData(symbol, startTimestamp, endTimestamp));
    const results = await Promise.all(promises);

    const allDates = new Set<string>();
    results.forEach(data => data.forEach(point => allDates.add(point.date)));
    const sortedDates = Array.from(allDates).sort();

    return results.map(data => {
      const dataMap = new Map(data.map(point => [point.date, point.close]));
      return sortedDates.map(date => ({
        date,
        close: dataMap.get(date) ?? null
      }));
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return [];
  }
}