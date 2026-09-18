"use client";

import { useState } from "react";
import { Presentation, BookOpen, FileText, File as FileIcon, Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaterialDetailDialog } from "@/components/admin/material-detail-dialog";
import { formatDateTime } from "@/lib/utils";

export type MaterialCardData = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  linkUrl: string | null;
  uploadedByName: string;
  createdAt: string | Date;
};

const CATEGORY_ICON: Record<string, typeof FileText> = {
  Apresentação: Presentation,
  Playbook: BookOpen,
  Documento: FileText,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The whole card opens the detail dialog on click — Administrador can edit/excluir from there,
 *  everyone else with access just gets the read-only view. The quick action (Baixar/Abrir link)
 *  stays on the card itself since that's a read action anyone can do without opening anything. */
export function MaterialCard({ material, isAdmin }: { material: MaterialCardData; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const Icon = material.linkUrl ? ExternalLink : CATEGORY_ICON[material.category] ?? FileIcon;

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}
        className="flex h-full cursor-pointer flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-muted-2 hover:shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{material.title}</div>
            <Badge variant="outline" className="mt-1">
              {material.category}
            </Badge>
          </div>
        </div>

        {material.description && <p className="mt-3 line-clamp-2 whitespace-pre-line text-xs text-muted">{material.description}</p>}

        <p className="mt-3 truncate text-[11px] text-muted-2">
          {material.linkUrl ? material.linkUrl : `${material.fileName} · ${formatBytes(material.fileSizeBytes ?? 0)}`}
        </p>
        <p className="text-[11px] text-muted-2">
          Enviado por {material.uploadedByName} em {formatDateTime(material.createdAt)}
        </p>

        <div className="mt-4">
          {material.linkUrl ? (
            <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
              <a href={material.linkUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" /> Abrir link
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
              <a href={`/api/materiais/${material.id}/download`}>
                <Download className="size-3.5" /> Baixar
              </a>
            </Button>
          )}
        </div>
      </Card>

      <MaterialDetailDialog material={material} isAdmin={isAdmin} open={open} onOpenChange={setOpen} />
    </>
  );
}
