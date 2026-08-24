'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { registerUser } from '@/lib/actions'
import AnimatedBackground from '@/components/AnimatedBackground'

const MODES = [
  { id: 'personal', label: 'Personal Finance', icon: '👤', desc: 'Track personal income and expenses' },
  { id: 'business', label: 'Small Business', icon: '🏪', desc: 'Manage sales, purchases and credit' },
  { id: 'entrepreneur', label: 'Micro Entrepreneur', icon: '🚀', desc: 'Full business + credit ledger' },
]

const CATEGORIES = ['Retail', 'Food & Beverages', 'Services', 'Manufacturing', 'Agriculture', 'Transport', 'Other']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    setStep(2)
  }

  const handleStep2 = (selectedMode: string) => {
    setMode(selectedMode)
    setStep(3)
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await registerUser({ name, email, password, mode, businessName, category })
    if ('error' in res) {
      setError(res.error ?? 'Registration failed')
      setLoading(false)
      return
    }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-0">
      <AnimatedBackground />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-5xl mb-4 flex justify-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
              <span className="font-bold text-3xl">₹</span>
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">MicroLedger</h1>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all ${step >= s ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-800">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-xl font-semibold text-slate-100 mb-6">Create your account</h2>
                {error && <div className="bg-red-900/20 border border-red-900/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}
                
                <form onSubmit={handleStep1} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="Min 6 characters" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-900/20 mt-4">
                    Continue →
                  </button>
                </form>
                
                <p className="text-center text-sm text-slate-400 mt-8">
                  Already have an account? <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Sign in</Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-xl font-semibold text-slate-100 mb-2">How will you use MicroLedger?</h2>
                <p className="text-slate-400 text-sm mb-6">Your dashboard adapts based on your choice.</p>
                
                <div className="space-y-4">
                  {MODES.map(m => (
                    <motion.button
                      key={m.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleStep2(m.id)}
                      className="w-full flex items-center gap-4 p-4 border border-slate-700 bg-slate-800/30 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-left"
                    >
                      <span className="text-3xl">{m.icon}</span>
                      <div>
                        <div className="font-semibold text-slate-200">{m.label}</div>
                        <div className="text-sm text-slate-400">{m.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-xl font-semibold text-slate-100 mb-6">
                  {mode === 'personal' ? 'Your Profile' : 'Business Details'}
                </h2>
                
                <form onSubmit={handleFinish} className="space-y-5">
                  {mode !== 'personal' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Business Name</label>
                      <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="My Shop" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-900/20 disabled:opacity-70 mt-4"
                  >
                    {loading ? 'Setting up your account...' : '🚀 Get Started'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
