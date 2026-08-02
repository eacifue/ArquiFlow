import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateUser } from "./api";
import type { InternalRole } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/ui/field-error";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ROLE_OPTIONS: { value: InternalRole; label: string }[] = [
  { value: "Admin", label: "Admin" },
  { value: "ProjectManager", label: "Arquitecto / PM" },
  { value: "Supervisor", label: "Supervisor de obra" },
];

const schema = z.object({
  email: z.string().min(1, "Requerido").email("Email inválido"),
  fullName: z.string().min(1, "Requerido").max(200),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["Admin", "ProjectManager", "Supervisor"]),
});

type FormValues = z.infer<typeof schema>;

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "Supervisor" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createUser.mutateAsync(values);
      toast.success("Usuario creado");
      reset({ email: "", fullName: "", password: "", role: "Supervisor" });
      setOpen(false);
    } catch {
      toast.error("No se pudo crear el usuario (¿el email ya existe?)");
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
      <DialogTrigger render={<Button />}>Nuevo usuario</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario interno</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="user-fullName">Nombre completo</Label>
            <Input id="user-fullName" {...register("fullName")} />
            <FieldError message={errors.fullName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Contraseña</Label>
            <Input id="user-password" type="password" {...register("password")} />
            <FieldError message={errors.password?.message} />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={watch("role")} onValueChange={(value) => setValue("role", value as InternalRole)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: InternalRole) => ROLE_OPTIONS.find((option) => option.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
