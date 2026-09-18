"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EkytePrintButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      <Printer className="size-4" /> Imprimir / salvar PDF
    </Button>
  );
}
