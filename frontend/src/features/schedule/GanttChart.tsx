import { useState } from "react";
import { Gantt, ViewMode, type Task } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { TaskListHeaderSpanish } from "./TaskListHeaderSpanish";
import { toast } from "sonner";
import { useUpdateTaskSchedule } from "./api";
import { formatLocalDate, parseLocalDate } from "./date-utils";
import type { ScheduleTask } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLOR: Record<ScheduleTask["status"], string> = {
  NotStarted: "var(--viz-neutral)",
  InProgress: "var(--viz-budgeted)",
  Done: "var(--viz-good)",
  Delayed: "var(--viz-critical)",
};

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: ViewMode.Day, label: "Día" },
  { value: ViewMode.Week, label: "Semana" },
  { value: ViewMode.Month, label: "Mes" },
];

interface GanttChartProps {
  projectId: string;
  tasks: ScheduleTask[];
  editable: boolean;
  onEditTask: (task: ScheduleTask) => void;
}

export function GanttChart({ projectId, tasks, editable, onEditTask }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const updateSchedule = useUpdateTaskSchedule(projectId);

  const ganttTasks: Task[] = tasks.map((task) => ({
    id: task.id,
    type: "task",
    name: task.name,
    start: parseLocalDate(task.startDate),
    end: parseLocalDate(task.endDate),
    progress: task.progressPercent,
    isDisabled: !editable,
    styles: {
      backgroundColor: STATUS_COLOR[task.status],
      backgroundSelectedColor: STATUS_COLOR[task.status],
      // A dark overlay (rather than a light one) stays visible against every
      // status color, including the light neutral gray of a NotStarted task.
      progressColor: "rgba(11,11,11,0.3)",
      progressSelectedColor: "rgba(11,11,11,0.38)",
    },
  }));

  const persistScheduleChange = async (ganttTask: Task) => {
    try {
      await updateSchedule.mutateAsync({
        taskId: ganttTask.id,
        startDate: formatLocalDate(ganttTask.start),
        endDate: formatLocalDate(ganttTask.end),
        progressPercent: Math.round(ganttTask.progress),
      });
    } catch {
      toast.error("No se pudo actualizar la tarea");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <LegendDot color="var(--viz-neutral)" label="No iniciada" />
          <LegendDot color="var(--viz-budgeted)" label="En curso" />
          <LegendDot color="var(--viz-good)" label="Hecha" />
          <LegendDot color="var(--viz-critical)" label="Atrasada" />
        </div>
        <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <SelectTrigger size="sm">
            <SelectValue>
              {(value: ViewMode) => VIEW_MODES.find((mode) => mode.value === value)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {VIEW_MODES.map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          locale="es"
          listCellWidth={editable ? "155px" : ""}
          columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 250 : 65}
          barCornerRadius={4}
          todayColor="rgba(42, 120, 214, 0.15)"
          TaskListHeader={TaskListHeaderSpanish}
          onDateChange={persistScheduleChange}
          onProgressChange={persistScheduleChange}
          onClick={(task) => {
            const original = tasks.find((t) => t.id === task.id);
            if (original && editable) onEditTask(original);
          }}
        />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
