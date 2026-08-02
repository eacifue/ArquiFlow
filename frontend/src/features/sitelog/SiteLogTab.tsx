import { NotebookPenIcon } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useSiteLogEntries } from "./api";
import { CreateSiteLogEntryDialog } from "./CreateSiteLogEntryDialog";
import { SiteLogTimeline } from "./SiteLogTimeline";
import { EmptyState } from "@/components/ui/empty-state";

export function SiteLogTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { data: entries, isLoading, isError } = useSiteLogEntries(projectId);

  const canManage = user?.roles.some((r) => r === "Admin" || r === "ProjectManager") ?? false;
  const canCreate = canManage || (user?.roles.includes("Supervisor") ?? false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bitácora de obra</h2>
        {canCreate && <CreateSiteLogEntryDialog projectId={projectId} />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando bitácora...</p>}
      {isError && <p className="text-sm text-destructive">No se pudo cargar la bitácora.</p>}
      {entries && entries.length === 0 && (
        <EmptyState
          icon={NotebookPenIcon}
          message="Todavía no hay entradas de bitácora."
          action={canCreate && <CreateSiteLogEntryDialog projectId={projectId} />}
        />
      )}

      {entries && entries.length > 0 && (
        <SiteLogTimeline projectId={projectId} entries={entries} canManage={canManage} />
      )}
    </div>
  );
}
