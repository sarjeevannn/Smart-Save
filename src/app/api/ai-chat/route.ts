import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { formatINR } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id
    const { message } = await req.json()
    const query = message.toLowerCase()

    let response = "I'm sorry, I didn't quite understand that. Try asking about your expenses, income, highest spending, or who owes you money."

    // 1. "How much did I spend this month?"
    if (query.includes('spend') || query.includes('spent') || (query.includes('total') && query.includes('expense'))) {
      const expenses = await prisma.transaction.aggregate({
        where: { userId, type: { in: ['EXPENSE', 'PURCHASE'] } },
        _sum: { amount: true }
      })
      response = `You have spent a total of **${formatINR(expenses._sum.amount || 0)}** on business expenses and purchases.`
    }
    // 2. "Who owes me the most money?"
    else if (query.includes('owe') || query.includes('credit') || query.includes('debt')) {
      const customers = await prisma.customer.findMany({
        where: { userId },
        include: { transactions: { where: { type: 'CREDIT', isPaid: false } } }
      })
      const mapped = customers.map(c => ({
        name: c.name,
        owed: c.transactions.reduce((sum, t) => sum + t.amount, 0)
      })).filter(c => c.owed > 0).sort((a, b) => b.owed - a.owed)

      if (mapped.length > 0) {
        response = `**${mapped[0].name}** owes you the most money (${formatINR(mapped[0].owed)}). In total, ${mapped.length} customers owe you money.`
      } else {
        response = "Good news! No one currently owes you money."
      }
    }
    // 3. "What was my highest expense?"
    else if ((query.includes('highest') || query.includes('biggest')) && query.includes('expense')) {
      const tx = await prisma.transaction.findFirst({
        where: { userId, type: { in: ['EXPENSE', 'PURCHASE'] } },
        orderBy: { amount: 'desc' }
      })
      if (tx) {
        response = `Your highest expense was **${formatINR(tx.amount)}** for **${tx.category.replace('_', ' ')}** on ${new Date(tx.date).toLocaleDateString()}.`
      } else {
        response = "You don't have any recorded expenses yet."
      }
    }
    // 4. "Compare this month's sales with last month" / "profit"
    else if (query.includes('profit') || query.includes('sales') || query.includes('income')) {
      const income = await prisma.transaction.aggregate({
        where: { userId, type: 'INCOME' },
        _sum: { amount: true }
      })
      const expenses = await prisma.transaction.aggregate({
        where: { userId, type: { in: ['EXPENSE', 'PURCHASE'] } },
        _sum: { amount: true }
      })
      const profit = (income._sum.amount || 0) - (expenses._sum.amount || 0)
      
      response = `Your total sales are **${formatINR(income._sum.amount || 0)}** and expenses are **${formatINR(expenses._sum.amount || 0)}**. \n\nYour estimated profit is **${formatINR(profit)}**.`
      
      if (profit < 0) {
        response += "\n\n⚠️ *Warning: You are currently running at a loss.*"
      }
    }
    // 5. "reduce my expenses"
    else if (query.includes('reduce') || query.includes('save')) {
       response = "To reduce expenses, I recommend reviewing your recurring bills and checking if your inventory purchases match your actual sales volume. Try keeping your expenses below 60% of your total income."
    }

    // Simulate AI thinking delay for realism
    await new Promise(resolve => setTimeout(resolve, 800))

    return NextResponse.json({ reply: response })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
