'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { addTransaction } from '@/lib/actions'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PURCHASE_CATEGORIES } from '@/lib/constants'
import { useRouter } from 'next/navigation'

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  INCOME:   { label: 'Add Income',   emoji: '💰', color: 'bg-green-600' },
  EXPENSE:  { label: 'Add Expense',  emoji: '💸', color: 'bg-red-600' },
  CREDIT:   { label: 'Add Credit',   emoji: '🤝', color: 'bg-yellow-600' },
  PURCHASE: { label: 'Add Purchase', emoji: '📦', color: 'bg-orange-600' },
}

const PAYMENT_MODES = [
  { id: 'cash', label: 'Cash', emoji: '💵' },
  { id: 'upi',  label: 'UPI',  emoji: '📱' },
  { id: 'bank', label: 'Bank', emoji: '🏦' },
]

interface Props { type: string; userId: string; onClose: () => void }

export default function TransactionBottomSheet({ type, userId, onClose }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [paymentMode, setPaymentMode] = useState('cash')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const categories =
    type === 'INCOME' ? INCOME_CATEGORIES :
    type === 'PURCHASE' ? PURCHASE_CATEGORIES :
    EXPENSE_CATEGORIES

  const cfg = TYPE_LABELS[type]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formRef.current) return
    setLoading(true)
    const fd = new FormData(formRef.current)
    fd.set('userId', userId)
    fd.set('type', type)
    fd.set('paymentMode', paymentMode)
    fd.set('category', selectedCategory || categories[0].id)
    await addTransaction(fd)
    setLoading(false)
    setSuccess(true)
    router.refresh()
    setTimeout(onClose, 1500)
  }

  const [aiProcessing, setAiProcessing] = useState(false)
  const [amountVal, setAmountVal] = useState('')
  const [descVal, setDescVal] = useState('')

  const handleScanReceipt = () => {
    setAiProcessing(true)
    // Simulate OCR delay
    setTimeout(() => {
      setAmountVal('4500')
      setSelectedCategory('purchases')
      setDescVal('Wholesale Market (Scanned)')
      setAiProcessing(false)
    }, 2000)
  }

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported in this browser.")
      return
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    
    setAiProcessing(true)
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase()
      // very basic NLP simulation
      const numberMatch = text.match(/\d+/)
      if (numberMatch) setAmountVal(numberMatch[0])
      
      if (text.includes('electricity') || text.includes('bill')) setSelectedCategory('utilities')
      else if (text.includes('rent')) setSelectedCategory('rent')
      else if (text.includes('salary') || text.includes('wage')) setSelectedCategory('salary')
      
      setDescVal(event.results[0][0].transcript)
      setAiProcessing(false)
    }
    recognition.onerror = () => setAiProcessing(false)
    recognition.onend = () => setAiProcessing(false)
    recognition.start()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-slate-900 border-t border-slate-700 shadow-2xl p-6 max-h-[90vh] overflow-y-auto rounded-t-3xl"
      >
        {success ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center py-12"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5 }}
              className="text-6xl mb-4"
            >
              ✅
            </motion.div>
            <p className="text-xl font-bold text-gray-800">Transaction Saved!</p>
            <p className="text-gray-500 text-sm mt-1">Your ledger has been updated.</p>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {cfg.emoji} {cfg.label}
              </h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleVoice} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  🎙️
                </button>
                <button type="button" onClick={handleScanReceipt} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  📷
                </button>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-300 ml-2">
                  <X size={22} />
                </button>
              </div>
            </div>

            {aiProcessing && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3 bg-indigo-900/40 border border-indigo-500/30 rounded-xl flex items-center gap-3 text-indigo-300 text-sm font-medium">
                <div className="animate-spin text-xl">🤖</div>
                Processing with AI...
              </motion.div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Amount (₹)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  value={amountVal}
                  onChange={e => setAmountVal(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 text-2xl font-bold bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode */}
              {type !== 'CREDIT' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Payment Mode</label>
                  <div className="flex gap-2">
                    {PAYMENT_MODES.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMode(m.id)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          paymentMode === m.id
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                            : 'border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
                  />
                </div>
                {(type === 'INCOME' || type === 'CREDIT') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Customer</label>
                    <input
                      name="customerName"
                      type="text"
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {type === 'CREDIT' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    name="dueDate"
                    type="date"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <input
                  name="description"
                  type="text"
                  value={descVal}
                  onChange={e => setDescVal(e.target.value)}
                  placeholder="Optional note…"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white rounded-xl font-semibold transition ${cfg.color} hover:opacity-90 disabled:opacity-60`}
              >
                {loading ? 'Saving…' : `${cfg.emoji} ${cfg.label}`}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
