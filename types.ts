export type SlotCategory = string;
export type Currency = 'USD' | 'INR';

export interface Slot {
  id: number;
  category: SlotCategory;
  allocated: number;
  spent: number;
  percentage: number;
  icon: React.ComponentType<{ className?: string }>;
  isEmergency?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: SlotCategory;
  date: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SavingsGoal {
    name: string;
    targetAmount: number;
    deadline: string; // ISO string format
}
