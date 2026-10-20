import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { downloadProjectReport, useProject } from "@/api/projects";
import { useBudgetItems } from "@/api/work";
import type { Project } from "@/api/types";
import { usePermissions } from "@/lib/auth";
import { useIsMobile } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { budgetDetail, healthLevel, PROJECT_STATUS_LABEL, scheduleDetail } from "@/lib/labels";
import { BudgetMeter, Button, EmptyState, Health, Progress, Skeleton, StatusBadge } from "@/ui/ds";
import { Icon } from "@/ui/Icon";
import { useToast } from "@/ui/overlay";
import { useNav } from "../AppLayout";
import { ExpenseFormDialog, ProjectFormDialog } from "./forms";
import { ScheduleTab } from "./ScheduleTab";
import { BudgetTab } from "./BudgetTab";
import { SiteLogTab, SiteLogEntrySheet } from "./SiteLogTab";
import { PaymentsTab } from "./PaymentsTab";
import { ClientTab } from "./ClientTab";

type TabKey = "cronograma" | "presupuesto" | "bitacora" | "pagos" | "cliente";

const TAB_LABEL: Record<TabKey, string> = {
  cronograma: "Cronograma",
  presupuesto: "Presupuesto",
  bitacora: "Bitácora",
  pagos: "Pagos",
  cliente: "Cliente",
};

function ProjectHeader({ project, full, onEdit }: { project: Project; full: boolean; onEdit?: () => void }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const m = project.metrics;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadProjectReport(project.id, project.name);
    } catch {
      toast.error("No se pudo generar el reporte", "Intentá de nuevo en un momento.");
    } finally {
      setDownloading(false);
    }
  };

  const meta = (
    <div className="obra-meta">
      {project.address ? <span>{project.address}</span> : null}
      {project.startDate || project.endDate ? (
        <span className="af-num">{`${project.startDate ? formatDate(project.startDate) : "—"} → ${project.endDate ? formatDate(project.endDate) : "—"}`}</span>
      ) : null}
      {project.projectManager ? <span>{`PM: ${project.projectManager.fullName}`}</span> : null}
      {full && project.supervisor ? <span>{`Supervisor: ${project.supervisor.fullName}`}</span> : null}
    </div>
  );

  const actions = (
    <div className="obra-head__actions">
      {onEdit ? (
        <Button variant="outline" icon="pencil" onClick={onEdit}>
          Editar
        </Button>
      ) : null}
      <Button variant="secondary" icon="download" onClick={download} disabled={downloading}>
        {downloading ? "Generando…" : "Descargar reporte"}
      </Button>
    </div>
  );

  const title = (
    <div className="obra-head__name">
      <h1 className="obra-title">{project.name}</h1>
      <StatusBadge kind="obra" status={PROJECT_STATUS_LABEL[project.status]} />
      {!full ? (
        <>
          <Health dimension="cronograma" level={healthLevel(m.scheduleHealth)} detail={scheduleDetail(project)} compact />
          <Health dimension="presupuesto" level={healthLevel(m.budgetHealth)} detail={budgetDetail(project)} compact />
        </>
      ) : null}
    </div>
  );

  if (!full) {
    return (
      <header className="obra-head obra-head--compact">
        <div className="obra-head__titles">
          {title}
          {meta}
        </div>
        {actions}
      </header>
    );
  }

  return (
    <header className="obra-head obra-head--full">
      <div className="obra-head__row">
        <div className="obra-head__titles">
          {title}
          {meta}
        </div>
        {actions}
      </div>
      <div className="obra-head__health">
        <Health dimension="cronograma" level={healthLevel(m.scheduleHealth)} detail={scheduleDetail(project, true)} />
        <Health dimension="presupuesto" level={healthLevel(m.budgetHealth)} detail={budgetDetail(project)} />
        <Progress label="Avance de obra" value={m.progress} planned={m.plannedProgress} />
        <BudgetMeter label="Presupuesto consumido" budgeted={m.budgeted} spent={m.spent} />
      </div>
    </header>
  );
}

function TabContent({ tab, project }: { tab: TabKey; project: Project }) {
  switch (tab) {
    case "cronograma":
      return <ScheduleTab project={project} />;
    case "presupuesto":
      return <BudgetTab project={project} />;
    case "bitacora":
      return <SiteLogTab project={project} />;
    case "pagos":
      return <PaymentsTab project={project} />;
    case "cliente":
      return <ClientTab project={project} />;
  }
}

export function ProjectScreen() {
  const { id = "", tab } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const perms = usePermissions();
  const { data: project, isLoading, isError } = useProject(id);
  const [editing, setEditing] = useState(false);

  const tabs: TabKey[] = isMobile
    ? ["bitacora", "presupuesto", "cronograma", ...(perms.isManager ? (["pagos", "cliente"] as TabKey[]) : [])]
    : ["cronograma", "presupuesto", "bitacora", ...(perms.isManager ? (["pagos", "cliente"] as TabKey[]) : [])];

  const current = (tab && tabs.includes(tab as TabKey) ? tab : tabs[0]) as TabKey;
  if (tab && !tabs.includes(tab as TabKey)) return <Navigate to={`/obras/${id}`} replace />;

  const go = (t: TabKey) => navigate(`/obras/${id}/${t}`);

  if (isLoading) {
    return (
      <main className="app-main">
        <Skeleton height={18} width={160} />
        <Skeleton height={120} />
        <Skeleton height={320} />
      </main>
    );
  }

  if (isError || !project) {
    return (
      <main className="app-main">
        <EmptyState
          tone="error"
          icon="octagon-x"
          title="Obra no encontrada"
          description="Puede que se haya eliminado o que no tengas acceso."
          action={<Link to="/obras">Volver a Obras</Link>}
        />
      </main>
    );
  }

  if (isMobile) return <MobileProject project={project} tabs={tabs} current={current} go={go} />;

  return (
    <main className="app-main">
      <nav aria-label="Ruta" className="breadcrumb">
        <Link to="/obras">Obras</Link>
        <span aria-hidden="true">/</span>
        <span>{project.name}</span>
      </nav>

      <ProjectHeader project={project} full={current === "presupuesto"} onEdit={perms.isManager ? () => setEditing(true) : undefined} />

      <div role="tablist" aria-label="Secciones de la obra" className="tabs">
        {tabs.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={t === current} className="tab" onClick={() => go(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <TabContent tab={current} project={project} />

      <ProjectFormDialog open={editing} onClose={() => setEditing(false)} project={project} />
    </main>
  );
}

function MobileProject({ project, tabs, current, go }: { project: Project; tabs: TabKey[]; current: TabKey; go: (t: TabKey) => void }) {
  const { openNav } = useNav();
  const perms = usePermissions();
  const { data: items = [] } = useBudgetItems(project.id);
  const [sheet, setSheet] = useState<"entry" | "expense" | null>(null);

  return (
    <div className="m-obra" style={{ flex: "1 1 100%" }}>
      <header className="m-head">
        <button type="button" className="m-icon-btn" aria-label="Abrir menú" onClick={openNav}>
          <Icon name="menu" size={22} />
        </button>
        <div className="m-head__titles">
          <div className="m-head__title">{project.name}</div>
          {project.address ? <div className="m-head__sub">{project.address}</div> : null}
        </div>
        <div style={{ paddingRight: 8 }}>
          <Health dimension="cronograma" level={healthLevel(project.metrics.scheduleHealth)} detail={scheduleDetail(project)} compact />
        </div>
      </header>

      <div role="tablist" aria-label="Secciones de la obra" className="m-tabs">
        {tabs.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={t === current} className="m-tab" onClick={() => go(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className={current === "bitacora" ? "m-body m-body--log" : "m-body"}>
        <TabContent tab={current} project={project} />
      </div>

      {perms.canLogSite ? (
        <nav aria-label="Acciones de obra" className="m-actionbar">
          <button type="button" className="m-action m-action--secondary" onClick={() => setSheet("expense")}>
            <Icon name="receipt" size={20} />
            Cargar gasto
          </button>
          <button type="button" className="m-action m-action--primary" onClick={() => setSheet("entry")}>
            <Icon name="camera" size={20} />
            Nueva entrada
          </button>
        </nav>
      ) : null}

      {sheet === "entry" ? <SiteLogEntrySheet project={project} onClose={() => setSheet(null)} /> : null}
      <ExpenseFormDialog open={sheet === "expense"} onClose={() => setSheet(null)} projectId={project.id} items={items} />
    </div>
  );
}
