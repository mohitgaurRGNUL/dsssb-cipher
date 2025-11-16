
import React, { useState } from 'react';
import type { Question } from '../types';

interface BatchImportProps {
  onImport: (questions: Question[]) => void;
}

const BatchImport: React.FC<BatchImportProps> = ({ onImport }) => {
  const [batchData, setBatchData] = useState('');

  const handleImport = () => {
    if (!batchData.trim()) {
      alert('Please paste data from the converter tool into the text area.');
      return;
    }

    try {
      const batch = JSON.parse(batchData);
      if (!Array.isArray(batch)) {
        throw new Error('Pasted data is not a JSON array.');
      }
      onImport(batch);
      setBatchData('');
    } catch (error) {
      alert('Failed to parse batch data. Please ensure it is a valid JSON array copied from the converter tool.');
      console.error(error);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl mb-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Batch Import Questions</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="batchData" className="block text-sm font-medium text-gray-700 mb-1">Paste converter tool Output Here (from converter.html)</label>
          <textarea
            id="batchData"
            value={batchData}
            onChange={(e) => setBatchData(e.target.value)}
            rows={10}
            placeholder="Paste the JSON array from the converter tool here..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-sans"
          />
        </div>
        <button
          onClick={handleImport}
          className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform duration-200 hover:-translate-y-0.5"
        >
          Import Batch
        </button>
      </div>
    </div>
  );
};

export default BatchImport;
