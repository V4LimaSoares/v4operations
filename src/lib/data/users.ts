import "server-only";
import { prisma } from "@/lib/prisma";

/** Internal-team accounts only (ADMIN/STAFF) — CLIENT portal logins are managed from /clientes,
 *  since creating one also involves creating the Client company record itself. */
export async function listInternalUsers() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { permissionProfile: true },
    // Nothing downstream needs the bcrypt hash — omit it at the query level so a future refactor
    // can't accidentally forward it into a client component's props.
    omit: { passwordHash: true },
  });
}

export async function listPermissionProfiles() {
  return prisma.permissionProfile.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
}
