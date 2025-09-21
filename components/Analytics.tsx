import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Slot, Transaction } from '../types';

interface AnalyticsProps {
  slots: Slot[];
  monthlyIncome: number;
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics: React.FC<AnalyticsProps> = ({ slots, monthlyIncome, transactions, formatCurrency }) => {
  const allocationData = slots.map(slot => ({
    name: slot.category,
    value: slot.allocated,
  }));

  const spendingData = slots.map(slot => ({
    name: slot.category,
    Allocated: slot.allocated,
    Spent: slot.spent,
  }));
  
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-cyan-300">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Total Income</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(monthlyIncome)}</p>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Net Balance</p>
            <p className="text-2xl font-bold text-cyan-400">{formatCurrency(monthlyIncome - totalSpent)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">Budget Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number; }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">Allocated vs. Spent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendingData}>
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                labelStyle={{ color: '#d1d5db' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="Allocated" fill="#8884d8" />
              <Bar dataKey="Spent" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;