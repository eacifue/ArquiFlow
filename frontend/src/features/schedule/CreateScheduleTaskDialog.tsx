import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateScheduleTask } from "./api";
import { useTaskTypes } from "@/features/tasktypes/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z
  .object({
    name: z.string().min(1, "Requerido").max(200),
    startDate: z.string().min(1, "Requerido"),
    endDate: z.string().min(1, "Requerido"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

export function CreateScheduleTaskDialog({ projectId, nextSortOrder }: { projectId: string; nextSortOrder: number }) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateScheduleTask(projectId);
  const { data: taskTypes, isLoading: taskTypesLoading } = useTaskTypes();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", startDate: "", endDate: "" } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTask.mutateAsync({ ...values, sortOrder: nextSortOrder });
      toast.success("Tarea creada");
      reset();
      setOpen(false);
    } catch {
      toast.error("No se pudo crear la tarea");
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>Nueva tarea</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea del cronograma</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-name">Nombre</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-name" className="w-full">
                    <SelectValue placeholder={taskTypesLoading ? "Cargando..." : "Elegir tarea"} />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes?.map((taskType) => (
                      <SelectItem key={taskType.id} value={taskType.name}>
                        {taskType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.name?.message} />
            {taskTypes && taskTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todavía no hay tareas en el maestro. Un Admin puede cargarlas en "Maestro de tareas".
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-startDate">Fecha de inicio</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker id="task-startDate" value={field.value} onChange={field.onChange} />
                )}
              />
              <FieldError message={errors.startDate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-endDate">Fecha de fin</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DatePicker id="task-endDate" value={field.value} onChange={field.onChange} />
                )}
              />
              <FieldError message={errors.endDate?.message} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Creando..." : "Crear tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
