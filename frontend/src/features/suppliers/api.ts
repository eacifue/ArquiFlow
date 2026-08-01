import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Supplier, SupplierFormInput } from "./types";

const SUPPLIERS_KEY = ["suppliers"];

export function useSuppliers() {
  return useQuery({
    queryKey: SUPPLIERS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<Supplier[]>("/api/suppliers");
      return data;
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SupplierFormInput) => {
      const { data } = await apiClient.post<Supplier>("/api/suppliers", input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
    },
  });
}

export function useUpdateSupplier(supplierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SupplierFormInput) => {
      const { data } = await apiClient.put<Supplier>(`/api/suppliers/${supplierId}`, input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId: string) => {
      await apiClient.delete(`/api/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
    },
  });
}
