export function ReadonlyBanner() {
  return (
    <div className="border-b border-warning/30 bg-warning-soft px-4 py-2 text-center text-xs font-medium text-warning">
      Modo somente leitura — você está vendo os dados reais de produção. Para editar, use o sistema no ar.
    </div>
  );
}
