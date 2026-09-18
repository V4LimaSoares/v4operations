"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { UserDialog } from "@/components/admin/user-dialog";
import { MODULES } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
  modulePermissions: string[];
  permissionProfileId: string | null;
};

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function UsersTable({
  users,
  profileOptions,
  selfId,
}: {
  users: UserRow[];
  profileOptions: { id: string; name: string; modules: string[] }[];
  selfId: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return users;
    return users.filter((u) => normalize(u.name).includes(q) || normalize(u.email).includes(q));
  }, [users, query]);

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative max-w-72 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
          <Input
            placeholder="Buscar por nome ou e-mail…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Buscar usuários"
          />
        </div>
        {query && (
          <span className="text-xs text-muted">
            {filtered.length} de {users.length}
          </span>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState message={users.length === 0 ? "Nenhum usuário interno cadastrado ainda." : "Nenhum usuário encontrado para essa busca."} />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {u.id === selfId && <span className="ml-1.5 text-xs text-muted-2">(você)</span>}
                    </TableCell>
                    <TableCell className="text-muted">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "primary" : "info"}>
                        {u.role === "ADMIN" ? "Administrador" : "Equipe"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal text-xs text-muted">
                      {u.role === "ADMIN"
                        ? "Acesso total"
                        : u.modulePermissions.length === 0
                          ? "Nenhum módulo liberado"
                          : u.modulePermissions.map((k) => MODULES.find((m) => m.key === k)?.label ?? k).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? "positive" : "negative"}>{u.active ? "Ativo" : "Bloqueado"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Nunca"}</TableCell>
                    <TableCell className="text-right">
                      <UserDialog
                        profiles={profileOptions}
                        isSelf={u.id === selfId}
                        user={{
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          role: u.role as "ADMIN" | "STAFF",
                          active: u.active,
                          modulePermissions: u.modulePermissions,
                          permissionProfileId: u.permissionProfileId,
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
    </>
  );
}
