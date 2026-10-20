import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { formatARS, formatDate, formatPct } from "@/lib/format";
import { resolveFileUrl } from "@/lib/api-client";
import { Icon, type IconName } from "./Icon";

// Port del sistema de diseño ArquiFlow (bundle "ArquiFlow.*"): mismos nombres,
// mismas clases af-* y misma estructura de marcado.

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Button ---------- */
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  block?: boolean;
}

export function Button({ variant = "primary", size = "md", icon, block, className, children, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      {...rest}
      className={cx("af-btn", `af-btn--${variant}`, `af-btn--${size}`, block && "af-btn--block", className)}
    >
      {icon ? <Icon name={icon} size={size === "lg" ? 20 : 16} /> : null}
      {children != null ? <span>{children}</span> : null}
    </button>
  );
}

/* ---------- StatusBadge ---------- */
export type BadgeTone = "neutral" | "muted" | "primary" | "success" | "warning" | "danger";

const STATUS: Record<string, Record<string, BadgeTone>> = {
  obra: { Planificación: "neutral", "En curso": "primary", "En pausa": "warning", Completada: "success", Cancelada: "muted" },
  tarea: { "Sin iniciar": "neutral", "En curso": "primary", Terminada: "success", Atrasada: "danger" },
  pago: { Pendiente: "warning", Pagado: "success" },
};

export function StatusBadge({
  kind = "obra",
  status,
  tone,
  className,
  style,
}: {
  kind?: "obra" | "tarea" | "pago";
  status: string;
  tone?: BadgeTone;
  className?: string;
  style?: CSSProperties;
}) {
  const t = tone ?? STATUS[kind]?.[status] ?? "neutral";
  return (
    <span className={cx("af-badge", `af-badge--${t}`, className)} style={style}>
      <span className="af-badge__dot" aria-hidden="true" />
      {status}
    </span>
  );
}

/* ---------- Health (semáforo) ---------- */
export type HealthLevel = "ok" | "riesgo" | "critico";

const HEALTH: Record<HealthLevel, { icon: IconName; label: string }> = {
  ok: { icon: "circle-check", label: "En término" },
  riesgo: { icon: "triangle-alert", label: "En riesgo" },
  critico: { icon: "octagon-x", label: "Crítico" },
};
const DIM = { cronograma: "Cronograma", presupuesto: "Presupuesto" };

export function Health({
  dimension,
  level = "ok",
  detail,
  compact,
  className,
}: {
  dimension: "cronograma" | "presupuesto";
  level?: HealthLevel;
  detail?: string;
  compact?: boolean;
  className?: string;
}) {
  const lv = HEALTH[level];
  const dim = DIM[dimension];
  return (
    <span
      className={cx("af-health", `af-health--${level}`, compact && "af-health--compact", className)}
      title={compact ? `${dim}: ${lv.label}${detail ? ` — ${detail}` : ""}` : undefined}
    >
      <Icon name={lv.icon} size={16} />
      {compact ? (
        <span className="af-sr">{`${dim}: ${lv.label}`}</span>
      ) : (
        <span className="af-health__text">
          <span className="af-health__dim">{dim}</span>
          <span className="af-health__label">{lv.label}</span>
          {detail ? <span className="af-health__detail">{detail}</span> : null}
        </span>
      )}
    </span>
  );
}

/* ---------- Stat ---------- */
export function Stat({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "danger" | "success" | "warning" | "muted";
  className?: string;
}) {
  return (
    <div className={cx("af-stat", className)}>
      <div className="af-label">{label}</div>
      <div className={cx("af-stat__value", tone && `af-text--${tone}`)}>{value}</div>
      {hint ? <div className="af-stat__hint">{hint}</div> : null}
    </div>
  );
}

/* ---------- Progress ---------- */
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function Progress({
  value,
  planned,
  label,
  showValue = true,
  tone = "primary",
  className,
}: {
  value: number;
  planned?: number;
  label?: string;
  showValue?: boolean;
  tone?: "primary" | "warning" | "danger" | "success";
  className?: string;
}) {
  const v = clamp(value || 0);
  return (
    <div className={cx("af-progress", className)}>
      {label || showValue ? (
        <div className="af-progress__head">
          <span>{label || "Avance"}</span>
          <span className="af-num">
            {formatPct(v) + (planned != null ? ` de ${formatPct(planned)} previsto` : "")}
          </span>
        </div>
      ) : null}
      <div
        className="af-progress__track"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Avance"}
      >
        <div className={`af-progress__fill af-fill--${tone}`} style={{ width: `${v}%` }} />
        {planned != null ? (
          <div className="af-progress__planned" style={{ left: `${clamp(planned)}%` }} title="Previsto a hoy" />
        ) : null}
      </div>
    </div>
  );
}

/* ---------- BudgetMeter ---------- */
export function BudgetMeter({
  budgeted = 0,
  spent = 0,
  label,
  showAmounts = true,
  className,
}: {
  budgeted?: number;
  spent?: number;
  label?: string;
  showAmounts?: boolean;
  className?: string;
}) {
  const ratio = budgeted > 0 ? spent / budgeted : 0;
  const over = spent > budgeted;
  const fillW = over ? (budgeted / spent) * 100 : ratio * 100;
  const overW = over ? 100 - fillW : 0;
  const tone = over ? "danger" : ratio >= 0.9 ? "warning" : "primary";
  return (
    <div className={cx("af-meter", className)}>
      <div className="af-meter__head">
        <span>{label || "Consumido"}</span>
        <span className={cx("af-num", over && "af-text--danger")}>{formatPct(ratio * 100)}</span>
      </div>
      <div className="af-meter__track">
        <div className={`af-meter__fill af-fill--${over ? "primary" : tone}`} style={{ width: `${fillW}%` }} />
        {over ? <div className="af-meter__over" style={{ width: `${overW}%` }} /> : null}
      </div>
      {showAmounts ? (
        <div className="af-meter__foot">
          <span>{`${formatARS(spent, { compact: true })} de ${formatARS(budgeted, { compact: true })}`}</span>
          {over ? (
            <span className="af-text--danger af-strong">{`Excedido ${formatARS(spent - budgeted, { compact: true })}`}</span>
          ) : (
            <span>{`Disponible ${formatARS(budgeted - spent, { compact: true })}`}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- ObraCard ---------- */
export function ObraCard(p: {
  nombre: string;
  direccion?: string | null;
  estado: string;
  avance: number;
  avancePrevisto?: number;
  presupuesto: number;
  gastado: number;
  saludCronograma: HealthLevel;
  detalleCronograma?: string;
  saludPresupuesto: HealthLevel;
  detallePresupuesto?: string;
  ultimaActividad?: string;
}) {
  return (
    <article className="af-card af-obra">
      <div className="af-obra__top">
        <div className="af-obra__titles">
          <h3 className="af-h3">{p.nombre}</h3>
          {p.direccion ? (
            <div className="af-meta">
              <Icon name="map-pin" size={14} />
              {p.direccion}
            </div>
          ) : null}
        </div>
        <StatusBadge kind="obra" status={p.estado} />
      </div>
      <div className="af-obra__health">
        <Health dimension="cronograma" level={p.saludCronograma} detail={p.detalleCronograma} />
        <Health dimension="presupuesto" level={p.saludPresupuesto} detail={p.detallePresupuesto} />
      </div>
      <div className="af-obra__bars">
        <Progress
          label="Avance"
          value={p.avance}
          planned={p.avancePrevisto}
          tone={p.saludCronograma === "critico" ? "danger" : "primary"}
        />
        <BudgetMeter label="Presupuesto consumido" budgeted={p.presupuesto} spent={p.gastado} />
      </div>
      {p.ultimaActividad ? <div className="af-obra__foot af-meta">{`Última bitácora: ${p.ultimaActividad}`}</div> : null}
    </article>
  );
}

/* ---------- BudgetItem ---------- */
export interface BudgetItemGasto {
  id: string;
  fecha: string;
  descripcion: string | null;
  proveedor: string | null;
  monto: number;
  comprobanteUrl: string | null;
}

export function BudgetItem(p: {
  categoria: string;
  descripcion: string;
  presupuestado: number;
  cantidad?: number | null;
  unidad?: string | null;
  gastos: BudgetItemGasto[];
  defaultOpen?: boolean;
  canAdd?: boolean;
  onAddExpense?: () => void;
  extraActions?: ReactNode;
}) {
  const [open, setOpen] = useState(!!p.defaultOpen);
  const gastos = p.gastos;
  const spent = gastos.reduce((a, g) => a + g.monto, 0);
  const over = spent > p.presupuestado;
  return (
    <section className={cx("af-card af-item", over && "af-item--over")}>
      <button type="button" className="af-item__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <div className="af-item__titles">
          <span className="af-label">{p.categoria}</span>
          <span className="af-h3">{p.descripcion}</span>
          {p.cantidad ? <span className="af-meta">{`${p.cantidad} ${p.unidad || ""}`}</span> : null}
        </div>
        <div className="af-item__nums">
          {over ? <StatusBadge tone="danger" status="Excedido" /> : null}
          <div className="af-item__amounts">
            <span className={cx("af-num af-strong", over && "af-text--danger")}>{formatARS(spent)}</span>
            <span className="af-meta">{`de ${formatARS(p.presupuestado)}`}</span>
          </div>
        </div>
        <Icon name="chevron-down" size={20} className={cx("af-item__chev", open && "is-open")} />
      </button>
      <div className="af-item__meter">
        <BudgetMeter
          budgeted={p.presupuestado}
          spent={spent}
          showAmounts={false}
          label={gastos.length + (gastos.length === 1 ? " gasto" : " gastos")}
        />
      </div>
      {open ? (
        <div className="af-item__body">
          {gastos.length ? (
            <div style={{ overflowX: "auto" }}>
              <table className="af-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th className="af-r">Monto</th>
                    <th className="af-c">Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((g) => (
                    <tr key={g.id}>
                      <td className="af-num">{formatDate(g.fecha)}</td>
                      <td>
                        {g.descripcion}
                        {g.proveedor ? <div className="af-meta">{g.proveedor}</div> : null}
                      </td>
                      <td className="af-num af-r">{formatARS(g.monto)}</td>
                      <td className="af-c">
                        {g.comprobanteUrl ? (
                          <a
                            className="af-iconlink"
                            href={resolveFileUrl(g.comprobanteUrl)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Ver comprobante"
                          >
                            <Icon name={g.comprobanteUrl.toLowerCase().endsWith(".pdf") ? "file-text" : "image"} />
                          </a>
                        ) : (
                          <span className="af-meta">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="af-meta">Todavía no hay gastos en esta partida.</p>
          )}
          {p.canAdd || p.extraActions ? (
            <div className="af-item__actions" style={{ gap: "var(--space-2)" }}>
              {p.extraActions}
              {p.canAdd ? (
                <Button variant="secondary" size="sm" icon="plus" onClick={p.onAddExpense}>
                  Agregar gasto
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/* ---------- LogEntry ---------- */
const CLIMA: Record<string, IconName> = { Soleado: "sun", Nublado: "cloud", Lluvia: "cloud-rain" };

export interface LogFoto {
  src?: string;
  epigrafe?: string | null;
}

export function LogEntry(p: {
  fecha: string;
  autor: string;
  clima?: string | null;
  notas?: string | null;
  fotos: LogFoto[];
  canEdit?: boolean;
  onEdit?: () => void;
}) {
  const fotos = p.fotos;
  return (
    <article className="af-log">
      <div className="af-log__rail" aria-hidden="true">
        <span className="af-log__node" />
      </div>
      <div className="af-card af-log__card">
        <header className="af-log__head">
          <div>
            <div className="af-h3">{formatDate(p.fecha)}</div>
            <div className="af-meta">{p.autor}</div>
          </div>
          <div className="af-log__right">
            {p.clima ? (
              <span className="af-chip">
                <Icon name={CLIMA[p.clima] || "cloud"} />
                {p.clima}
              </span>
            ) : null}
            {p.canEdit ? (
              <button type="button" className="af-iconbtn" aria-label="Editar entrada" onClick={p.onEdit}>
                <Icon name="pencil" />
              </button>
            ) : null}
          </div>
        </header>
        {p.notas ? <p className="af-log__notes">{p.notas}</p> : null}
        {fotos.length ? (
          <div className={cx("af-gallery", fotos.length === 1 && "af-gallery--one")}>
            {fotos.map((f, i) => (
              <figure key={i} className="af-photo">
                {f.src ? (
                  <a href={f.src} target="_blank" rel="noreferrer">
                    <img src={f.src} alt={f.epigrafe || "Foto de obra"} loading="lazy" />
                  </a>
                ) : (
                  <div className="af-photo__ph">
                    <Icon name="image" size={24} />
                  </div>
                )}
                {f.epigrafe ? <figcaption>{f.epigrafe}</figcaption> : null}
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/* ---------- EmptyState ---------- */
export function EmptyState({
  icon = "folder",
  title,
  description,
  action,
  tone,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "error";
}) {
  return (
    <div className={cx("af-empty", tone === "error" && "af-empty--error")}>
      <div className="af-empty__icon">
        <Icon name={icon} size={24} />
      </div>
      <div className="af-h3">{title}</div>
      {description ? <p className="af-meta">{description}</p> : null}
      {action || null}
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ width, height, round }: { width?: number | string; height?: number | string; round?: boolean }) {
  return (
    <div
      className="af-skeleton"
      style={{ width: width || "100%", height: height || 16, borderRadius: round ? 9999 : undefined }}
      aria-hidden="true"
    />
  );
}
