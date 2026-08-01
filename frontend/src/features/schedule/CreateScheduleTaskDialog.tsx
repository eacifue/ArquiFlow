import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateScheduleTask } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
            <Input id="task-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-startDate">Fecha de inicio</Label>
              <Input id="task-startDate" type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-endDate">Fecha de fin</Label>
              <Input id="task-endDate" type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
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
