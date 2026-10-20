import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard, useProjects } from "@/api/projects";
import type { Project } from "@/api/types";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { formatARS, formatLongToday, formatWhen, plural } from "@/lib/format";
import { attentionScore, budgetDetail, compareAttention, healthLevel, lastActivity, PROJECT_STATUS_LABEL, scheduleDetail } from "@/lib/labels";
import { resolveFileUrl } from "@/lib/api-client";
import { Button, EmptyState, ObraCard, Skeleton, Stat } from "@/ui/ds";
import { Icon } from "@/ui/Icon";
import { ProjectFormDialog } from "./project/forms";

export function ObraCardFor({ project }: { project: Project }) {
  const m = project.metrics;
  return (
    <ObraCard
      nombre={project.name}
      direccion={project.address}
      estado={PROJECT_STATUS_LABEL[project.status]}
      avance={m.progress}
      avancePrevisto={m.plannedProgress}
      presupuesto={m.budgeted}
      gastado={m.spent}
      saludCronograma={healthLevel(m.scheduleHealth)}
      detalleCronograma={scheduleDetail(project)}
      saludPresupuesto={healthLevel(m.budgetHealth)}
      detallePresupuesto={budgetDetail(project)}
      ultimaActividad={lastActivity(project)}
    />
  );
}

function deviationHint(projects: Project[], key: "scheduleHealth" | "budgetHealth", one: string, many: string) {
  const critical = projects.filter((p) => p.metrics[key] === "Critico").length;
  const risk = projects.filter((p) => p.metrics[key] === "Riesgo").length;
  if (!critical && !risk) return "Todas en término";
  return [critical ? plural(critical, one, many) : null, risk ? `${risk} en riesgo` : null].filter(Boolean).join(" · ");
}

export function DashboardScreen() {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const projectsQuery = useProjects();
  const dashboardQuery = useDashboard();
  const [creating, setCreating] = useState(false);

  const projects = projectsQuery.data ?? [];
  const active = projects.filter((p) => p.status !== "Completed" && p.status !== "Cancelled");
  const inProgress = projects.filter((p) => p.status === "InProgress");
  const scheduleOff = active.filter((p) => p.metrics.scheduleHealth !== "Ok");
  const budgetOff = active.filter((p) => p.metrics.budgetHealth !== "Ok");
  const attention = active
    .filter((p) => attentionScore(p) > 0)
    .sort(compareAttention);
  const d = dashboardQuery.data;
  const missing = d?.todayLogs.missing ?? [];

  return (
    <main className="app-main app-main--home">
      <header className="page-head">
        <div className="page-head__titles">
          <h1 className="page-title">Inicio</h1>
          <p className="page-sub">
            {`${formatLongToday()} · ${plural(active.length, "obra activa", "obras activas")} · ${inProgress.length} en curso`}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="theme-btn" onClick={toggle} aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}>
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <Button variant="ghost" onClick={logout}>
            Cerrar sesión
          </Button>
          <Button icon="plus" onClick={() => setCreating(true)}>
            Nueva obra
          </Button>
        </div>
      </header>

      <section aria-label="Resumen" className="grid-stats">
        <Stat
          label="Cronograma con desvío"
          value={plural(scheduleOff.length, "obra", "obras")}
          hint={deviationHint(active, "scheduleHealth", "crítica", "críticas")}
          tone={scheduleOff.length ? "danger" : "success"}
        />
        <Stat
          label="Presupuesto con desvío"
          value={plural(budgetOff.length, "obra", "obras")}
          hint={deviationHint(active, "budgetHealth", "excedida", "excedidas")}
          tone={budgetOff.length ? "danger" : "success"}
        />
        <Stat
          label="Pagos pendientes"
          value={d ? formatARS(d.pendingPayments.total, { compact: true }) : "—"}
          hint={d ? `${plural(d.pendingPayments.paymentCount, "pago", "pagos")} a ${plural(d.pendingPayments.supplierCount, "proveedor", "proveedores")}` : undefined}
          tone={d && d.pendingPayments.total > 0 ? "warning" : undefined}
        />
        <Stat
          label="Bitácoras de hoy"
          value={d ? `${d.todayLogs.logged} de ${d.todayLogs.activeProjects}` : "—"}
          hint={
            !d
              ? undefined
              : missing.length === 0
                ? "Todas las obras en curso cargaron bitácora"
                : `${missing.length === 1 ? "Falta" : "Faltan"} ${missing.length > 2 ? `${missing.slice(0, 2).join(", ")} y ${missing.length - 2} más` : missing.join(" y ")}`
          }
        />
      </section>

      <section className="section">
        <div className="section__head section__head--baseline">
          <h2 className="section-title">Requieren atención</h2>
          <Link to="/obras" className="link-strong">
            {`Ver las ${projects.length} obras`}
          </Link>
        </div>
        {projectsQuery.isLoading ? (
          <div className="grid-cards">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={300} />
            ))}
          </div>
        ) : projectsQuery.isError ? (
          <EmptyState tone="error" icon="octagon-x" title="No se pudieron cargar las obras" description="Revisá la conexión e intentá de nuevo." />
        ) : attention.length === 0 ? (
          <EmptyState icon="circle-check" title="Nada que atender" description="Todas las obras activas van en término de cronograma y presupuesto." />
        ) : (
          <div className="grid-cards">
            {attention.map((p) => (
              <Link key={p.id} className="obra-link" to={`/obras/${p.id}`}>
                <ObraCardFor project={p} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid-2">
        <section className="card card--col">
          <div className="card__head">
            <h2 className="section-title">Mayores saldos pendientes</h2>
            <Link to="/proveedores" className="link-strong" style={{ fontSize: 13 }}>
              Ver proveedores
            </Link>
          </div>
          {d && d.topSupplierBalances.length === 0 ? (
            <p className="card__foot">No hay pagos pendientes.</p>
          ) : (
            <div className="scroll-x">
              <table className="af-table" style={{ minWidth: 420 }}>
                <thead>
                  <tr>
                    <th className="pl">Proveedor</th>
                    <th className="af-r">Pagado</th>
                    <th className="af-r pr">Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {(d?.topSupplierBalances ?? []).map((s) => (
                    <tr key={s.id}>
                      <td className="pl">
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                        <div className="af-meta">
                          {[s.category, plural(s.projectCount, "obra", "obras")].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="af-num af-r" style={{ color: "var(--muted-foreground)" }}>
                        {formatARS(s.paid)}
                      </td>
                      <td className="af-num af-r pr" style={{ fontWeight: 600, color: "var(--warning-text)" }}>
                        {formatARS(s.pending)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card card--col">
          <div className="card__head">
            <h2 className="section-title">Última actividad en bitácora</h2>
            <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Hoy y ayer</span>
          </div>
          {d && d.recentLogEntries.length === 0 ? (
            <p className="card__foot">Sin entradas de bitácora hoy ni ayer.</p>
          ) : (
            <ul className="list-plain">
              {(d?.recentLogEntries ?? []).map((a, i) => (
                <li key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <Link className="row-link" to={`/obras/${a.projectId}/bitacora`} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px" }}>
                    <div className="thumb">
                      {a.firstPhotoUrl ? <img src={resolveFileUrl(a.firstPhotoUrl)} alt="" /> : <Icon name="image" size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ fontWeight: 500 }}>{a.projectName}</div>
                      <div style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.notes || "Sin notas"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flex: "none", display: "flex", flexDirection: "column", gap: 2 }}>
                      <div className="af-num" style={{ fontSize: 13 }}>
                        {formatWhen(a.createdAt)}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>
                        {`${a.authorName} · ${plural(a.photoCount, "foto", "fotos")}`}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ProjectFormDialog open={creating} onClose={() => setCreating(false)} />
    </main>
  );
}
