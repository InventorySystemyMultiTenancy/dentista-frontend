import { RequireRole } from "@/components/RequireRole";
import { PortalHeader } from "@/components/PortalHeader";

// TODO(fundo do portal): o usuário vai pedir um fundo com vídeo em "scroll-scrubbing"
// (o vídeo avança conforme o scroll da página) para esta área do paciente.
// Quando as instruções chegarem, o vídeo/canvas entra aqui no layout, atrás de {children}.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["PATIENT"]}>
      <div className="flex flex-1 flex-col bg-zinc-50">
        <PortalHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </RequireRole>
  );
}
