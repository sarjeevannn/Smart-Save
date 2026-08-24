import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInvoice } from '@/lib/actions'
import { formatINR } from '@/lib/constants'
import { QRCodeSVG } from 'qrcode.react'
import PrintButton from './PrintButton'

export default async function InvoiceViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const invoice = await getInvoice(params.id)
  if (!invoice) return <div>Invoice not found</div>

  const profile = invoice.user.profile
  const customer = invoice.customer

  // Generate UPI string if UPI ID exists
  let upiString = ''
  if (profile?.upiId) {
    upiString = `upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(profile.businessName)}&am=${invoice.total}&tr=${invoice.invoiceNumber}&cu=INR`
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-slate-100">Invoice {invoice.invoiceNumber}</h1>
        <PrintButton />
      </div>

      <div className="bg-white text-black p-10 rounded-xl shadow-2xl print:shadow-none print:p-0 print:bg-transparent">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">INVOICE</h2>
            <p className="text-gray-500 text-sm">#{invoice.invoiceNumber}</p>
            <p className="text-gray-500 text-sm">Date: {new Date(invoice.date).toLocaleDateString()}</p>
            {invoice.dueDate && <p className="text-gray-500 text-sm font-semibold mt-1">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold text-gray-900">{profile?.businessName || invoice.user.name}</h3>
            {profile?.address && <p className="text-sm text-gray-600 max-w-[250px] whitespace-pre-wrap">{profile.address}</p>}
            {profile?.phone && <p className="text-sm text-gray-600">{profile.phone}</p>}
            {profile?.email && <p className="text-sm text-gray-600">{profile.email}</p>}
            {profile?.gstin && <p className="text-sm text-gray-600 mt-1 font-medium">GSTIN: {profile.gstin}</p>}
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-10">
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Bill To</p>
          <h4 className="text-lg font-bold text-gray-900">{customer?.name || 'Walk-in Customer'}</h4>
          {customer?.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
          {customer?.email && <p className="text-sm text-gray-600">{customer.email}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-left">
          <thead>
            <tr className="border-b-2 border-gray-900 text-gray-900">
              <th className="py-3 font-semibold">Description</th>
              <th className="py-3 font-semibold text-right">Qty</th>
              <th className="py-3 font-semibold text-right">Rate</th>
              <th className="py-3 font-semibold text-right">Tax (%)</th>
              <th className="py-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoice.items.map(item => (
              <tr key={item.id}>
                <td className="py-4 text-gray-800">{item.description}</td>
                <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                <td className="py-4 text-right text-gray-600">{formatINR(item.rate)}</td>
                <td className="py-4 text-right text-gray-600">{item.taxPercent}%</td>
                <td className="py-4 text-right font-medium text-gray-900">{formatINR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatINR(invoice.subtotal)}</span>
            </div>
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatINR(invoice.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-900 pt-3">
              <span>Total</span>
              <span>{formatINR(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer / QR / Notes */}
        <div className="flex justify-between items-end border-t border-gray-200 pt-8 mt-16">
          <div className="max-w-md">
            {invoice.notes && (
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-900 mb-1">Notes</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Terms & Conditions</p>
                <p className="text-sm text-gray-600">{invoice.terms}</p>
              </div>
            )}
          </div>
          
          {upiString && (
            <div className="text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Scan to Pay via UPI</p>
              <div className="bg-white p-2 rounded-lg inline-block shadow-sm">
                <QRCodeSVG value={upiString} size={100} />
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">{profile?.upiId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
