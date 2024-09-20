'use client'

import React, { useMemo, useEffect, useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions, 
  ChartData, 
  ScatterDataPoint 
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

interface StockDataPoint {
  date: string;
  close: number | null;
}

interface StockChartProps {
  data: StockDataPoint[][];
  symbols: string[];
  startDate: string;
  endDate: string;
  showTooltip: boolean;
}

type ChartPoint = ScatterDataPoint & { x: number; y: number | null; originalY: number | null };

export interface StockChartRef {
  updateChart: () => void;
}

const StockChart = forwardRef<StockChartRef, StockChartProps>(function StockChart(
  { data, symbols, startDate, endDate, showTooltip },
  ref
) {
  const [chartHeight, setChartHeight] = useState('500px');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const chartRef = useRef<ChartJS<"line", ChartPoint[], unknown> | null>(null);

  useImperativeHandle(ref, () => ({
    updateChart: () => {
      if (chartRef.current) {
        chartRef.current.update();
      }
    }
  }));

  const updateChartHeight = useCallback(() => {
    const windowHeight = window.innerHeight;
    setChartHeight(`${windowHeight * 0.7}px`);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    updateChartHeight();
    window.addEventListener('resize', updateChartHeight);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('resize', updateChartHeight);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [updateChartHeight]);

  const chartData: ChartData<'line', ChartPoint[]> = useMemo(() => {
    if (!data || data.length === 0 || !symbols || symbols.length === 0) {
      return { labels: [], datasets: [] };
    }

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    return {
      labels: [],
      datasets: data.map((stockData, index) => {
        const symbol = symbols[index];
        const isExchangeRate = symbol === 'USDJPY=X';
        const validData = stockData.filter(point => {
          const pointTimestamp = new Date(point.date).getTime();
          return point.close !== null && pointTimestamp >= startTimestamp && pointTimestamp <= endTimestamp;
        });
        const firstValidPoint = validData[0];
        const baseValue = isExchangeRate ? 1 : (firstValidPoint?.close ?? 0);

        return {
          label: symbol,
          data: validData.map(point => ({
            x: new Date(point.date).getTime(),
            y: point.close !== null ? (isExchangeRate ? point.close : ((point.close - baseValue) / baseValue) * 100) : null,
            originalY: point.close,
          })).filter((point): point is ChartPoint => point.y !== null),
          borderColor: isExchangeRate ? 'rgba(128, 128, 128, 0.8)' : `hsl(${index * 137.508}deg, 70%, 50%)`,
          backgroundColor: isExchangeRate ? 'rgba(128, 128, 128, 0.2)' : `hsla(${index * 137.508}deg, 70%, 50%, 0.5)`,
          borderDash: [],
          pointRadius: 0,
          borderWidth: isExchangeRate ? 0.5 : 1.0,
          fill: false,
          yAxisID: isExchangeRate ? 'y-exchange' : 'y-percent',
          tension: 0.3,
        };
      }),
    };
  }, [data, symbols, startDate, endDate]);

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#fff' : '#666',
        },
      },
      title: {
        display: true,
        text: 'Stock Price and Exchange Rate Comparison',
        color: isDarkMode ? '#fff' : '#666',
      },
      tooltip: {
        enabled: showTooltip,
        mode: 'index',
        intersect: false,
        caretPadding: 100, // ツールチップとポインタの間の距離を増やす
        caretSize: 0, // ツールチップの矢印を非表示にする
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const dataIndex = context.dataIndex;
            const point = (context.dataset.data[dataIndex] as ChartPoint);
            const actualValue = point.originalY;
            const baseValue = (context.dataset.data[0] as ChartPoint).originalY;
            
            if (label === 'USDJPY=X') {
              return `${label}: ¥${actualValue?.toFixed(2)}`;
            } else if (actualValue !== null && baseValue !== null) {
              const percentChange = ((actualValue - baseValue) / baseValue) * 100;
              const multiplier = actualValue / baseValue;
              return `${label}: ${percentChange.toFixed(2)}% (${multiplier.toFixed(2)}x) $${actualValue.toFixed(2)}`;
            }
            return label;
          }
        },
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: isDarkMode ? '#fff' : '#666',
        bodyColor: isDarkMode ? '#fff' : '#666',
        padding: 10, // ツールチップ内部のパディングを増やす
        displayColors: false, // カラーボックスを非表示にする
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
        limits: {
          x: {
            min: new Date(startDate).getTime(),
            max: new Date(endDate).getTime(),
            minRange: 86400000,
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'yyyy-MM-dd',
          displayFormats: {
            day: 'yyyy-MM-dd',
          },
        },
        adapters: {
          date: {
            locale: enUS,
          },
        },
        title: {
          display: true,
          text: 'Date',
          color: isDarkMode ? '#fff' : '#666',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: isDarkMode ? '#fff' : '#666',
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        min: new Date(startDate).getTime(),
        max: new Date(endDate).getTime(),
      },
      'y-percent': {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Percent Change',
          color: isDarkMode ? '#fff' : '#666',
        },
        ticks: {
          callback: function(value: string | number) {
            if (typeof value === 'number') {
              return value.toFixed(2) + '%';
            }
            return value;
          },
          color: isDarkMode ? '#fff' : '#666',
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          lineWidth: (context) => context.tick.value === 0 ? 2 : 1,
          zeroLineWidth: 2,
          zeroLineColor: isDarkMode ? '#FFFFFF' : '#000000',
        },
      },
      'y-exchange': {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'USD/JPY Exchange Rate',
          color: isDarkMode ? '#fff' : '#666',
        },
        ticks: {
          callback: function(value: string | number) {
            if (typeof value === 'number') {
              return '¥' + value.toFixed(2);
            }
            return value;
          },
          color: isDarkMode ? '#fff' : '#666',
        },
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }), [isDarkMode, startDate, endDate, showTooltip]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = chartData;
      chartRef.current.options = options;
      chartRef.current.update('none');
    }
  }, [chartData, options]);

  if (!data || data.length === 0 || !symbols || symbols.length === 0) {
    return <div>No data available to display</div>;
  }

  return (
    <div style={{ 
      width: '100%', 
      height: chartHeight, 
      backgroundColor: isDarkMode ? '#333' : '#fff',
      padding: '20px',
      borderRadius: '8px',
      position: 'relative',
    }}>
      <Chart
        ref={chartRef}
        type="line"
        data={chartData}
        options={options}
      />
    </div>
  );
});

export default StockChart;