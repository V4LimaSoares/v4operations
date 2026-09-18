"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  if (!theme) return <div className="size-9" />;

  return (
    <Button variant="ghost" size="icon" aria-label="Alternar tema" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
