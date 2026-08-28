import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  redirect(`/dashboard?clientId=${id}`);
}
