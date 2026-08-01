export type ProjectStatus = "Planning" | "InProgress" | "OnHold" | "Completed" | "Cancelled";

export interface Project {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  totalBudget: number;
}

export interface CreateProjectInput {
  name: string;
  address?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  totalBudget: number;
}
