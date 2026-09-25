import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffModule } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

// Lookup by (platform, externalId) — lets an MCP-assisted session resolve the internal AdAccount
// id it needs for /api/admin/metrics/import without needing direct database access.
export async function GET(req: Request) {
  await requireStaffModule("contas");
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const externalId = searchParams.get("externalId");
  if (!platform || !externalId) {
    return NextResponse.json({ error: "platform e externalId obrigatórios." }, { status: 400 });
  }
  if (platform !== "GOOGLE_ADS" && platform !== "META_ADS") {
    return NextResponse.json({ error: "platform inválido." }, { status: 400 });
  }
  const account = await prisma.adAccount.findUnique({
    where: { platform_externalId: { platform, externalId } },
    select: { id: true, name: true, clientId: true, dataSource: true },
  });
  if (!account) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  return NextResponse.json({ account });
}

const schema = z.object({
  clientId: z.string().min(1),
  platform: z.enum(["GOOGLE_ADS", "META_ADS"]),
  externalId: z.string().min(3),
  name: z.string().min(2),
  currency: z.string().default("BRL"),
  dataSource: z.enum(["DEMO", "REAL"]).default("REAL"),
});

export async function POST(req: Request) {
  const actor = await requireStaffModule("contas");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const existing = await prisma.adAccount.findUnique({
    where: { platform_externalId: { platform: parsed.data.platform, externalId: parsed.data.externalId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Esta conta já está conectada a um cliente." }, { status: 409 });
  }

  const account = await prisma.adAccount.create({ data: parsed.data });

  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: "criou",
    entityType: "Conta de anúncio",
    entityId: account.id,
    entityLabel: account.name,
  });

  return NextResponse.json({ ok: true, account });
}
