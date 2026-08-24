'use client'

import { Trash2 } from 'lucide-react'
import { deleteTransaction } from '@/lib/actions'
import { useState } from 'react'

export default function DeleteButton({ transactionId }: { transactionId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this?')) {
      setLoading(true)
      await deleteTransaction(transactionId)
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading}
      title="Delete"
      className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  )
}
