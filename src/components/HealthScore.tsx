'use client'

import { motion } from 'framer-motion'

interface Props {
  total: number
  incomeStability: number
  expenseControl: number
  creditRecovery: number
  cashFlow: number
  label: string
  color: string
}

const colorMap: Record<string, string> = {
  green: '#16a34a',
  blue: '#2563eb',
  yellow: '#d97706',
  red: '#dc2626',
}

const bgMap: Record<string, string> = {
  green: 'bg-green-900/20 border-green-900/30 text-green-400',
  blue: 'bg-blue-900/20 border-blue-900/30 text-blue-400',
  yellow: 'bg-yellow-900/20 border-yellow-900/30 text-yellow-400',
  red: 'bg-red-900/20 border-red-900/30 text-red-400',
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{value}/25</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / 25) * 100}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full bg-indigo-500 rounded-full"
        />
      </div>
    </div>
  )
}

export default function HealthScore({ total, incomeStability, expenseControl, creditRecovery, cashFlow, label, color }: Props) {
  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (total / 100) * circumference

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
            <motion.circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={colorMap[color] || '#6366f1'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>
        <div>
          <div className={`inline-flex px-3 py-1 rounded-full border text-sm font-semibold ${bgMap[color]}`}>
            {label === 'Excellent' ? '🟢' : label === 'Good' ? '🔵' : label === 'Fair' ? '🟡' : '🔴'} {label}
          </div>
          <p className="text-xs text-gray-500 mt-1">Financial Health Score</p>
        </div>
      </div>
      <div className="space-y-2">
        <ScoreBar label="Income Stability" value={incomeStability} />
        <ScoreBar label="Expense Control" value={expenseControl} />
        <ScoreBar label="Credit Recovery" value={creditRecovery} />
        <ScoreBar label="Cash Flow" value={cashFlow} />
      </div>
    </div>
  )
}
