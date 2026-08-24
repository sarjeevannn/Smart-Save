'use client'

import { motion } from 'framer-motion'

interface Insight {
  type: 'positive' | 'warning' | 'info' | 'danger'
  message: string
}

const styles = {
  positive: 'bg-green-900/20 border-green-900/30 text-green-400',
  warning: 'bg-yellow-900/20 border-yellow-900/30 text-yellow-400',
  info: 'bg-blue-900/20 border-blue-900/30 text-blue-400',
  danger: 'bg-red-900/20 border-red-900/30 text-red-400',
}

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="space-y-2">
      {insights.map((ins, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`border rounded-xl px-4 py-3 text-sm ${styles[ins.type]}`}
        >
          {ins.message}
        </motion.div>
      ))}
    </div>
  )
}
