import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { useDeleteSiteLogEntry } from "./api";
import { resolveFileUrl } from "@/lib/api-client";
import type { SiteLogEntry } from "./types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" });

function formatDate(dateOnly: string) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

interface SiteLogTimelineProps {
  projectId: string;
  entries: SiteLogEntry[];
  canManage: boolean;
}

export function SiteLogTimeline({ projectId, entries, canManage }: SiteLogTimelineProps) {
  const deleteEntry = useDeleteSiteLogEntry(projectId);

  const handleDelete = async (entry: SiteLogEntry) => {
    const confirmed = await confirm({
      title: `¿Eliminar la entrada del ${formatDate(entry.date)}?`,
      description: "Esto también borra sus fotos. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteEntry.mutateAsync(entry.id);
      toast.success("Entrada eliminada");
    } catch {
      toast.error("No se pudo eliminar la entrada");
    }
  };

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{formatDate(entry.date)}</p>
                {entry.weather && <Badge variant="secondary">{entry.weather}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">Cargado por {entry.authorName}</p>
            </div>
            {canManage && (
              <Button variant="destructive" size="sm" onClick={() => handleDelete(entry)}>
                <Trash2Icon data-icon="inline-start" />
                Eliminar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {entry.notes && <p className="text-sm">{entry.notes}</p>}

            {entry.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {entry.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={resolveFileUrl(photo.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-square overflow-hidden rounded-md border"
                  >
                    <img
                      src={resolveFileUrl(photo.fileUrl)}
                      alt={photo.caption ?? "Foto de bitácora"}
                      className="h-full w-full object-cover transition-opacity hover:opacity-80"
                    />
                  </a>
                ))}
              </div>
            )}

            {entry.notes === null && entry.photos.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin notas ni fotos.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
