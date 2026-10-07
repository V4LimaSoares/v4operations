"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { TeamAvatar } from "@/components/admin/team-avatar";
import { Button } from "@/components/ui/button";

/** Perfil's avatar + upload. Writes to the same photo as Equipes (see /api/perfil/photo). */
export function ProfilePhotoUploader({
  memberId,
  name,
  colorVar,
  photoUrl,
}: {
  memberId: string;
  name: string;
  colorVar: string;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(!!photoUrl);
  const [version, setVersion] = useState<number | undefined>(undefined);

  async function onSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/perfil/photo", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível enviar a foto.");
        return;
      }
      setHasPhoto(true);
      setVersion(Date.now());
      toast.success("Foto atualizada — vale também em Equipes.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onRemove() {
    setLoading(true);
    try {
      const res = await fetch("/api/perfil/photo", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível remover a foto.");
        return;
      }
      setHasPhoto(false);
      toast.success("Foto removida.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <TeamAvatar
        id={memberId}
        name={name}
        colorVar={colorVar}
        photoUrl={hasPhoto ? "x" : null}
        cacheBust={version ?? (photoUrl ? Number(photoUrl.replace(/\D/g, "")) || undefined : undefined)}
        className="size-16 text-xl"
      />
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onSelected} className="hidden" />
      <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={() => inputRef.current?.click()}>
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
        {hasPhoto ? "Trocar" : "Adicionar foto"}
      </Button>
      {hasPhoto && (
        <button type="button" onClick={onRemove} disabled={loading} className="text-xs text-muted hover:text-negative">
          Remover
        </button>
      )}
    </div>
  );
}
