import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateScheduleTask } from "./api";
import { useTaskTypes } from "@/features/tasktypes/api";
import type { ScheduleTask } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

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
  const { data: taskTypes, isLoading: taskTypesLoading } = useTaskTypes();
  const {
    control,
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
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="edit-task-name" className="w-full">
                    <SelectValue placeholder={taskTypesLoading ? "Cargando..." : "Elegir tarea"} />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes?.map((taskType) => (
                      <SelectItem key={taskType.id} value={taskType.name}>
                        {taskType.name}
                      </SelectItem>
                    ))}
                    {/* The task's current name might not exist in the master anymore
                        (renamed/deleted after this task was created) — keep it selectable
                        so editing doesn't force a change the user didn't ask for. */}
                    {task.name && !taskTypes?.some((t) => t.name === task.name) && (
                      <SelectItem value={task.name}>{task.name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-startDate">Fecha de inicio</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker id="edit-task-startDate" value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-endDate">Fecha de fin</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DatePicker id="edit-task-endDate" value={field.value} onChange={field.onChange} />
                )}
              />
              <FieldError message={errors.endDate?.message} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-task-progress">Avance (%)</Label>
            <Input id="edit-task-progress" type="number" min={0} max={100} {...register("progressPercent")} />
            <FieldError message={errors.progressPercent?.message} />
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
