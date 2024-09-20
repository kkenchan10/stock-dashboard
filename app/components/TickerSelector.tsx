import React, { useState } from 'react';

interface TickerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ticker: string, convertToYen: boolean) => void;
}

export default function TickerSelector({ isOpen, onClose, onAdd }: TickerSelectorProps) {
  const [ticker, setTicker] = useState('');
  const [convertToYen, setConvertToYen] = useState(false);

  const handleAdd = () => {
    if (ticker) {
      onAdd(ticker, convertToYen);
      setTicker('');
      setConvertToYen(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4">銘柄を追加</h2>
        <div className="mb-4">
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-1">
            ティッカー
          </label>
          <input
            id="ticker"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={convertToYen}
              onChange={(e) => setConvertToYen(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">円に換算</span>
          </label>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            キャンセル
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}