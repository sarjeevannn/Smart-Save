import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDashboardMetrics, getInsights, getHealthScore } from '@/lib/actions'
import BalanceCard from '@/components/BalanceCard'
import SummaryCards from '@/components/SummaryCards'
import DashboardChart from '@/components/DashboardChart'
import RecentActivity from '@/components/RecentActivity'
import HealthScore from '@/components/HealthScore'
import InsightsPanel from '@/components/InsightsPanel'
import FloatingAddButton from '@/components/FloatingAddButton'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const userId = (session.user as any).id
  const [metrics, insights, health] = await Promise.all([
    getDashboardMetrics(userId),
    getInsights(userId),
    getHealthScore(userId),
  ])

  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6 pb-24">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {metrics.growthPct >= 0
            ? `Your business is growing ↑ ${Math.abs(metrics.growthPct).toFixed(1)}%`
            : `Your income dipped ↓ ${Math.abs(metrics.growthPct).toFixed(1)}% this month`}
        </p>
      </div>

      {/* Balance Card */}
      <BalanceCard balance={metrics.profit} growthPct={metrics.growthPct} />

      {/* Summary Cards */}
      <SummaryCards
        totalIncome={metrics.totalIncome}
        totalExpenses={metrics.totalExpenses}
        profit={metrics.profit}
        totalCredit={metrics.totalCredit}
      />

      {/* Cash Flow Chart */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">📈 Cash Flow</h2>
        <DashboardChart data={metrics.chartData} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">🕐 Recent Activity</h2>
          <RecentActivity transactions={metrics.recent as any} />
        </div>

        {/* Health Score */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">💪 Financial Health</h2>
          <HealthScore {...health} />
        </div>
      </div>

      {/* Insights */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl shadow-black/20 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">🧠 Smart Insights</h2>
        <InsightsPanel insights={insights} />
      </div>

      {/* Floating Add Button */}
      <FloatingAddButton userId={userId} />
    </div>
  )
}
