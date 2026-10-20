import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { downloadProjectReport, useProject, useProjects } from "@/api/projects";
import { useScheduleTasks, useSiteLog } from "@/api/work";
import type { SiteLogEntry } from "@/api/types";
import { resolveFileUrl } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/lib/hooks";
import { formatARS, formatDate, formatDayMonth, formatPct, initials, plural, todayIso } from "@/lib/format";
import { authorLabel, PROJECT_STATUS_LABEL, taskStatusLabel } from "@/lib/labels";
import { BudgetMeter, Button, EmptyState, LogEntry, Progress, Skeleton, StatusBadge } from "@/ui/ds";
import { Icon } from "@/ui/Icon";
import { useToast } from "@/ui/overlay";

const PAGE = 2;

function PortalBar() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  if (isMobile) {
    return (
      <header className="portal__bar" style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 8px 8px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 17, lineHeight: "22px", fontWeight: 600, letterSpacing: "-0.02em" }}>ArquiFlow</span>
            {user?.studioName ? <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--muted-foreground)" }}>{user.studioName}</span> : null}
          </div>
          <div ref={ref} style={{ position: "relative" }}>
            <button type="button" aria-label={`Cuenta de ${user?.fullName}`} aria-expanded={menu} onClick={() => setMenu((v) => !v)} className="m-icon-btn">
              <span className="af-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                {initials(user?.fullName ?? "")}
              </span>
            </button>
            {menu ? (
              <div className="af-dialog" role="menu" style={{ position: "absolute", right: 8, top: "100%", width: 200, padding: 4, zIndex: 20 }}>
                <div className="af-meta" style={{ padding: "8px 12px" }}>{user?.fullName}</div>
                <button type="button" role="menuitem" className="af-btn af-btn--ghost af-btn--md af-btn--block" style={{ justifyContent: "flex-start" }} onClick={logout}>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="portal__bar">
      <div className="portal__bar-in">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>ArquiFlow</span>
          {user?.studioName ? <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{user.studioName}</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14 }}>{user?.fullName}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}

export function PortalScreen() {
  const { id } = useParams();
  const { data: projects, isLoading } = useProjects();

  if (!id) {
    if (isLoading) return <div className="portal"><PortalBar /></div>;
    if (projects?.length === 1) return <Navigate to={`/portal/${projects[0].id}`} replace />;
    return (
      <div className="portal">
        <PortalBar />
        <main className="portal__main">
          <h1 className="portal__h2">Tus obras</h1>
          {projects?.length ? (
            <ul className="list-plain" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {projects.map((p) => (
                <li key={p.id}>
                  <Link to={`/portal/${p.id}`} className="obra-link">
                    <div className="etapa">
                      <StatusBadge kind="obra" status={PROJECT_STATUS_LABEL[p.status]} style={{ alignSelf: "flex-start" }} />
                      <div style={{ fontWeight: 600, fontSize: 18 }}>{p.name}</div>
                      {p.address ? <div className="af-meta">{p.address}</div> : null}
                      <Progress value={p.metrics.progress} showValue={false} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="folder" title="Todavía no tenés obras" description="Cuando el estudio te invite a una obra, la vas a ver acá." />
          )}
        </main>
      </div>
    );
  }

  return <PortalProject id={id} />;
}

function heroPhoto(entries: SiteLogEntry[]) {
  const entry = entries.find((e) => e.photos.length);
  if (!entry) return null;
  const photo = entry.photos[0];
  const caption = photo.caption || entry.notes?.split(/[.:]/)[0]?.trim() || "Última foto de obra";
  return { src: resolveFileUrl(photo.fileUrl), caption, date: entry.date };
}

function PortalProject({ id }: { id: string }) {
  const isMobile = useIsMobile();
  const toast = useToast();
  const { data: project, isLoading, isError } = useProject(id);
  const { data: tasks = [] } = useScheduleTasks(id);
  const { data: entries = [] } = useSiteLog(id);
  const [shown, setShown] = useState(PAGE);
  const [showLog, setShowLog] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const logRef = useRef<HTMLElement | null>(null);

  if (isLoading) {
    return (
      <div className="portal">
        <PortalBar />
        <main className="portal__main">
          <Skeleton height={340} />
        </main>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="portal">
        <PortalBar />
        <main className="portal__main">
          <EmptyState tone="error" icon="octagon-x" title="Obra no encontrada" description="Puede que ya no tengas acceso a esta obra." action={<Link to="/portal">Ver tus obras</Link>} />
        </main>
      </div>
    );
  }

  const m = project.metrics;
  const today = todayIso();
  const hero = heroPhoto(entries);
  const photoCount = entries.reduce((a, e) => a + e.photos.length, 0);
  const recentPhotos = entries.flatMap((e) => e.photos).slice(0, 6);
  const pm = project.projectManager ? `Arq. ${project.projectManager.fullName}` : null;

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

  const etapas = tasks.map((t, i) => {
    const status = taskStatusLabel(t, today);
    return { ...t, n: String(i + 1).padStart(2, "0"), status, fechas: `${formatDayMonth(t.startDate)} → ${formatDate(t.endDate)}` };
  });

  const log = (
    <section ref={logRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 className="portal__h2" style={isMobile ? { fontSize: 18, lineHeight: "26px" } : undefined}>
          Bitácora de obra
        </h2>
        <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{`${plural(entries.length, "entrada", "entradas")} · ${plural(photoCount, "foto", "fotos")}`}</span>
      </div>
      {entries.length === 0 ? (
        <EmptyState icon="image" title="Todavía no hay entradas" description="Acá vas a ver el avance diario de la obra con fotos." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {entries.slice(0, shown).map((e) => (
            <LogEntry
              key={e.id}
              fecha={e.date}
              autor={authorLabel(e.authorName, e.authorRole, "client")}
              clima={e.weather}
              notas={e.notes}
              fotos={e.photos.map((p) => ({ src: resolveFileUrl(p.fileUrl), epigrafe: p.caption }))}
            />
          ))}
        </div>
      )}
      {entries.length > shown ? (
        <Button variant="outline" style={{ alignSelf: "center" }} onClick={() => setShown((s) => s + 5)}>
          Ver entradas anteriores
        </Button>
      ) : null}
    </section>
  );

  const rubros = (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 className="portal__h2" style={isMobile ? { fontSize: 18, lineHeight: "26px" } : undefined}>
        Presupuesto por rubro
      </h2>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflowX: "auto" }}>
        <table className="af-table" style={{ minWidth: isMobile ? 0 : 560 }}>
          <thead>
            <tr>
              <th className="pl">Rubro</th>
              <th className="af-r">Presupuestado</th>
              <th className="af-r">Invertido</th>
              <th className="af-r pr">%</th>
            </tr>
          </thead>
          <tbody>
            {m.categories.map((c) => (
              <tr key={c.category}>
                <td className="pl">{c.category}</td>
                <td className="af-num af-r">{formatARS(c.budgeted, { compact: true })}</td>
                <td className="af-num af-r">{formatARS(c.spent, { compact: true })}</td>
                <td className="af-num af-r pr" style={{ color: "var(--muted-foreground)" }}>
                  {c.budgeted > 0 ? formatPct((c.spent / c.budgeted) * 100) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const photo = (height?: number) => (
    <div role="img" aria-label={hero ? `Foto más reciente: ${hero.caption}` : "Sin fotos todavía"} className="portal__photo" style={height ? { minHeight: 0, height, borderRadius: 0, border: 0, borderBottom: "1px solid var(--border)" } : undefined}>
      {hero ? <img src={hero.src} alt="" /> : <Icon name="image" size={height ? 36 : 40} strokeWidth={1.5} />}
    </div>
  );

  if (isMobile) {
    return (
      <div className="portal" style={{ fontSize: 16, lineHeight: "24px" }}>
        <PortalBar />
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 24 }}>
          <figure style={{ margin: 0 }}>
            {photo(220)}
            {hero ? (
              <figcaption style={{ padding: "6px 16px 0", fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>
                {`${hero.caption} · `}
                <span className="af-num">{formatDate(hero.date)}</span>
              </figcaption>
            ) : null}
          </figure>

          <section style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <StatusBadge kind="obra" status={PROJECT_STATUS_LABEL[project.status]} style={{ alignSelf: "flex-start" }} />
              <h1 style={{ fontSize: 28, lineHeight: "34px", fontWeight: 600, letterSpacing: "-0.02em" }}>{project.name}</h1>
              {project.address ? <p style={{ fontSize: 14, lineHeight: "20px", color: "var(--muted-foreground)" }}>{project.address}</p> : null}
            </div>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="af-label">Avance</span>
                  {project.endDate ? (
                    <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                      Entrega <span className="af-num">{formatDate(project.endDate)}</span>
                    </span>
                  ) : null}
                </div>
                <span className="af-num" style={{ fontSize: 36, lineHeight: "40px", fontWeight: 500 }}>{formatPct(m.progress)}</span>
                <Progress value={m.progress} showValue={false} />
              </div>
              <BudgetMeter label="Invertido hasta hoy" budgeted={m.budgeted} spent={m.spent} />
            </div>
            <Button size="lg" icon="download" block onClick={download} disabled={downloading}>
              {downloading ? "Generando…" : "Descargar reporte PDF"}
            </Button>
          </section>

          <section style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontSize: 18, lineHeight: "26px", fontWeight: 600 }}>Etapas</h2>
            {etapas.length ? (
              <ol className="m-list">
                {etapas.map((e) => (
                  <li key={e.id}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 500 }}>{e.name}</span>
                      <span className="af-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--muted-foreground)" }}>{e.fechas}</span>
                    </div>
                    <StatusBadge kind="tarea" status={e.status} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="af-meta">El cronograma todavía no está cargado.</p>
            )}
          </section>

          <section style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ fontSize: 18, lineHeight: "26px", fontWeight: 600 }}>Fotos recientes</h2>
              <a
                href="#bitacora"
                style={{ fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "12px 0" }}
                onClick={(e) => {
                  e.preventDefault();
                  setShowLog(true);
                  requestAnimationFrame(() => logRef.current?.scrollIntoView({ behavior: "smooth" }));
                }}
              >
                Ver bitácora
              </a>
            </div>
            {recentPhotos.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
                {recentPhotos.map((p) => (
                  <a key={p.id} href={resolveFileUrl(p.fileUrl)} target="_blank" rel="noreferrer" aria-label={p.caption || "Foto de obra"} style={{ aspectRatio: "1 / 1", borderRadius: 4, background: "var(--muted)", border: "1px solid var(--border)", overflow: "hidden", display: "grid", placeItems: "center" }}>
                    <img src={resolveFileUrl(p.fileUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="af-meta">Todavía no hay fotos.</p>
            )}
          </section>

          {showLog ? <div style={{ padding: "0 16px" }}>{log}</div> : null}
          {m.categories.length ? <div style={{ padding: "0 16px" }}>{rubros}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="portal">
      <PortalBar />
      <main className="portal__main">
        <section className="portal__hero">
          <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {photo()}
            {hero ? (
              <figcaption style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>
                {`${hero.caption} · `}
                <span className="af-num">{formatDate(hero.date)}</span>
              </figcaption>
            ) : null}
          </figure>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <StatusBadge kind="obra" status={PROJECT_STATUS_LABEL[project.status]} style={{ alignSelf: "flex-start" }} />
              <h1 style={{ fontSize: 40, lineHeight: "44px", fontWeight: 600, letterSpacing: "-0.02em" }}>{project.name}</h1>
              <p style={{ color: "var(--muted-foreground)" }}>{[project.address, pm].filter(Boolean).join(" · ")}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="af-label">Avance de obra</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span className="af-num" style={{ fontSize: 48, lineHeight: "52px", fontWeight: 500, letterSpacing: "-0.02em" }}>{formatPct(m.progress)}</span>
                {project.endDate ? (
                  <span style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
                    Entrega estimada <span className="af-num">{formatDate(project.endDate)}</span>
                  </span>
                ) : null}
              </div>
              <Progress value={m.progress} showValue={false} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="af-label">Presupuesto</span>
              <BudgetMeter label="Invertido hasta hoy" budgeted={m.budgeted} spent={m.spent} />
            </div>
            <Button size="lg" icon="download" style={{ alignSelf: "flex-start" }} onClick={download} disabled={downloading}>
              {downloading ? "Generando…" : "Descargar reporte PDF"}
            </Button>
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 className="portal__h2">Etapas</h2>
          {etapas.length ? (
            <ol className="etapas">
              {etapas.map((e) => (
                <li key={e.id} className="etapa">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span className="af-num" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{e.n}</span>
                    <StatusBadge kind="tarea" status={e.status} />
                  </div>
                  <div style={{ fontWeight: 600 }}>{e.name}</div>
                  <Progress value={e.progressPercent} showValue={false} tone={e.status === "Terminada" ? "success" : e.status === "Atrasada" ? "danger" : "primary"} />
                  <div className="af-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--muted-foreground)" }}>{e.fechas}</div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="af-meta">El cronograma todavía no está cargado.</p>
          )}
        </section>

        {log}
        {m.categories.length ? rubros : null}
      </main>
    </div>
  );
}
