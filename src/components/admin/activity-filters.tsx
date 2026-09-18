"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";

export function ActivityFilters({ entityTypes, actors }: { entityTypes: string[]; actors: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const entityType = searchParams.get("entityType") ?? "";
  const actor = searchParams.get("actor") ?? "";

  function update(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={entityType} onChange={(e) => update({ entityType: e.target.value })} className="w-auto">
        <option value="">Todos os tipos</option>
        {entityTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <Select value={actor} onChange={(e) => update({ actor: e.target.value })} className="w-auto">
        <option value="">Todos os usuários</option>
        {actors.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </Select>
    </div>
  );
}
