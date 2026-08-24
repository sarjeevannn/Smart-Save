'use client'

import { motion } from 'framer-motion'
import { formatINR, getCategoryIcon, getCategoryLabel } from '@/lib/constants'

interface Transaction {
  id: string
  type: string
  amount: number
  category: string
  date: Date
  customer?: { name: string } | null
  description?: string | null
}

const typeConfig = {
  INCOME: { color: 'text-green-500', bg: 'bg-green-900/20 border border-green-900/30', sign: '+', emoji: '🟢' },
  EXPENSE: { color: 'text-red-500', bg: 'bg-red-900/20 border border-red-900/30', sign: '-', emoji: '🔴' },
  PURCHASE: { color: 'text-orange-500', bg: 'bg-orange-900/20 border border-orange-900/30', sign: '-', emoji: '📦' },
  CREDIT: { color: 'text-yellow-500', bg: 'bg-yellow-900/20 border border-yellow-900/30', sign: '', emoji: '🟡' },
}

export default function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-sm">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx, i) => {
        const cfg = typeConfig[tx.type as keyof typeof typeConfig] ?? typeConfig.EXPENSE
        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center justify-between p-3 rounded-xl ${cfg.bg}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center text-lg shadow-inner">
                {getCategoryIcon(tx.category)}
              </div>
              <div>
                <p className="font-medium text-sm text-slate-200">
                  {getCategoryLabel(tx.category)}
                  {tx.customer && <span className="text-slate-400 font-normal"> · {tx.customer.name}</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500">
                    {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  {tx.type === 'CREDIT' && <span className="text-[10px] bg-yellow-900/40 text-yellow-500 px-1.5 py-0.5 rounded font-medium border border-yellow-900/50">pending</span>}
                </div>
              </div>
            </div>
            <div className={`font-bold text-sm ${cfg.color}`}>
              {cfg.sign}{formatINR(tx.amount)}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
