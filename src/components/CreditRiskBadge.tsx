'use client'

const RISK_CONFIG = {
  none: null,
  low:    { label: '🟢 Low Risk',    css: 'bg-green-50 text-green-700 border-green-200',  desc: 'Usually pays on time' },
  medium: { label: '🟡 Medium Risk', css: 'bg-yellow-50 text-yellow-700 border-yellow-200', desc: 'Payment slightly delayed' },
  high:   { label: '🔴 High Risk',   css: 'bg-red-50 text-red-700 border-red-200',  desc: 'Payment overdue' },
}

export default function CreditRiskBadge({ riskLevel, daysOverdue }: { riskLevel: string; daysOverdue: number }) {
  const cfg = RISK_CONFIG[riskLevel as keyof typeof RISK_CONFIG]
  if (!cfg) return null
  return (
    <div className={`border rounded-xl px-3 py-1.5 text-right ${cfg.css}`}>
      <p className="text-xs font-semibold">{cfg.label}</p>
      <p className="text-xs opacity-70">
        {daysOverdue > 0 ? `${daysOverdue} days overdue` : cfg.desc}
      </p>
    </div>
  )
}
