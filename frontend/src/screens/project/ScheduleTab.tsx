import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useMoveTask, useScheduleTasks } from "@/api/work";
import type { Project, ScheduleTask } from "@/api/types";
import { usePermissions } from "@/lib/auth";
import { useIsMobile } from "@/lib/hooks";
import { daysUntil, formatDate, formatDayMonth, formatPct, plural, todayIso } from "@/lib/format";
import { taskStatusLabel } from "@/lib/labels";
import { Button, EmptyState, Skeleton, Stat, StatusBadge } from "@/ui/ds";
import { useToast } from "@/ui/overlay";
import { TaskFormDialog } from "./forms";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAY = 86_400_000;

const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function ScheduleTab({ project }: { project: Project }) {
  const isMobile = useIsMobile();
  const { isManager } = usePermissions();
  const { data: tasks = [], isLoading, isError } = useScheduleTasks(project.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ task?: ScheduleTask } | null>(null);
  const m = project.metrics;
  const today = todayIso();

  const delayed = tasks.filter((t) => taskStatusLabel(t, today) === "Atrasada").length;
  const selected = tasks.find((t) => t.id === selectedId);
  const nextSortOrder = tasks.reduce((max, t) => Math.max(max, t.sortOrder), 0) + 1;

  const delivery = project.endDate ? daysUntil(project.endDate) : null;
  const deliveryHint =
    delivery == null ? "Sin fecha de entrega" : delivery > 0 ? `Faltan ${plural(delivery, "día", "días")}` : delivery === 0 ? "Es hoy" : `Venció hace ${plural(-delivery, "día", "días")}`;

  if (isLoading) return <Skeleton height={360} />;
  if (isError) return <EmptyState tone="error" icon="octagon-x" title="No se pudo cargar el cronograma" description="Intentá de nuevo en un momento." />;

  const stats = (
    <section className="grid-stats">
      <Stat label="Avance real" value={formatPct(m.progress)} hint={`Previsto a hoy: ${formatPct(m.plannedProgress)}`} />
      <Stat
        label="Tareas"
        value={`${m.tasksDone} de ${m.taskCount}`}
        hint={`terminadas · ${m.tasksInProgress} en curso · ${m.tasksNotStarted} sin iniciar`}
      />
      <Stat
        label="Atrasadas"
        value={String(delayed)}
        hint={delayed === 0 ? "Ninguna tarea pasó su fecha de fin" : "Pasaron su fecha de fin sin terminar"}
        tone={delayed === 0 ? "success" : "danger"}
      />
      <Stat label="Entrega" value={project.endDate ? formatDate(project.endDate) : "—"} hint={deliveryHint} />
    </section>
  );

  const dialogEl = (
    <TaskFormDialog
      open={dialog != null}
      onClose={() => setDialog(null)}
      projectId={project.id}
      task={dialog?.task}
      nextSortOrder={nextSortOrder}
    />
  );

  if (isMobile) {
    return (
      <>
        {tasks.length === 0 ? (
          <EmptyState icon="folder" title="Todavía no hay tareas" description="El cronograma se arma desde la computadora." />
        ) : (
          <ol className="m-list">
            {tasks.map((t) => (
              <li key={t.id} onClick={isManager ? () => setDialog({ task: t }) : undefined} style={{ cursor: isManager ? "pointer" : undefined }}>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontWeight: 500 }}>{t.name}</span>
                  <span className="af-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--muted-foreground)" }}>
                    {`${formatDayMonth(t.startDate)} → ${formatDate(t.endDate)} · ${t.progressPercent} %`}
                  </span>
                </div>
                <StatusBadge kind="tarea" status={taskStatusLabel(t, today)} />
              </li>
            ))}
          </ol>
        )}
        {dialogEl}
      </>
    );
  }

  return (
    <>
      {stats}
      <section className="card card--col">
        <div className="card__head">
          <div className="card__head-left">
            <h2 className="section-title">Cronograma</h2>
            <div className="legend">
              <span className="legend__item"><span className="legend__swatch" style={{ background: "var(--chart-2)" }} />Planificado</span>
              <span className="legend__item"><span className="legend__swatch" style={{ background: "var(--chart-1)" }} />Avance</span>
              <span className="legend__item"><span className="legend__swatch" style={{ background: "var(--chart-5)" }} />Atrasada</span>
              <span className="legend__item"><span style={{ width: 2, height: 14, background: "var(--ring)" }} />Hoy</span>
            </div>
          </div>
          {isManager ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {selected ? (
                <>
                  <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{selected.name}</span>
                  <Button variant="outline" size="sm" icon="pencil" onClick={() => setDialog({ task: selected })}>
                    Editar tarea
                  </Button>
                </>
              ) : null}
              <Button icon="plus" onClick={() => setDialog({})}>
                Nueva tarea
              </Button>
            </div>
          ) : null}
        </div>
        {tasks.length === 0 ? (
          <div className="card__pad">
            <EmptyState
              icon="folder"
              title="Todavía no hay tareas"
              description="Armá el cronograma con las tareas del maestro de tareas."
              action={isManager ? <Button icon="plus" onClick={() => setDialog({})}>Nueva tarea</Button> : null}
            />
          </div>
        ) : (
          <Gantt
            project={project}
            tasks={tasks}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
            canEdit={isManager}
          />
        )}
        <div className="card__foot">
          Arrastrá una barra para mover sus fechas; arrastrá su borde derecho para cambiar la fecha de fin. En celular el cronograma se ve como lista.
        </div>
      </section>
      {dialogEl}
    </>
  );
}

function Gantt({
  project,
  tasks,
  selectedId,
  onSelect,
  canEdit,
}: {
  project: Project;
  tasks: ScheduleTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  canEdit: boolean;
}) {
  const toast = useToast();
  const move = useMoveTask(project.id);
  const today = todayIso();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{ id: string; mode: "move" | "end"; startX: number; deltaDays: number } | null>(null);

  const { t0, span, months } = useMemo(() => {
    const starts = tasks.map((t) => t.startDate).concat(project.startDate ? [project.startDate] : []);
    const ends = tasks.map((t) => t.endDate).concat(project.endDate ? [project.endDate] : []);
    const min = starts.sort()[0];
    const max = ends.sort().at(-1)!;
    const [y0, m0] = min.split("-").map(Number);
    const [y1, m1] = max.split("-").map(Number);
    const start = Date.UTC(y0, m0 - 1, 1);
    const end = Date.UTC(y1, m1, 1);
    const list: string[] = [];
    for (let y = y0, mo = m0 - 1; Date.UTC(y, mo, 1) < end; mo === 11 ? ((mo = 0), y++) : mo++) list.push(MONTHS[mo]);
    return { t0: start, span: end - start, months: list };
  }, [tasks, project.startDate, project.endDate]);

  const pct = (ms: number) => `${((ms / span) * 100).toFixed(2)}%`;
  const todayFrac = (toUtc(today) - t0) / span;

  const begin = (e: ReactPointerEvent, task: ScheduleTask, mode: "move" | "end") => {
    if (!canEdit) return;
    e.stopPropagation();
    // Capturar siempre en la barra, así el borde y el cuerpo comparten un único flujo de eventos.
    (e.currentTarget.closest(".gantt__bar") as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id: task.id, mode, startX: e.clientX, deltaDays: 0 });
  };

  const update = (e: ReactPointerEvent) => {
    if (!drag || !trackRef.current) return;
    const width = trackRef.current.getBoundingClientRect().width - 340;
    const days = Math.round(((e.clientX - drag.startX) / width) * (span / DAY));
    if (days !== drag.deltaDays) setDrag({ ...drag, deltaDays: days });
  };

  const finish = async (task: ScheduleTask) => {
    if (!drag) return;
    const { mode, deltaDays } = drag;
    setDrag(null);
    if (deltaDays === 0) return;
    const start = mode === "move" ? fromUtc(toUtc(task.startDate) + deltaDays * DAY) : task.startDate;
    let end = fromUtc(toUtc(task.endDate) + deltaDays * DAY);
    if (end < start) end = start;
    try {
      await move.mutateAsync({ id: task.id, startDate: start, endDate: end, progressPercent: task.progressPercent });
    } catch {
      toast.error("No se pudo mover la tarea", task.name);
    }
  };

  return (
    <div className="scroll-x">
      <div className="gantt" ref={trackRef}>
        <div className="gantt__head">
          <div className="gantt__cols af-label">
            <span>Tarea</span>
            <span style={{ textAlign: "right" }}>Avance</span>
            <span>Estado</span>
          </div>
          <div className="gantt__months" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
            {months.map((mo, i) => (
              <div key={i} className="af-label gantt__month">
                {mo}
              </div>
            ))}
          </div>
        </div>
        <div className="gantt__body">
          {tasks.map((t) => {
            const status = taskStatusLabel(t, today);
            const isDragging = drag?.id === t.id;
            const dStart = isDragging && drag.mode === "move" ? drag.deltaDays : 0;
            const dEnd = isDragging ? drag.deltaDays : 0;
            const a = toUtc(t.startDate) + dStart * DAY;
            const b = Math.max(toUtc(t.endDate) + dEnd * DAY, a) + DAY;
            const fill = status === "Atrasada" ? "var(--chart-5)" : status === "Terminada" ? "var(--success)" : "var(--chart-1)";
            return (
              <div key={t.id} className={selectedId === t.id ? "gantt__row is-selected" : "gantt__row"}>
                <button type="button" className="gantt__task gantt__cols" aria-pressed={selectedId === t.id} onClick={() => onSelect(t.id)}>
                  <span className="gantt__task-name">
                    <span>{t.name}</span>
                    <span className="af-num gantt__dates">{`${formatDayMonth(t.startDate)} → ${formatDayMonth(t.endDate)}`}</span>
                  </span>
                  <span className="af-num" style={{ textAlign: "right" }}>{`${t.progressPercent} %`}</span>
                  <StatusBadge kind="tarea" status={status} />
                </button>
                <div
                  className="gantt__track"
                  style={{
                    backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent calc(${100 / months.length}% - 1px), var(--border) calc(${100 / months.length}% - 1px), var(--border) ${100 / months.length}%)`,
                  }}
                >
                  <div
                    className={isDragging ? "gantt__bar is-dragging" : "gantt__bar"}
                    title={`${t.name}: ${formatDayMonth(t.startDate)} → ${formatDayMonth(t.endDate)}`}
                    style={{ left: pct(a - t0), width: pct(b - a), cursor: canEdit ? undefined : "default" }}
                    onPointerDown={(e) => begin(e, t, "move")}
                    onPointerMove={update}
                    onPointerUp={() => finish(t)}
                    onPointerCancel={() => setDrag(null)}
                  >
                    <div className="gantt__bar-fill" style={{ width: `${t.progressPercent}%`, background: fill }} />
                    {canEdit ? (
                      <div className="gantt__handle" onPointerDown={(e) => begin(e, t, "end")} />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {todayFrac >= 0 && todayFrac <= 1 ? (
            <div aria-hidden="true" className="gantt__today" style={{ left: `calc(340px + (100% - 340px) * ${todayFrac.toFixed(4)})` }} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
