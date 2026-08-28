"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    // The <html> tag defaults to data-theme="dark" server-side (no SSR access to
    // localStorage); reconcile with any saved preference once mounted on the client.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {
      // ignore (private browsing / storage disabled)
    }
    const resolved = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", resolved);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with localStorage on mount
    setTheme(resolved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }

  if (!theme) return <div className="size-9" />;

  return (
    <Button variant="ghost" size="icon" aria-label="Alternar tema" onClick={toggle}>
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
