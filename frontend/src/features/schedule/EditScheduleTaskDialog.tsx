import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateScheduleTask } from "./api";
import type { ScheduleTask } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const schema = z
  .object({
    name: z.string().min(1, "Requerido").max(200),
    startDate: z.string().min(1, "Requerido"),
    endDate: z.string().min(1, "Requerido"),
    progressPercent: z.coerce.number().min(0).max(100),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

interface EditScheduleTaskDialogProps {
  projectId: string;
  task: ScheduleTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditScheduleTaskDialog({ projectId, task, open, onOpenChange }: EditScheduleTaskDialogProps) {
  const updateTask = useUpdateScheduleTask(projectId, task.id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: task.name,
      startDate: task.startDate,
      endDate: task.endDate,
      progressPercent: task.progressPercent,
    },
  });

  useEffect(() => {
    reset({
      name: task.name,
      startDate: task.startDate,
      endDate: task.endDate,
      progressPercent: task.progressPercent,
    });
  }, [task, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateTask.mutateAsync({ ...values, sortOrder: task.sortOrder });
      toast.success("Tarea actualizada");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo actualizar la tarea");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-task-name">Nombre</Label>
            <Input id="edit-task-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-startDate">Fecha de inicio</Label>
              <Input id="edit-task-startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-endDate">Fecha de fin</Label>
              <Input id="edit-task-endDate" type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-task-progress">Avance (%)</Label>
            <Input id="edit-task-progress" type="number" min={0} max={100} {...register("progressPercent")} />
            {errors.progressPercent && (
              <p className="text-sm text-destructive">{errors.progressPercent.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              El estado (no iniciada / en curso / hecha / atrasada) se calcula solo a partir del avance y la
              fecha de fin.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateTask.isPending}>
              {updateTask.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
