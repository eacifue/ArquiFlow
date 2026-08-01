import { Link } from "react-router-dom";
import { useProjects } from "./api";
import { useAuth } from "@/features/auth/auth-context";
import { CreateProjectDialog } from "./CreateProjectDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  Planning: "Planificación",
  InProgress: "En curso",
  OnHold: "En pausa",
  Completed: "Completada",
  Cancelled: "Cancelada",
};

export function ProjectsListPage() {
  const { data: projects, isLoading, isError } = useProjects();
  const { user } = useAuth();
  const canManageProjects = user?.roles.some((r) => r === "Admin" || r === "ProjectManager");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Obras</h1>
        {canManageProjects && <CreateProjectDialog />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando obras...</p>}
      {isError && <p className="text-sm text-destructive">No se pudieron cargar las obras.</p>}

      {projects && projects.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no hay obras cargadas.</p>
      )}

      {projects && projects.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Presupuesto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link to={`/projects/${project.id}`} className="font-medium hover:underline">
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>{project.address ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{STATUS_LABEL[project.status] ?? project.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {project.totalBudget.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
