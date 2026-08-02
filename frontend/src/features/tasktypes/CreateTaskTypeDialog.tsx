import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { useCreateTaskType } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().min(1, "Requerido").max(200),
});

type FormValues = z.infer<typeof schema>;

export function CreateTaskTypeDialog() {
  const [open, setOpen] = useState(false);
  const createTaskType = useCreateTaskType();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTaskType.mutateAsync(values);
      toast.success("Tarea creada");
      reset();
      setOpen(false);
    } catch {
      toast.error("No se pudo crear la tarea (¿ya existe con ese nombre?)");
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
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Nueva tarea
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="tt-name">Nombre</Label>
            <Input id="tt-name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createTaskType.isPending}>
              {createTaskType.isPending ? "Creando..." : "Crear tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
