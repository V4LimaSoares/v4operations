"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";

export function ClientSwitcher({
  clients,
}: {
  clients: { id: string; name: string; company: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("clientId") ?? "all";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("clientId");
    else params.set("clientId", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-56"
      aria-label="Selecionar cliente"
    >
      <option value="all">Todos os clientes</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} — {c.company}
        </option>
      ))}
    </Select>
  );
}
