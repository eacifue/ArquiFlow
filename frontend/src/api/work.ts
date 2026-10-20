import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { invalidateProjectHealth } from "./projects";
import type {
  BudgetItem,
  BudgetItemInput,
  ExpenseInput,
  Payment,
  PaymentInput,
  PaymentStatus,
  ProjectExpense,
  ScheduleTask,
  SiteLogEntry,
  SiteLogEntryInput,
} from "./types";

// Presupuesto, cronograma, bitácora y pagos de una obra.

const k = {
  budget: (p: string) => ["projects", p, "budget-items"] as const,
  schedule: (p: string) => ["projects", p, "schedule-tasks"] as const,
  sitelog: (p: string) => ["projects", p, "site-log"] as const,
  payments: (p: string) => ["projects", p, "payments"] as const,
  expenses: (p: string) => ["projects", p, "expenses"] as const,
};

/* ---------- presupuesto ---------- */

export function useBudgetItems(projectId: string) {
  return useQuery({
    queryKey: k.budget(projectId),
    queryFn: async () => (await apiClient.get<BudgetItem[]>(`/api/projects/${projectId}/budget-items`)).data,
  });
}

export function useSaveBudgetItem(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: BudgetItemInput }) =>
      id
        ? (await apiClient.put<BudgetItem>(`/api/projects/${projectId}/budget-items/${id}`, input)).data
        : (await apiClient.post<BudgetItem>(`/api/projects/${projectId}/budget-items`, input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.budget(projectId) });
      invalidateProjectHealth(queryClient);
    },
  });
}

export function useDeleteBudgetItem(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/projects/${projectId}/budget-items/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.budget(projectId) });
      invalidateProjectHealth(queryClient);
    },
  });
}

export function useCreateExpense(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ budgetItemId, input }: { budgetItemId: string; input: ExpenseInput }) => {
      const form = new FormData();
      form.append("amount", String(input.amount));
      form.append("date", input.date);
      if (input.description) form.append("description", input.description);
      if (input.supplierId) form.append("supplierId", input.supplierId);
      if (input.receipt) form.append("receipt", input.receipt);
      return (await apiClient.post(`/api/budget-items/${budgetItemId}/expenses`, form)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.budget(projectId) });
      void queryClient.invalidateQueries({ queryKey: k.expenses(projectId) });
      invalidateProjectHealth(queryClient);
    },
  });
}

export function useProjectExpenses(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: k.expenses(projectId),
    queryFn: async () => (await apiClient.get<ProjectExpense[]>(`/api/projects/${projectId}/expenses`)).data,
    enabled,
  });
}

/* ---------- cronograma ---------- */

export function useScheduleTasks(projectId: string) {
  return useQuery({
    queryKey: k.schedule(projectId),
    queryFn: async () => (await apiClient.get<ScheduleTask[]>(`/api/projects/${projectId}/schedule-tasks`)).data,
  });
}

export interface TaskInput {
  name: string;
  startDate: string;
  endDate: string;
  progressPercent: number;
  sortOrder: number;
}

export function useSaveTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: TaskInput }) =>
      id
        ? (await apiClient.put<ScheduleTask>(`/api/projects/${projectId}/schedule-tasks/${id}`, input)).data
        : (await apiClient.post<ScheduleTask>(`/api/projects/${projectId}/schedule-tasks`, input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.schedule(projectId) });
      invalidateProjectHealth(queryClient);
    },
  });
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, startDate, endDate, progressPercent }: { id: string; startDate: string; endDate: string; progressPercent: number }) =>
      (await apiClient.patch<ScheduleTask>(`/api/projects/${projectId}/schedule-tasks/${id}/schedule`, {
        startDate,
        endDate,
        progressPercent,
      })).data,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: k.schedule(projectId) });
      const previous = queryClient.getQueryData<ScheduleTask[]>(k.schedule(projectId));
      queryClient.setQueryData<ScheduleTask[]>(k.schedule(projectId), (tasks) =>
        tasks?.map((t) => (t.id === vars.id ? { ...t, startDate: vars.startDate, endDate: vars.endDate } : t)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(k.schedule(projectId), ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: k.schedule(projectId) });
      invalidateProjectHealth(queryClient);
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/projects/${projectId}/schedule-tasks/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.schedule(projectId) });
      invalidateProjectHealth(queryClient);
    },
  });
}

/* ---------- bitácora ---------- */

export function useSiteLog(projectId: string) {
  return useQuery({
    queryKey: k.sitelog(projectId),
    queryFn: async () => (await apiClient.get<SiteLogEntry[]>(`/api/projects/${projectId}/site-log-entries`)).data,
  });
}

export async function uploadSiteLogPhoto(projectId: string, file: File, onProgress: (pct: number) => void) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<{ fileUrl: string }>(`/api/projects/${projectId}/site-log-entries/photos`, form, {
    onUploadProgress: (e) => {
      if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data.fileUrl;
}

export function useSaveSiteLogEntry(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: SiteLogEntryInput }) =>
      id
        ? (await apiClient.put<SiteLogEntry>(`/api/projects/${projectId}/site-log-entries/${id}`, input)).data
        : (await apiClient.post<SiteLogEntry>(`/api/projects/${projectId}/site-log-entries`, input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.sitelog(projectId) });
      invalidateProjectHealth(queryClient);
    },
  });
}

export function useDeleteSiteLogEntry(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/projects/${projectId}/site-log-entries/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.sitelog(projectId) });
      invalidateProjectHealth(queryClient);
    },
  });
}

/* ---------- pagos ---------- */

export function usePayments(projectId: string) {
  return useQuery({
    queryKey: k.payments(projectId),
    queryFn: async () => (await apiClient.get<Payment[]>(`/api/projects/${projectId}/payments`)).data,
  });
}

export function useCreatePayment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PaymentInput) => (await apiClient.post<Payment>(`/api/projects/${projectId}/payments`, input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.payments(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      invalidateProjectHealth(queryClient);
    },
  });
}

export function useSetPaymentStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentStatus }) =>
      (await apiClient.patch<Payment>(`/api/projects/${projectId}/payments/${id}/status`, { status })).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: k.payments(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      invalidateProjectHealth(queryClient);
    },
  });
}
