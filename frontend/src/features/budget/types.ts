export interface BudgetItem {
  id: string;
  projectId: string;
  category: string;
  description: string;
  budgetedAmount: number;
  unit: string | null;
  quantity: number | null;
  spentAmount: number;
}

export interface BudgetItemFormInput {
  category: string;
  description: string;
  budgetedAmount: number;
  unit?: string;
  quantity?: number;
}

export interface Expense {
  id: string;
  budgetItemId: string;
  amount: number;
  date: string;
  description: string | null;
  receiptFileUrl: string | null;
}

export interface CreateExpenseInput {
  amount: number;
  date: string;
  description?: string;
  receipt?: File;
}
