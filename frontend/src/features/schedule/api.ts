import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  ScheduleTask,
  ScheduleTaskFormInput,
  UpdateScheduleRequest,
  UpdateScheduleTaskInput,
} from "./types";

function scheduleTasksKey(projectId: string) {
  return ["projects", projectId, "schedule-tasks"];
}

export function useScheduleTasks(projectId: string) {
  return useQuery({
    queryKey: scheduleTasksKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<ScheduleTask[]>(`/api/projects/${projectId}/schedule-tasks`);
      return data;
    },
  });
}

export function useCreateScheduleTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ScheduleTaskFormInput) => {
      const { data } = await apiClient.post<ScheduleTask>(`/api/projects/${projectId}/schedule-tasks`, input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTasksKey(projectId) });
    },
  });
}

export function useUpdateScheduleTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateScheduleTaskInput) => {
      const { data } = await apiClient.put<ScheduleTask>(
        `/api/projects/${projectId}/schedule-tasks/${taskId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTasksKey(projectId) });
    },
  });
}

export function useUpdateTaskSchedule(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, ...input }: UpdateScheduleRequest & { taskId: string }) => {
      const { data } = await apiClient.patch<ScheduleTask>(
        `/api/projects/${projectId}/schedule-tasks/${taskId}/schedule`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTasksKey(projectId) });
    },
  });
}

export function useDeleteScheduleTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(`/api/projects/${projectId}/schedule-tasks/${taskId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleTasksKey(projectId) });
    },
  });
}
