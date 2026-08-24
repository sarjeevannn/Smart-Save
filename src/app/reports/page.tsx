import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDashboardMetrics, getTransactions } from '@/lib/actions'
import { formatINR, getCategoryLabel } from '@/lib/constants'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const [metrics, allTx] = await Promise.all([
    getDashboardMetrics(userId),
    getTransactions(userId),
  ])

  const now = new Date()
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const uncategorized = allTx.filter(t => !t.category || t.category === 'other_income' || t.category === 'other_expense').length

  // Category breakdown for expenses
  const expenseByCategory: Record<string, number> = {}
  allTx.filter(t => t.type === 'EXPENSE' || t.type === 'PURCHASE').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
  })

  const incomeByCategory: Record<string, number> = {}
  allTx.filter(t => t.type === 'INCOME').forEach(t => {
    incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Tax & Financial Summary</h1>
        <p className="text-slate-400 text-sm">Financial Year: {fy}–{String(fy + 1).slice(2)}</p>
      </div>

      {uncategorized > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-yellow-400">
            You have <strong>{uncategorized} uncategorized transaction{uncategorized > 1 ? 's' : ''}</strong>. Categorize them before generating your financial summary.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Recorded Income', value: metrics.totalIncome, color: 'text-green-500' },
          { label: 'Business Expenses', value: metrics.totalExpenses, color: 'text-red-500' },
          { label: 'Estimated Net Earnings', value: metrics.profit, color: metrics.profit >= 0 ? 'text-indigo-400' : 'text-red-500' },
        ].map(item => (
          <div key={item.label} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-5">
            <p className="text-sm text-slate-400 mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{formatINR(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income breakdown */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">📥 Income by Category</h2>
          {Object.keys(incomeByCategory).length === 0
            ? <p className="text-slate-400 text-sm">No income data</p>
            : Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <span className="text-sm text-slate-300">{getCategoryLabel(cat)}</span>
                <span className="text-sm font-semibold text-green-400">{formatINR(amt)}</span>
              </div>
            ))
          }
        </div>

        {/* Expense breakdown */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">📤 Expenses by Category</h2>
          {Object.keys(expenseByCategory).length === 0
            ? <p className="text-slate-400 text-sm">No expense data</p>
            : Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <span className="text-sm text-slate-300">{getCategoryLabel(cat)}</span>
                <span className="text-sm font-semibold text-red-400">{formatINR(amt)}</span>
              </div>
            ))
          }
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">📋 All Transactions ({allTx.length})</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-800">
          <thead>
            <tr>
              {['Date', 'Type', 'Category', 'Amount'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-400 uppercase pb-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {allTx.slice(0, 20).map(tx => (
              <tr key={tx.id}>
                <td className="py-2 text-sm text-slate-400">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${tx.type === 'INCOME' ? 'bg-green-900/30 text-green-400 border border-green-800' : tx.type === 'CREDIT' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                    {tx.type}
                  </span>
                </td>
                <td className="py-2 text-sm text-slate-300">{getCategoryLabel(tx.category)}</td>
                <td className={`py-2 text-sm font-semibold ${tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatINR(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {allTx.length > 20 && <p className="text-sm text-slate-500 mt-3 text-center">Showing 20 of {allTx.length} transactions</p>}
      </div>
    </div>
  )
}
