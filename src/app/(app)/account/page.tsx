import { redirect } from "next/navigation";
import { requireStaffModule } from "@/lib/session";

// Health Score merged into /clientes as a tab — this route stays only so old links/bookmarks
// still land somewhere instead of 404ing.
export default async function AccountRedirectPage() {
  await requireStaffModule("clientes");
  redirect("/clientes");
}
