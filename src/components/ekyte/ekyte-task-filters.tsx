"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, Input } from "@/components/ui/input";

export function EkyteTaskFilters({ clients, formats }: { clients: string[]; formats: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateDebounced(key: string, value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update(key, value), 300);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={searchParams.get("client") ?? ""} onChange={(e) => update("client", e.target.value)} className="w-auto">
        <option value="">Todos os clientes</option>
        {clients.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select value={searchParams.get("format") ?? ""} onChange={(e) => update("format", e.target.value)} className="w-auto">
        <option value="">Todos os formatos</option>
        {formats.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </Select>
      <Select value={searchParams.get("status") ?? ""} onChange={(e) => update("status", e.target.value)} className="w-auto">
        <option value="">Todos os status</option>
        <option value="10">Ativa</option>
        <option value="20">Pausada</option>
        <option value="30">Concluída</option>
        <option value="40">Cancelada</option>
        <option value="late">Atrasada</option>
      </Select>
      <Input
        type="search"
        placeholder="Buscar cliente, tarefa, executor..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => updateDebounced("q", e.target.value)}
        className="w-56"
      />
    </div>
  );
}
