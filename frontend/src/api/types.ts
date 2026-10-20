import type { Role } from "@/lib/auth";

export type ProjectStatus = "Planning" | "InProgress" | "OnHold" | "Completed" | "Cancelled";
export type ApiHealth = "Ok" | "Riesgo" | "Critico";
export type TaskStatus = "NotStarted" | "InProgress" | "Done" | "Delayed";
export type PaymentStatus = "Pending" | "Paid";

export interface PersonRef {
  id: string;
  fullName: string;
}

export interface CategoryMetrics {
  category: string;
  budgeted: number;
  spent: number;
}

export interface ProjectMetrics {
  progress: number;
  plannedProgress: number;
  taskCount: number;
  tasksDone: number;
  tasksInProgress: number;
  tasksNotStarted: number;
  delayedTasks: number;
  scheduleHealth: ApiHealth;
  budgeted: number;
  spent: number;
  budgetItemCount: number;
  categories: CategoryMetrics[];
  budgetHealth: ApiHealth;
  budgetHealthCategory: string | null;
  budgetHealthCategoryPercent: number | null;
  lastSiteLogAt: string | null;
  lastSiteLogAuthor: string | null;
}

export interface Project {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  totalBudget: number;
  projectManager: PersonRef | null;
  supervisor: PersonRef | null;
  metrics: ProjectMetrics;
}

export interface ProjectInput {
  name: string;
  address: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  status?: ProjectStatus;
  projectManagerId: string | null;
  supervisorId: string | null;
}

export interface StaffMember {
  id: string;
  fullName: string;
  role: Role;
}

export interface Expense {
  id: string;
  budgetItemId: string;
  amount: number;
  date: string;
  description: string | null;
  supplierId: string | null;
  supplierName: string | null;
  receiptFileUrl: string | null;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  category: string;
  description: string;
  budgetedAmount: number;
  unit: string | null;
  quantity: number | null;
  spentAmount: number;
  expenses: Expense[];
}

export interface BudgetItemInput {
  category: string;
  description: string;
  budgetedAmount: number;
  unit: string | null;
  quantity: number | null;
}

export interface ExpenseInput {
  amount: number;
  date: string;
  description?: string;
  supplierId?: string;
  receipt?: File;
}

export interface ScheduleTask {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  progressPercent: number;
  status: TaskStatus;
  sortOrder: number;
}

export interface SiteLogPhoto {
  id: string;
  fileUrl: string;
  caption: string | null;
}

export interface SiteLogEntry {
  id: string;
  projectId: string;
  date: string;
  notes: string | null;
  weather: string | null;
  authorUserId: string;
  authorName: string;
  authorRole: Role | null;
  createdAt: string;
  photos: SiteLogPhoto[];
}

export interface SiteLogEntryInput {
  date: string;
  notes: string | null;
  weather: string | null;
  photos: Array<{ fileUrl: string; caption: string | null }>;
}

export interface Payment {
  id: string;
  projectId: string;
  supplierId: string | null;
  supplierName: string | null;
  expenseId: string | null;
  expenseDescription: string | null;
  amount: number;
  date: string;
  method: string | null;
  status: PaymentStatus;
}

export interface PaymentInput {
  supplierId: string;
  expenseId: string | null;
  amount: number;
  date: string;
  method: string | null;
}

export interface ProjectExpense {
  id: string;
  budgetItemId: string;
  budgetItemDescription: string;
  amount: number;
  date: string;
  description: string | null;
}

export interface ProjectClient {
  userId: string;
  email: string;
  fullName: string;
  invitedAt: string;
  lastLoginAt: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  category: string | null;
  paidTotal: number;
  pendingBalance: number;
  projectCount: number;
}

export interface SupplierInput {
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  category: string | null;
}

export interface TaskType {
  id: string;
  name: string;
  projectCount: number;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  allProjects: boolean;
  projects: string[];
  lastLoginAt: string | null;
}

export interface Dashboard {
  pendingPayments: { total: number; paymentCount: number; supplierCount: number };
  topSupplierBalances: Array<{
    id: string;
    name: string;
    category: string | null;
    projectCount: number;
    paid: number;
    pending: number;
  }>;
  recentLogEntries: Array<{
    projectId: string;
    projectName: string;
    notes: string | null;
    createdAt: string;
    authorName: string;
    photoCount: number;
    firstPhotoUrl: string | null;
  }>;
  todayLogs: { logged: number; activeProjects: number; missing: string[] };
}
