import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Role } from "@/lib/auth";
import { invalidateProjectHealth } from "./projects";
import type { AppUser, Supplier, SupplierInput, TaskType } from "./types";

// Recursos compartidos entre obras: proveedores, maestro de tareas y usuarios.

/* ---------- proveedores ---------- */

export function useSuppliers(enabled = true) {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await apiClient.get<Supplier[]>("/api/suppliers")).data,
    enabled,
  });
}

export function useSaveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: SupplierInput }) =>
      id
        ? (await apiClient.put<Supplier>(`/api/suppliers/${id}`, input)).data
        : (await apiClient.post<Supplier>("/api/suppliers", input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/suppliers/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      invalidateProjectHealth(queryClient);
    },
  });
}

/* ---------- maestro de tareas ---------- */

export function useTaskTypes(enabled = true) {
  return useQuery({
    queryKey: ["task-types"],
    queryFn: async () => (await apiClient.get<TaskType[]>("/api/task-types")).data,
    enabled,
  });
}

export function useSaveTaskType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id?: string; name: string }) =>
      id
        ? (await apiClient.put<TaskType>(`/api/task-types/${id}`, { name })).data
        : (await apiClient.post<TaskType>("/api/task-types", { name })).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-types"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteTaskType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/task-types/${id}`);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["task-types"] }),
  });
}

/* ---------- usuarios ---------- */

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => (await apiClient.get<AppUser[]>("/api/users")).data,
  });
}

export function useSaveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id?: string;
      input: { email: string; fullName: string; role: Role; password?: string };
    }) => {
      if (id) {
        await apiClient.put(`/api/users/${id}`, input);
      } else {
        await apiClient.post("/api/users", input);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      await apiClient.post(`/api/users/${id}/reset-password`, { password });
    },
  });
}
