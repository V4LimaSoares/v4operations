import { cn } from "@/lib/utils";

/** Shows the uploaded profile photo (via GET /api/team/[id]/avatar) when present, falling back
 *  to the colored-initial avatar used everywhere else in the app otherwise. Plain <img> (not
 *  next/image) since the source isn't a static/known-dimension asset — it's a per-person API
 *  route, same reasoning as the rest of this app's `unoptimized` image usage. */
export function TeamAvatar({
  id,
  name,
  colorVar,
  photoUrl,
  className = "size-14",
  cacheBust,
}: {
  id: string;
  name: string;
  colorVar: string;
  photoUrl?: string | null;
  /** Tailwind size classes (e.g. "size-14") — pass the exact class, not a raw number, so Tailwind's
   *  JIT can see it statically. Also carries text-size/font-weight for the initials fallback. */
  className?: string;
  /** Bust the browser cache after replacing a photo without changing the underlying URL — pass
   *  something that changes on each upload (e.g. Date.now()). */
  cacheBust?: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/team/${id}/avatar${cacheBust ? `?v=${cacheBust}` : ""}`}
        alt={name}
        className={cn(className, "shrink-0 rounded-2xl object-cover shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]")}
      />
    );
  }
  return (
    <div
      className={cn(className, "flex shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]")}
      style={{ background: colorVar }}
    >
      {name[0]}
    </div>
  );
}
