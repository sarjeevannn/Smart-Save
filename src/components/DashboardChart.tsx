'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatINR } from '@/lib/constants'

const PERIODS = ['Monthly', 'Daily'] as const

interface Props {
  data: { name: string; income: number; expense: number }[]
}

export default function CashFlowChart({ data }: Props) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
        <div className="text-4xl mb-2">📈</div>
        <p>No data yet — add transactions to see your cash flow!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {(['bar', 'line'] as const).map(t => (
          <button
            key={t}
            onClick={() => setChartType(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${chartType === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'}`}
          >
            {t === 'bar' ? '📊 Bar' : '📈 Line'}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={chartType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626' }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
