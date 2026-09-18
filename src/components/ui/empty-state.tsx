import { cn } from "@/lib/utils";

/** Single styling for "nothing here yet" across the app — drop inside a `Card`, a `TableCell
 *  colSpan`, or any container; it brings its own vertical padding and centered muted text. */
export function EmptyState({ message, className }: { message: string; className?: string }) {
  return <p className={cn("py-10 text-center text-sm text-muted", className)}>{message}</p>;
}
