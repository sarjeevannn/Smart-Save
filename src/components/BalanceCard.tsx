'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatINR } from '@/lib/constants'

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}

interface Props {
  balance: number
  growthPct: number
}

export default function BalanceCard({ balance, growthPct }: Props) {
  const animatedBalance = useCountUp(balance)
  const positive = growthPct >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-indigo-200 text-sm font-medium">Current Balance</p>
          <p className="text-4xl font-bold mt-1 tracking-tight">{formatINR(animatedBalance)}</p>
        </div>
        <div className="text-3xl">💰</div>
      </div>
      <div className={`flex items-center gap-1.5 text-sm ${positive ? 'text-green-300' : 'text-red-300'}`}>
        {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{positive ? '+' : ''}{growthPct.toFixed(1)}% compared to last month</span>
      </div>
    </motion.div>
  )
}
