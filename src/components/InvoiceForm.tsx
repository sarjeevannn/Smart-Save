'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createInvoice } from '@/lib/actions'
import { Plus, Trash2, FileText, ArrowRight } from 'lucide-react'

export default function InvoiceForm({ userId, profile, customers }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${new Date().getTime().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    customerName: '', // Fallback if new customer
    notes: 'Thank you for your business!',
    terms: 'Please pay within 15 days.',
  })
  
  const [items, setItems] = useState([
    { description: '', quantity: 1, rate: 0, taxPercent: 0, total: 0 }
  ])

  const calculateTotal = () => {
    let subtotal = 0
    let taxTotal = 0
    items.forEach(item => {
      const lineTotal = item.quantity * item.rate
      subtotal += lineTotal
      taxTotal += lineTotal * (item.taxPercent / 100)
    })
    return { subtotal, taxTotal, total: subtotal + taxTotal }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'rate' || field === 'taxPercent') {
      newItems[index].total = newItems[index].quantity * newItems[index].rate * (1 + newItems[index].taxPercent / 100)
    }
    setItems(newItems)
  }

  const addItem = () => setItems([...items, { description: '', quantity: 1, rate: 0, taxPercent: 0, total: 0 }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const totals = calculateTotal()
    
    try {
      const invoiceId = await createInvoice(userId, {
        ...invoiceData,
        ...totals,
        items
      })
      router.push(`/invoice/${invoiceId}`)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const totals = calculateTotal()

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Invoice Number</label>
          <input 
            required 
            value={invoiceData.invoiceNumber} 
            onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl outline-none focus:border-indigo-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Customer</label>
          <select 
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl outline-none focus:border-indigo-500"
            onChange={e => setInvoiceData({...invoiceData, customerId: e.target.value})}
            value={invoiceData.customerId}
          >
            <option value="">-- Select Customer --</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
          <input 
            type="date" required 
            value={invoiceData.date} 
            onChange={e => setInvoiceData({...invoiceData, date: e.target.value})}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl outline-none [color-scheme:dark]" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Due Date</label>
          <input 
            type="date" 
            value={invoiceData.dueDate} 
            onChange={e => setInvoiceData({...invoiceData, dueDate: e.target.value})}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl outline-none [color-scheme:dark]" 
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2"><FileText size={18}/> Line Items</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <input required value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none focus:border-indigo-500" placeholder="Item name" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-400 mb-1">Qty</label>
                <input type="number" step="0.01" required value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none focus:border-indigo-500" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-slate-400 mb-1">Rate (₹)</label>
                <input type="number" step="0.01" required value={item.rate} onChange={e => updateItem(index, 'rate', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none focus:border-indigo-500" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-400 mb-1">Tax (%)</label>
                <input type="number" step="0.01" value={item.taxPercent} onChange={e => updateItem(index, 'taxPercent', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none focus:border-indigo-500" />
              </div>
              <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} className="p-2 mb-1 text-slate-400 hover:text-red-400 disabled:opacity-30 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-3 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 font-medium">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-8 mb-8 border-t border-slate-800 pt-6">
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
            <textarea value={invoiceData.notes} onChange={e => setInvoiceData({...invoiceData, notes: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl outline-none focus:border-indigo-500 h-20" />
          </div>
        </div>
        
        <div className="w-full md:w-64 space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-400">
            <span>Tax</span>
            <span>₹{totals.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-slate-100 border-t border-slate-800 pt-2 mt-2">
            <span>Total</span>
            <span>₹{totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg shadow-indigo-900/20 disabled:opacity-70"
        >
          {loading ? 'Generating...' : 'Generate Invoice'} <ArrowRight size={18} />
        </button>
      </div>
    </form>
  )
}
