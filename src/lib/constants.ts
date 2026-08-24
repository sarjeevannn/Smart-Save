export const INCOME_CATEGORIES = [
  { id: 'product_sale', label: 'Product Sale', icon: '🛍️' },
  { id: 'service', label: 'Service', icon: '⚙️' },
  { id: 'salary', label: 'Salary', icon: '💼' },
  { id: 'freelance', label: 'Freelance', icon: '💻' },
  { id: 'investment', label: 'Investment', icon: '📈' },
  { id: 'rental', label: 'Rental', icon: '🏠' },
  { id: 'other_income', label: 'Other', icon: '➕' },
]

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Supplies', icon: '🍛' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'utilities', label: 'Utilities', icon: '💡' },
  { id: 'rent', label: 'Rent', icon: '🏢' },
  { id: 'salary_paid', label: 'Staff Salary', icon: '👤' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'other_expense', label: 'Other', icon: '📝' },
]

export const PURCHASE_CATEGORIES = [
  { id: 'raw_material', label: 'Raw Material', icon: '🏭' },
  { id: 'equipment', label: 'Equipment', icon: '🔩' },
  { id: 'goods', label: 'Goods', icon: '📦' },
  { id: 'other_purchase', label: 'Other', icon: '🛒' },
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, ...PURCHASE_CATEGORIES]

export const getCategoryIcon = (id: string) =>
  ALL_CATEGORIES.find(c => c.id === id)?.icon ?? '💰'

export const getCategoryLabel = (id: string) =>
  ALL_CATEGORIES.find(c => c.id === id)?.label ?? id

export const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
