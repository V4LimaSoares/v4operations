import { NextResponse } from "next/server";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaffModule("clientes");
  const { id } = await params;

  const logs = await prisma.activityLog.findMany({
    where: { entityType: "Health Score", entityId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ logs });
}
