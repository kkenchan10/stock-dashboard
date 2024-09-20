import { NextRequest, NextResponse } from 'next/server';
import { fetchStockData } from '@/utils/yahooFinance';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get('symbols');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!symbols || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const symbolsArray = symbols.split(',');
    const data = await fetchStockData(symbolsArray, startDate, endDate);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}