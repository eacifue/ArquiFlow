export type PaymentStatus = "Pending" | "Paid";

export interface Payment {
  id: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
  expenseId: string | null;
  amount: number;
  date: string;
  method: string | null;
  status: PaymentStatus;
}

export interface CreatePaymentInput {
  supplierId: string;
  expenseId?: string;
  amount: number;
  date: string;
  method?: string;
}

export interface ProjectExpense {
  id: string;
  budgetItemId: string;
  budgetItemDescription: string;
  amount: number;
  date: string;
  description: string | null;
}
