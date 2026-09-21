import { requireAdmin } from "@/lib/session";
import { listInternalUsers, listPermissionProfiles } from "@/lib/data/users";
import { listUnlinkedTeamMembers } from "@/lib/data/team";
import { MODULES } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { UserDialog } from "@/components/admin/user-dialog";
import { UsersTable } from "@/components/admin/users-table";
import { PermissionProfileDialog } from "@/components/admin/permission-profile-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function UsuariosPage() {
  const admin = await requireAdmin();
  const [users, profiles, unlinkedTeamMembers] = await Promise.all([
    listInternalUsers(),
    listPermissionProfiles(),
    listUnlinkedTeamMembers(),
  ]);

  const profileOptions = profiles.map((p) => ({ id: p.id, name: p.name, modules: p.modules }));

  return (
    <div>
      <PageHeader
        title="Usuários e Permissões"
        description="Crie contas para a equipe e defina exatamente quais áreas do sistema cada uma pode acessar"
        actions={<UserDialog profiles={profileOptions} unlinkedTeamMembers={unlinkedTeamMembers} />}
      />

      <Tabs urlParam="tab" defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTable
            users={users.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              active: u.active,
              lastLoginAt: u.lastLoginAt,
              modulePermissions: u.modulePermissions,
              permissionProfileId: u.permissionProfileId,
            }))}
            profileOptions={profileOptions}
            selfId={admin.id}
          />
        </TabsContent>

        <TabsContent value="profiles">
          <div className="mb-3 flex justify-end">
            <PermissionProfileDialog />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Módulos</TableHead>
                    <TableHead>Em uso por</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState message="Nenhum perfil criado ainda." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.name}
                          {p.isSystem && <span className="ml-1.5 text-xs text-muted-2">(padrão)</span>}
                        </TableCell>
                        <TableCell className="max-w-64 whitespace-normal text-muted">{p.description ?? "—"}</TableCell>
                        <TableCell className="max-w-64 whitespace-normal text-xs text-muted">
                          {p.modules.length === 0
                            ? "Nenhum"
                            : p.modules.map((k) => MODULES.find((m) => m.key === k)?.label ?? k).join(", ")}
                        </TableCell>
                        <TableCell className="text-muted">{p._count.users} usuário(s)</TableCell>
                        <TableCell className="text-right">
                          <PermissionProfileDialog
                            profile={{
                              id: p.id,
                              name: p.name,
                              description: p.description,
                              modules: p.modules,
                              isSystem: p.isSystem,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
