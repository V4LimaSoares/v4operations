import { requireStaffModule } from "@/lib/session";
import { listMaterials } from "@/lib/data/materials";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialDialog } from "@/components/admin/material-dialog";
import { MaterialCard } from "@/components/admin/material-card";
import { MateriaisTabs } from "@/components/materiais/materiais-tabs";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function MateriaisPage() {
  const user = await requireStaffModule("materiais");
  const materials = await listMaterials();
  const isAdmin = user.role === "ADMIN";

  return (
    <div>
      <PageHeader
        title="Materiais Operacionais"
        description="Apresentações, playbooks e documentos de referência para o time"
        actions={<MaterialDialog />}
      />
      <MateriaisTabs active="files" />

      {materials.length === 0 ? (
        <Card>
          <EmptyState message="Nenhum material enviado ainda." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {materials.map((m) => (
            <MaterialCard key={m.id} material={m} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
