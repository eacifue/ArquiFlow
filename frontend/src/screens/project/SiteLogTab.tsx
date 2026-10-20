import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { uploadSiteLogPhoto, useBudgetItems, useSaveSiteLogEntry, useSiteLog } from "@/api/work";
import type { Project, SiteLogEntry } from "@/api/types";
import { resolveFileUrl } from "@/lib/api-client";
import { useAuth, usePermissions } from "@/lib/auth";
import { useIsMobile, apiErrorMessage } from "@/lib/hooks";
import { plural, todayIso } from "@/lib/format";
import { authorLabel, WEATHER_OPTIONS } from "@/lib/labels";
import { Button, EmptyState, LogEntry, Skeleton } from "@/ui/ds";
import { Icon } from "@/ui/Icon";
import { useToast } from "@/ui/overlay";
import { ExpenseFormDialog } from "./forms";

export function SiteLogTab({ project }: { project: Project }) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isManager, canLogSite } = usePermissions();
  const { data: entries = [], isLoading, isError } = useSiteLog(project.id);
  const { data: items = [] } = useBudgetItems(project.id);
  const [editing, setEditing] = useState<SiteLogEntry | "new" | null>(null);
  const [expense, setExpense] = useState(false);

  if (isLoading) return <Skeleton height={360} />;
  if (isError) return <EmptyState tone="error" icon="octagon-x" title="No se pudo cargar la bitácora" description="Intentá de nuevo en un momento." />;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingLeft: isMobile ? 8 : 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>
          {`${plural(entries.length, "entrada", "entradas")} · la más reciente arriba`}
        </span>
        {!isMobile && canLogSite ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" icon="receipt" onClick={() => setExpense(true)} disabled={!items.length}>
              Cargar gasto
            </Button>
            <Button icon="camera" onClick={() => setEditing("new")}>
              Nueva entrada
            </Button>
          </div>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="image"
          title="Todavía no hay entradas"
          description="La bitácora registra el avance diario de la obra con fotos."
          action={canLogSite && !isMobile ? <Button icon="camera" onClick={() => setEditing("new")}>Nueva entrada</Button> : null}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {entries.map((e) => (
            <LogEntry
              key={e.id}
              fecha={e.date}
              autor={authorLabel(e.authorName, e.authorRole, "team")}
              clima={e.weather}
              notas={e.notes}
              fotos={e.photos.map((p) => ({ src: resolveFileUrl(p.fileUrl), epigrafe: p.caption }))}
              canEdit={isManager || (canLogSite && e.authorUserId === user?.userId)}
              onEdit={() => setEditing(e)}
            />
          ))}
        </div>
      )}

      {editing ? (
        <SiteLogEntrySheet project={project} entry={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />
      ) : null}
      <ExpenseFormDialog open={expense} onClose={() => setExpense(false)} projectId={project.id} items={items} />
    </>
  );
}

interface PhotoSlot {
  key: string;
  preview: string;
  progress: number;
  fileUrl?: string;
  caption: string | null;
  failed?: boolean;
  promise?: Promise<string | undefined>;
}

const MAX_PHOTOS = 10;

export function SiteLogEntrySheet({ project, entry, onClose }: { project: Project; entry?: SiteLogEntry; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveSiteLogEntry(project.id);
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    () =>
      entry?.photos.map((p) => ({ key: p.id, preview: resolveFileUrl(p.fileUrl), progress: 100, fileUrl: p.fileUrl, caption: p.caption })) ?? [],
  );
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const [weather, setWeather] = useState(entry?.weather ?? "Soleado");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [date, setDate] = useState(entry?.date ?? todayIso());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const patch = (key: string, change: Partial<PhotoSlot>) =>
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, ...change } : p)));

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photosRef.current.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > room) toast.warning(`Máximo ${MAX_PHOTOS} fotos por entrada`);
    const slots = picked.map((file) => {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      const slot: PhotoSlot = { key, preview: URL.createObjectURL(file), progress: 0, caption: null };
      slot.promise = uploadSiteLogPhoto(project.id, file, (pct) => patch(key, { progress: pct }))
        .then((fileUrl) => {
          patch(key, { fileUrl, progress: 100 });
          return fileUrl;
        })
        .catch(() => {
          patch(key, { failed: true });
          return undefined;
        });
      return slot;
    });
    setPhotos((prev) => [...prev, ...slots]);
  };

  const submit = async () => {
    if (date > todayIso()) {
      toast.error("La fecha no puede ser futura");
      return;
    }
    setSaving(true);
    // Se puede guardar mientras suben: esperamos lo que falte antes de enviar.
    await Promise.all(photosRef.current.map((p) => p.promise));
    const ready = photosRef.current.filter((p) => p.fileUrl);
    const failed = photosRef.current.filter((p) => p.failed).length;
    try {
      await save.mutateAsync({
        id: entry?.id,
        input: { date, notes: notes.trim() || null, weather, photos: ready.map((p) => ({ fileUrl: p.fileUrl!, caption: p.caption })) },
      });
      toast.success(entry ? "Entrada actualizada" : "Entrada guardada", failed ? `${plural(failed, "foto no se pudo", "fotos no se pudieron")} subir` : project.name);
      onClose();
    } catch (err) {
      toast.error("No se pudo guardar la entrada", apiErrorMessage(err, "Intentá de nuevo."));
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <div className="sheet-backdrop" onMouseDown={onClose} />
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={entry ? "Editar entrada" : "Nueva entrada"}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <header className="sheet__head">
          <button type="button" className="m-icon-btn" aria-label="Cerrar sin guardar" onClick={onClose}>
            <Icon name="x" size={22} />
          </button>
          <div className="m-head__titles">
            <h1 className="m-head__title">{entry ? "Editar entrada" : "Nueva entrada"}</h1>
            <div className="m-head__sub">{project.name}</div>
          </div>
        </header>

        <div className="sheet__body">
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 className="sheet__h2">Fotos</h2>
              <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>{`${photos.length} de hasta ${MAX_PHOTOS}`}</span>
            </div>
            <div className="photo-grid">
              {photos.length < MAX_PHOTOS ? (
                <label className="photo-add">
                  <Icon name="camera" size={26} />
                  Sacar foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    capture="environment"
                    multiple
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : null}
              {photos.map((p, i) => (
                <div key={p.key} className="photo-tile">
                  {p.preview ? <img src={p.preview} alt={p.caption || `Foto ${i + 1}`} /> : <Icon name="image" size={22} />}
                  <button
                    type="button"
                    className="photo-tile__x"
                    aria-label={`Quitar foto ${i + 1}`}
                    onClick={() => setPhotos((prev) => prev.filter((x) => x.key !== p.key))}
                  >
                    <Icon name="x" size={16} strokeWidth={2.5} />
                  </button>
                  {!p.fileUrl ? (
                    <div className="photo-tile__up">
                      <span className="af-num" style={p.failed ? { color: "var(--destructive-text)" } : undefined}>
                        {p.failed ? "No se pudo subir" : `Subiendo ${p.progress} %`}
                      </span>
                      {!p.failed ? (
                        <div className="photo-tile__track">
                          <div style={{ width: `${p.progress}%` }} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>
              Subí entre 3 y 5 fotos. Se cargan en segundo plano: podés guardar mientras suben.
            </p>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 className="sheet__h2">Clima</h2>
            <div role="radiogroup" aria-label="Clima" className="clima-grid">
              {WEATHER_OPTIONS.map((w) => (
                <button key={w} type="button" role="radio" aria-checked={weather === w} className="clima-opt" onClick={() => setWeather(w)}>
                  {w}
                </button>
              ))}
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="notas" className="sheet__h2">
              Notas
            </label>
            <textarea
              id="notas"
              rows={5}
              className="sheet-input"
              style={{ resize: "none" }}
              placeholder="Qué se hizo hoy, qué falta, novedades."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="fecha" className="sheet__h2">
              Fecha
            </label>
            <input id="fecha" type="date" max={todayIso()} className="sheet-input sheet-input--line" value={date} onChange={(e) => setDate(e.target.value)} />
            <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>Hoy, por defecto.</span>
          </section>
        </div>

        <footer className="sheet__foot">
          <button type="submit" className="m-action m-action--primary" style={{ width: "100%" }} disabled={saving}>
            {saving ? "Guardando…" : "Guardar entrada"}
          </button>
        </footer>
      </form>
    </>,
    document.body,
  );
}
