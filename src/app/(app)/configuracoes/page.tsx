import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function ConfiguracoesPage() {
  const user = await requireUser();

  return (
    <div>
      <PageHeader title="Configurações" description="Preferências da sua conta" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Informações da sua conta de acesso</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row label="Nome" value={user.name} />
            <Row label="E-mail" value={user.email} />
            <Row
              label="Perfil"
              value={<Badge variant={user.role === "ADMIN" ? "primary" : "outline"}>{user.role === "ADMIN" ? "Administrador" : "Cliente"}</Badge>}
            />
            {user.client && <Row label="Empresa" value={user.client.company} />}
            <Row label="Conta criada em" value={formatDate(user.createdAt)} />
            {user.lastLoginAt && <Row label="Último acesso" value={formatDate(user.lastLoginAt)} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterar senha</CardTitle>
            <CardDescription>Recomendamos usar uma senha única e forte</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
