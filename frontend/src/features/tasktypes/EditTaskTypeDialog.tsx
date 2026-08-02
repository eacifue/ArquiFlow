import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateTaskType } from "./api";
import type { TaskType } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";

const schema = z.object({
  name: z.string().min(1, "Requerido").max(200),
});

type FormValues = z.infer<typeof schema>;

interface EditTaskTypeDialogProps {
  taskType: TaskType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskTypeDialog({ taskType, open, onOpenChange }: EditTaskTypeDialogProps) {
  const updateTaskType = useUpdateTaskType(taskType.id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: taskType.name },
  });

  useEffect(() => {
    reset({ name: taskType.name });
  }, [taskType, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateTaskType.mutateAsync(values);
      toast.success("Tarea actualizada");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo actualizar la tarea (¿ya existe con ese nombre?)");
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
            <Label htmlFor="edit-tt-name">Nombre</Label>
            <Input id="edit-tt-name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateTaskType.isPending}>
              {updateTaskType.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
