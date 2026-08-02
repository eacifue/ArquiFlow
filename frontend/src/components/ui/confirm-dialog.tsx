import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

let openConfirm: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

/**
 * Global, promise-based replacement for window.confirm(): styled to match
 * the app, mounted once via <ConfirmDialogHost /> at the app root.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (!openConfirm) {
    throw new Error("ConfirmDialogHost is not mounted");
  }
  return openConfirm(options);
}

export function ConfirmDialogHost() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  useEffect(() => {
    openConfirm = (options) => new Promise((resolve) => setPending({ options, resolve }));
    return () => {
      openConfirm = null;
    };
  }, []);

  const settle = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && settle(false)}>
      {pending && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending.options.title}</AlertDialogTitle>
            {pending.options.description && (
              <AlertDialogDescription>{pending.options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {pending.options.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              variant={pending.options.variant === "destructive" ? "destructive" : "default"}
              onClick={() => settle(true)}
            >
              {pending.options.confirmLabel ?? "Confirmar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
