import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreatePaymentInput, Payment, PaymentStatus, ProjectExpense } from "./types";

function paymentsKey(projectId: string) {
  return ["projects", projectId, "payments"];
}

export function usePayments(projectId: string) {
  return useQuery({
    queryKey: paymentsKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<Payment[]>(`/api/projects/${projectId}/payments`);
      return data;
    },
  });
}

export function useProjectExpenses(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["projects", projectId, "expenses"],
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectExpense[]>(`/api/projects/${projectId}/expenses`);
      return data;
    },
    enabled,
  });
}

export function useCreatePayment(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePaymentInput) => {
      const { data } = await apiClient.post<Payment>(`/api/projects/${projectId}/payments`, input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentsKey(projectId) });
    },
  });
}

export function useUpdatePaymentStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: string; status: PaymentStatus }) => {
      const { data } = await apiClient.patch<Payment>(
        `/api/projects/${projectId}/payments/${paymentId}/status`,
        { status },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentsKey(projectId) });
    },
  });
}

export function useDeletePayment(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      await apiClient.delete(`/api/projects/${projectId}/payments/${paymentId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentsKey(projectId) });
    },
  });
}
