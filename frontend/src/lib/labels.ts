import type { ApiHealth, Project, ProjectStatus, ScheduleTask } from "@/api/types";
import type { HealthLevel } from "@/ui/ds";
import type { Role } from "./auth";
import { formatAgo, formatPct, plural, todayIso } from "./format";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  Planning: "Planificación",
  InProgress: "En curso",
  OnHold: "En pausa",
  Completed: "Completada",
  Cancelled: "Cancelada",
};

export const BUDGET_CATEGORIES = [
  "Materiales",
  "Mano de obra",
  "Equipos y herramientas",
  "Subcontratos",
  "Servicios profesionales",
  "Imprevistos",
  "Otros",
];

export const WEATHER_OPTIONS = ["Soleado", "Nublado", "Lluvia"];

/** Estado de tarea para mostrar: atrasada si pasó su fecha de fin sin terminar. */
export function taskStatusLabel(task: Pick<ScheduleTask, "progressPercent" | "endDate">, today = todayIso()) {
  if (task.progressPercent >= 100) return "Terminada";
  if (task.endDate < today) return "Atrasada";
  if (task.progressPercent <= 0) return "Sin iniciar";
  return "En curso";
}

export function healthLevel(h: ApiHealth): HealthLevel {
  return h === "Critico" ? "critico" : h === "Riesgo" ? "riesgo" : "ok";
}

/** "3 tareas atrasadas" o "4 pp detrás". */
export function scheduleDetail(project: Project, long = false) {
  const m = project.metrics;
  if (m.taskCount === 0) return "Sin tareas cargadas";
  if (m.delayedTasks > 0) return plural(m.delayedTasks, "tarea atrasada", "tareas atrasadas");
  const behind = m.plannedProgress - m.progress;
  const suffix = long ? " de lo previsto" : "";
  if (behind > 0) return `${behind} pp detrás${suffix}`;
  if (behind < 0) return `${-behind} pp adelante${suffix}`;
  return "Según lo previsto";
}

/** "Subcontratos excedido", "Mano de obra al 94 %" o "2 pp bajo el avance". */
export function budgetDetail(project: Project) {
  const m = project.metrics;
  if (m.budgetHealthCategory && m.budgetHealth === "Critico") return `${m.budgetHealthCategory} excedido`;
  if (m.budgetHealthCategory && m.budgetHealth === "Riesgo")
    return `${m.budgetHealthCategory} al ${formatPct(m.budgetHealthCategoryPercent ?? 0)}`;
  if (m.budgeted <= 0) return "Sin presupuesto cargado";
  const consumed = Math.round((m.spent / m.budgeted) * 100);
  const diff = m.progress - consumed;
  if (diff >= 0) return `${diff} pp bajo el avance`;
  return `${-diff} pp sobre el avance`;
}

export function lastActivity(project: Project) {
  const m = project.metrics;
  if (!m.lastSiteLogAt) return "sin entradas";
  const when = formatAgo(m.lastSiteLogAt);
  return when === "hoy" && m.lastSiteLogAuthor ? `hoy, ${m.lastSiteLogAuthor}` : when;
}

const SEVERITY: Record<ApiHealth, number> = { Ok: 0, Riesgo: 1, Critico: 2 };

export function attentionScore(project: Project) {
  return SEVERITY[project.metrics.scheduleHealth] + SEVERITY[project.metrics.budgetHealth];
}

/** Orden de "Requieren atención": más grave primero; a igual gravedad, pesa más el cronograma. */
export function compareAttention(a: Project, b: Project) {
  return (
    attentionScore(b) - attentionScore(a) ||
    SEVERITY[b.metrics.scheduleHealth] - SEVERITY[a.metrics.scheduleHealth] ||
    a.name.localeCompare(b.name)
  );
}

/** Cómo se presenta el autor en bitácora: interna ("Supervisor", "PM") o para el cliente ("Jefe de obra"). */
export function authorLabel(name: string, role: Role | null, audience: "team" | "client") {
  if (!role) return name;
  const team: Record<Role, string> = { Admin: "Admin", ProjectManager: "PM", Supervisor: "Supervisor", Client: "Cliente" };
  const client: Record<Role, string> = {
    Admin: "Dirección de obra",
    ProjectManager: "Dirección de obra",
    Supervisor: "Jefe de obra",
    Client: "Cliente",
  };
  return `${name} · ${(audience === "team" ? team : client)[role]}`;
}
