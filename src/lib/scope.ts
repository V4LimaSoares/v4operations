import "server-only";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export type ClientScope = {
  /** null = admin viewing aggregate data across every client */
  clientId: string | null;
  isAggregate: boolean;
};

/**
 * Resolves which client's data the current request should see.
 * CLIENT users are always locked to their own clientId, regardless of any
 * requested override — this is the core data-isolation boundary.
 */
export function resolveScope(user: User, requestedClientId?: string): ClientScope {
  if (user.role !== "ADMIN") {
    return { clientId: user.clientId, isAggregate: false };
  }
  if (requestedClientId && requestedClientId !== "all") {
    return { clientId: requestedClientId, isAggregate: false };
  }
  return { clientId: null, isAggregate: true };
}

export async function listClientOptions() {
  return prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true, status: true },
  });
}
