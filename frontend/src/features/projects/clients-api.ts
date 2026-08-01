import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ProjectClient {
  userId: string;
  email: string;
  fullName: string;
}

export interface InviteProjectClientInput {
  email: string;
  fullName: string;
  password: string;
}

function clientsKey(projectId: string) {
  return ["projects", projectId, "clients"];
}

export function useProjectClients(projectId: string) {
  return useQuery({
    queryKey: clientsKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectClient[]>(`/api/projects/${projectId}/clients`);
      return data;
    },
  });
}

export function useInviteProjectClient(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteProjectClientInput) => {
      const { data } = await apiClient.post<ProjectClient>(`/api/projects/${projectId}/clients`, input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKey(projectId) });
    },
  });
}

export function useRevokeProjectClient(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/api/projects/${projectId}/clients/${userId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKey(projectId) });
    },
  });
}
