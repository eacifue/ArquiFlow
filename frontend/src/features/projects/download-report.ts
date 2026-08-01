import { apiClient } from "@/lib/api-client";

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
