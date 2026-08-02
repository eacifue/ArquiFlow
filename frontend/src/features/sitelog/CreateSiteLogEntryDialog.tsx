import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateSiteLogEntry } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  date: z.string().min(1, "Requerido"),
  weather: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateSiteLogEntryDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createEntry = useCreateSiteLogEntry(projectId);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createEntry.mutateAsync({
        ...values,
        photos: fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : [],
      });
      toast.success("Entrada de bitácora creada");
      reset({ date: new Date().toISOString().slice(0, 10), weather: "", notes: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
    } catch {
      toast.error("No se pudo crear la entrada");
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>Nueva entrada</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva entrada de bitácora</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="log-date">Fecha</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => <DatePicker id="log-date" value={field.value} onChange={field.onChange} />}
              />
              <FieldError message={errors.date?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-weather">Clima</Label>
              <Input id="log-weather" placeholder="Ej: Soleado" {...register("weather")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-notes">Notas</Label>
            <Textarea id="log-notes" placeholder="Avance del día, novedades..." {...register("notes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-photos">Fotos</Label>
            <Input id="log-photos" type="file" accept="image/*" multiple ref={fileInputRef} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createEntry.isPending}>
              {createEntry.isPending ? "Guardando..." : "Crear entrada"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
