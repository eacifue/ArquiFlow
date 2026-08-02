import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { confirm } from "@/components/ui/confirm-dialog";
import { useInviteProjectClient, useProjectClients, useRevokeProjectClient } from "./clients-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";

const schema = z.object({
  email: z.string().min(1, "Requerido").email("Email inválido"),
  fullName: z.string().min(1, "Requerido").max(200),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export function ProjectClientsSection({ projectId }: { projectId: string }) {
  const { data: clients, isLoading } = useProjectClients(projectId);
  const inviteClient = useInviteProjectClient(projectId);
  const revokeClient = useRevokeProjectClient(projectId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await inviteClient.mutateAsync(values);
      toast.success("Cliente vinculado a la obra");
      reset();
    } catch {
      toast.error("No se pudo vincular al cliente");
    }
  });

  const handleRevoke = async (userId: string) => {
    const confirmed = await confirm({
      title: "¿Quitarle el acceso a esta obra a este cliente?",
      description: "Va a dejar de poder ver el cronograma, presupuesto y bitácora de esta obra.",
      confirmLabel: "Quitar acceso",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await revokeClient.mutateAsync(userId);
      toast.success("Acceso revocado");
    } catch {
      toast.error("No se pudo revocar el acceso");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acceso del cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {clients && clients.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay ningún cliente con acceso a esta obra.
            </p>
          )}
          {clients && clients.length > 0 && (
            <ul className="space-y-2">
              {clients.map((client) => (
                <li key={client.userId} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{client.fullName}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(client.userId)}>
                    Quitar acceso
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitar cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="client-fullName">Nombre completo</Label>
              <Input id="client-fullName" {...register("fullName")} />
              <FieldError message={errors.fullName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input id="client-email" type="email" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-password">Contraseña</Label>
              <Input id="client-password" type="password" {...register("password")} />
              <FieldError message={errors.password?.message} />
              <p className="text-xs text-muted-foreground">
                Si el cliente ya tiene una cuenta (por otra obra), este campo se ignora.
              </p>
            </div>
            <Button type="submit" disabled={inviteClient.isPending}>
              {inviteClient.isPending ? "Vinculando..." : "Vincular cliente"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
