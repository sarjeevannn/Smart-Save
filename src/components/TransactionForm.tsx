'use client'

import { useRef } from 'react'
import { addTransaction } from '@/lib/actions'

interface Props {
  type: 'INCOME' | 'EXPENSE'
}

export default function TransactionForm({ type }: Props) {
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    await addTransaction(formData)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
      <input type="hidden" name="type" value={type} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input 
            type="number" 
            name="amount" 
            step="0.01" 
            required 
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0.00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input 
            type="date" 
            name="date" 
            required 
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input 
            type="text" 
            name="category" 
            required 
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder={type === 'INCOME' ? 'e.g. Product Sale' : 'e.g. Office Supplies'}
          />
        </div>

        {type === 'INCOME' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
            <input 
              type="text" 
              name="customerName" 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. John Doe"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <textarea 
          name="description" 
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Additional details..."
          rows={2}
        />
      </div>

      <button 
        type="submit" 
        className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${
          type === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        Add {type === 'INCOME' ? 'Sale / Income' : 'Expense'}
      </button>
    </form>
  )
}
