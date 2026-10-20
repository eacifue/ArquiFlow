import { useState } from "react";
import { Link } from "react-router-dom";
import { useProjectClients, useRevokeClient } from "@/api/projects";
import type { Project, ProjectClient } from "@/api/types";
import { formatDate, formatWhen, initials } from "@/lib/format";
import { Button, EmptyState, Skeleton } from "@/ui/ds";
import { Avatar } from "@/ui/controls";
import { Icon } from "@/ui/Icon";
import { useConfirm, useToast } from "@/ui/overlay";
import { InviteClientDialog } from "./forms";

const CLIENT_SEES = ["Etapas y avance de la obra", "Presupuesto por rubro e invertido", "Bitácora con fotos", "Reporte PDF descargable"];

export function ClientTab({ project }: { project: Project }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: clients = [], isLoading } = useProjectClients(project.id);
  const revoke = useRevokeClient(project.id);
  const [inviting, setInviting] = useState(false);

  const remove = async (c: ProjectClient) => {
    const ok = await confirm({
      title: `¿Quitar acceso a ${c.fullName}?`,
      description: `Deja de ver ${project.name}. Su usuario no se borra y podés volver a invitarlo.`,
      confirmLabel: "Quitar acceso",
      destructive: true,
    });
    if (!ok) return;
    try {
      await revoke.mutateAsync(c.userId);
      toast.success("Acceso quitado", project.name);
    } catch {
      toast.error("No se pudo quitar el acceso");
    }
  };

  return (
    <div className="split">
      <section className="card split__main" style={{ flexBasis: 560 }}>
        <div className="card__head">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h2 className="section-title">Acceso del cliente</h2>
            <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>Personas que pueden ver esta obra en modo lectura.</span>
          </div>
          <Button icon="plus" onClick={() => setInviting(true)}>
            Invitar cliente
          </Button>
        </div>
        {isLoading ? (
          <div className="card__pad">
            <Skeleton height={56} />
          </div>
        ) : clients.length ? (
          <ul className="list-plain">
            {clients.map((c) => (
              <li key={c.userId} className="client-row">
                <Avatar initials={initials(c.fullName)} size={40} fontSize={14} />
                <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 500 }}>{c.fullName}</span>
                  <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>{c.email}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)", minWidth: 180 }}>
                  <span>
                    Invitado el <span className="af-num">{formatDate(c.invitedAt)}</span>
                  </span>
                  <span>{c.lastLoginAt ? `Último ingreso: ${formatWhen(c.lastLoginAt)}` : "Todavía no ingresó"}</span>
                </div>
                <button type="button" className="btn-danger-outline" onClick={() => remove(c)}>
                  Quitar acceso
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card__pad">
            <EmptyState icon="folder" title="Nadie tiene acceso todavía" description="Invitá al cliente para que vea el avance, la bitácora y descargue el reporte." />
          </div>
        )}
      </section>

      <aside className="card split__side" style={{ flexBasis: 320, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 className="section-title">Qué ve el cliente</h2>
        <ul className="list-plain" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CLIENT_SEES.map((v) => (
            <li key={v} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "var(--success-text)", marginTop: 2 }}>
                <Icon name="circle-check" size={16} />
              </span>
              {v}
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>
          No ve pagos, proveedores, comprobantes ni los semáforos internos.
        </p>
        <Link to={`/portal/${project.id}`} className="link-strong">
          Ver la obra como cliente
        </Link>
      </aside>

      <InviteClientDialog open={inviting} onClose={() => setInviting(false)} project={project} />
    </div>
  );
}
