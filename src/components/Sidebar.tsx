'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, TrendingUp, TrendingDown, Users, FileText, LogOut, Brain, Receipt, Menu, X } from 'lucide-react'
import AIAssistant from './AIAssistant'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/credit', label: 'Credit', icon: Users },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/insights', label: 'Insights', icon: Brain },
  { href: '/invoice/new', label: 'Invoice', icon: Receipt },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any
  const initial = user?.name ? user.name[0].toUpperCase() : 'U'
  
  const [reminders, setReminders] = React.useState<any[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (user?.id) {
      import('@/lib/actions').then(({ getReminders }) => {
        getReminders(user.id).then(setReminders)
      })
    }
  }, [user?.id])

  // Desktop Sidebar
  const DesktopSidebar = (
    <aside className="hidden md:flex w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800 flex-col fixed h-full z-20 shadow-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3 text-indigo-400">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <span className="font-bold text-lg">₹</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-100">MicroLedger</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(link => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}>
              {isActive && <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-indigo-500/10 rounded-xl" initial={false} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <span className="relative z-10"><Icon size={18} /></span>
              <span className="relative z-10">{link.label}</span>
            </Link>
          )
        })}

        {reminders.length > 0 && (
          <div className="mt-8 mb-4">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Reminders</h3>
            <div className="space-y-2">
              {reminders.map((r, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg text-xs border ${r.type === 'overdue' ? 'bg-red-900/10 border-red-900/30 text-red-400' : 'bg-yellow-900/10 border-yellow-900/30 text-yellow-400'}`}>
                  <div className="font-bold mb-0.5 flex items-center gap-1">
                    {r.type === 'overdue' ? '⚠️ Overdue' : '🔔 Upcoming'}
                  </div>
                  {r.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <AIAssistant />
        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-slate-950 border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={() => signOut()} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )

  // Mobile Header
  const MobileHeader = (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-30 flex items-center justify-between px-4">
      <div className="flex items-center gap-2 text-indigo-400">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <span className="font-bold text-lg">₹</span>
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-100">MicroLedger</span>
      </div>
      <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-300 bg-slate-800 rounded-lg">
        <Menu size={20} />
      </button>
    </div>
  )

  // Mobile Bottom Nav
  const MobileBottomNav = (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-30 flex items-center justify-around px-2 pb-safe">
      {navItems.slice(0, 4).map(link => {
        const isActive = pathname === link.href
        const Icon = link.icon
        return (
          <Link key={link.href} href={link.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
            <Icon size={20} />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        )
      })}
    </div>
  )

  // Mobile Slide-out Menu
  const MobileSlideOut = (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 flex justify-between items-center border-b border-slate-800">
              <span className="font-bold text-slate-100">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map(link => {
                const isActive = pathname === link.href
                const Icon = link.icon
                return (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-300'}`}>
                    <Icon size={18} /> {link.label}
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-3">
              <AIAssistant />
              <button onClick={() => signOut()} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-medium">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {DesktopSidebar}
      {MobileHeader}
      {MobileBottomNav}
      {MobileSlideOut}
    </>
  )
}
