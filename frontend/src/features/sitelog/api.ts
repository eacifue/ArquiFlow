import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreateSiteLogEntryInput, SiteLogEntry } from "./types";

function siteLogKey(projectId: string) {
  return ["projects", projectId, "site-log-entries"];
}

export function useSiteLogEntries(projectId: string) {
  return useQuery({
    queryKey: siteLogKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<SiteLogEntry[]>(`/api/projects/${projectId}/site-log-entries`);
      return data;
    },
  });
}

export function useCreateSiteLogEntry(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSiteLogEntryInput) => {
      const formData = new FormData();
      formData.append("date", input.date);
      if (input.notes) formData.append("notes", input.notes);
      if (input.weather) formData.append("weather", input.weather);
      input.photos.forEach((photo) => formData.append("photos", photo));

      const { data } = await apiClient.post<SiteLogEntry>(
        `/api/projects/${projectId}/site-log-entries`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteLogKey(projectId) });
    },
  });
}

export function useDeleteSiteLogEntry(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      await apiClient.delete(`/api/projects/${projectId}/site-log-entries/${entryId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteLogKey(projectId) });
    },
  });
}
