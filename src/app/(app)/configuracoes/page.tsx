import { requireModule } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getHealthConfig } from "@/lib/data/health-signals";
import { HealthConfigForm } from "@/components/admin/health-config-form";

export default async function ConfiguracoesPage() {
  const user = await requireModule("configuracoes");
  const healthConfig = user.role === "ADMIN" ? await getHealthConfig() : null;

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
              value={
                <Badge variant={user.role === "ADMIN" ? "primary" : user.role === "STAFF" ? "info" : "outline"}>
                  {user.role === "ADMIN" ? "Administrador" : user.role === "STAFF" ? "Equipe" : "Cliente"}
                </Badge>
              }
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

        {user.role === "ADMIN" && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Backup dos dados</CardTitle>
              <CardDescription>
                Cópia completa do banco (clientes, equipe, Health Score, métricas, notas, fotos e histórico). Senhas e o token do eKyte nunca vão no arquivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <a href="/api/admin/backup" className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:opacity-90">
                  Baixar backup
                </a>
                <a href="/api/admin/backup?files=1" className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-2">
                  Baixar backup com arquivos (Materiais)
                </a>
              </div>
              <p className="text-xs text-muted">
                Guarde o arquivo em local privado: ele contém dados pessoais (LGPD). Para trazer os dados de produção para o ambiente local, use <code>npx tsx scripts/restore-backup.ts arquivo.json.gz --yes</code>.
              </p>
            </CardContent>
          </Card>
        )}

        {healthConfig && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Parâmetros do Health Score</CardTitle>
              <CardDescription>Pesos das dimensões e faixas de classificação (somente administradores)</CardDescription>
            </CardHeader>
            <CardContent>
              <HealthConfigForm config={healthConfig} />
            </CardContent>
          </Card>
        )}
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
