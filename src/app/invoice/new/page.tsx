import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getBusinessProfile, getCustomers } from '@/lib/actions'
import InvoiceForm from '@/components/InvoiceForm'

export default async function NewInvoicePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const profile = await getBusinessProfile(userId)
  const customers = await getCustomers(userId)

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Create New Invoice</h1>
        <p className="text-slate-400 text-sm">Generate a professional digital invoice for your customers.</p>
      </div>

      <InvoiceForm userId={userId} profile={profile} customers={customers} />
    </div>
  )
}
