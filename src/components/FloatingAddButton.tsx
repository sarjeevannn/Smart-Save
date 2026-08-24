'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import TransactionBottomSheet from './TransactionBottomSheet'

const QUICK_ACTIONS = [
  { type: 'INCOME', label: 'Income', emoji: '💰' },
  { type: 'EXPENSE', label: 'Expense', emoji: '💸' },
  { type: 'CREDIT', label: 'Credit', emoji: '🤝' },
  { type: 'PURCHASE', label: 'Purchase', emoji: '📦' },
]

export default function FloatingAddButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const handleSelect = (type: string) => {
    setSelectedType(type)
    setOpen(false)
  }

  return (
    <>
      {/* Quick action menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.type}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelect(action.type)}
              className="flex items-center gap-3 bg-white text-gray-700 shadow-lg rounded-full pl-4 pr-5 py-2.5 font-medium text-sm hover:shadow-xl transition-shadow"
            >
              <span className="text-xl">{action.emoji}</span>
              {action.label}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 flex items-center justify-center transition-colors"
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={24} />
          </motion.div>
        </motion.button>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {selectedType && (
          <TransactionBottomSheet
            type={selectedType}
            userId={userId}
            onClose={() => setSelectedType(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
