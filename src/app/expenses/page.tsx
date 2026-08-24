import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTransactions } from '@/lib/actions'
import { formatINR, getCategoryIcon, getCategoryLabel } from '@/lib/constants'
import DeleteButton from '@/components/DeleteButton'
import FloatingAddButton from '@/components/FloatingAddButton'

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const expenses = await getTransactions(userId, 'EXPENSE')
  const purchases = await getTransactions(userId, 'PURCHASE')
  const transactions = [...expenses, ...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const total = transactions.reduce((a, b) => a + b.amount, 0)

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Expenses & Purchases</h1>
        <p className="text-slate-400 text-sm">Total: <span className="text-red-500 font-semibold">{formatINR(total)}</span></p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
              <tr>
                {['Date', 'Category', 'Type', 'Mode', 'Amount', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    <div className="text-3xl mb-2">📉</div>
                    No expenses recorded yet. Click + to add your first expense!
                  </td>
                </tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 text-sm text-slate-400">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-slate-200">{getCategoryIcon(tx.category)} {getCategoryLabel(tx.category)}</span>
                    {tx.description && <p className="text-xs text-slate-500 mt-0.5">{tx.description}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${tx.type === 'PURCHASE' ? 'bg-orange-900/30 text-orange-400 border border-orange-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                      {tx.type.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full capitalize">{tx.paymentMode}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-red-500">-{formatINR(tx.amount)}</td>
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
