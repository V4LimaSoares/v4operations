"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlatformBadge } from "@/components/dashboard/badges";
import type { UnmatchedRealAccount } from "@/lib/data/ad-accounts";

type ClientOption = { id: string; name: string; company: string };

/** Contas page section: real Google/Meta accounts the MCP-assisted matcher couldn't safely
 *  auto-link (ambiguous or no name match) — pick the client by hand instead of re-running a script. */
export function UnmatchedAccountsPanel({ accounts, clients }: { accounts: UnmatchedRealAccount[]; clients: ClientOption[] }) {
  const router = useRouter();
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);

  if (accounts.length === 0) return null;

  async function link(account: UnmatchedRealAccount) {
    const clientId = picks[account.externalId];
    if (!clientId) return;
    setPending(account.externalId);
    try {
      const res = await fetch("/api/admin/ad-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          platform: account.platform,
          externalId: account.externalId,
          name: account.name,
          dataSource: "REAL",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível vincular.");
        return;
      }
      toast.success(`${account.label} vinculada.`);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Contas reais sem cliente vinculado</CardTitle>
        <p className="text-sm text-muted">
          Contas encontradas nas contas de anúncio da agência que não bateram automaticamente com nenhum cliente. Escolha o
          cliente certo pra cada uma.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {accounts.map((a) => (
          <div key={`${a.platform}:${a.externalId}`} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
            <PlatformBadge platform={a.platform} />
            <div className="min-w-40 flex-1">
              <p className="text-sm font-medium">{a.label}</p>
              <p className="font-mono text-xs text-muted">{a.externalId}</p>
            </div>
            <Select
              value={picks[a.externalId] ?? ""}
              onChange={(e) => setPicks((cur) => ({ ...cur, [a.externalId]: e.target.value }))}
              className="max-w-64"
              aria-label={`Cliente para ${a.label}`}
            >
              <option value="">Selecione o cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!picks[a.externalId] || pending === a.externalId}
              onClick={() => link(a)}
            >
              {pending === a.externalId ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Vincular
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
