import { useState } from "react";
import { toast } from "sonner";
import { ClipboardListIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { useDeleteTaskType, useTaskTypes } from "./api";
import { CreateTaskTypeDialog } from "./CreateTaskTypeDialog";
import { EditTaskTypeDialog } from "./EditTaskTypeDialog";
import type { TaskType } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function TaskTypesPage() {
  const { data: taskTypes, isLoading, isError } = useTaskTypes();
  const deleteTaskType = useDeleteTaskType();
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);

  const handleDelete = async (taskType: TaskType) => {
    const confirmed = await confirm({
      title: `¿Eliminar la tarea "${taskType.name}"?`,
      description: "Deja de estar disponible para elegir en tareas nuevas del cronograma.",
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteTaskType.mutateAsync(taskType.id);
      toast.success("Tarea eliminada");
    } catch {
      toast.error("No se pudo eliminar la tarea");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-display font-semibold">Maestro de tareas</h1>
        <CreateTaskTypeDialog />
      </div>
      <p className="text-sm text-muted-foreground">
        Estas son las tareas disponibles para elegir al cargar el cronograma de una obra.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando tareas...</p>}
      {isError && <p className="text-sm text-destructive">No se pudieron cargar las tareas.</p>}
      {taskTypes && taskTypes.length === 0 && (
        <EmptyState
          icon={ClipboardListIcon}
          message="Todavía no hay tareas cargadas en el maestro."
          action={<CreateTaskTypeDialog />}
        />
      )}

      {taskTypes && taskTypes.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskTypes.map((taskType) => (
              <TableRow key={taskType.id}>
                <TableCell className="font-medium">{taskType.name}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingTaskType(taskType)}>
                    <PencilIcon data-icon="inline-start" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(taskType)}>
                    <Trash2Icon data-icon="inline-start" />
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editingTaskType && (
        <EditTaskTypeDialog
          taskType={editingTaskType}
          open={Boolean(editingTaskType)}
          onOpenChange={(open) => !open && setEditingTaskType(null)}
        />
      )}
    </div>
  );
}
