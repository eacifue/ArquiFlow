import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center",
        className
      )}
    >
      <Icon className="size-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
