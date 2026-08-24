import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCustomers } from '@/lib/actions'
import { formatINR } from '@/lib/constants'
import FloatingAddButton from '@/components/FloatingAddButton'
import CreditRiskBadge from '@/components/CreditRiskBadge'
import MarkPaidButton from '@/components/MarkPaidButton'
import DeleteButton from '@/components/DeleteButton'

export default async function CreditPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const customers = await getCustomers(userId)
  const sorted = [...customers].sort((a, b) => b.outstanding - a.outstanding)

  const totalOutstanding = customers.reduce((a, b) => a + b.outstanding, 0)

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Credit Ledger</h1>
        <p className="text-slate-400 text-sm">
          Total outstanding: <span className="text-yellow-500 font-semibold">{formatINR(totalOutstanding)}</span> across {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-indigo-100/20 p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🤝</div>
          <p className="font-medium">No credit records yet</p>
          <p className="text-sm mt-1">Click + and select "Credit" to track what customers owe you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(customer => {
            const paidPct = customer.credited > 0 ? Math.min(100, Math.round((customer.paid / customer.credited) * 100)) : 0
            const unpaid = customer.transactions.filter(t => t.type === 'CREDIT' && !t.isPaid)
            const paidTx = customer.transactions.filter(t => t.type === 'CREDIT' && t.isPaid)

            return (
              <div key={customer.id} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center font-bold text-lg">
                      {customer.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{customer.name}</h3>
                      {customer.phone && <p className="text-sm text-slate-400">{customer.phone}</p>}
                    </div>
                  </div>
                  <CreditRiskBadge riskLevel={customer.riskLevel} daysOverdue={customer.daysOverdue} />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Total Credit</p>
                    <p className="font-bold text-slate-100">{formatINR(customer.credited)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Received</p>
                    <p className="font-bold text-green-500">{formatINR(customer.paid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Outstanding</p>
                    <p className="font-bold text-red-500">{formatINR(customer.outstanding)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Payment Progress</span>
                    <span>{paidPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                </div>

                {/* Unpaid transactions */}
                {unpaid.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Payments</p>
                    {unpaid.map(tx => {
                      const daysOverdue = Math.round((Date.now() - new Date(tx.date).getTime()) / 86400000) - 7
                      let waMessage = `Hi ${customer.name}, a gentle reminder that your payment of ₹${tx.amount} is due.`
                      if (daysOverdue > 7) waMessage = `Hi ${customer.name}, your payment of ₹${tx.amount} is significantly overdue by ${daysOverdue} days. Please clear this immediately.`
                      
                      return (
                        <div key={tx.id} className="flex items-center justify-between bg-yellow-900/20 border border-yellow-700/30 rounded-xl px-4 py-2">
                          <div>
                            <p className="text-sm font-medium text-yellow-400">{formatINR(tx.amount)}</p>
                            <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            {customer.phone && (
                              <a 
                                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition border border-green-500/30"
                                title="Send WhatsApp Reminder"
                              >
                                {/* Simple SVG for WA since Lucide doesn't have it natively or Phone is standard */}
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                              </a>
                            )}
                            <MarkPaidButton transactionId={tx.id} isPaid={false} />
                            <DeleteButton transactionId={tx.id} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Paid transactions */}
                {paidTx.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Completed Payments</p>
                    {paidTx.slice(0, 3).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between bg-green-900/10 border border-green-800/30 rounded-xl px-4 py-2 opacity-80">
                        <div>
                          <p className="text-sm font-medium text-green-400 line-through">{formatINR(tx.amount)}</p>
                          <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <MarkPaidButton transactionId={tx.id} isPaid={true} />
                          <DeleteButton transactionId={tx.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <FloatingAddButton userId={userId} />
    </div>
  )
}
