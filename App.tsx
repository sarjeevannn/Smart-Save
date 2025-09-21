import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Slot, Transaction, Badge, SlotCategory, Currency, SavingsGoal } from './types';
import { INITIAL_SLOTS, INITIAL_BADGES, WalletIcon, SettingsIcon, PencilIcon, TargetIcon } from './constants.tsx';
import { getCategorySuggestion } from './services/geminiService.ts';
import Analytics from './components/Analytics';
import AIAssistant from './components/AIAssistant';
import TransactionHistory from './components/TransactionHistory';

// Helper UI Components
const Header: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => (
  <header className="py-6 flex justify-between items-center">
    <div className="text-left">
      <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
        Smart Money Manager
      </h1>
      <p className="text-gray-400 mt-2">Your personal AI-powered finance dashboard.</p>
    </div>
    <button onClick={onOpenSettings} className="p-3 rounded-full hover:bg-gray-700 transition-colors" aria-label="Open Settings">
      <SettingsIcon className="w-6 h-6 text-gray-400"/>
    </button>
  </header>
);

interface SlotCardProps {
  slot: Slot;
  formatCurrency: (amount: number) => string;
}
const SlotCard: React.FC<SlotCardProps> = ({ slot, formatCurrency }) => {
  const progress = slot.allocated > 0 ? (slot.spent / slot.allocated) * 100 : 0;
  const isOverBudget = progress > 100;
  const isWarning = progress > 80 && progress <= 100;

  const progressBarColor = isOverBudget
    ? 'bg-red-500'
    : isWarning
    ? 'bg-yellow-500'
    : 'bg-green-500';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-700 hover:border-cyan-400 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <slot.icon className="w-8 h-8 text-cyan-400" />
          <span className="font-bold text-lg">{slot.category}</span>
        </div>
        {isOverBudget && <span className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded-full">OVER</span>}
      </div>
      <p className="text-sm text-gray-400">
        Spent {formatCurrency(slot.spent)} of {formatCurrency(slot.allocated)}
      </p>
      <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
        <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
      </div>
    </div>
  );
};

interface GamificationBadgesProps {
    badges: Badge[];
}
const GamificationBadges: React.FC<GamificationBadgesProps> = ({ badges }) => (
    <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-yellow-300">Achievements</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
            {badges.map(badge => (
                <div key={badge.id} title={badge.description} className={`flex flex-col items-center justify-center p-4 rounded-lg w-32 h-32 text-center transition-all duration-300 ${badge.unlocked ? 'bg-yellow-500/20 border border-yellow-400 text-yellow-300' : 'bg-gray-800/50 border border-gray-700 text-gray-500'}`}>
                    <badge.icon className={`w-12 h-12 mb-2 ${badge.unlocked ? 'text-yellow-400' : 'text-gray-600'}`} />
                    <span className="text-xs font-semibold">{badge.name}</span>
                </div>
            ))}
        </div>
    </div>
);

interface SavingsGoalTrackerProps {
    goal: SavingsGoal | null;
    savingsSlot: Slot | undefined;
    formatCurrency: (amount: number) => string;
}
const SavingsGoalTracker: React.FC<SavingsGoalTrackerProps> = ({ goal, savingsSlot, formatCurrency }) => {
    if (!goal) return null;

    const savedAmount = savingsSlot?.allocated || 0;
    const progress = goal.targetAmount > 0 ? (savedAmount / goal.targetAmount) * 100 : 0;
    
    const deadlineDate = new Date(goal.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const daysRemaining = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    return (
        <div className="my-8 p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
                <TargetIcon className="w-8 h-8 text-yellow-300" />
                <div>
                    <h2 className="text-2xl font-bold text-yellow-300">{goal.name}</h2>
                    <p className="text-sm text-gray-400">Target: {formatCurrency(goal.targetAmount)} by {deadlineDate.toLocaleDateString()}</p>
                </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-yellow-500 h-4 rounded-full text-right" style={{ width: `${Math.min(progress, 100)}%` }}>
                   <span className="px-2 text-xs font-bold text-yellow-900">{progress.toFixed(0)}%</span>
                </div>
            </div>
            <div className="flex justify-between text-sm mt-2 text-gray-400">
                <span>{formatCurrency(savedAmount)} saved</span>
                <span>{daysRemaining} days left</span>
            </div>
        </div>
    );
};

// Modals
const Modal: React.FC<{children: React.ReactNode, onClose: () => void, title: string}> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 relative">
             <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl" aria-label="Close modal">&times;</button>
            <h2 id="modal-title" className="text-2xl font-bold mb-6 text-center text-cyan-300">{title}</h2>
            {children}
        </div>
    </div>
);

interface AddTransactionModalProps {
  slots: Slot[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  onClose: () => void;
  currency: Currency;
}
const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ slots, onAddTransaction, onClose, currency }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<SlotCategory>(slots[0]?.category || '');
    const [suggestedCategory, setSuggestedCategory] = useState<string>('');
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

    const handleDescriptionBlur = useCallback(async () => {
        if (description.length > 3) {
            setIsSuggesting(true);
            const suggestion = await getCategorySuggestion(description, slots.map(s => s.category));
            if (suggestion) {
                setCategory(suggestion);
                setSuggestedCategory(suggestion);
            }
            setIsSuggesting(false);
        }
    }, [description, slots]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0 || !description) {
            alert("Please enter a valid amount and description.");
            return;
        }
        onAddTransaction({ amount: numericAmount, description, category });
        onClose();
    };
    
    const currencySymbol = currency === 'INR' ? '₹' : '$';

    return (
        <Modal onClose={onClose} title="Add New Expense">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount ({currencySymbol})</label>

                    <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        placeholder="0.00" step="0.01" required />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <input type="text" id="description" value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleDescriptionBlur}
                         className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        placeholder="e.g., Coffee, Subway ticket" required />
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value as SlotCategory)}
                         className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" required>
                        {slots.map(s => (
                            <option key={s.id} value={s.category}>
                                {s.category} {suggestedCategory === s.category && '✨ Suggested'}
                            </option>
                        ))}
                    </select>
                    {isSuggesting && <p className="text-xs text-purple-300 mt-1">AI is suggesting a category...</p>}
                </div>
                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Add Expense</button>
            </form>
        </Modal>
    );
};

interface AddIncomeModalProps {
  onAddIncome: (amount: number) => void;
  onClose: () => void;
  currency: Currency;
}
const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ onAddIncome, onClose, currency }) => {
    const [amount, setAmount] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (numericAmount > 0) {
            onAddIncome(numericAmount);
            onClose();
        } else {
            alert('Please enter a valid income amount.');
        }
    };
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    return (
        <Modal onClose={onClose} title="Add Income">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="income-amount" className="block text-sm font-medium text-gray-300 mb-1">Income Amount ({currencySymbol})</label>
                    <input type="number" id="income-amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        placeholder="100.00" step="0.01" required />
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Add Income</button>
            </form>
        </Modal>
    );
};

interface CreateSlotModalProps {
  onClose: () => void;
  slots: Slot[];
  onCreateSlot: (category: string, allocated: number) => void;
  monthlyIncome: number;
  formatCurrency: (amount: number) => string;
}
const CreateSlotModal: React.FC<CreateSlotModalProps> = ({ onClose, slots, onCreateSlot, monthlyIncome, formatCurrency }) => {
    const [category, setCategory] = useState('');
    const [allocated, setAllocated] = useState('');

    const totalAllocated = useMemo(() => slots.reduce((sum, s) => sum + s.allocated, 0), [slots]);
    const unallocated = monthlyIncome - totalAllocated;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAllocated = parseFloat(allocated);
        if (!category.trim()) {
            alert('Please enter a category name.');
            return;
        }
        if (isNaN(numericAllocated) || numericAllocated < 0) {
            alert('Please enter a valid budget amount.');
            return;
        }
        if (numericAllocated > unallocated) {
            alert(`Budget cannot exceed unallocated funds of ${formatCurrency(unallocated)}.`);
            return;
        }
        onCreateSlot(category, numericAllocated);
        onClose();
    };
    return (
        <Modal onClose={onClose} title="Create New Slot">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="slot-category" className="block text-sm font-medium text-gray-300 mb-1">Category Name</label>
                    <input type="text" id="slot-category" value={category} onChange={(e) => setCategory(e.target.value)}
                         className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        placeholder="e.g., Vacation Fund" required />
                </div>
                <div>
                    <label htmlFor="slot-allocated" className="block text-sm font-medium text-gray-300 mb-1">Budget Amount</label>
                    <input type="number" id="slot-allocated" value={allocated} onChange={(e) => setAllocated(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        placeholder={`e.g., 500`} step="10" max={unallocated} required />
                    <p className="text-xs text-gray-400 mt-1">Unallocated funds: {formatCurrency(unallocated)}</p>
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Create Slot</button>
            </form>
        </Modal>
    );
};

interface EditSlotsModalProps {
  slots: Slot[];
  onSave: (updatedSlots: Array<{id: number, allocated: number}>) => void;
  onClose: () => void;
  monthlyIncome: number;
  formatCurrency: (amount: number) => string;
}
const EditSlotsModal: React.FC<EditSlotsModalProps> = ({ slots, onSave, onClose, monthlyIncome, formatCurrency }) => {
    const [editedSlots, setEditedSlots] = useState(slots.map(s => ({ id: s.id, category: s.category, allocated: s.allocated, isEmergency: !!s.isEmergency })));
    
    const handleAllocatedChange = (id: number, newAllocated: string) => {
        const numericAllocated = parseFloat(newAllocated) || 0;
        setEditedSlots(currentSlots => 
            currentSlots.map(s => s.id === id ? { ...s, allocated: numericAllocated } : s)
        );
    };

    const totalAllocated = useMemo(() => editedSlots.reduce((sum, s) => sum + s.allocated, 0), [editedSlots]);
    const unallocated = monthlyIncome - totalAllocated;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (totalAllocated > monthlyIncome) {
            alert(`Total allocation cannot exceed your monthly income of ${formatCurrency(monthlyIncome)}.`);
            return;
        }
        onSave(editedSlots.map(({id, allocated}) => ({id, allocated})));
        onClose();
    };

    return (
        <Modal onClose={onClose} title="Edit Slot Budgets">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {editedSlots.map(slot => (
                        <div key={slot.id} className="flex items-center gap-4">
                            <label htmlFor={`slot-edit-${slot.id}`} className="flex-grow text-gray-300">{slot.category}</label>
                            <input
                                type="number"
                                id={`slot-edit-${slot.id}`}
                                value={slot.allocated}
                                onChange={e => handleAllocatedChange(slot.id, e.target.value)}
                                className="w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                placeholder="0" step="10" min="0"
                                disabled={slot.isEmergency}
                            />
                        </div>
                    ))}
                </div>
                <div className={`text-center font-bold p-2 rounded-lg ${totalAllocated > monthlyIncome ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                    {totalAllocated > monthlyIncome ? 'Overallocated' : 'Unallocated'}: {formatCurrency(Math.abs(unallocated))}
                </div>
                <button type="submit" disabled={totalAllocated > monthlyIncome} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">Save Changes</button>
            </form>
        </Modal>
    );
};


interface SettingsModalProps {
  currentIncome: number;
  currency: Currency;
  savingsGoal: SavingsGoal | null;
  onUpdateIncome: (newIncome: number) => void;
  onUpdateCurrency: (newCurrency: Currency) => void;
  onSetSavingsGoal: (goal: SavingsGoal) => void;
  onResetData: () => void;
  onClose: () => void;
}
const SettingsModal: React.FC<SettingsModalProps> = ({ currentIncome, currency, savingsGoal, onUpdateIncome, onUpdateCurrency, onSetSavingsGoal, onResetData, onClose }) => {
    const [income, setIncome] = useState(currentIncome.toString());
    const [goalName, setGoalName] = useState(savingsGoal?.name || '');
    const [goalAmount, setGoalAmount] = useState(savingsGoal?.targetAmount.toString() || '');
    const [goalDeadline, setGoalDeadline] = useState(savingsGoal?.deadline ? new Date(savingsGoal.deadline).toISOString().split('T')[0] : '');

    const currencySymbol = currency === 'INR' ? '₹' : '$';
    
    const handleUpdateIncome = () => {
        const numericIncome = parseFloat(income);
        if (numericIncome > 0) {
            onUpdateIncome(numericIncome);
        } else {
            alert('Please enter a valid income.');
        }
    };
    
    const handleSetGoal = () => {
        const numericAmount = parseFloat(goalAmount);
        if (goalName && numericAmount > 0 && goalDeadline) {
            onSetSavingsGoal({
                name: goalName,
                targetAmount: numericAmount,
                deadline: new Date(goalDeadline).toISOString(),
            });
            alert('Savings goal updated!');
        } else {
            alert('Please fill out all fields for the savings goal.');
        }
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all your data? This action cannot be undone.')) {
            onResetData();
            onClose();
        }
    };

    return (
        <Modal onClose={onClose} title="Settings">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-cyan-300 mb-2">General</h3>
                    <label htmlFor="update-income" className="block text-sm font-medium text-gray-300 mb-1">Monthly Income ({currencySymbol})</label>
                    <div className="flex gap-2">
                        <input type="number" id="update-income" value={income} onChange={e => setIncome(e.target.value)}
                             className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                        <button onClick={handleUpdateIncome} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Update</button>
                    </div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-1 mt-4">Currency</label>
                    <select id="currency" value={currency} onChange={(e) => onUpdateCurrency(e.target.value as Currency)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                    </select>
                </div>
                <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-yellow-300 mb-2">Savings Goal</h3>
                    <div className="space-y-4">
                         <input type="text" placeholder="Goal Name (e.g., New Laptop)" value={goalName} onChange={e => setGoalName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none" />
                         <input type="number" placeholder="Target Amount" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none" />
                         <input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none" />
                         <button onClick={handleSetGoal} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Set/Update Goal</button>
                    </div>
                </div>
                <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                    <button onClick={handleReset} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Reset All Data</button>
                </div>
            </div>
        </Modal>
    );
};

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

const NotificationToast: React.FC<{ notification: Notification, onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    error: 'bg-red-500 border-red-400',
    warning: 'bg-yellow-500 border-yellow-400',
    success: 'bg-green-500 border-green-400',
  };

  return (
    <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white text-sm font-semibold border-l-4 ${colors[notification.type]} animate-fade-in-right`}>
      {notification.message}
    </div>
  );
};

// Main App Component
export default function App() {
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditSlotsModal, setShowEditSlotsModal] = useState(false);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [currency]);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'warning') => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [...prev, newNotification]);
  }, []);
  
  useEffect(() => {
    if (monthlyIncome !== null) {
      setSlots(prevSlots => {
          const slotsToUpdate = prevSlots.length > 0 ? prevSlots : INITIAL_SLOTS.map(s => ({...s, allocated: 0, spent: 0}));
          // Recalculate percentages if switching to amount-based
          const totalPercentage = slotsToUpdate.reduce((sum, s) => s.percentage + (s.isEmergency ? 0 : s.percentage), 100);
          
          return slotsToUpdate.map(s => ({
            ...s,
            allocated: monthlyIncome * (s.percentage / totalPercentage),
          }));
      });
    }
  }, [monthlyIncome]);
  
  const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
    setSlots(prevSlots => prevSlots.map(slot => {
        if (slot.category === newTransaction.category) {
            const newSpent = slot.spent + newTransaction.amount;
            if (newSpent > slot.allocated) {
                addNotification(`You've overspent in the "${slot.category}" category!`);
            }
            return { ...slot, spent: newSpent };
        }
        return slot;
    }));
  };
  
  const handleAddIncome = (amount: number) => {
    setMonthlyIncome(prev => (prev || 0) + amount);
  };
  
  const handleCreateSlot = (category: string, allocated: number) => {
      const newSlot: Slot = {
          id: slots.length > 0 ? Math.max(...slots.map(s => s.id)) + 1 : 1,
          category,
          allocated,
          spent: 0,
          percentage: monthlyIncome ? (allocated / monthlyIncome) * 100 : 0,
          icon: WalletIcon,
      };
      setSlots(prev => [...prev, newSlot]);
  };

  const handleUpdateSlots = (updatedSlots: Array<{id: number, allocated: number}>) => {
    setSlots(prevSlots => {
        return prevSlots.map(s => {
            const updateInfo = updatedSlots.find(u => u.id === s.id);
            if (updateInfo) {
                return {
                    ...s,
                    allocated: updateInfo.allocated,
                    percentage: monthlyIncome ? (updateInfo.allocated / monthlyIncome) * 100 : 0,
                };
            }
            return s;
        });
    });
  };
  
  const handleResetData = () => {
      setMonthlyIncome(null);
      setSlots([]);
      setTransactions([]);
      setBadges(INITIAL_BADGES);
      setCurrency('USD');
      setSavingsGoal(null);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    setSlots(prevSlots => prevSlots.map(slot =>
        slot.category === transactionToDelete.category
        ? { ...slot, spent: slot.spent - transactionToDelete.amount }
        : slot
    ));
  };

  // Gamification logic
  useEffect(() => {
    if (slots.length === 0 || monthlyIncome === null) return;
  
    setBadges(prevBadges => {
      const newBadges = [...prevBadges];
      let hasChanged = false;

      const updateBadge = (id: string, unlocked: boolean) => {
        const index = newBadges.findIndex(b => b.id === id);
        if (index !== -1 && newBadges[index].unlocked !== unlocked) {
            newBadges[index] = { ...newBadges[index], unlocked };
            hasChanged = true;
        }
      };

      // Budget Master
      const allWithinBudget = slots.every(s => s.spent <= s.allocated);
      updateBadge('b1', allWithinBudget && transactions.length > 5);
      
      // Savings Champion
      const savingsSlot = slots.find(s => s.category === "Savings");
      updateBadge('b2', !!(savingsSlot && savingsSlot.spent === 0 && monthlyIncome > 0));

      // Frugal Financier
      const leisureSlot = slots.find(s => s.category === "Leisure");
      updateBadge('b3', !!(leisureSlot && leisureSlot.spent < (leisureSlot.allocated * 0.5) && leisureSlot.allocated > 0 && transactions.some(t => t.category === "Leisure")));
      
      // Goal Achiever
      if (savingsGoal && savingsSlot) {
        const goalAchieved = savingsSlot.allocated >= savingsGoal.targetAmount;
        updateBadge('b4', goalAchieved);
      }
      
      return hasChanged ? newBadges : prevBadges;
    });
  }, [transactions, slots, monthlyIncome, savingsGoal]);


  if (monthlyIncome === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-md text-center bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h1 className="text-3xl font-bold mb-4 text-cyan-300">Welcome!</h1>
          <p className="text-gray-400 mb-6">Enter your total monthly income to get started.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const incomeInput = (e.target as HTMLFormElement).elements.namedItem('income') as HTMLInputElement;
            const income = parseFloat(incomeInput.value);
            if (income > 0) setMonthlyIncome(income);
          }}>
            <input type="number" name="income" placeholder="e.g., 3000" step="100" min="0" required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none mb-4" />
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Set Income & Start</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {notifications.map(n => 
        <NotificationToast key={n.id} notification={n} onClose={() => setNotifications(prev => prev.filter(item => item.id !== n.id))} />
      )}
      <div className="max-w-7xl mx-auto">
        <Header onOpenSettings={() => setShowSettingsModal(true)} />

        <SavingsGoalTracker goal={savingsGoal} savingsSlot={slots.find(s => s.category === 'Savings')} formatCurrency={formatCurrency} />
        
        <div className="my-8 p-4 bg-gray-800/50 rounded-lg flex flex-wrap gap-4 justify-center">
            <button onClick={() => setShowAddExpenseModal(true)} className="flex-grow md:flex-grow-0 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md">Add Expense</button>
            <button onClick={() => setShowAddIncomeModal(true)} className="flex-grow md:flex-grow-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md">Add Income</button>
            <button onClick={() => setShowCreateSlotModal(true)} className="flex-grow md:flex-grow-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md">Create Slot</button>
            <button onClick={() => setShowEditSlotsModal(true)} className="flex-grow md:flex-grow-0 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md">Edit Slots</button>
        </div>
        
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-cyan-300">Spending Slots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {slots.map(slot => <SlotCard key={slot.id} slot={slot} formatCurrency={formatCurrency} />)}
            </div>
        </div>

        <div className="mt-8">
            <Analytics slots={slots} monthlyIncome={monthlyIncome} transactions={transactions} formatCurrency={formatCurrency} />
        </div>

        <div className="mt-8">
            <TransactionHistory 
                transactions={transactions} 
                onDeleteTransaction={handleDeleteTransaction}
                slotCategories={slots.map(s => s.category)}
                formatCurrency={formatCurrency}
            />
        </div>

        <AIAssistant transactions={transactions} savingsGoal={savingsGoal} />

        <GamificationBadges badges={badges} />

      </div>
      {showAddExpenseModal && <AddTransactionModal slots={slots} onAddTransaction={handleAddTransaction} onClose={() => setShowAddExpenseModal(false)} currency={currency} />}
      {showAddIncomeModal && <AddIncomeModal onAddIncome={handleAddIncome} onClose={() => setShowAddIncomeModal(false)} currency={currency} />}
      {showCreateSlotModal && <CreateSlotModal slots={slots} onCreateSlot={handleCreateSlot} onClose={() => setShowCreateSlotModal(false)} monthlyIncome={monthlyIncome} formatCurrency={formatCurrency} />}
      {showEditSlotsModal && <EditSlotsModal slots={slots} onSave={handleUpdateSlots} onClose={() => setShowEditSlotsModal(false)} monthlyIncome={monthlyIncome} formatCurrency={formatCurrency} />}
      {showSettingsModal && <SettingsModal currentIncome={monthlyIncome} currency={currency} savingsGoal={savingsGoal} onUpdateCurrency={setCurrency} onUpdateIncome={setMonthlyIncome} onResetData={handleResetData} onSetSavingsGoal={setSavingsGoal} onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
}