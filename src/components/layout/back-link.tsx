"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Goes back to the exact previous screen (same tab, filters, scroll) when the user navigated
 *  here from inside the app; falls back to `fallbackHref` when the page was opened directly. */
export function BackLink({ fallbackHref, label = "Voltar" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        const cameFromApp = document.referrer.startsWith(window.location.origin) && window.history.length > 1;
        if (cameFromApp) router.back();
        else router.push(fallbackHref);
      }}
      className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" /> {label}
    </button>
  );
}
