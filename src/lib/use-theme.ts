"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

/** Shared with `theme-toggle.tsx` and both account menus — one localStorage/data-theme contract
 *  so switching from any of them stays in sync everywhere else. */
export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    // The <html> tag defaults to data-theme="dark" server-side (no SSR access to
    // localStorage); reconcile with any saved preference once mounted on the client.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore (private browsing / storage disabled)
    }
    const resolved = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", resolved);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with localStorage on mount
    setThemeState(resolved);
  }, []);

  function setTheme(next: "dark" | "light") {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }

  return { theme, setTheme };
}
