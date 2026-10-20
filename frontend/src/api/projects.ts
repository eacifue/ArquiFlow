import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Dashboard, Project, ProjectClient, ProjectInput, StaffMember } from "./types";

export const keys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  dashboard: ["dashboard"] as const,
  staff: ["staff"] as const,
  clients: (projectId: string) => ["projects", projectId, "clients"] as const,
};

/** Cualquier cambio en una obra mueve sus semáforos: refrescar listado, detalle y dashboard. */
export function invalidateProjectHealth(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: keys.projects });
  void queryClient.invalidateQueries({ queryKey: keys.dashboard });
}

export function useProjects() {
  return useQuery({
    queryKey: keys.projects,
    queryFn: async () => (await apiClient.get<Project[]>("/api/projects")).data,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: keys.project(id ?? ""),
    queryFn: async () => (await apiClient.get<Project>(`/api/projects/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useStaff(enabled = true) {
  return useQuery({
    queryKey: keys.staff,
    queryFn: async () => (await apiClient.get<StaffMember[]>("/api/projects/staff")).data,
    enabled,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: async () => (await apiClient.get<Dashboard>("/api/dashboard")).data,
  });
}

export function useSaveProject(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInput) =>
      id
        ? (await apiClient.put<Project>(`/api/projects/${id}`, input)).data
        : (await apiClient.post<Project>("/api/projects", input)).data,
    onSuccess: () => invalidateProjectHealth(queryClient),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/projects/${id}`);
    },
    onSuccess: () => invalidateProjectHealth(queryClient),
  });
}

export function useProjectClients(projectId: string) {
  return useQuery({
    queryKey: keys.clients(projectId),
    queryFn: async () => (await apiClient.get<ProjectClient[]>(`/api/projects/${projectId}/clients`)).data,
  });
}

export function useInviteClient(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; fullName: string; password: string }) =>
      (await apiClient.post<ProjectClient>(`/api/projects/${projectId}/clients`, input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.clients(projectId) }),
  });
}

export function useRevokeClient(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/api/projects/${projectId}/clients/${userId}`);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.clients(projectId) }),
  });
}

export async function downloadProjectReport(projectId: string, projectName: string) {
  const response = await apiClient.get(`/api/projects/${projectId}/report`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-${projectName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
