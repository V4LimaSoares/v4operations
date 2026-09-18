import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { EkyteTokenDialog } from "@/components/admin/ekyte-token-dialog";

/** Admin-only, shown on every page (rendered from the shared app layout) whenever the last Ekyte
 *  API call failed — most commonly a revoked/expired token. Silent when everything's fine. */
export async function EkyteIntegrationBanner() {
  const integration = await prisma.ekyteIntegration.findFirst();
  if (!integration || integration.status !== "ERROR") return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-negative-soft px-4 py-2.5 text-sm text-negative">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0" />
        <span>
          <strong>Integração com o Ekyte parou de funcionar.</strong> {integration.errorMessage}
        </span>
      </div>
      <EkyteTokenDialog
        trigger={
          <Button size="sm" variant="destructive">
            Atualizar token
          </Button>
        }
      />
    </div>
  );
}
