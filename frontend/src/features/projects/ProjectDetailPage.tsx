import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteProject, useProject } from "./api";
import { downloadProjectReport } from "./download-report";
import { useAuth } from "@/features/auth/auth-context";
import { EditProjectDialog } from "./EditProjectDialog";
import { ProjectClientsSection } from "./ProjectClientsSection";
import { BudgetTab } from "@/features/budget/BudgetTab";
import { ScheduleTab } from "@/features/schedule/ScheduleTab";
import { SiteLogTab } from "@/features/sitelog/SiteLogTab";
import { PaymentsTab } from "@/features/payments/PaymentsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteProject = useDeleteProject();
  const [editOpen, setEditOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const canManageProject = user?.roles.some((r) => r === "Admin" || r === "ProjectManager");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando obra...</p>;
  }

  if (!project) {
    return <p className="text-sm text-destructive">Obra no encontrada.</p>;
  }

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      await downloadProjectReport(project.id, project.name);
    } catch {
      toast.error("No se pudo generar el reporte");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la obra "${project.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Obra eliminada");
      navigate("/projects");
    } catch {
      toast.error("No se pudo eliminar la obra");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.address}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={isDownloading}>
            {isDownloading ? "Generando..." : "Descargar reporte"}
          </Button>
          {canManageProject && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteProject.isPending}>
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Cronograma</TabsTrigger>
          <TabsTrigger value="budget">Presupuesto</TabsTrigger>
          <TabsTrigger value="sitelog">Bitácora</TabsTrigger>
          {canManageProject && <TabsTrigger value="payments">Pagos</TabsTrigger>}
          {canManageProject && <TabsTrigger value="client">Cliente</TabsTrigger>}
        </TabsList>
        <TabsContent value="schedule">
          <ScheduleTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="sitelog">
          <SiteLogTab projectId={project.id} />
        </TabsContent>
        {canManageProject && (
          <TabsContent value="payments">
            <PaymentsTab projectId={project.id} />
          </TabsContent>
        )}
        {canManageProject && (
          <TabsContent value="client">
            <ProjectClientsSection projectId={project.id} />
          </TabsContent>
        )}
      </Tabs>

      <EditProjectDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
