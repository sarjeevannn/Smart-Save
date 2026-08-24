'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const AUTH_ROUTES = ['/login', '/register']

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  if (!session || isAuthRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 mt-16 mb-16 md:mt-0 md:mb-0 p-4 md:p-8 overflow-x-hidden overflow-y-auto min-h-screen relative z-0">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent -z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] -z-10 pointer-events-none" />
        
        {children}
      </main>
    </div>
  )
}
