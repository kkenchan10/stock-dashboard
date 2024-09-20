import axios from 'axios';

export interface ExchangeRatePoint {
  date: string;
  rate: number;
}

export async function fetchExchangeRates(startDate: string, endDate: string): Promise<ExchangeRatePoint[]> {
  try {
    const url = `/api/proxy?url=${encodeURIComponent(`https://api.exchangerate.host/timeseries?start_date=${startDate}&end_date=${endDate}&base=USD&symbols=JPY`)}`;
    const response = await axios.get(url);
    const data = response.data;

    return Object.entries(data.rates).map(([date, rates]: [string, any]) => ({
      date,
      rate: rates.JPY
    }));
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return [];
  }
}