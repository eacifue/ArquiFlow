import { useState } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "@/api/projects";
import { usePermissions } from "@/lib/auth";
import { plural } from "@/lib/format";
import { Button, EmptyState, Skeleton } from "@/ui/ds";
import { ObraCardFor } from "./DashboardScreen";
import { ProjectFormDialog } from "./project/forms";

export function ProjectsScreen() {
  const { isManager } = usePermissions();
  const { data: projects = [], isLoading, isError } = useProjects();
  const [creating, setCreating] = useState(false);
  const inProgress = projects.filter((p) => p.status === "InProgress").length;

  return (
    <main className="app-main">
      <header className="page-head page-head--end">
        <div className="page-head__titles">
          <h1 className="page-title">Obras</h1>
          <p className="page-sub">{`${plural(projects.length, "obra", "obras")} · ${inProgress} en curso`}</p>
        </div>
        {isManager ? (
          <div className="page-actions">
            <Button icon="plus" onClick={() => setCreating(true)}>
              Nueva obra
            </Button>
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <div className="grid-cards">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={300} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState tone="error" icon="octagon-x" title="No se pudieron cargar las obras" description="Revisá la conexión e intentá de nuevo." />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Todavía no hay obras"
          description="Creá la primera obra para cargar su presupuesto, cronograma y bitácora."
          action={isManager ? <Button icon="plus" onClick={() => setCreating(true)}>Nueva obra</Button> : null}
        />
      ) : (
        <div className="grid-cards">
          {projects.map((p) => (
            <Link key={p.id} className="obra-link" to={`/obras/${p.id}`}>
              <ObraCardFor project={p} />
            </Link>
          ))}
        </div>
      )}

      <ProjectFormDialog open={creating} onClose={() => setCreating(false)} />
    </main>
  );
}
