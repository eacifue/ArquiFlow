import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TaskType, TaskTypeFormInput } from "./types";

const TASK_TYPES_KEY = ["task-types"];

export function useTaskTypes() {
  return useQuery({
    queryKey: TASK_TYPES_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<TaskType[]>("/api/task-types");
      return data;
    },
  });
}

export function useCreateTaskType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaskTypeFormInput) => {
      const { data } = await apiClient.post<TaskType>("/api/task-types", input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASK_TYPES_KEY });
    },
  });
}

export function useUpdateTaskType(taskTypeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaskTypeFormInput) => {
      const { data } = await apiClient.put<TaskType>(`/api/task-types/${taskTypeId}`, input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASK_TYPES_KEY });
    },
  });
}

export function useDeleteTaskType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskTypeId: string) => {
      await apiClient.delete(`/api/task-types/${taskTypeId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASK_TYPES_KEY });
    },
  });
}
