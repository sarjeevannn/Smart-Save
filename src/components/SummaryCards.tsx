'use client'

import { motion } from 'framer-motion'
import { formatINR } from '@/lib/constants'

interface Props {
  totalIncome: number
  totalExpenses: number
  profit: number
  totalCredit: number
}

const cards = [
  { key: 'income', label: 'Total Income', emoji: '📥', color: 'from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-700', value: (p: Props) => p.totalIncome },
  { key: 'expense', label: 'Total Expenses', emoji: '📤', color: 'from-red-50 to-rose-50', border: 'border-red-200', text: 'text-red-700', value: (p: Props) => p.totalExpenses },
  { key: 'profit', label: 'Net Profit', emoji: '📊', color: 'from-blue-50 to-indigo-50', border: 'border-blue-200', text: 'text-blue-700', value: (p: Props) => p.profit },
  { key: 'credit', label: 'Outstanding Credit', emoji: '🤝', color: 'from-yellow-50 to-amber-50', border: 'border-yellow-200', text: 'text-yellow-700', value: (p: Props) => p.totalCredit },
]

export default function SummaryCards(props: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const val = card.value(props)
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.3, duration: 0.4 }}
            className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-4`}
          >
            <div className="text-2xl mb-2">{card.emoji}</div>
            <p className="text-xs text-gray-500 font-medium mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.text}`}>{formatINR(Math.abs(val))}</p>
            {card.key === 'profit' && val < 0 && (
              <p className="text-xs text-red-500 mt-1">Loss</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
