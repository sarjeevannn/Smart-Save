'use server'

import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── Auth ──────────────────────────────────────────────────────────────────
export async function registerUser(data: {
  name: string
  email: string
  password: string
  businessName?: string
  mode?: string
  category?: string
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) return { error: 'Email already registered' }
  const hashed = await bcrypt.hash(data.password, 10)
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      businessName: data.businessName,
      mode: data.mode || 'business',
      category: data.category,
    },
  })
  return { success: true, userId: user.id }
}

export async function updateUserProfile(userId: string, data: {
  businessName?: string
  mode?: string
  category?: string
}) {
  await prisma.user.update({ where: { id: userId }, data })
  revalidatePath('/')
}

// ─── Transactions ──────────────────────────────────────────────────────────
export async function addTransaction(formData: FormData) {
  const userId = formData.get('userId') as string
  const type = formData.get('type') as string
  const amount = parseFloat(formData.get('amount') as string)
  const category = formData.get('category') as string
  const paymentMode = (formData.get('paymentMode') as string) || 'cash'
  const date = new Date(formData.get('date') as string)
  const description = formData.get('description') as string | null
  const tags = formData.get('tags') as string | null
  const customerName = formData.get('customerName') as string | null
  const dueDateStr = formData.get('dueDate') as string | null

  let customerId: string | null = null
  if (customerName && userId) {
    let customer = await prisma.customer.findFirst({
      where: { name: { equals: customerName }, userId },
    })
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: customerName, userId },
      })
    }
    customerId = customer.id
  }

  await prisma.transaction.create({
    data: {
      type,
      amount,
      category,
      paymentMode,
      date,
      description,
      tags,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      isPaid: type !== 'CREDIT',
      userId,
      customerId,
    },
  })

  revalidatePath('/')
  revalidatePath('/income')
  revalidatePath('/expenses')
  revalidatePath('/credit')
  return { success: true }
}

export async function getTransactions(userId: string, type?: string) {
  return prisma.transaction.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { date: 'desc' },
    include: { customer: true },
  })
}

export async function markCreditPaid(transactionId: string) {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isPaid: true }
  })
  revalidatePath('/credit')
  revalidatePath('/')
}

export async function deleteTransaction(transactionId: string) {
  await prisma.transaction.delete({
    where: { id: transactionId }
  })
  revalidatePath('/')
  revalidatePath('/income')
  revalidatePath('/expenses')
  revalidatePath('/credit')
  revalidatePath('/reports')
  revalidatePath('/insights')
}

export async function undoCreditPaid(transactionId: string) {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isPaid: false }
  })
  revalidatePath('/credit')
  revalidatePath('/')
}

// ─── Dashboard Metrics ─────────────────────────────────────────────────────
export async function getDashboardMetrics(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const allTx = await prisma.transaction.findMany({ where: { userId } })
  const thisMonthTx = allTx.filter(t => t.date >= startOfMonth)
  const lastMonthTx = allTx.filter(t => t.date >= startOfLastMonth && t.date <= endOfLastMonth)

  const sum = (txs: typeof allTx, type: string) =>
    txs.filter(t => t.type === type).reduce((a, b) => a + b.amount, 0)

  const totalIncome = sum(allTx, 'INCOME')
  const totalExpenses = sum(allTx, 'EXPENSE') + sum(allTx, 'PURCHASE')
  const totalCredit = allTx.filter(t => t.type === 'CREDIT' && !t.isPaid).reduce((a, b) => a + b.amount, 0)
  const profit = totalIncome - totalExpenses

  const thisMonthIncome = sum(thisMonthTx, 'INCOME')
  const lastMonthIncome = sum(lastMonthTx, 'INCOME')
  const growthPct = lastMonthIncome > 0
    ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100
    : 0

  // Monthly chart data (last 6 months)
  const monthlyData: Record<string, { income: number; expense: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    monthlyData[key] = { income: 0, expense: 0 }
  }
  allTx.forEach(t => {
    const key = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' })
    if (!monthlyData[key]) return
    if (t.type === 'INCOME') monthlyData[key].income += t.amount
    if (t.type === 'EXPENSE' || t.type === 'PURCHASE') monthlyData[key].expense += t.amount
  })
  const chartData = Object.entries(monthlyData).map(([name, v]) => ({ name, ...v }))

  // Recent 5 transactions
  const recent = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 5,
    include: { customer: true },
  })

  return {
    totalIncome,
    totalExpenses,
    profit,
    totalCredit,
    growthPct,
    chartData,
    recent,
  }
}

// ─── Customers ─────────────────────────────────────────────────────────────
export async function getCustomers(userId: string) {
  const customers = await prisma.customer.findMany({
    where: { userId },
    include: { transactions: { orderBy: { date: 'desc' } } },
  })
  return customers.map(c => {
    const credited = c.transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((a, b) => a + b.amount, 0)
    const paid = c.transactions
      .filter(t => t.type === 'CREDIT' && t.isPaid)
      .reduce((a, b) => a + b.amount, 0)
    const outstanding = credited - paid

    // Risk: find oldest unpaid credit
    const unpaid = c.transactions.filter(t => t.type === 'CREDIT' && !t.isPaid)
    let riskLevel = 'none'
    let daysOverdue = 0
    if (unpaid.length > 0) {
      const oldest = unpaid.reduce((a, b) => (a.date < b.date ? a : b))
      daysOverdue = Math.floor((Date.now() - new Date(oldest.date).getTime()) / 86400000)
      riskLevel = daysOverdue > 14 ? 'high' : daysOverdue > 7 ? 'medium' : 'low'
    }

    return { ...c, credited, paid, outstanding, riskLevel, daysOverdue }
  })
}

// ─── Insights ─────────────────────────────────────────────────────────────
export async function getInsights(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const allTx = await prisma.transaction.findMany({ where: { userId } })
  const thisTx = allTx.filter(t => new Date(t.date) >= startOfMonth)
  const lastTx = allTx.filter(t => new Date(t.date) >= startOfLastMonth && new Date(t.date) <= endOfLastMonth)

  const insights: { type: 'positive' | 'warning' | 'info' | 'danger'; message: string }[] = []

  const thisIncome = thisTx.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0)
  const lastIncome = lastTx.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0)
  
  const currentExpenses = thisTx.filter(t => t.type === 'EXPENSE' || t.type === 'PURCHASE')
  const lastExpenses = lastTx.filter(t => t.type === 'EXPENSE' || t.type === 'PURCHASE')
  
  const thisExpense = currentExpenses.reduce((a, b) => a + b.amount, 0)
  const lastExpense = lastExpenses.reduce((a, b) => a + b.amount, 0)

  if (lastIncome > 0 && thisIncome > lastIncome * 1.1)
    insights.push({ type: 'positive', message: `📈 Your sales increased by ${Math.round(((thisIncome - lastIncome) / lastIncome) * 100)}% this month!` })

  if (lastExpense > 0 && thisExpense > lastExpense * 1.2)
    insights.push({ type: 'warning', message: `⚠️ Expenses are ${Math.round(((thisExpense - lastExpense) / lastExpense) * 100)}% higher than last month.` })

  // Anomaly Detection
  if (currentExpenses.length > 0 && lastExpenses.length > 0) {
    const avgExpense = lastExpense / lastExpenses.length
    const highestExpense = currentExpenses.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
    if (highestExpense.amount > avgExpense * 3) {
       insights.push({ type: 'danger', message: `🚨 Unusual Transaction Detected: ${highestExpense.category.replace('_', ' ')} for ₹${highestExpense.amount} is significantly higher than your normal spending pattern.` })
    }
  }

  // Cash Flow Prediction
  const daysPassed = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  if (daysPassed > 5 && thisIncome > 0) {
    const projectedIncome = Math.round((thisIncome / daysPassed) * daysInMonth)
    insights.push({ type: 'info', message: `🔮 Cash Flow Prediction: Based on current trends, your estimated sales for this month will reach ₹${projectedIncome.toLocaleString('en-IN')}.` })
  }

  const overdueCredit = allTx.filter(t => t.type === 'CREDIT' && !t.isPaid && (Date.now() - new Date(t.date).getTime()) > 14 * 86400000)
  if (overdueCredit.length > 0)
    insights.push({ type: 'danger', message: `🔴 ${overdueCredit.length} customer payment${overdueCredit.length > 1 ? 's are' : ' is'} overdue by more than 14 days.` })

  const cashTx = allTx.filter(t => t.paymentMode === 'cash').length
  if (allTx.length > 0 && cashTx / allTx.length > 0.7)
    insights.push({ type: 'info', message: `💡 Most of your transactions (${Math.round((cashTx / allTx.length) * 100)}%) are cash-based.` })

  if (thisIncome > 0 && thisExpense / thisIncome > 0.8)
    insights.push({ type: 'warning', message: `⚠️ Your expense-to-income ratio is high (${Math.round((thisExpense / thisIncome) * 100)}%). Consider reducing costs.` })

  if (insights.length === 0)
    insights.push({ type: 'info', message: `📊 Add more transactions to see personalised insights.` })

  return insights
}

// ─── Health Score ──────────────────────────────────────────────────────────
export async function getHealthScore(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const allTx = await prisma.transaction.findMany({ where: { userId } })
  const thisTx = allTx.filter(t => new Date(t.date) >= startOfMonth)
  const lastTx = allTx.filter(t => new Date(t.date) >= startOfLastMonth && new Date(t.date) <= endOfLastMonth)

  const thisIncome = thisTx.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0)
  const lastIncome = lastTx.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0)
  const thisExpense = thisTx.filter(t => t.type === 'EXPENSE' || t.type === 'PURCHASE').reduce((a, b) => a + b.amount, 0)
  const overdueCount = allTx.filter(t => t.type === 'CREDIT' && !t.isPaid && (Date.now() - new Date(t.date).getTime()) > 7 * 86400000).length

  // Score breakdown (each out of 25)
  const incomeStability = lastIncome > 0 ? Math.min(25, Math.round(25 * (thisIncome / (lastIncome * 1.2)))) : (thisIncome > 0 ? 20 : 10)
  const expenseControl = thisIncome > 0 ? Math.min(25, Math.round(25 * (1 - Math.min(thisExpense / thisIncome, 1)))) : 15
  const creditRecovery = Math.max(0, 25 - overdueCount * 5)
  const cashFlow = allTx.length > 5 ? 25 : Math.round(25 * (allTx.length / 5))

  const total = incomeStability + expenseControl + creditRecovery + cashFlow
  const label = total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Fair' : 'Needs Attention'
  const color = total >= 80 ? 'green' : total >= 60 ? 'blue' : total >= 40 ? 'yellow' : 'red'

  return {
    total,
    incomeStability,
    expenseControl,
    creditRecovery,
    cashFlow,
    label,
    color,
  }
}

// ─── Advanced AI & Invoices ────────────────────────────────────────────────
export async function getAdvancedInsights(userId: string) {
  const allTx = await prisma.transaction.findMany({ where: { userId } })
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const expenses = allTx.filter(t => t.type === 'EXPENSE' || t.type === 'PURCHASE')
  
  // Leakage Detector
  const expenseByCategory: Record<string, number> = {}
  const priorExpenseByCategory: Record<string, number> = {}
  
  expenses.forEach(t => {
    if (t.date >= currentMonthStart) {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
    } else {
      priorExpenseByCategory[t.category] = (priorExpenseByCategory[t.category] || 0) + t.amount
    }
  })
  
  const leakage = []
  for (const cat in expenseByCategory) {
    const avgPrior = (priorExpenseByCategory[cat] || 0) / 3 // Assume 3 months history
    if (avgPrior > 0 && expenseByCategory[cat] > avgPrior * 1.5) {
      leakage.push({
        category: cat,
        amount: expenseByCategory[cat],
        average: avgPrior,
        impact: 'high',
        message: `Your ${cat} spending is 50% higher than your average.`
      })
    }
  }

  // Cash Flow Predictor
  const recentIncome = allTx.filter(t => t.type === 'INCOME' && t.date >= currentMonthStart).reduce((a, b) => a + b.amount, 0)
  const recentExpense = expenses.filter(t => t.date >= currentMonthStart).reduce((a, b) => a + b.amount, 0)
  const burnRatePerDay = recentExpense / Math.max(1, now.getDate())
  const predictedMonthEndExpense = burnRatePerDay * 30
  
  const cashFlow = {
    burnRate: burnRatePerDay,
    predictedExpense: predictedMonthEndExpense,
    status: predictedMonthEndExpense > recentIncome * 1.2 ? 'warning' : 'healthy',
    message: predictedMonthEndExpense > recentIncome * 1.2 
      ? 'Warning: At this rate, your expenses will exceed income by month end.' 
      : 'Your cash flow is positive. Keep it up!'
  }

  // Profitability
  const totalSales = allTx.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0)
  const totalCOGS = allTx.filter(t => t.type === 'PURCHASE').reduce((a, b) => a + b.amount, 0)
  const grossMargin = totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0
  const profitability = {
    margin: grossMargin,
    message: grossMargin > 40 ? 'Great margins!' : grossMargin > 20 ? 'Healthy margins.' : 'Your margins are quite tight. Review your purchase costs.'
  }

  // Savings
  const savings = leakage.map(l => ({
    category: l.category,
    potential: l.amount - l.average,
    action: `Negotiate ${l.category} rates or find cheaper alternatives to save ₹${Math.round(l.amount - l.average)}.`
  }))

  return { leakage, cashFlow, profitability, savings }
}

export async function getReminders(userId: string) {
  const credits = await prisma.transaction.findMany({
    where: { userId, type: 'CREDIT', isPaid: false },
    include: { customer: true }
  })
  
  const now = Date.now()
  const reminders = []
  
  for (const credit of credits) {
    if (credit.dueDate) {
      const days = Math.round((new Date(credit.dueDate).getTime() - now) / 86400000)
      if (days < 0) reminders.push({ type: 'overdue', message: `${credit.customer?.name}'s payment of ₹${credit.amount} is overdue by ${Math.abs(days)} days.` })
      else if (days <= 3) reminders.push({ type: 'upcoming', message: `${credit.customer?.name} is scheduled to pay ₹${credit.amount} in ${days} days.` })
    } else {
      // Auto infer 7 days
      const days = Math.round((now - new Date(credit.date).getTime()) / 86400000) - 7
      if (days > 0) reminders.push({ type: 'overdue', message: `${credit.customer?.name}'s payment of ₹${credit.amount} is overdue by ${days} days.` })
    }
  }
  
  return reminders
}

// ─── Business & Invoices ──────────────────────────────────────────────────
export async function getBusinessProfile(userId: string) {
  let profile = await prisma.businessProfile.findUnique({ where: { userId } })
  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    profile = await prisma.businessProfile.create({
      data: { userId, businessName: user?.businessName || user?.name || 'My Business' }
    })
  }
  return profile
}

export async function saveBusinessProfile(userId: string, data: any) {
  await prisma.businessProfile.update({ where: { userId }, data })
  revalidatePath('/invoice/new')
}

export async function createInvoice(userId: string, data: any) {
  const invoice = await prisma.invoice.create({
    data: {
      userId,
      invoiceNumber: data.invoiceNumber,
      date: new Date(data.date),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      subtotal: data.subtotal,
      taxTotal: data.taxTotal,
      total: data.total,
      notes: data.notes,
      terms: data.terms,
      items: {
        create: data.items.map((item: any) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          taxPercent: parseFloat(item.taxPercent),
          total: parseFloat(item.total)
        }))
      }
    }
  })
  
  revalidatePath('/invoice')
  return invoice.id
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: { items: true, user: { include: { profile: true } }, customer: true }
  })
}

export async function getInvoices(userId: string) {
  return prisma.invoice.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    include: { customer: true }
  })
}
