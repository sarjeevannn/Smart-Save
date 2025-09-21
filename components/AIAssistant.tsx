import React, { useState, useCallback } from 'react';
import { getFinancialInsights } from '../services/geminiService';
import type { Transaction, SavingsGoal } from '../types';

interface AIAssistantProps {
  transactions: Transaction[];
  savingsGoal: SavingsGoal | null;
}

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7.5a6 6 0 0 0-12 0c0 1.5.3 2.7 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
    </svg>
);


const AIAssistant: React.FC<AIAssistantProps> = ({ transactions, savingsGoal }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGetInsights = useCallback(async () => {
    setIsLoading(true);
    setInsights('');
    const result = await getFinancialInsights(transactions, savingsGoal);
    setInsights(result);
    setIsLoading(false);
  }, [transactions, savingsGoal]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-300">AI Financial Assistant</h2>
        <button
          onClick={handleGetInsights}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
        >
          <LightbulbIcon className="w-5 h-5" />
          {isLoading ? 'Analyzing...' : 'Get Insights'}
        </button>
      </div>
      {isLoading && <p className="text-center text-gray-400">Your personal AI assistant is analyzing your spending...</p>}
      {insights && (
        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
          <pre className="whitespace-pre-wrap font-sans text-gray-300">{insights}</pre>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;