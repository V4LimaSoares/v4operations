import { prisma } from "@/lib/prisma";

export type AuditAction = "criou" | "editou" | "excluiu" | "vinculou" | "desvinculou";

/** Records one row in ActivityLog — the "who changed what, when" trail shown in Administração >
 *  Atividades and as "Modificado por..." captions. Never throws: a logging failure must not take
 *  down the mutation it's describing, it only gets noted server-side. */
export async function logActivity(input: {
  actorId: string;
  actorName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel: string;
  detail?: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({ data: input });
  } catch (err) {
    console.error("[audit] failed to log activity:", err);
  }
}
