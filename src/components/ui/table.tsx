"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * "There's more, scroll →" hint for tables wider than their container. Only shown when the
 * table actually overflows and there's still distance left to scroll — a table that already
 * fits, or one that's been scrolled to its end, shows no overlay. Real content is never
 * faded/clipped; this is a decorative pointer-events-none edge gradient layered on top.
 */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateFade = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  }, []);

  React.useEffect(() => {
    updateFade();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFade);
    ro.observe(el);
    el.addEventListener("scroll", updateFade, { passive: true });
    window.addEventListener("resize", updateFade);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateFade);
      window.removeEventListener("resize", updateFade);
    };
  }, [updateFade]);

  return (
    <div className="relative">
      <div ref={scrollRef} className="w-full overflow-x-auto scrollbar-thin">
        <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
      </div>
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-surface to-transparent" />
      )}
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-border", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-surface-2/60", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle whitespace-nowrap", className)} {...props} />;
}
