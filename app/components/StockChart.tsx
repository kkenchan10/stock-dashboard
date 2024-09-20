'use client'

import React, { useMemo, useEffect, useState, useRef, forwardRef } from 'react';
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
import TickerSelector from './TickerSelector';
import { StockDataPoint } from '@/utils/yahooFinance';

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

interface StockChartProps {
  data: { [key: string]: StockDataPoint[] };
  isLoading: boolean;
  startDate: string;
  endDate: string;
  onAddTicker: (ticker: string, convertToYen: boolean) => void;
}

type ChartPoint = { 
  x: number; 
  y: number | null; 
  originalY: number | null;
};

const StockChart = forwardRef<HTMLDivElement, StockChartProps>(function StockChart(
  { data, isLoading, startDate, endDate, onAddTicker },
  ref
) {
  const [chartHeight, setChartHeight] = useState('500px');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTickerSelectorOpen, setIsTickerSelectorOpen] = useState(false);
  const chartRef = useRef<ChartJS<"line", (ScatterDataPoint | ChartPoint)[], unknown> | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    const updateChartHeight = () => {
      const windowHeight = window.innerHeight;
      setChartHeight(`${windowHeight * 0.7}px`);
    };

    updateChartHeight();
    window.addEventListener('resize', updateChartHeight);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('resize', updateChartHeight);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const chartData: ChartData<'line', (ScatterDataPoint | ChartPoint)[]> = useMemo(() => {
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    return {
      datasets: Object.entries(data).map(([symbol, stockData], index) => {
        const validData = stockData.filter(point => {
          const pointTimestamp = new Date(point.date).getTime();
          return pointTimestamp >= startTimestamp && pointTimestamp <= endTimestamp;
        });

        const baseValue = validData[0]?.close ?? null;

        return {
          label: symbol,
          data: validData.map((point): ChartPoint => {
            const currentValue = point.close;
            let percentChange = null;
            if (baseValue !== null && currentValue !== null) {
              percentChange = ((currentValue - baseValue) / baseValue) * 100;
            }
            return {
              x: new Date(point.date).getTime(),
              y: percentChange,
              originalY: currentValue,
            };
          }),
          borderColor: `hsl(${index * 137.508}deg, 70%, 50%)`,
          backgroundColor: `hsla(${index * 137.508}deg, 70%, 50%, 0.5)`,
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          spanGaps: true,
        };
      }),
    };
  }, [data, startDate, endDate]);

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
        text: '株価変化率チャート（開始日基準）',
        color: isDarkMode ? '#fff' : '#666',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const point = context.raw as ChartPoint;
            const percentChange = point.y;
            const originalValue = point.originalY;
            if (percentChange !== null && originalValue !== null) {
              return `${label}: ${percentChange.toFixed(2)}% ($${originalValue.toFixed(2)})`;
            }
            return `${label}: N/A`;
          }
        },
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: isDarkMode ? '#fff' : '#666',
        bodyColor: isDarkMode ? '#fff' : '#666',
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
          tooltipFormat: 'yyyy/MM/dd',
          displayFormats: {
            day: 'MM/dd',
          },
        },
        adapters: {
          date: {
            locale: enUS,
          },
        },
        title: {
          display: true,
          text: '日付',
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
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: '変化率 (%)',
          color: isDarkMode ? '#fff' : '#666',
        },
        ticks: {
          callback: function(value) {
            if (typeof value === 'number') {
              return value.toFixed(2) + '%';
            }
            return value;
          },
          color: isDarkMode ? '#fff' : '#666',
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }), [isDarkMode, startDate, endDate]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = chartData;
      chartRef.current.options = options;
      chartRef.current.update('none');
    }
  }, [chartData, options]);

  if (Object.keys(data).length === 0) {
    return <div>表示するデータがありません</div>;
  }

  return (
    <div className="w-full space-y-4" ref={ref}>
      <button 
        onClick={() => setIsTickerSelectorOpen(true)}
        className="px-5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        銘柄を追加
      </button>
      <div className={`w-full h-[${chartHeight}] ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-5 rounded-lg relative`}>
        <Chart
          ref={chartRef}
          type="line"
          data={chartData}
          options={options}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center text-white text-2xl">
            読み込み中...
          </div>
        )}
      </div>
      <TickerSelector
        isOpen={isTickerSelectorOpen}
        onClose={() => setIsTickerSelectorOpen(false)}
        onAdd={onAddTicker}
      />
    </div>
  );
});

export default React.memo(StockChart);