import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { BudgetItem, BudgetItemFormInput, CreateExpenseInput, Expense } from "./types";

function budgetItemsKey(projectId: string) {
  return ["projects", projectId, "budget-items"];
}

function expensesKey(budgetItemId: string) {
  return ["budget-items", budgetItemId, "expenses"];
}

export function useBudgetItems(projectId: string) {
  return useQuery({
    queryKey: budgetItemsKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<BudgetItem[]>(`/api/projects/${projectId}/budget-items`);
      return data;
    },
  });
}

export function useCreateBudgetItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BudgetItemFormInput) => {
      const { data } = await apiClient.post<BudgetItem>(`/api/projects/${projectId}/budget-items`, input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetItemsKey(projectId) });
    },
  });
}

export function useUpdateBudgetItem(projectId: string, budgetItemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BudgetItemFormInput) => {
      const { data } = await apiClient.put<BudgetItem>(
        `/api/projects/${projectId}/budget-items/${budgetItemId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetItemsKey(projectId) });
    },
  });
}

export function useDeleteBudgetItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetItemId: string) => {
      await apiClient.delete(`/api/projects/${projectId}/budget-items/${budgetItemId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetItemsKey(projectId) });
    },
  });
}

export function useExpenses(budgetItemId: string, enabled: boolean) {
  return useQuery({
    queryKey: expensesKey(budgetItemId),
    queryFn: async () => {
      const { data } = await apiClient.get<Expense[]>(`/api/budget-items/${budgetItemId}/expenses`);
      return data;
    },
    enabled,
  });
}

export function useCreateExpense(projectId: string, budgetItemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const formData = new FormData();
      formData.append("amount", String(input.amount));
      formData.append("date", input.date);
      if (input.description) formData.append("description", input.description);
      if (input.receipt) formData.append("receipt", input.receipt);

      const { data } = await apiClient.post<Expense>(
        `/api/budget-items/${budgetItemId}/expenses`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesKey(budgetItemId) });
      void queryClient.invalidateQueries({ queryKey: budgetItemsKey(projectId) });
    },
  });
}

export function useDeleteExpense(projectId: string, budgetItemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      await apiClient.delete(`/api/budget-items/${budgetItemId}/expenses/${expenseId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesKey(budgetItemId) });
      void queryClient.invalidateQueries({ queryKey: budgetItemsKey(projectId) });
    },
  });
}
