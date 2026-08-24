'use server'

import prisma from './prisma'
import { revalidatePath } from 'next/cache'

export async function addTransaction(formData: FormData) {
  const type = formData.get('type') as string
  const amount = parseFloat(formData.get('amount') as string)
  const category = formData.get('category') as string
  const date = new Date(formData.get('date') as string)
  const description = formData.get('description') as string | null
  const customerName = formData.get('customerName') as string | null

  let customerId = null
  if (customerName) {
    // Upsert customer
    const customer = await prisma.customer.create({
      data: { name: customerName }
    })
    customerId = customer.id
  }

  await prisma.transaction.create({
    data: {
      type,
      amount,
      category,
      date,
      description,
      customerId,
    }
  })

  revalidatePath('/')
  revalidatePath('/income')
  revalidatePath('/expenses')
}

export async function getTransactions(type?: 'INCOME' | 'EXPENSE') {
  return prisma.transaction.findMany({
    where: type ? { type } : undefined,
    orderBy: { date: 'desc' },
    include: { customer: true }
  })
}

export async function getDashboardMetrics() {
  const transactions = await prisma.transaction.findMany()
  
  let totalIncome = 0
  let totalExpenses = 0

  const monthlyData: Record<string, { income: number, expense: number }> = {}

  transactions.forEach(t => {
    if (t.type === 'INCOME') totalIncome += t.amount
    else if (t.type === 'EXPENSE') totalExpenses += t.amount
    
    // YYYY-MM format
    const month = t.date.toISOString().slice(0, 7)
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 }
    
    if (t.type === 'INCOME') monthlyData[month].income += t.amount
    else if (t.type === 'EXPENSE') monthlyData[month].expense += t.amount
  })

  const profit = totalIncome - totalExpenses

  const chartData = Object.keys(monthlyData).sort().map(month => ({
    name: month,
    income: monthlyData[month].income,
    expense: monthlyData[month].expense
  }))

  return { totalIncome, totalExpenses, profit, chartData }
}
