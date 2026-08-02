import { useState } from "react";
import { toast } from "sonner";
import { CalendarDaysIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { useDeleteScheduleTask, useScheduleTasks } from "./api";
import { CreateScheduleTaskDialog } from "./CreateScheduleTaskDialog";
import { EditScheduleTaskDialog } from "./EditScheduleTaskDialog";
import { GanttChart } from "./GanttChart";
import type { ScheduleTask } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_LABEL: Record<ScheduleTask["status"], string> = {
  NotStarted: "No iniciada",
  InProgress: "En curso",
  Done: "Hecha",
  Delayed: "Atrasada",
};

export function ScheduleTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { data: tasks, isLoading, isError } = useScheduleTasks(projectId);
  const deleteTask = useDeleteScheduleTask(projectId);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);

  const canManage = user?.roles.some((r) => r === "Admin" || r === "ProjectManager") ?? false;

  const handleDelete = async (task: ScheduleTask) => {
    const confirmed = await confirm({
      title: `¿Eliminar la tarea "${task.name}"?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Tarea eliminada");
    } catch {
      toast.error("No se pudo eliminar la tarea");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cronograma</h2>
        {canManage && <CreateScheduleTaskDialog projectId={projectId} nextSortOrder={tasks?.length ?? 0} />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando cronograma...</p>}
      {isError && <p className="text-sm text-destructive">No se pudo cargar el cronograma.</p>}
      {tasks && tasks.length === 0 && (
        <EmptyState
          icon={CalendarDaysIcon}
          message="Todavía no hay tareas cargadas."
          action={
            canManage && <CreateScheduleTaskDialog projectId={projectId} nextSortOrder={tasks?.length ?? 0} />
          }
        />
      )}

      {tasks && tasks.length > 0 && (
        <>
          <GanttChart
            projectId={projectId}
            tasks={tasks}
            editable={canManage}
            onEditTask={setEditingTask}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Avance</TableHead>
                <TableHead>Estado</TableHead>
                {canManage && <TableHead className="w-0" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>{task.startDate}</TableCell>
                  <TableCell>{task.endDate}</TableCell>
                  <TableCell>{task.progressPercent}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        task.status === "Delayed"
                          ? "destructive"
                          : task.status === "Done"
                            ? "success"
                            : "secondary"
                      }
                    >
                      {STATUS_LABEL[task.status]}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingTask(task)}>
                        <PencilIcon data-icon="inline-start" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(task)}>
                        <Trash2Icon data-icon="inline-start" />
                        Eliminar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {editingTask && (
        <EditScheduleTaskDialog
          projectId={projectId}
          task={editingTask}
          open={Boolean(editingTask)}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}
    </div>
  );
}
