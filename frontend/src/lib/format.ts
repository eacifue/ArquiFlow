// Formatos es-AR, iguales a los del sistema de diseño (formatARS / formatPct / formatDate).

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const ars0 = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const pct = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export function formatARS(n: number, opts?: { compact?: boolean }) {
  return (opts?.compact ? ars0 : ars).format(n).replace(/ /g, " ");
}

export function formatPct(n: number) {
  return `${pct.format(n)} %`;
}

function toDate(d: string | Date) {
  if (d instanceof Date) return d;
  return new Date(d.length === 10 ? `${d}T12:00:00` : d);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatDate(d: string | Date) {
  const dt = toDate(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

export function formatDayMonth(d: string | Date) {
  const dt = toDate(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}`;
}

export function formatTime(d: string | Date) {
  const dt = toDate(d);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function formatLongToday(now = new Date()) {
  return `${WEEKDAYS[now.getDay()]} ${formatDate(now)}`;
}

export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dayDiff(from: Date, to: Date) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

export function daysUntil(d: string) {
  return dayDiff(new Date(), toDate(d));
}

/** "hoy 17:42", "ayer 18:20" o "02/10/2026". */
export function formatWhen(iso: string, now = new Date()) {
  const dt = toDate(iso);
  const diff = dayDiff(dt, now);
  if (diff === 0) return `hoy ${formatTime(dt)}`;
  if (diff === 1) return `ayer ${formatTime(dt)}`;
  return formatDate(dt);
}

/** "hoy", "ayer" o "hace 6 días". */
export function formatAgo(iso: string, now = new Date()) {
  const diff = dayDiff(toDate(iso), now);
  if (diff <= 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
