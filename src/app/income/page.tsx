import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTransactions } from '@/lib/actions'
import { formatINR, getCategoryIcon, getCategoryLabel } from '@/lib/constants'
import DeleteButton from '@/components/DeleteButton'
import FloatingAddButton from '@/components/FloatingAddButton'

export default async function IncomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const transactions = await getTransactions(userId, 'INCOME')
  const total = transactions.reduce((a, b) => a + b.amount, 0)

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Income & Sales</h1>
          <p className="text-slate-400 text-sm">Total: <span className="text-green-500 font-semibold">{formatINR(total)}</span></p>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
            <tr>
              {['Date', 'Category', 'Customer', 'Mode', 'Amount', ''].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                  <div className="text-3xl mb-2">💰</div>
                  No income recorded yet. Click + to add your first sale!
                </td>
              </tr>
            ) : transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-4 text-sm text-slate-400">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-slate-200">{getCategoryIcon(tx.category)} {getCategoryLabel(tx.category)}</span>
                  {tx.description && <p className="text-xs text-slate-500 mt-0.5">{tx.description}</p>}
                </td>
                <td className="px-5 py-4 text-sm text-slate-400">{tx.customer?.name || '—'}</td>
                <td className="px-5 py-4">
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full capitalize">{tx.paymentMode}</span>
                </td>
                <td className="px-5 py-4 text-sm font-bold text-green-500">{formatINR(tx.amount)}</td>
                <td className="px-5 py-4 text-right">
                  <DeleteButton transactionId={tx.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      <FloatingAddButton userId={userId} />
    </div>
  )
}
