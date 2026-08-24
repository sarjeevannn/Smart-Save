'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { markCreditPaid, undoCreditPaid } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { Undo2, Check } from 'lucide-react'

export default function MarkPaidButton({ transactionId, isPaid }: { transactionId: string, isPaid?: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    if (isPaid) {
      await undoCreditPaid(transactionId)
    } else {
      await markCreditPaid(transactionId)
    }
    setLoading(false)
    router.refresh()
  }

  if (isPaid) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg transition disabled:opacity-60 border border-slate-700 w-[72px] justify-center"
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
        ) : (
          <><Undo2 size={14} /> Undo</>
        )}
      </button>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-950 bg-green-500 hover:bg-green-400 rounded-lg transition disabled:opacity-60 shadow-lg shadow-green-900/20 w-[96px] justify-center"
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-green-950/30 border-t-green-950 rounded-full animate-spin" />
      ) : (
        <><Check size={14} /> Mark Paid</>
      )}
    </motion.button>
  )
}
