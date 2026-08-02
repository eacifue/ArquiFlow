import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // resolvedTheme is only known after the client resolves "system", so avoid
  // rendering a possibly-wrong icon during the first paint.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="size-8" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="sr-only">{isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}</span>
    </Button>
  );
}
