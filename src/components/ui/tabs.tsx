"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/** With `urlParam`, the active tab lives in the URL (?tab=…) so "Voltar" from a detail page lands
 *  on the same tab instead of resetting to the first one. Without it, plain uncontrolled tabs. */
export function Tabs({
  urlParam,
  defaultValue,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & { urlParam?: string }) {
  const searchParams = useSearchParams();
  const [inner, setInner] = React.useState(() => (urlParam ? searchParams.get(urlParam) : null) ?? defaultValue);
  if (!urlParam) return <TabsPrimitive.Root defaultValue={defaultValue} value={value} onValueChange={onValueChange} {...props} />;
  return (
    <TabsPrimitive.Root
      {...props}
      value={value ?? inner}
      onValueChange={(v) => {
        setInner(v);
        onValueChange?.(v);
        const url = new URL(window.location.href);
        url.searchParams.set(urlParam, v);
        window.history.replaceState(window.history.state, "", url);
      }}
    />
  );
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    // Narrow screens: a tab row with several longer labels (e.g. Financeiro's "Contas a Pagar" /
    // "Fixo / Pró-labore") doesn't have room to keep every trigger on one line, so the label text
    // used to wrap to two lines instead — this scrolls the row horizontally instead, same fix as
    // PerformanceTabs.
    <div className="max-w-full overflow-x-auto scrollbar-thin">
      <TabsPrimitive.List
        className={cn("inline-flex items-center gap-1 rounded-lg bg-surface-2 p-1", className)}
        {...props}
      />
    </div>
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 focus:outline-none", className)} {...props} />;
}
