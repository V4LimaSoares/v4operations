import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

/** Small "Modificado por X em DD/MM/AAAA às HH:mm" caption for a record's header — reads the most
 *  recent ActivityLog row for this entity. Renders nothing for legacy records with no log yet. */
export async function LastModified({ entityType, entityId }: { entityType: string; entityId: string }) {
  const log = await prisma.activityLog.findFirst({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  });
  if (!log) return null;

  return (
    <p className="text-xs text-muted-2">
      Modificado por {log.actorName} em {formatDateTime(log.createdAt)}
    </p>
  );
}
