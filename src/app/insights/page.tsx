import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdvancedInsights } from '@/lib/actions'
import { formatINR } from '@/lib/constants'
import { Brain, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, Activity } from 'lucide-react'

export default async function InsightsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const { leakage, cashFlow, profitability, savings } = await getAdvancedInsights(userId)

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Brain className="text-indigo-400" /> AI Insights Dashboard
        </h1>
        <p className="text-slate-400 text-sm">Advanced financial analytics and predictions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cash Flow Predictor */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400">
              <Activity size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Cash Flow Predictor</h2>
          </div>
          <div className="space-y-4">
            <p className={`text-sm ${cashFlow.status === 'warning' ? 'text-red-400' : 'text-green-400'}`}>
              {cashFlow.message}
            </p>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-400">Current Burn Rate</span>
              <span className="font-bold text-slate-200">{formatINR(cashFlow.burnRate)} / day</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-400">Predicted Month-End Expense</span>
              <span className="font-bold text-slate-200">{formatINR(cashFlow.predictedExpense)}</span>
            </div>
          </div>
        </div>

        {/* Profitability Assistant */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Profitability Assistant</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-300">{profitability.message}</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-indigo-400">{profitability.margin.toFixed(1)}%</span>
              <span className="text-sm text-slate-400 pb-1">Gross Margin</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
              <div 
                className="bg-indigo-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, Math.max(0, profitability.margin))}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Expense Leakage Detector */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center text-red-400">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Expense Leakage Detector</h2>
          </div>
          {leakage.length === 0 ? (
            <p className="text-sm text-slate-400">No abnormal spending detected this month. Great job!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {leakage.map((l, i) => (
                <div key={i} className="p-4 bg-red-900/10 border border-red-900/30 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-red-400 capitalize">{l.category}</span>
                    <TrendingDown className="text-red-500" size={16} />
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{l.message}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Average: {formatINR(l.average)}</span>
                    <span className="font-bold text-slate-200">Current: {formatINR(l.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Savings Opportunity Dashboard */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-900/50 flex items-center justify-center text-yellow-400">
              <Lightbulb size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Savings Opportunity Dashboard</h2>
          </div>
          {savings.length === 0 ? (
            <p className="text-sm text-slate-400">Keep tracking expenses to unlock personalized savings opportunities.</p>
          ) : (
            <div className="space-y-3">
              {savings.map((s, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-800/40 rounded-xl items-center border border-slate-700/50">
                  <div className="flex-shrink-0 text-2xl">💡</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">{s.action}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Potential</p>
                    <p className="font-bold text-green-400">+{formatINR(s.potential)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
