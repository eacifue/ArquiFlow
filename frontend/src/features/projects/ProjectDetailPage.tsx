import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { DownloadIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
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
    const confirmed = await confirm({
      title: `¿Eliminar la obra "${project.name}"?`,
      description: "Se borra junto con su cronograma, presupuesto, bitácora y pagos. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar obra",
      variant: "destructive",
    });
    if (!confirmed) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-display font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={isDownloading}>
            <DownloadIcon data-icon="inline-start" />
            {isDownloading ? "Generando..." : "Descargar reporte"}
          </Button>
          {canManageProject && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <PencilIcon data-icon="inline-start" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteProject.isPending}>
                <Trash2Icon data-icon="inline-start" />
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
